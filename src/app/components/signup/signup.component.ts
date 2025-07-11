import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { VendorRegistrationService } from '../../services/vendor-registration.service';
import { ClientRegistrationService } from '../../services/client-registration.service';
import { AuthService } from '../../services/auth.service';
import { VendorRegistration } from '../../models/vendor-registration.model';
import { ClientRegistration } from '../../models/client-registration.model';
import { firstValueFrom } from 'rxjs';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  otp?: string;
}

interface OTPResponse extends ApiResponse {
  otp?: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {
  currentStep = 0;
  totalSteps = 5;
  isLoading = false;
  error = '';
  success = '';
  otpVerified = false;
  
  // User type selection
  userType: 'vendor' | 'client' | null = null;
  
  // Forms for each step - initialized with default values
  step1Form!: FormGroup;
  step2Form!: FormGroup;
  step3Form!: FormGroup;
  step4Form!: FormGroup;
  step5Form!: FormGroup;

  // Flag to prevent multiple form initializations
  private formsInitialized = false;

  // Options
  serviceOptions: any[] = [];

  // OTP related
  otpSent = false;
  otpTimer = 0;
  otpInterval: any;
  currentOTP: string = '';

  vendorRegistration: VendorRegistration | null = null;
  clientRegistration: ClientRegistration | null = null;

  // IFSC validation properties
  isIFSCInvalid = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private vendorRegistrationService: VendorRegistrationService,
    private clientRegistrationService: ClientRegistrationService,
    private authService: AuthService
  ) {
    // Forms will be initialized in ngOnInit
  }

  ngOnInit(): void {
    this.initializeForms();

    // Check for user type and step in query params
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'vendor' || params['type'] === 'client') {
        this.userType = params['type'];
        
        // If step is specified, set the current step
        if (params['step']) {
          const step = parseInt(params['step']);
          if (step >= 1 && step <= 5) {
            this.currentStep = step;
          }
        }
        
        // Check if user is already logged in (redirected from login)
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.email) {
          this.populateFormsWithExistingUserData(currentUser);
        }
        
        this.loadRegistrationData();
      } else {
        // If no user type specified, clear any existing registration data and start with selection
        this.userType = null;
        this.currentStep = 0; // User type selection step
        this.vendorRegistrationService.clearRegistrationData();
        this.clientRegistrationService.clearRegistrationData();
      }
    });

    // Subscribe to registration data changes
    this.vendorRegistrationService.registration$.subscribe(registration => {
      if (registration && this.userType === 'vendor') {
        this.vendorRegistration = registration;
        this.currentStep = registration.currentStep;
        this.otpVerified = registration.otpVerified;
      }
    });

    this.clientRegistrationService.registration$.subscribe(registration => {
      if (registration && this.userType === 'client') {
        this.clientRegistration = registration;
        this.currentStep = registration.currentStep;
        this.otpVerified = registration.otpVerified;
      }
    });
    

  }

  debugFormInitialization() {
    // Debug method - can be used for troubleshooting if needed
  }

  ngOnDestroy(): void {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }
  }

  private loadRegistrationData(): void {
    if (this.userType === 'vendor') {
      this.serviceOptions = this.vendorRegistrationService.getServiceOptions();
      this.vendorRegistrationService.registration$.subscribe(registration => {
        this.vendorRegistration = registration;
        if (registration) {
          this.currentStep = registration.currentStep;
          this.populateFormsFromVendorRegistration(registration);
        }
      });
    } else if (this.userType === 'client') {
      this.serviceOptions = this.clientRegistrationService.getServiceRequiredOptions();
      this.clientRegistrationService.registration$.subscribe(registration => {
        this.clientRegistration = registration;
        if (registration) {
          this.currentStep = registration.currentStep;
          this.populateFormsFromClientRegistration(registration);
        }
      });
    }
  }

  selectUserType(type: 'vendor' | 'client'): void {
    this.userType = type;
    this.currentStep = 1;
    
    // Initialize registration data
    if (type === 'vendor') {
      this.vendorRegistrationService.initializeRegistration().subscribe();
    } else {
      this.clientRegistrationService.initializeRegistration().subscribe();
    }
    
    // Update URL with user type
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: type },
      queryParamsHandling: 'merge'
    });
    
    // Load registration data
    this.loadRegistrationData();
    
    // Update form validators for the selected user type
    this.updateFormValidatorsForUserType();
  }

  private initializeForms(): void {
    // Prevent multiple initializations
    if (this.formsInitialized) {
      return;
    }
    
    // Step 1: Company Information
    this.step1Form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      companyName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      contactPerson: ['', Validators.required],
      gstNumber: ['', Validators.required],
      serviceType: ['', Validators.required],
      numberOfResources: [1, [Validators.required, Validators.min(1)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    }, { validators: this.passwordMatchValidator });

    // Step 2: OTP Verification
    this.step2Form = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    // Step 3: Address & Bank Details (conditional)
    this.step3Form = this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      pinCode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      accountNumber: [''],
      accountType: [null],
      ifscCode: [''],
      bankName: [''],
      branchName: [''],
      bankCity: [''],
      paymentTerms: ['']
    });

    // Step 4: Compliance Information
    this.step4Form = this.fb.group({
      panNumber: ['', [Validators.required, Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      registeredUnderESI: [false],
      registeredUnderPF: [false],
      registeredUnderMSMED: [false],
      esiRegistrationNumber: [''],
      pfRegistrationNumber: [''],
      msmedRegistrationNumber: ['']
    });

    // Step 5: Declarations and Terms
    this.step5Form = this.fb.group({
      compliesWithStatutoryRequirements: [false],
      hasCloseRelativesInCompany: [false],
      hasAdequateSafetyStandards: [false],
      hasOngoingLitigation: [false],
      termsAccepted: [false, Validators.requiredTrue],
      additionalNotes: ['']
    });

    this.setupConditionalValidators();
    this.formsInitialized = true;
  }

  private updateFormValidatorsForUserType(): void {
    // Store current form values before updating validators
    const currentValues = this.step3Form.value;
    
    if (this.userType === 'vendor') {
      // Add bank details validators for vendors
      this.step3Form.get('accountNumber')?.setValidators([Validators.required, Validators.pattern(/^[0-9]{9,18}$/)]);
      this.step3Form.get('accountType')?.setValidators([Validators.required]);
      this.step3Form.get('ifscCode')?.setValidators([Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]);
      this.step3Form.get('bankName')?.setValidators([Validators.required]);
      this.step3Form.get('branchName')?.setValidators([Validators.required]);
      this.step3Form.get('bankCity')?.setValidators([Validators.required]);
      this.step3Form.get('paymentTerms')?.setValidators([Validators.required]);
    } else {
      // Remove bank details validators for clients, but keep payment terms required
      this.step3Form.get('accountNumber')?.clearValidators();
      this.step3Form.get('accountType')?.clearValidators();
      this.step3Form.get('ifscCode')?.clearValidators();
      this.step3Form.get('bankName')?.clearValidators();
      this.step3Form.get('branchName')?.clearValidators();
      this.step3Form.get('bankCity')?.clearValidators();
      this.step3Form.get('paymentTerms')?.setValidators([Validators.required]); // Payment terms required for clients too
    }

    // Update validity only for the controls that had validators changed
    const controlsToUpdate = ['accountNumber', 'accountType', 'ifscCode', 'bankName', 'branchName', 'bankCity', 'paymentTerms'];
    controlsToUpdate.forEach(key => {
      const control = this.step3Form.get(key);
      if (control) {
        control.updateValueAndValidity();
      }
    });
    
    // Restore form values if they were lost
    if (JSON.stringify(this.step3Form.value) !== JSON.stringify(currentValues)) {
      this.step3Form.patchValue(currentValues);
    }
  }

  private setupConditionalValidators(): void {
    // ESI Registration Number validator
    this.step4Form.get('registeredUnderESI')?.valueChanges.subscribe(value => {
      const esiNumberControl = this.step4Form.get('esiRegistrationNumber');
      if (value) {
        esiNumberControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{10}$/)]);
      } else {
        esiNumberControl?.clearValidators();
      }
      esiNumberControl?.updateValueAndValidity();
    });

    // PF Registration Number validator
    this.step4Form.get('registeredUnderPF')?.valueChanges.subscribe(value => {
      const pfNumberControl = this.step4Form.get('pfRegistrationNumber');
      if (value) {
        pfNumberControl?.setValidators([Validators.required, Validators.pattern(/^[A-Z]{2}\/[A-Z]{3}\/[0-9]{7}\/[0-9]{3}\/[0-9]{7}$/)]);
      } else {
        pfNumberControl?.clearValidators();
      }
      pfNumberControl?.updateValueAndValidity();
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value 
      ? null : { passwordMismatch: true };
  }

  private populateFormsFromVendorRegistration(registration: VendorRegistration): void {
    // Populate Step 1
    this.step1Form.patchValue({
      companyName: registration.companyName,
      firstName: registration.firstName,
      lastName: registration.lastName,
      contactPerson: registration.contactPerson,
      gstNumber: registration.gstNumber,
      serviceType: registration.serviceType,
      numberOfResources: registration.numberOfResources,
      phone: registration.phone,
      password: registration.password,
      confirmPassword: registration.confirmPassword
    });

    // Populate Step 3
    // Ensure accountType is a string
    const accountTypeValue = registration.bankDetails.accountType ? String(registration.bankDetails.accountType) : null;
    
    this.step3Form.patchValue({
      addressLine1: registration.address.addressLine1,
      addressLine2: registration.address.addressLine2,
      city: registration.address.city,
      state: registration.address.state,
      country: registration.address.country,
      pinCode: registration.address.pinCode,
      accountNumber: registration.bankDetails.accountNumber,
      accountType: accountTypeValue,
      ifscCode: registration.bankDetails.ifscCode,
      bankName: registration.bankDetails.bankName,
      branchName: registration.bankDetails.branchName,
      bankCity: registration.bankDetails.bankCity,
      paymentTerms: registration.bankDetails.paymentTerms
    });

    // Populate Step 4
    this.step4Form.patchValue({
      panNumber: registration.panNumber,
      registeredUnderESI: registration.registeredUnderESI,
      esiRegistrationNumber: registration.esiRegistrationNumber,
      registeredUnderPF: registration.registeredUnderPF,
      pfRegistrationNumber: registration.pfRegistrationNumber,
      registeredUnderMSMED: registration.registeredUnderMSMED
    });

    // Populate Step 5
    this.step5Form.patchValue({
      compliesWithStatutoryRequirements: registration.compliesWithStatutoryRequirements,
      hasCloseRelativesInCompany: registration.hasCloseRelativesInCompany,
      hasAdequateSafetyStandards: registration.hasAdequateSafetyStandards,
      hasOngoingLitigation: registration.hasOngoingLitigation,
      termsAccepted: false, // Default to false for new registrations
      additionalNotes: ''
    });

    this.updateFormValidatorsForUserType();
  }

  private populateFormsFromClientRegistration(registration: ClientRegistration): void {
    // Populate Step 1 (adjust field names for client)
    this.step1Form.patchValue({
      companyName: registration.companyName,
      firstName: registration.firstName,
      lastName: registration.lastName,
      contactPerson: registration.contactPerson,
      gstNumber: registration.gstNumber,
      serviceType: registration.serviceType,
      numberOfResources: registration.numberOfRequirements,
      phone: registration.phone,
      password: registration.password,
      confirmPassword: registration.confirmPassword
    });

    // Populate Step 3 (address and payment terms for clients)
    this.step3Form.patchValue({
      addressLine1: registration.address.addressLine1,
      addressLine2: registration.address.addressLine2,
      city: registration.address.city,
      state: registration.address.state,
      country: registration.address.country,
      pinCode: registration.address.pinCode,
      paymentTerms: registration.paymentTerms
    });

    // Populate Step 4
    this.step4Form.patchValue({
      panNumber: registration.panNumber,
      registeredUnderESI: registration.registeredUnderESI,
      esiRegistrationNumber: registration.esiRegistrationNumber,
      registeredUnderPF: registration.registeredUnderPF,
      pfRegistrationNumber: registration.pfRegistrationNumber,
      registeredUnderMSMED: registration.registeredUnderMSMED
    });

    // Populate Step 5
    this.step5Form.patchValue({
      compliesWithStatutoryRequirements: registration.compliesWithStatutoryRequirements,
      hasCloseRelativesInCompany: registration.hasCloseRelativesInCompany,
      hasAdequateSafetyStandards: registration.hasAdequateSafetyStandards,
      hasOngoingLitigation: registration.hasOngoingLitigation,
      termsAccepted: false, // Default to false for new registrations
      additionalNotes: ''
    });

    this.updateFormValidatorsForUserType();
  }

  private populateFormsWithExistingUserData(user: any): void {
    // Populate step 1 form with existing user data
    this.step1Form.patchValue({
      email: user.email || '',
      companyName: user.companyName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      contactPerson: user.contactPerson || '',
      gstNumber: user.gstNumber || '',
      serviceType: user.serviceType || '',
      numberOfResources: user.numberOfResources || 1,
      numberOfRequirements: user.numberOfRequirements || 1,
      phone: user.phone || ''
    });
    
    // Mark email as verified since user is already logged in
    this.otpVerified = true;
    
    // Set current step to the next step they need to complete
    if (user.registrationStep) {
      this.currentStep = Math.min(user.registrationStep + 1, 5);
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  async nextStep(): Promise<void> {
    if (this.currentStep <= this.totalSteps) {
      // Clear any existing errors and success messages before proceeding
      this.error = '';
      this.success = '';
      
      // Save the current step data
      const stepData = this.getCurrentStepData();
      
      if (this.currentStep === 1) {
        // For step 1, save the data and send OTP
        try {
          const response = await firstValueFrom<ApiResponse>(this.isVendor ? 
            this.vendorRegistrationService.saveStep(this.currentStep, stepData) :
            this.clientRegistrationService.saveStep(this.currentStep, stepData)
          );
          
          if (response.success) {
            // Clear any form errors before proceeding
            this.clearFormErrors();
            
            // Check if OTP is included in the response (from step 1)
            if (response.otp) {
              this.currentOTP = response.otp;
              this.otpSent = true;
              this.startOtpTimer();
              this.showSuccessMessage('OTP sent successfully');
            } else {
              // Send OTP after successful step 1 save if not included
              await this.sendOTP();
            }
            
            this.currentStep++;
          } else {
            // Preserve form values and clear form errors when there's a server error
            this.preserveFormValues();
            this.clearFormErrors();
            this.error = response.message || 'Failed to save step 1 data';
          }
        } catch (error: any) {
          // Preserve form values and clear form errors when there's a server error
          this.preserveFormValues();
          this.clearFormErrors();
          this.error = error.error?.message || 'Failed to save step 1 data';
        }
      } else if (this.currentStep === 2) {
        // For step 2, verify OTP
        try {
          const email = this.step1Form.get('email')?.value;
          const otp = this.step2Form.get('otp')?.value;
          
          const response = await firstValueFrom<ApiResponse>(this.isVendor ?
            this.vendorRegistrationService.saveStep(2, { email, otp }) :
            this.clientRegistrationService.saveStep(2, { email, otp })
          );

          if (response.success) {
            this.clearFormErrors();
            this.otpVerified = true;
            this.showSuccessMessage('OTP verified successfully');
            this.currentStep++;
          } else {
            this.error = response.message || 'Invalid OTP. Please try again.';
          }
        } catch (error: any) {
          this.error = error.error?.message || 'Failed to verify OTP';
        }
      } else if (this.currentStep === 5) {
        // For step 5, complete registration
        try {
          // Validate step 5 form
          this.markFormGroupTouched(this.step5Form);
          if (!this.step5Form.valid) {
            this.error = 'Please complete all required fields in step 5';
            return;
          }

          const email = this.step1Form.get('email')?.value;
          const step5Data = { email, ...this.step5Form.value };
          
          const response = await firstValueFrom<ApiResponse>(this.isVendor ?
            this.vendorRegistrationService.saveStep(5, step5Data) :
            this.clientRegistrationService.saveStep(5, step5Data)
          );
          
          if (response.success) {
            this.showSuccessMessage('Registration complete! Redirecting to login...', 2000);
            // Redirect to login after a short delay
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.error = response.message || 'Failed to complete registration';
          }
        } catch (error: any) {
          console.error('Step 5 error:', error);
          this.error = error.error?.message || 'Failed to complete registration';
        }
      } else {
        // For other steps, just save the data
        try {
          const response = await firstValueFrom<ApiResponse>(this.isVendor ? 
            this.vendorRegistrationService.saveStep(this.currentStep, stepData) :
            this.clientRegistrationService.saveStep(this.currentStep, stepData)
          );
          
          if (response.success) {
            this.clearFormErrors();
            this.currentStep++;
          } else {
            this.error = response.message || `Failed to save step ${this.currentStep} data`;
          }
        } catch (error: any) {
          console.error(`Step ${this.currentStep} - Error:`, error);
          this.error = error.error?.message || `Failed to save step ${this.currentStep} data`;
        }
      }
    }
  }

  async sendOTP(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = '';
      const email = this.step1Form.get('email')?.value;
      
      const response = await firstValueFrom<OTPResponse>(this.isVendor ? 
        this.vendorRegistrationService.sendOTP(email) :
        this.clientRegistrationService.sendOTP(email)
      );

      if (response.success) {
        this.otpSent = true;
        this.currentOTP = response.otp || ''; // Store the OTP from backend
        this.startOtpTimer();
        this.showSuccessMessage('OTP sent successfully');
      } else {
        this.error = response.message || 'Failed to send OTP';
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to send OTP. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  private startOtpTimer(): void {
    this.otpTimer = 300; // 5 minutes
    this.otpInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        clearInterval(this.otpInterval);
        this.otpSent = false;
      }
    }, 1000);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private clearFormErrors(): void {
    // Clear errors from all forms without affecting values
    this.step1Form.setErrors(null);
    this.step2Form.setErrors(null);
    this.step3Form.setErrors(null);
    this.step4Form.setErrors(null);
    this.step5Form.setErrors(null);
    
    // Clear individual field errors without affecting values
    Object.keys(this.step1Form.controls).forEach(key => {
      const control = this.step1Form.get(key);
      if (control) {
        control.setErrors(null);
        // Ensure the field is not marked as touched to prevent showing validation errors
        control.markAsUntouched();
      }
    });
  }

  private preserveFormValues(): void {
    // This method ensures form values are preserved when there are server errors
    // The form values are already preserved by Angular, we just need to ensure
    // the password match validator doesn't trigger incorrectly
    if (this.step1Form.get('password')?.value && this.step1Form.get('confirmPassword')?.value) {
      // If both password fields have values, ensure they match for validation
      const password = this.step1Form.get('password')?.value;
      const confirmPassword = this.step1Form.get('confirmPassword')?.value;
      
      if (password === confirmPassword) {
        // If passwords match, clear any password mismatch errors
        this.step1Form.setErrors(null);
      }
    }
  }

  private showSuccessMessage(message: string, duration: number = 3000): void {
    this.success = message;
    // Auto-dismiss the success message after the specified duration
    setTimeout(() => {
      if (this.success === message) {
        this.success = '';
      }
    }, duration);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['pattern']) return this.getPatternError(fieldName);
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      companyName: 'Company Name',
      firstName: 'First Name',
      lastName: 'Last Name',
      contactPerson: 'Contact Person',
      gstNumber: 'GST Number',
      serviceType: 'Service Type',
      numberOfResources: this.userType === 'client' ? 'Number of Requirements' : 'Number of Resources',
      phone: 'Mobile Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      otp: 'OTP',
      addressLine1: 'Address Line 1',
      city: 'City',
      state: 'State',
      country: 'Country',
      pinCode: 'Pin Code',
      accountNumber: 'Bank Account Number',
      accountType: 'Account Type',
      ifscCode: 'IFSC Code',
      bankName: 'Bank Name',
      branchName: 'Branch Name',
      bankCity: 'Bank City',
      paymentTerms: 'Payment Terms',
      panNumber: 'PAN Number',
      esiRegistrationNumber: 'ESI Registration Number',
      pfRegistrationNumber: 'PF Registration Number',
      compliesWithStatutoryRequirements: 'Compliance with Statutory Requirements',
      hasAdequateSafetyStandards: 'Adequate Safety Standards',
      termsAccepted: 'Terms and Conditions'
    };
    return labels[fieldName] || fieldName;
  }

  private getPatternError(fieldName: string): string {
    const errors: { [key: string]: string } = {
      phone: 'Mobile number must be 10 digits',
      gstNumber: 'Please enter a valid GST number',
      pinCode: 'Pin code must be 6 digits',
      accountNumber: 'Bank account number must be 9-18 digits',
      ifscCode: 'Please enter a valid IFSC code',
      panNumber: 'Please enter a valid PAN number',
      otp: 'OTP must be 6 digits',
      esiRegistrationNumber: 'ESI number must be 10 digits',
      pfRegistrationNumber: 'Please enter a valid PF registration number'
    };
    return errors[fieldName] || 'Please enter a valid value';
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  copyOTP(): void {
    const otp = this.currentOTP;
    if (!otp) {
      this.showSuccessMessage('No OTP available to copy');
      return;
    }
    
    navigator.clipboard.writeText(otp).then(() => {
      this.showSuccessMessage('OTP copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = otp;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showSuccessMessage('OTP copied to clipboard!');
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  // Helper methods for template
  get isVendor(): boolean {
    return this.userType === 'vendor';
  }

  get isClient(): boolean {
    return this.userType === 'client';
  }

  get userTypeTitle(): string {
    return this.userType === 'vendor' ? 'Vendor' : 'Client';
  }

  get resourceFieldLabel(): string {
    return this.userType === 'client' ? 'Number of Requirements' : 'Number of Resources';
  }

  get serviceFieldLabel(): string {
    return this.userType === 'client' ? 'Service Required' : 'Service Provided';
  }

  get resourceFieldPlaceholder(): string {
    return this.userType === 'client' ? 'Enter expected number of requirements' : 'Enter number of resources';
  }

  get serviceFieldPlaceholder(): string {
    return this.userType === 'client' ? 'Select required service' : 'Select provided service';
  }

  getAccountTypeOptions() {
    return [
      { value: 'savings', label: 'Savings Account' },
      { value: 'current', label: 'Current Account' },
      { value: 'business', label: 'Business Account' }
    ];
  }

  debugFormValidation() {
    // Debug method - can be used for troubleshooting if needed
  }



  private getCurrentStepData(): any {
    switch (this.currentStep) {
      case 1:
        return {
          email: this.step1Form.get('email')?.value,
          password: this.step1Form.get('password')?.value,
          companyName: this.step1Form.get('companyName')?.value,
          contactPerson: this.step1Form.get('contactPerson')?.value,
          gstNumber: this.step1Form.get('gstNumber')?.value,
          serviceType: this.step1Form.get('serviceType')?.value,
          numberOfResources: this.step1Form.get('numberOfResources')?.value,
          firstName: this.step1Form.get('firstName')?.value,
          lastName: this.step1Form.get('lastName')?.value,
          phone: this.step1Form.get('phone')?.value
        };
      case 2:
        return {
          email: this.step1Form.get('email')?.value,
          otp: this.step2Form.get('otp')?.value
        };
      case 3:
        const step3Data: any = {
          email: this.step1Form.get('email')?.value,
          address: {
            addressLine1: this.step3Form.get('addressLine1')?.value,
            addressLine2: this.step3Form.get('addressLine2')?.value,
            city: this.step3Form.get('city')?.value,
            state: this.step3Form.get('state')?.value,
            country: this.step3Form.get('country')?.value,
            pinCode: this.step3Form.get('pinCode')?.value
          }
        };
        
        // Add payment terms for clients
        if (this.isClient) {
          step3Data.paymentTerms = this.step3Form.get('paymentTerms')?.value;
        }
        
        // Add bank details for vendors
        if (this.isVendor) {
          step3Data.bankDetails = {
            bankAccountNumber: this.step3Form.get('accountNumber')?.value,
            accountType: this.step3Form.get('accountType')?.value,
            ifscCode: this.step3Form.get('ifscCode')?.value,
            bankName: this.step3Form.get('bankName')?.value,
            branchName: this.step3Form.get('branchName')?.value,
            bankCity: this.step3Form.get('bankCity')?.value,
            paymentTerms: this.step3Form.get('paymentTerms')?.value
          };
        }
        
        return step3Data;
      case 4:
        return {
          email: this.step1Form.get('email')?.value,
          panNumber: this.step4Form.get('panNumber')?.value,
          registeredUnderESI: this.step4Form.get('registeredUnderESI')?.value,
          registeredUnderPF: this.step4Form.get('registeredUnderPF')?.value,
          registeredUnderMSMED: this.step4Form.get('registeredUnderMSMED')?.value,
          esiRegistrationNumber: this.step4Form.get('esiRegistrationNumber')?.value,
          pfRegistrationNumber: this.step4Form.get('pfRegistrationNumber')?.value,
          msmedRegistrationNumber: this.step4Form.get('msmedRegistrationNumber')?.value
        };
      case 5:
        return {
          email: this.step1Form.get('email')?.value,
          compliesWithStatutoryRequirements: this.step5Form.get('compliesWithStatutoryRequirements')?.value,
          hasCloseRelativesInCompany: this.step5Form.get('hasCloseRelativesInCompany')?.value,
          hasAdequateSafetyStandards: this.step5Form.get('hasAdequateSafetyStandards')?.value,
          hasOngoingLitigation: this.step5Form.get('hasOngoingLitigation')?.value,
          termsAccepted: this.step5Form.get('termsAccepted')?.value,
          additionalNotes: this.step5Form.get('additionalNotes')?.value
        };
      default:
        return {};
    }
  }

  get isCurrentStepValid(): boolean {
    let isValid = false;
    switch (this.currentStep) {
      case 1:
        isValid = this.step1Form.valid;
        break;
      case 2:
        isValid = this.step2Form.valid;
        break;
      case 3:
        // Force validation update for step 3
        this.step3Form.updateValueAndValidity();
        isValid = this.step3Form.valid;
        
        // If form is invalid, check if all required fields have values manually
        if (!isValid) {
          const requiredFields = ['addressLine1', 'city', 'state', 'country', 'pinCode'];
          if (this.isVendor) {
            requiredFields.push('accountNumber', 'accountType', 'ifscCode', 'bankName', 'branchName', 'bankCity', 'paymentTerms');
          } else if (this.isClient) {
            requiredFields.push('paymentTerms');
          }
          
          const missingFields = requiredFields.filter(field => {
            const value = this.step3Form.get(field)?.value;
            return !value || value.trim() === '';
          });
          
          // If no missing fields, consider form valid regardless of Angular validation
          if (missingFields.length === 0) {
            isValid = true;
          }
        }
        
        break;
      case 4:
        isValid = this.step4Form.valid;
        break;
      case 5:
        isValid = this.step5Form.valid;
        break;
      default:
        isValid = false;
    }
    return isValid;
  }

  // IFSC Code validation and bank details fetching
  fetchBankDetails(ifscCode: string) {
    if (ifscCode.length !== 11) {
      this.clearBankFields();
      return;
    }

    const ifscUrl = `https://ifsc.razorpay.com/${ifscCode}`;

    this.http.get(ifscUrl).subscribe(
      (data: any) => {
        if (data && data.BANK) {
          this.isIFSCInvalid = false; // ✅ Reset error flag if IFSC is valid
          this.step3Form.patchValue({
            bankName: data.BANK,
            branchName: data.BRANCH,
            bankCity: data.CITY
          });
        } else {
          this.isIFSCInvalid = true; // ✅ Mark IFSC as invalid
          this.clearBankFields();
        }
      },
      (error) => {
        console.error('Invalid IFSC code or API error:', error);
        this.isIFSCInvalid = true; // ✅ Mark IFSC as invalid
        this.clearBankFields();
      }
    );
  }

  private clearBankFields() {
    this.step3Form.patchValue({
      bankName: '',
      branchName: '',
      bankCity: ''
    });
  }
}