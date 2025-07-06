export interface AuditLog {
  _id: string;
  entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note';
  entityId: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'status_change' | 'approval' | 'rejection' | 'payment' | 'credit_note';
  previousState?: any;
  newState?: any;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  performedBy: {
    userId: string;
    userType: 'client' | 'vendor' | 'admin';
    organizationId: string;
    organizationRole: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  performedAt: string;
  ipAddress?: string;
  userAgent?: string;
  comments?: string;
  metadata?: {
    [key: string]: any;
  };
  relatedEntities?: {
    entityType: string;
    entityId: string;
    relationship: string;
  }[];
  systemGenerated: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuditLogRequest {
  entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note';
  entityId: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'status_change' | 'approval' | 'rejection' | 'payment' | 'credit_note';
  previousState?: any;
  newState?: any;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  comments?: string;
  metadata?: {
    [key: string]: any;
  };
  relatedEntities?: {
    entityType: string;
    entityId: string;
    relationship: string;
  }[];
}

export interface AuditLogQuery {
  entityType?: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note';
  entityId?: string;
  actionType?: string;
  performedBy?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogResponse {
  success: boolean;
  data: {
    docs: AuditLog[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
  message?: string;
}

// Audit trail summary for display
export interface AuditTrailSummary {
  totalActions: number;
  lastAction: AuditLog;
  keyActions: AuditLog[];
  timeline: {
    date: string;
    actions: AuditLog[];
  }[];
}

// Specific audit log types for different entities
export interface SOWAuditLog extends AuditLog {
  entityType: 'sow';
  sowSpecificData?: {
    previousStatus?: string;
    newStatus?: string;
    vendorId?: string;
    estimatedCost?: {
      amount: number;
      currency: string;
    };
    approvalLevel?: string;
  };
}

export interface POAuditLog extends AuditLog {
  entityType: 'po';
  poSpecificData?: {
    previousStatus?: string;
    newStatus?: string;
    sowId?: string;
    totalAmount?: {
      amount: number;
      currency: string;
    };
    financeApprovalLevel?: string;
  };
}

export interface InvoiceAuditLog extends AuditLog {
  entityType: 'invoice';
  invoiceSpecificData?: {
    previousPaymentStatus?: string;
    newPaymentStatus?: string;
    poId?: string;
    invoiceAmount?: {
      amount: number;
      currency: string;
    };
    paymentDetails?: {
      paidAmount: number;
      paymentMethod: string;
      transactionId?: string;
    };
  };
} 