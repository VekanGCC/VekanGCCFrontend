export interface PO {
  _id: string;
  poNumber: string;
  sowId: string;
  clientId: string;
  vendorId: string;
  startDate: string;
  endDate: string;
  totalAmount: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
  paymentTerms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'immediate' | 'custom';
  customPaymentTerms?: string;
  status: 'draft' | 'submitted' | 'finance_approved' | 'sent_to_vendor' | 'vendor_accepted' | 'vendor_rejected' | 'cancelled' | 'active' | 'completed';
  financeApproval: {
    userId?: string;
    status: 'pending' | 'approved' | 'rejected';
    date?: string;
    comments?: string;
  };
  vendorResponse: {
    status: 'accepted' | 'rejected' | 'pending';
    responseDate?: string;
    comments?: string;
    respondedBy?: string;
    respondedByRole?: string;
  };
  paymentTracking: {
    totalInvoiced: number;
    totalPaid: number;
    remainingAmount: number;
    lastPaymentDate?: string;
  };
  clientOrganizationId: string;
  vendorOrganizationId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  statusDisplay?: string;
  paymentTermsDisplay?: string;
  
  workflowHistory: {
    status: string;
    timestamp: string;
    performedBy: string;
    performedByRole: string;
    comments?: string;
  }[];
}

export interface CreatePORequest {
  sowId: string;
  vendorId: string;
  startDate: string;
  endDate: string;
  totalAmount: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
  paymentTerms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'immediate' | 'custom';
  customPaymentTerms?: string;
}

export interface UpdatePORequest {
  startDate?: string;
  endDate?: string;
  totalAmount?: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
  paymentTerms?: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'immediate' | 'custom';
  customPaymentTerms?: string;
}

export interface POResponse {
  status: 'accepted' | 'rejected';
  comments?: string;
}

export interface FinanceApprovalRequest {
  status: 'approved' | 'rejected';
  comments?: string;
}

export interface VendorPOApprovalRequest {
  poId: string;
  status: 'accepted' | 'rejected';
  comments?: string;
} 