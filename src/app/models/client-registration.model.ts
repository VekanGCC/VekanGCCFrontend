export interface ClientRegistration {
  step: number;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  contactPerson: string;
  gstNumber: string;
  serviceType: string;
  numberOfRequirements: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    pinCode: string;
  };
  panNumber: string;
  registeredUnderESI: boolean;
  registeredUnderPF: boolean;
  registeredUnderMSMED: boolean;
  esiRegistrationNumber?: string;
  pfRegistrationNumber?: string;
  msmedRegistrationNumber?: string;
  compliesWithStatutoryRequirements: boolean;
  hasCloseRelativesInCompany: boolean;
  hasAdequateSafetyStandards: boolean;
  hasOngoingLitigation: boolean;
  documents: {
    identificationDocument: File | null;
    profileImage: File | null;
  };
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  otpVerified: boolean;
  currentStep: number;
}

export interface ServiceRequiredOption {
  value: string;
  label: string;
}