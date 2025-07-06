import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuditLog, AuditTrailSummary } from '../../../models/audit-log.model';
import { AuditLogService } from '../../../services/audit-log.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './audit-trail.component.html',
  styleUrls: ['./audit-trail.component.scss']
})
export class AuditTrailComponent implements OnInit, OnDestroy {
  @Input() entityType!: 'sow' | 'po' | 'invoice' | 'payment' | 'credit_note';
  @Input() entityId!: string;
  @Input() showSummary = true;
  @Input() maxEntries = 50;

  private destroy$ = new Subject<void>();

  // Data
  auditLogs: AuditLog[] = [];
  auditSummary: AuditTrailSummary | null = null;
  isLoading = false;
  isLoadingSummary = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;

  // Pagination state
  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  // Filters
  selectedActionType: string = '';
  selectedUser: string = '';
  dateRange: { start: string; end: string } = {
    start: '',
    end: ''
  };

  // Action types for filtering
  actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'create', label: 'Created' },
    { value: 'update', label: 'Updated' },
    { value: 'status_change', label: 'Status Changed' },
    { value: 'approval', label: 'Approved' },
    { value: 'rejection', label: 'Rejected' },
    { value: 'payment', label: 'Payment' },
    { value: 'credit_note', label: 'Credit Note' }
  ];

  constructor(
    private auditLogService: AuditLogService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAuditTrail();
    if (this.showSummary) {
      this.loadAuditSummary();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAuditTrail(): void {
    this.isLoading = true;
    this.error = null;
    this.paginationState.isLoading = true;

    const query: any = {
      page: this.paginationState.currentPage,
      limit: this.paginationState.pageSize,
      sortBy: 'performedAt',
      sortOrder: 'desc'
    };

    if (this.selectedActionType) {
      query.actionType = this.selectedActionType;
    }

    if (this.selectedUser) {
      query.performedBy = this.selectedUser;
    }

    if (this.dateRange && this.dateRange.start && this.dateRange.end) {
      query.startDate = this.dateRange.start;
      query.endDate = this.dateRange.end;
    }

    this.auditLogService.getAuditLogs(query).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.auditLogs = response.data.docs || [];
        this.paginationState.totalItems = response.data.totalDocs || 0;
        this.paginationState.totalPages = response.data.totalPages || 0;
        this.paginationState.hasNextPage = response.data.hasNextPage || false;
        this.paginationState.hasPreviousPage = response.data.hasPrevPage || false;
        this.isLoading = false;
        this.paginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading audit trail:', error);
        this.error = 'Failed to load audit trail';
        this.isLoading = false;
        this.paginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  loadAuditSummary(): void {
    this.isLoadingSummary = true;

    this.auditLogService.getAuditTrailSummary(this.entityType, this.entityId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (summary) => {
        this.auditSummary = summary;
        this.isLoadingSummary = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading audit summary:', error);
        this.isLoadingSummary = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadAuditTrail();
  }

  onActionTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedActionType = target.value;
    this.paginationState.currentPage = 1;
    this.loadAuditTrail();
  }

  onUserChange(userId: string): void {
    this.selectedUser = userId;
    this.paginationState.currentPage = 1;
    this.loadAuditTrail();
  }

  onDateRangeChange(dateRange: { start: string; end: string } | null): void {
    this.dateRange = dateRange || { start: '', end: '' };
    this.paginationState.currentPage = 1;
    this.loadAuditTrail();
  }

  clearFilters(): void {
    this.selectedActionType = '';
    this.selectedUser = '';
    this.dateRange = { start: '', end: '' };
    this.paginationState.currentPage = 1;
    this.loadAuditTrail();
  }

  exportAuditTrail(format: 'csv' | 'pdf' | 'excel' = 'csv'): void {
    const query: any = {
      entityType: this.entityType,
      entityId: this.entityId,
      sortBy: 'performedAt',
      sortOrder: 'desc'
    };

    if (this.selectedActionType) {
      query.actionType = this.selectedActionType;
    }

    if (this.selectedUser) {
      query.performedBy = this.selectedUser;
    }

    if (this.dateRange && this.dateRange.start && this.dateRange.end) {
      query.startDate = this.dateRange.start;
      query.endDate = this.dateRange.end;
    }

    this.auditLogService.exportAuditLogs(query, format).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-trail-${this.entityType}-${this.entityId}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting audit trail:', error);
      }
    });
  }

  getActionIcon(actionType: string): string {
    switch (actionType) {
      case 'create':
        return '📝';
      case 'update':
        return '✏️';
      case 'status_change':
        return '🔄';
      case 'approval':
        return '✅';
      case 'rejection':
        return '❌';
      case 'payment':
        return '💳';
      case 'credit_note':
        return '📄';
      default:
        return '📋';
    }
  }

  getActionClass(actionType: string): string {
    switch (actionType) {
      case 'create':
        return 'bg-blue-100 text-blue-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'status_change':
        return 'bg-purple-100 text-purple-800';
      case 'approval':
        return 'bg-green-100 text-green-800';
      case 'rejection':
        return 'bg-red-100 text-red-800';
      case 'payment':
        return 'bg-emerald-100 text-emerald-800';
      case 'credit_note':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  formatChanges(changes: any[]): string {
    if (!changes || changes.length === 0) return 'No specific changes recorded';
    
    return changes.map(change => 
      `${change.field}: ${this.formatValue(change.oldValue)} → ${this.formatValue(change.newValue)}`
    ).join(', ');
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  getUserDisplayName(performedBy: any): string {
    if (!performedBy) return 'System';
    return `${performedBy.firstName} ${performedBy.lastName} (${performedBy.organizationRole})`;
  }

  hasChanges(auditLog: AuditLog): boolean {
    return !!(auditLog.changes && auditLog.changes.length > 0);
  }

  isSystemGenerated(auditLog: AuditLog): boolean {
    return auditLog.systemGenerated || !!(auditLog.metadata && auditLog.metadata['systemGenerated']);
  }

  trackById(index: number, item: AuditLog): string {
    return item._id || `audit-${index}`;
  }

  getMetadataKeys(metadata: any): string[] {
    return Object.keys(metadata || {});
  }

  // Helper methods for template
  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
} 