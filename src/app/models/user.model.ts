export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  userType: 'vendor' | 'client' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  registrationStep: number;
  isRegistrationComplete: boolean;
  companyName: string;
  contactPerson: string;
  phone: string;
  gstNumber: string;
  serviceType: string;
  numberOfResources?: number;
  numberOfRequirements?: number;
  paymentTerms?: string;
  businessInfo?: {
    companyName: string;
    businessType?: string;
    registrationNumber?: string;
    taxId?: string;
  };
  // Organization fields (for all users)
  organizationId?: string;
  organizationRole?: 'admin_owner' | 'admin_employee' | 'admin_account' | 'vendor_owner' | 'vendor_employee' | 'vendor_account' | 'client_owner' | 'client_employee' | 'client_account';
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface UserAddress {
  _id: string;
  userId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserBankDetails {
  _id: string;
  userId: string;
  bankAccountNumber: string;
  accountType: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  bankCity: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatutoryCompliance {
  _id: string;
  userId: string;
  panNumber: string;
  registeredUnderESI: boolean;
  esiRegistrationNumber?: string;
  registeredUnderPF: boolean;
  pfRegistrationNumber?: string;
  registeredUnderMSMED: boolean;
  msmedRegistrationNumber?: string;
  compliesWithStatutoryRequirements: boolean;
  hasCloseRelativesInCompany: boolean;
  hasAdequateSafetyStandards: boolean;
  hasOngoingLitigation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}