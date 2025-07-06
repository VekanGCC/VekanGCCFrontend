import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileService, ProfileData } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { User, UserAddress, UserBankDetails, UserStatutoryCompliance } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileData: ProfileData | null = null;
  isLoading = true;
  isEditing = false;
  activeTab: 'personal' | 'addresses' | 'bank' | 'compliance' = 'personal';
  
  // Forms
  personalForm!: FormGroup;
  addressForm!: FormGroup;
  bankForm!: FormGroup;
  complianceForm!: FormGroup;
  passwordForm!: FormGroup;

  private subscriptions: Subscription[] = [];

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForms(): void {
    this.personalForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      companyName: ['', Validators.required],
      contactPerson: ['', Validators.required],
      gstNumber: [''],
      serviceType: [''],
      numberOfResources: [0],
      numberOfRequirements: [0],
      paymentTerms: ['']
    });

    this.addressForm = this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      pinCode: ['', Validators.required],
      isDefault: [false]
    });

    this.bankForm = this.fb.group({
      bankAccountNumber: ['', Validators.required],
      accountType: ['', Validators.required],
      ifscCode: ['', Validators.required],
      bankName: ['', Validators.required],
      branchName: ['', Validators.required],
      bankCity: ['', Validators.required]
    });

    this.complianceForm = this.fb.group({
      panNumber: [''],
      registeredUnderESI: [false],
      esiRegistrationNumber: [''],
      registeredUnderPF: [false],
      pfRegistrationNumber: [''],
      registeredUnderMSMED: [false],
      msmedRegistrationNumber: [''],
      compliesWithStatutoryRequirements: [false],
      hasCloseRelativesInCompany: [false],
      hasAdequateSafetyStandards: [false],
      hasOngoingLitigation: [false]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  private loadProfileData(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.profileService.getProfile().subscribe({
        next: (data) => {
          this.profileData = data;
          this.populateForms();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.isLoading = false;
        }
      })
    );
  }

  private populateForms(): void {
    if (!this.profileData) return;

    // Populate personal form
    this.personalForm.patchValue({
      firstName: this.profileData.user.firstName,
      lastName: this.profileData.user.lastName,
      phone: this.profileData.user.phone,
      companyName: this.profileData.user.companyName,
      contactPerson: this.profileData.user.contactPerson,
      gstNumber: this.profileData.user.gstNumber,
      serviceType: this.profileData.user.serviceType,
      numberOfResources: this.profileData.user.numberOfResources,
      numberOfRequirements: this.profileData.user.numberOfRequirements,
      paymentTerms: this.profileData.user.paymentTerms
    });

    // Populate compliance form if data exists
    if (this.profileData.compliance) {
      this.complianceForm.patchValue(this.profileData.compliance);
    }
  }

  setActiveTab(tab: 'personal' | 'addresses' | 'bank' | 'compliance'): void {
    this.activeTab = tab;
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateForms(); // Reset forms when canceling edit
    }
  }

  savePersonalInfo(): void {
    if (this.personalForm.valid) {
      this.isLoading = true;
      this.subscriptions.push(
        this.profileService.updateProfile(this.personalForm.value).subscribe({
          next: () => {
            this.isEditing = false;
            this.isLoading = false;
            this.loadProfileData(); // Reload data
          },
          error: (error) => {
            console.error('Error updating profile:', error);
            this.isLoading = false;
          }
        })
      );
    }
  }

  addAddress(): void {
    if (this.addressForm.valid) {
      this.isLoading = true;
      this.subscriptions.push(
        this.profileService.addAddress(this.addressForm.value).subscribe({
          next: () => {
            this.addressForm.reset();
            this.isLoading = false;
            this.loadProfileData(); // Reload data
          },
          error: (error) => {
            console.error('Error adding address:', error);
            this.isLoading = false;
          }
        })
      );
    }
  }

  addBankDetails(): void {
    if (this.bankForm.valid) {
      this.isLoading = true;
      this.subscriptions.push(
        this.profileService.addBankDetails(this.bankForm.value).subscribe({
          next: () => {
            this.bankForm.reset();
            this.isLoading = false;
            this.loadProfileData(); // Reload data
          },
          error: (error) => {
            console.error('Error adding bank details:', error);
            this.isLoading = false;
          }
        })
      );
    }
  }

  saveCompliance(): void {
    if (this.complianceForm.valid) {
      this.isLoading = true;
      this.subscriptions.push(
        this.profileService.updateCompliance(this.complianceForm.value).subscribe({
          next: () => {
            this.isLoading = false;
            this.loadProfileData(); // Reload data
          },
          error: (error) => {
            console.error('Error updating compliance:', error);
            this.isLoading = false;
          }
        })
      );
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid && this.passwordForm.value.newPassword === this.passwordForm.value.confirmPassword) {
      this.isLoading = true;
      this.subscriptions.push(
        this.profileService.changePassword({
          currentPassword: this.passwordForm.value.currentPassword,
          newPassword: this.passwordForm.value.newPassword
        }).subscribe({
          next: () => {
            this.passwordForm.reset();
            this.isLoading = false;
            // Show success message
          },
          error: (error) => {
            console.error('Error changing password:', error);
            this.isLoading = false;
          }
        })
      );
    }
  }

  deleteAddress(addressId: string): void {
    if (confirm('Are you sure you want to delete this address?')) {
      this.subscriptions.push(
        this.profileService.deleteAddress(addressId).subscribe({
          next: () => {
            this.loadProfileData(); // Reload data
          },
          error: (error) => {
            console.error('Error deleting address:', error);
          }
        })
      );
    }
  }

  deleteBankDetails(bankDetailsId: string): void {
    if (confirm('Are you sure you want to delete these bank details?')) {
      this.subscriptions.push(
        this.profileService.deleteBankDetails(bankDetailsId).subscribe({
          next: () => {
            this.loadProfileData(); // Reload data
          },
          error: (error) => {
            console.error('Error deleting bank details:', error);
          }
        })
      );
    }
  }

  isVendor(): boolean {
    return this.profileData?.user.userType === 'vendor';
  }

  getDefaultAddress(): UserAddress | null {
    return this.profileData?.addresses.find(addr => addr.isDefault) || null;
  }
} 