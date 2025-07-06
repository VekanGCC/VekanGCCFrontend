import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { VendorRegistration } from '../models/vendor-registration.model';
import { environment } from '../../environments/environment';

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface OTPResponse extends ApiResponse {
  otp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VendorRegistrationService {
  private apiUrl = `${environment.apiUrl}/vendor`;
  private registrationData = new BehaviorSubject<VendorRegistration | null>(null);
  registration$ = this.registrationData.asObservable();

  constructor(private http: HttpClient) {}

  initializeRegistration(): Observable<VendorRegistration> {
    const initialData: VendorRegistration = {
      currentStep: 1,
      companyName: '',
      firstName: '',
      lastName: '',
      contactPerson: '',
      email: '',
      numberOfResources: 1,
      phone: '',
      gstNumber: '',
      serviceType: '',
      password: '',
      confirmPassword: '',
      otpVerified: false,
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        pinCode: ''
      },
      bankDetails: {
        accountNumber: '',
        accountType: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
        bankCity: '',
        paymentTerms: ''
      },
      panNumber: '',
      registeredUnderESI: false,
      registeredUnderPF: false,
      registeredUnderMSMED: false,
      esiRegistrationNumber: '',
      pfRegistrationNumber: '',
      msmedRegistrationNumber: '',
      compliesWithStatutoryRequirements: false,
      hasCloseRelativesInCompany: false,
      hasAdequateSafetyStandards: false,
      hasOngoingLitigation: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.registrationData.next(initialData);
    return of(initialData);
  }

  sendOTP(email: string): Observable<OTPResponse> {
    // For vendor, OTP is generated in step 1, so this can be a no-op or return a mock response
    // Optionally, you can implement a resend OTP endpoint if needed
    return of({ success: true, message: 'OTP sent (mock for vendor)', otp: '123456' });
  }

  verifyOTP(email: string, otp: string): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/create`, {
      step: 2,
      data: { email, otp }
    }).pipe(
      map(response => {
        if (response.success) {
          const currentData = this.registrationData.value;
          if (currentData) {
            currentData.otpVerified = true;
            this.registrationData.next(currentData);
          }
          return true;
        }
        return false;
      })
    );
  }

  saveStep(step: number, data: any): Observable<ApiResponse> {
    const currentData = this.registrationData.value;
    if (step === 1) {
      // For step 1, store the data in registration data
      if (currentData) {
        const updatedData = { ...currentData, ...data };
        this.registrationData.next(updatedData);
      }
    }
    return this.http.post<ApiResponse>(`${this.apiUrl}/create`, { step, data });
  }

  getRegistrationStatus(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/registration-status`);
  }

  clearRegistrationData(): void {
    localStorage.removeItem('vendorRegistration');
    this.registrationData.next(null);
  }

  getServiceOptions(): any[] {
    return [
      { value: 'it_services', label: 'IT Services' },
      { value: 'consulting', label: 'Consulting' },
      { value: 'staffing', label: 'Staffing' },
      { value: 'training', label: 'Training' },
      { value: 'other', label: 'Other' }
    ];
  }
}