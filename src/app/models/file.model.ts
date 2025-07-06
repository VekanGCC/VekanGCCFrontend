export interface File {
  _id: string;
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
  extension: string;
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  entityType: 'user' | 'resource' | 'requirement' | 'application' | 'vendor' | 'client';
  entityId: string;
  category: 'profile' | 'document' | 'certificate' | 'contract' | 'invoice' | 'other';
  description: string;
  isPublic: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNotes?: string;
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedAt?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  tags: string[];
  metadata?: any;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileUploadRequest {
  file: File;
  entityType: string;
  entityId: string;
  category?: string;
  description?: string;
  isPublic?: boolean;
  tags?: string;
}

export interface FileUpdateRequest {
  description?: string;
  category?: string;
  isPublic?: boolean;
  tags?: string;
}

export interface FileApprovalRequest {
  approvalStatus: 'approved' | 'rejected';
  approvalNotes?: string;
}

export interface BulkApprovalRequest {
  fileIds: string[];
  approvalStatus: 'approved' | 'rejected';
  approvalNotes?: string;
}

export interface FileFilters {
  category?: string;
  approvalStatus?: string;
  page?: number;
  limit?: number;
}

export interface FileStats {
  totalFiles: number;
  pendingApprovals: number;
  approvedFiles: number;
  rejectedFiles: number;
  totalSize: number;
  categories: {
    [key: string]: number;
  };
} 