export interface VendorRegistration {
  currentStep: number;
  companyName: string;
  firstName: string;
  lastName: string;
  contactPerson: string;
  email: string;
  numberOfResources: number;
  phone: string;
  gstNumber: string;
  serviceType: string;
  password: string;
  confirmPassword: string;
  otpVerified: boolean;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    pinCode: string;
  };
  bankDetails: {
    accountNumber: string;
    accountType: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    bankCity: string;
    paymentTerms: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOption {
  value: string;
  label: string;
}

export interface AccountTypeOption {
  value: string;
  label: string;
}