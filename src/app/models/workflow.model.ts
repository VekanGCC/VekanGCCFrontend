export interface WorkflowStep {
  _id?: string;
  name: string;
  order: number;
  role: 'client' | 'vendor' | 'admin' | 'hr_admin' | 'super_admin';
  action: 'review' | 'approve' | 'reject' | 'notify' | 'escalate' | 'interact' | 'revoke';
  required: boolean;
  autoAdvance: boolean;
  description?: string;
  notifications?: WorkflowNotification[];
  conditions?: any;
}

export interface WorkflowNotification {
  type: 'email' | 'sms' | 'in_app';
  template?: string;
  recipients: ('applicant' | 'client' | 'vendor' | 'admin' | 'hr_admin')[];
}

export interface WorkflowSettings {
  allowParallelProcessing: boolean;
  maxProcessingTime: number; // in hours
  autoEscalateAfter: number; // in hours
  requireComments: boolean;
}

export interface WorkflowConfiguration {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  applicationTypes: ('client_applied' | 'vendor_applied' | 'both')[];
  steps: WorkflowStep[];
  settings: WorkflowSettings;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepInstance {
  stepId: string;
  stepName: string;
  order: number;
  role: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'escalated';
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  startedAt?: string;
  completedAt?: string;
  performedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  actionTaken?: 'approved' | 'rejected' | 'reviewed' | 'escalated' | 'notified';
  comments?: string;
  metadata?: any;
  notifications?: WorkflowStepNotification[];
}

export interface WorkflowStepNotification {
  type: 'email' | 'sms' | 'in_app';
  sentAt: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface WorkflowInstance {
  _id: string;
  applicationId: {
    _id: string;
    status: string;
    notes?: string;
    requirement?: any;
    resource?: any;
  };
  workflowConfigurationId: {
    _id: string;
    name: string;
    description?: string;
    steps?: WorkflowStep[];
  };
  currentStep: number;
  status: 'active' | 'completed' | 'cancelled' | 'escalated';
  steps: WorkflowStepInstance[];
  startedAt: string;
  completedAt?: string;
  escalatedAt?: string;
  escalatedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  escalationReason?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  applicationTypes: ('client_applied' | 'vendor_applied' | 'both')[];
  steps: WorkflowStep[];
  settings: WorkflowSettings;
  isDefault?: boolean;
}

export interface UpdateWorkflowRequest extends Partial<CreateWorkflowRequest> {}

export interface ProcessWorkflowStepRequest {
  stepOrder: number;
  action: 'approved' | 'rejected' | 'reviewed' | 'escalated' | 'notified';
  comments?: string;
  metadata?: any;
}

export interface WorkflowFilters {
  isActive?: boolean;
  applicationTypes?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface WorkflowInstanceFilters {
  status?: string;
  applicationId?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} 