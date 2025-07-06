export interface Invoice {
  _id: string;
  invoiceNumber: string;
  poId: string;
  vendorId: string;
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  invoiceAmount: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
  workSummary: string;
  invoiceFile?: {
    originalName: string;
    fileSize: number;
    fileType: string;
    fileId: string;
    filename: string;
    path: string;
    uploadedAt: string;
  };
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'paid' | 'overdue' | 'cancelled';
  paymentDetails: {
    paidAmount: number;
    paidDate?: string;
    paymentMethod: 'bank_transfer' | 'check' | 'credit_card' | 'other';
    transactionId?: string;
    notes?: string;
  };
  creditNote?: {
    amount: number;
    reason?: string;
    file?: {
      originalName: string;
      fileSize: number;
      fileType: string;
      fileId: string;
      filename: string;
      path: string;
    };
    createdAt?: string;
    createdBy?: string;
  };
  approvalDetails: {
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
  };
  alerts: InvoiceAlert[];
  clientOrganizationId: string;
  vendorOrganizationId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  statusDisplay?: string;
  paymentMethodDisplay?: string;
  daysOverdue?: number;
  
  // Workflow tracking
  workflowHistory: {
    status: string;
    timestamp: string;
    performedBy: string;
    performedByRole: string;
    comments?: string;
  }[];
  
  // PO validation - ensure PO is accepted
  poValidation: {
    poStatus: string;
    poAcceptedDate?: string;
    poAcceptedBy?: string;
  };
}

export interface InvoiceAlert {
  date: string;
  type: 'due_date_approaching' | 'overdue' | 'payment_received' | 'credit_note_issued';
  message: string;
  isRead: boolean;
}

export interface CreateInvoiceRequest {
  poId: string;
  vendorId: string;
  invoiceDate: string;
  invoiceAmount: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
  workSummary: string;
  invoiceFile?: File;
}

export interface UpdateInvoiceRequest {
  invoiceDate?: string;
  invoiceAmount?: {
    amount: number;
    currency: 'USD' | 'EUR' | 'GBP' | 'INR';
  };
  workSummary?: string;
  invoiceFile?: File;
}

export interface InvoiceApprovalRequest {
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface PaymentUpdateRequest {
  paidAmount: number;
  paidDate: string;
  paymentMethod: 'bank_transfer' | 'check' | 'credit_card' | 'other';
  transactionId?: string;
  notes?: string;
}

export interface CreditNoteRequest {
  amount: number;
  reason: string;
  creditNoteFile?: File;
} 