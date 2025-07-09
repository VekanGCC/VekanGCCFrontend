import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClientRegistration } from '../models/client-registration.model';
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
export class ClientRegistrationService {
  private apiUrl = `${environment.apiUrl}/client`;
  private registrationData = new BehaviorSubject<ClientRegistration | null>(null);
  registration$ = this.registrationData.asObservable();

  constructor(private http: HttpClient) {}

  initializeRegistration(): Observable<ClientRegistration> {
    const initialData: ClientRegistration = {
      step: 1,
      currentStep: 1,
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      contactPerson: '',
      gstNumber: '',
      serviceType: '',
      numberOfRequirements: 1,
      firstName: '',
      lastName: '',
      phone: '',
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: '',
        pinCode: ''
      },
      paymentTerms: '',
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
      documents: {
        identificationDocument: null,
        profileImage: null
      },
      isEmailVerified: false,
      isPhoneVerified: false,
      otpVerified: false
    };

    this.registrationData.next(initialData);
    return of(initialData);
  }

  updateRegistration(data: Partial<ClientRegistration>): Observable<ClientRegistration> {
    const currentData = this.registrationData.value;
    if (currentData) {
      const updatedData = { ...currentData, ...data };
      this.registrationData.next(updatedData);
      return of(updatedData);
    }
    return of(this.registrationData.value as ClientRegistration);
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

  sendOTP(email: string): Observable<OTPResponse> {
    return this.http.post<OTPResponse>(`${this.apiUrl}/send-otp`, { email });
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
            currentData.isEmailVerified = true;
            currentData.otpVerified = true;
            this.registrationData.next(currentData);
          }
          return true;
        }
        return false;
      })
    );
  }

  getRegistrationStatus(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/registration-status`);
  }

  updateStep(step: number): Observable<ClientRegistration> {
    return this.updateRegistration({ currentStep: step });
  }

  completeRegistration(): Observable<ClientRegistration> {
    const currentData = this.registrationData.value;
    if (currentData) {
      return this.http.post<ClientRegistration>(`${this.apiUrl}/complete`, currentData);
    }
    return of(this.registrationData.value as ClientRegistration);
  }

  getCurrentRegistrationData(): Observable<ClientRegistration | null> {
    return this.registration$;
  }

  // Step 1: Basic Information
  saveStep1(data: {
    email: string;
    password: string;
    companyName: string;
    contactPerson: string;
    gstNumber: string;
    serviceType: string;
    numberOfRequirements: number;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/registration/step1`, data);
  }

  // Step 3: Address and Payment Terms
  saveStep3(data: {
    address: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      country: string;
      pinCode: string;
    };
    paymentTerms: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/registration/step3`, data);
  }

  // Step 4: PAN and Compliance
  saveStep4(data: {
    panNumber: string;
    registeredUnderESI: boolean;
    registeredUnderPF: boolean;
    registeredUnderGST: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/registration/step4`, data);
  }

  // Clear Registration Data
  clearRegistrationData(): void {
    localStorage.removeItem('clientRegistration');
    this.registrationData.next(null);
  }

  // Get Service Required Options
  getServiceRequiredOptions(): any[] {
    return [
      { value: 'it_services', label: 'IT Services' },
      { value: 'consulting', label: 'Consulting' },
      { value: 'staffing', label: 'Staffing' },
      { value: 'training', label: 'Training' },
      { value: 'other', label: 'Other' }
    ];
  }
}