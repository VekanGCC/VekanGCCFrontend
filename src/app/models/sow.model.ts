export interface SOW {
  _id: string;
  title: string;
  description: string;
  requirementId?: string;
  clientId: string;
  vendorId: string;
  startDate: string;
  endDate: string;
  estimatedCost: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
  status: 'draft' | 'submitted' | 'pm_approval_pending' | 'internal_approved' | 'sent_to_vendor' | 'vendor_accepted' | 'vendor_rejected' | 'cancelled';
  approvals: SOWApproval[];
  vendorResponse: {
    status: 'accepted' | 'rejected' | 'pending';
    responseDate?: string;
    comments?: string;
    proposedChanges?: string;
    respondedBy?: string;
    respondedByRole?: string;
  };
  clientOrganizationId: string;
  vendorOrganizationId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  statusDisplay?: string;
  
  workflowHistory: {
    status: string;
    timestamp: string;
    performedBy: string;
    performedByRole: string;
    comments?: string;
  }[];
}

export interface SOWApproval {
  userId: string;
  date: string;
  status: 'approved' | 'rejected';
  comments?: string;
  role: 'client_admin' | 'client_account' | 'vendor_admin' | 'vendor_account';
}

export interface CreateSOWRequest {
  title: string;
  description: string;
  requirementId?: string;
  vendorId: string;
  startDate: string;
  endDate: string;
  estimatedCost: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
}

export interface UpdateSOWRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  estimatedCost?: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
}

export interface SOWResponse {
  status: 'accepted' | 'rejected';
  comments?: string;
  proposedChanges?: string;
}

export interface VendorSOWApprovalRequest {
  sowId: string;
  status: 'accepted' | 'rejected';
  comments?: string;
  proposedChanges?: string;
} 