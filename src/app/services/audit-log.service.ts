import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  AuditLog, 
  CreateAuditLogRequest, 
  AuditLogQuery, 
  AuditLogResponse,
  AuditTrailSummary 
} from '../models/audit-log.model';

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  // Create audit log entry
  createAuditLog(auditData: CreateAuditLogRequest): Observable<any> {
    return this.http.post(this.apiUrl, auditData);
  }

  // Get audit logs with filters
  getAuditLogs(query: AuditLogQuery): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(this.apiUrl, { params: query as any });
  }

  // Get audit trail for specific entity
  getEntityAuditTrail(entityType: string, entityId: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/entity/${entityType}/${entityId}`);
  }

  // Get audit trail summary for entity
  getAuditTrailSummary(entityType: string, entityId: string): Observable<AuditTrailSummary> {
    return this.http.get<AuditTrailSummary>(`${this.apiUrl}/entity/${entityType}/${entityId}/summary`);
  }

  // Get audit logs by organization
  getOrganizationAuditLogs(organizationId: string, query?: AuditLogQuery): Observable<AuditLogResponse> {
    const params = { organizationId, ...query };
    return this.http.get<AuditLogResponse>(`${this.apiUrl}/organization`, { params: params as any });
  }

  // Get audit logs by user
  getUserAuditLogs(userId: string, query?: AuditLogQuery): Observable<AuditLogResponse> {
    const params = { userId, ...query };
    return this.http.get<AuditLogResponse>(`${this.apiUrl}/user`, { params: params as any });
  }

  // Export audit logs
  exportAuditLogs(query: AuditLogQuery, format: 'csv' | 'pdf' | 'excel' = 'csv'): Observable<Blob> {
    const params = { ...query, format };
    return this.http.get(`${this.apiUrl}/export`, { 
      params: params as any,
      responseType: 'blob' 
    });
  }

  // Get audit log statistics
  getAuditStatistics(organizationId?: string, startDate?: string, endDate?: string): Observable<any> {
    const params: any = {};
    if (organizationId) params.organizationId = organizationId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return this.http.get(`${this.apiUrl}/statistics`, { params });
  }

  // Helper method to create audit log for entity creation
  logEntityCreation(
    entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note',
    entityId: string,
    entityData: any,
    comments?: string
  ): Observable<any> {
    const auditData: CreateAuditLogRequest = {
      entityType,
      entityId,
      action: `${entityType.toUpperCase()} Created`,
      actionType: 'create',
      newState: entityData,
      comments,
      metadata: {
        creationMethod: 'manual',
        entityVersion: 1
      }
    };
    return this.createAuditLog(auditData);
  }

  // Helper method to create audit log for entity updates
  logEntityUpdate(
    entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note',
    entityId: string,
    previousState: any,
    newState: any,
    changes: { field: string; oldValue: any; newValue: any }[],
    comments?: string
  ): Observable<any> {
    const auditData: CreateAuditLogRequest = {
      entityType,
      entityId,
      action: `${entityType.toUpperCase()} Updated`,
      actionType: 'update',
      previousState,
      newState,
      changes,
      comments,
      metadata: {
        updateMethod: 'manual',
        fieldsChanged: changes.map(c => c.field)
      }
    };
    return this.createAuditLog(auditData);
  }

  // Helper method to create audit log for status changes
  logStatusChange(
    entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note',
    entityId: string,
    previousStatus: string,
    newStatus: string,
    comments?: string,
    metadata?: any
  ): Observable<any> {
    const auditData: CreateAuditLogRequest = {
      entityType,
      entityId,
      action: `${entityType.toUpperCase()} Status Changed: ${previousStatus} → ${newStatus}`,
      actionType: 'status_change',
      previousState: { status: previousStatus },
      newState: { status: newStatus },
      changes: [
        {
          field: 'status',
          oldValue: previousStatus,
          newValue: newStatus
        }
      ],
      comments,
      metadata: {
        statusTransition: `${previousStatus} → ${newStatus}`,
        ...metadata
      }
    };
    return this.createAuditLog(auditData);
  }

  // Helper method to create audit log for approvals
  logApproval(
    entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note',
    entityId: string,
    approvalType: 'approval' | 'rejection',
    previousState: any,
    newState: any,
    comments?: string,
    metadata?: any
  ): Observable<any> {
    const action = approvalType === 'approval' ? 'Approved' : 'Rejected';
    const auditData: CreateAuditLogRequest = {
      entityType,
      entityId,
      action: `${entityType.toUpperCase()} ${action}`,
      actionType: approvalType,
      previousState,
      newState,
      comments,
      metadata: {
        approvalType,
        approvalLevel: metadata?.approvalLevel || 'standard',
        ...metadata
      }
    };
    return this.createAuditLog(auditData);
  }

  // Helper method to create audit log for payments
  logPayment(
    entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note',
    entityId: string,
    paymentData: any,
    previousState: any,
    newState: any,
    comments?: string
  ): Observable<any> {
    const auditData: CreateAuditLogRequest = {
      entityType,
      entityId,
      action: `${entityType.toUpperCase()} Payment Processed`,
      actionType: 'payment',
      previousState,
      newState,
      changes: [
        {
          field: 'paymentStatus',
          oldValue: previousState.paymentStatus,
          newValue: newState.paymentStatus
        },
        {
          field: 'paidAmount',
          oldValue: previousState.paidAmount || 0,
          newValue: newState.paidAmount
        }
      ],
      comments,
      metadata: {
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
        paymentAmount: paymentData.paidAmount
      }
    };
    return this.createAuditLog(auditData);
  }

  // Helper method to create audit log for credit notes
  logCreditNote(
    entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note',
    entityId: string,
    creditNoteData: any,
    previousState: any,
    newState: any,
    comments?: string
  ): Observable<any> {
    const auditData: CreateAuditLogRequest = {
      entityType,
      entityId,
      action: `${entityType.toUpperCase()} Credit Note Issued`,
      actionType: 'credit_note',
      previousState,
      newState,
      changes: [
        {
          field: 'creditNote',
          oldValue: previousState.creditNote || null,
          newValue: newState.creditNote
        }
      ],
      comments,
      metadata: {
        creditNoteAmount: creditNoteData.amount,
        creditNoteReason: creditNoteData.reason,
        creditNoteId: creditNoteData._id
      }
    };
    return this.createAuditLog(auditData);
  }

  // Helper method to create system-generated audit log
  logSystemAction(
    entityType: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note',
    entityId: string,
    action: string,
    actionType: string,
    metadata?: any
  ): Observable<any> {
    const auditData: CreateAuditLogRequest = {
      entityType,
      entityId,
      action,
      actionType: actionType as any,
      metadata: {
        systemGenerated: true,
        ...metadata
      }
    };
    return this.createAuditLog(auditData);
  }
} 