import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { SOW, VendorSOWApprovalRequest } from '../../../models/sow.model';
import { SOWService } from '../../../services/sow.service';
import { AuthService } from '../../../services/auth.service';
import { AuditLogService } from '../../../services/audit-log.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { AuditTrailComponent } from '../../shared/audit-trail/audit-trail.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-sow-approvals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    LucideAngularModule,
    PaginationComponent,
    AuditTrailComponent
  ],
  templateUrl: './sow-approvals.component.html',
  styleUrls: ['./sow-approvals.component.scss']
})
export class SOWApprovalsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  sows: SOW[] = [];
  isLoading = false;
  totalSOWs = 0;
  currentPage = 1;
  pageSize = 10;

  // Pagination state
  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  // Modal states
  showApprovalModal = false;
  showViewModal = false;
  showAuditTrailModal = false;
  selectedSOW: SOW | null = null;
  selectedSOWForAudit: SOW | null = null;

  // Forms
  approvalForm: FormGroup;

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'SOW ID',
      field: '_id',
      flex: 1,
      cellRenderer: (params: any) => {
        const sowId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${sowId ? sowId.slice(-6) : 'N/A'}</div>`;
      }
    },
    {
      headerName: 'Title',
      field: 'title',
      flex: 2,
      cellRenderer: (params: any) => {
        return `<div class="text-sm text-gray-900">${params.data.title}</div>`;
      }
    },
    {
      headerName: 'Client',
      field: 'clientId',
      flex: 2,
      cellRenderer: (params: any) => {
        const client = params.data.clientId;
        if (typeof client === 'object' && client) {
          return `<div class="text-sm text-gray-900">${client.firstName} ${client.lastName}</div>`;
        }
        return '<div class="text-sm text-gray-500">Unknown</div>';
      }
    },
    {
      headerName: 'Estimated Cost',
      field: 'estimatedCost',
      flex: 1,
      cellRenderer: (params: any) => {
        const cost = params.data.estimatedCost;
        if (cost) {
          return `<div class="text-sm text-gray-900">${cost.currency} ${cost.amount.toLocaleString()}</div>`;
        }
        return '<div class="text-sm text-gray-500">N/A</div>';
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 1,
      cellRenderer: (params: any) => {
        const status = params.data.status;
        const statusClass = this.getStatusClass(status);
        const statusText = this.formatStatus(status);
        
        return `
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${statusText}
          </span>
        `;
      }
    },
    {
      headerName: 'Received Date',
      field: 'createdAt',
      flex: 1,
      cellRenderer: (params: any) => {
        const date = params.data.createdAt;
        const formattedDate = date ? new Date(date).toLocaleDateString() : 'N/A';
        return `<div class="text-sm text-gray-500">${formattedDate}</div>`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 2,
      cellRenderer: (params: any) => {
        const sow = params.data;
        const canApprove = this.canApproveSOW(sow);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
        // View button
        html += `
          <button 
            class="view-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            onclick="window.sowViewAction('${sow._id}')">
            <span>👁️</span>
          </button>
        `;
        
        // Audit trail button
        html += `
          <button 
            class="audit-btn text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
            onclick="window.sowAuditAction('${sow._id}')">
            <span>📋</span>
          </button>
        `;
        
        // Approval buttons
        if (canApprove) {
          html += `
            <button 
              class="approve-btn text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 border border-green-200"
              onclick="window.sowApproveAction('${sow._id}')"
              title="Approve SOW">
              <span>✅ Approve</span>
            </button>
            <button 
              class="reject-btn text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 border border-red-200"
              onclick="window.sowRejectAction('${sow._id}')"
              title="Reject SOW">
              <span>❌ Reject</span>
            </button>
          `;
        } else {
          html += `
            <span class="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
              ${sow.status !== 'sent_to_vendor' ? 'Not pending approval' : 'No permission'}
            </span>
          `;
        }
        
        html += '</div>';
        
        return html;
      }
    }
  ];

  defaultColDef = {
    resizable: true,
    sortable: false,
    filter: false,
    flex: 1,
    minWidth: 100
  };

  gridOptions = {
    defaultColDef: {
      flex: 1,
      minWidth: 100,
    },
    rowHeight: 60,
    tooltipShowDelay: 500,
    onGridReady: (params: any) => {
      this.onGridReady(params);
    }
  };

  constructor(
    private sowService: SOWService,
    private authService: AuthService,
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.approvalForm = this.fb.group({
      status: ['', [Validators.required]],
      comments: ['', [Validators.maxLength(500)]],
      proposedChanges: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.loadSOWs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSOWs(): void {
    this.isLoading = true;
    
    console.log('🔧 SOW Approvals: Loading SOWs for vendor approval...');
    
    this.sowService.getSOWs({
      page: this.currentPage,
      limit: this.pageSize,
      status: 'sent_to_vendor' // Only show SOWs sent to vendor for approval
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.sows = response.data.docs || [];
        this.totalSOWs = response.data.totalDocs || 0;
        
        console.log('🔧 SOW Approvals: Loaded SOWs:', {
          count: this.sows.length,
          total: this.totalSOWs,
          sows: this.sows.map(sow => ({
            id: sow._id,
            title: sow.title,
            status: sow.status,
            canApprove: this.canApproveSOW(sow)
          }))
        });
        
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('🔧 SOW Approvals: Error loading SOWs:', error);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onViewSOW(sow: SOW): void {
    this.selectedSOW = sow;
    this.showViewModal = true;
  }

  onApproveSOW(sow: SOW): void {
    console.log('🔧 SOW Approvals: Opening approve modal for SOW:', sow._id);
    this.selectedSOW = sow;
    this.approvalForm.patchValue({ status: 'accepted' });
    this.showApprovalModal = true;
    this.changeDetectorRef.detectChanges();
  }

  onRejectSOW(sow: SOW): void {
    console.log('🔧 SOW Approvals: Opening reject modal for SOW:', sow._id);
    this.selectedSOW = sow;
    this.approvalForm.patchValue({ status: 'rejected' });
    this.showApprovalModal = true;
    this.changeDetectorRef.detectChanges();
  }

  onSubmitApproval(): void {
    if (this.approvalForm.valid && this.selectedSOW) {
      this.isLoading = true;
      
      const approvalData: VendorSOWApprovalRequest = {
        sowId: this.selectedSOW._id,
        status: this.approvalForm.get('status')?.value,
        comments: this.approvalForm.get('comments')?.value,
        proposedChanges: this.approvalForm.get('proposedChanges')?.value
      };

      console.log('🔧 SOW Approvals: Submitting approval:', approvalData);

      const currentSOW = this.selectedSOW;
      const previousStatus = currentSOW.status;

      this.sowService.vendorResponse(this.selectedSOW._id, approvalData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          console.log('🔧 SOW Approvals: Approval response:', response);
          if (response.success) {
            const updatedSOW = response.data;
            
            // Log the vendor approval/rejection
            this.auditLogService.logApproval(
              'sow',
              this.selectedSOW!._id,
              approvalData.status === 'accepted' ? 'approval' : 'rejection',
              { status: previousStatus },
              { status: updatedSOW.status },
              approvalData.comments || `SOW ${approvalData.status} by vendor account`,
              {
                approvalLevel: 'vendor_approval',
                approvedBy: this.currentUser?._id,
                approvalDate: new Date().toISOString(),
                proposedChanges: approvalData.proposedChanges
              }
            ).subscribe();

            // Update local data
            const index = this.sows.findIndex(sow => sow._id === this.selectedSOW!._id);
            if (index !== -1) {
              this.sows[index] = updatedSOW;
            }
            
            this.showApprovalModal = false;
            this.approvalForm.reset();
            this.showSuccessMessage(`SOW ${approvalData.status} successfully`);
            
            // Force change detection to ensure modal closes
            this.changeDetectorRef.detectChanges();
          } else {
            console.error('🔧 SOW Approvals: Approval failed:', response.message);
            this.showErrorMessage(response.message || 'Failed to process SOW approval');
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('🔧 SOW Approvals: Error processing SOW approval:', error);
          this.showErrorMessage('Failed to process SOW approval');
          this.isLoading = false;
        },
        complete: () => {
          console.log('🔧 SOW Approvals: Approval request completed');
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
    }
  }

  onCloseModal(): void {
    this.showApprovalModal = false;
    this.showViewModal = false;
    this.showAuditTrailModal = false;
    this.selectedSOW = null;
    this.selectedSOWForAudit = null;
    this.approvalForm.reset();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSOWs();
  }

  showAuditTrail(sow: SOW): void {
    this.selectedSOWForAudit = sow;
    this.showAuditTrailModal = true;
    this.changeDetectorRef.detectChanges();
  }

  closeAuditTrailModal(): void {
    this.showAuditTrailModal = false;
    this.selectedSOWForAudit = null;
    this.changeDetectorRef.detectChanges();
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'internal_approved':
        return 'bg-blue-100 text-blue-800';
      case 'sent_to_vendor':
        return 'bg-purple-100 text-purple-800';
      case 'vendor_accepted':
        return 'bg-green-100 text-green-800';
      case 'vendor_rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  canApproveSOW(sow: SOW): boolean {
    // Allow both vendor_owner and vendor_account users to approve SOWs
    const canApprove = ['vendor_owner', 'vendor_account'].includes(this.currentUser?.organizationRole || '') && 
                      sow.status === 'sent_to_vendor';
    
    console.log('🔧 SOW Approvals: Can approve check:', {
      userRole: this.currentUser?.organizationRole,
      sowStatus: sow.status,
      canApprove: canApprove
    });
    
    return canApprove;
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  showSuccessMessage(message: string): void {
    console.log('Success:', message);
  }

  showErrorMessage(message: string): void {
    console.error('Error:', message);
  }

  trackById(index: number, item: SOW): string {
    return item._id || `sow-${index}`;
  }

  // Helper methods for template
  getPendingSOWsCount(): number {
    return this.sows.filter(s => s.status === 'sent_to_vendor').length;
  }

  getApprovedSOWsCount(): number {
    return this.sows.filter(s => s.status === 'vendor_accepted').length;
  }

  getRejectedSOWsCount(): number {
    return this.sows.filter(s => s.status === 'vendor_rejected').length;
  }

  getTotalValue(): number {
    return this.sows.reduce((sum, sow) => sum + (sow.estimatedCost?.amount || 0), 0);
  }

  getNoRowsMessage(): string {
    return 'No SOWs pending approval';
  }

  onGridReady(params: any): void {
    console.log('🔧 SOW Approvals: Grid ready, setting up button handlers');
    
    // Set up global functions for button clicks
    (window as any).sowViewAction = (sowId: string) => {
      console.log('🔧 SOW Approvals: View button clicked for SOW:', sowId);
      const sow = this.sows.find(s => s._id === sowId);
      if (sow) {
        this.onViewSOW(sow);
      }
    };

    (window as any).sowAuditAction = (sowId: string) => {
      console.log('🔧 SOW Approvals: Audit button clicked for SOW:', sowId);
      const sow = this.sows.find(s => s._id === sowId);
      if (sow) {
        this.showAuditTrail(sow);
      }
    };

    (window as any).sowApproveAction = (sowId: string) => {
      console.log('🔧 SOW Approvals: Approve button clicked for SOW:', sowId);
      const sow = this.sows.find(s => s._id === sowId);
      if (sow) {
        this.onApproveSOW(sow);
      }
    };

    (window as any).sowRejectAction = (sowId: string) => {
      console.log('🔧 SOW Approvals: Reject button clicked for SOW:', sowId);
      const sow = this.sows.find(s => s._id === sowId);
      if (sow) {
        this.onRejectSOW(sow);
      }
    };
  }
} 