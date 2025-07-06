import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { PO, VendorPOApprovalRequest } from '../../../models/po.model';
import { POService } from '../../../services/po.service';
import { AuthService } from '../../../services/auth.service';
import { AuditLogService } from '../../../services/audit-log.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { AuditTrailComponent } from '../../shared/audit-trail/audit-trail.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-po-approvals',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    LucideAngularModule,
    PaginationComponent,
    AuditTrailComponent
  ],
  templateUrl: './po-approvals.component.html',
  styleUrls: ['./po-approvals.component.scss']
})
export class POApprovalsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  pos: PO[] = [];
  isLoading = false;
  totalPOs = 0;
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
  selectedPO: PO | null = null;
  selectedPOForAudit: PO | null = null;

  // Forms
  approvalForm: FormGroup;

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'PO Number',
      field: 'poNumber',
      flex: 1,
      cellRenderer: (params: any) => {
        return `<div class="text-sm font-medium text-gray-900">${params.data.poNumber}</div>`;
      }
    },
    {
      headerName: 'SOW Reference',
      field: 'sowId',
      flex: 1,
      cellRenderer: (params: any) => {
        const sowId = params.data.sowId;
        return `<div class="text-sm text-gray-900">#${sowId ? sowId.slice(-6) : 'N/A'}</div>`;
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
      headerName: 'Total Amount',
      field: 'totalAmount',
      flex: 1,
      cellRenderer: (params: any) => {
        const amount = params.data.totalAmount;
        if (amount) {
          return `<div class="text-sm text-gray-900">${amount.currency} ${amount.amount.toLocaleString()}</div>`;
        }
        return '<div class="text-sm text-gray-500">N/A</div>';
      }
    },
    {
      headerName: 'Payment Terms',
      field: 'paymentTerms',
      flex: 1,
      cellRenderer: (params: any) => {
        const terms = params.data.paymentTerms;
        const customTerms = params.data.customPaymentTerms;
        const displayTerms = customTerms || terms?.replace('_', ' ').toUpperCase();
        return `<div class="text-sm text-gray-900">${displayTerms}</div>`;
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
        const po = params.data;
        const canApprove = this.canApprovePO(po);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
        // View button
        html += `
          <button 
            class="view-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            id="view-${po._id}">
            <span>👁️</span>
          </button>
        `;
        
        // Audit trail button
        html += `
          <button 
            class="audit-btn text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
            id="audit-${po._id}">
            <span>📋</span>
          </button>
        `;
        
        // Approval buttons
        if (canApprove) {
          html += `
            <button 
              class="approve-btn text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
              id="approve-${po._id}">
              <span>✅</span>
            </button>
            <button 
              class="reject-btn text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
              id="reject-${po._id}">
              <span>❌</span>
            </button>
          `;
        }
        
        html += '</div>';
        
        // Add event listeners
        setTimeout(() => {
          const viewBtn = document.getElementById(`view-${po._id}`);
          const auditBtn = document.getElementById(`audit-${po._id}`);
          const approveBtn = document.getElementById(`approve-${po._id}`);
          const rejectBtn = document.getElementById(`reject-${po._id}`);
          
          if (viewBtn) {
            viewBtn.addEventListener('click', () => this.onViewPO(po));
          }
          
          if (auditBtn) {
            auditBtn.addEventListener('click', () => this.showAuditTrail(po));
          }
          
          if (approveBtn) {
            approveBtn.addEventListener('click', () => this.onApprovePO(po));
          }
          
          if (rejectBtn) {
            rejectBtn.addEventListener('click', () => this.onRejectPO(po));
          }
        });
        
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
    tooltipShowDelay: 500
  };

  constructor(
    private poService: POService,
    private authService: AuthService,
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.approvalForm = this.fb.group({
      status: ['', [Validators.required]],
      comments: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadPOs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPOs(): void {
    this.isLoading = true;
    
    console.log('🔧 PO Approvals: Loading POs for vendor');
    console.log('🔧 PO Approvals: Current user:', this.currentUser);
    console.log('🔧 PO Approvals: Requesting POs with status: sent_to_vendor');
    
    this.poService.getPOs({
      page: this.currentPage,
      limit: this.pageSize,
      status: 'sent_to_vendor' // Only show POs sent to vendor for approval
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('✅ PO Approvals: POs loaded successfully:', response);
        this.pos = response.data.docs || [];
        this.totalPOs = response.data.totalDocs || 0;
        console.log('🔧 PO Approvals: Found POs:', this.pos.length, 'Total:', this.totalPOs);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('❌ PO Approvals: Error loading POs:', error);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onViewPO(po: PO): void {
    this.selectedPO = po;
    this.showViewModal = true;
  }

  onApprovePO(po: PO): void {
    this.selectedPO = po;
    this.approvalForm.patchValue({ status: 'accepted' });
    this.showApprovalModal = true;
  }

  onRejectPO(po: PO): void {
    this.selectedPO = po;
    this.approvalForm.patchValue({ status: 'rejected' });
    this.showApprovalModal = true;
  }

  onSubmitApproval(): void {
    if (this.approvalForm.valid && this.selectedPO) {
      this.isLoading = true;
      
      const approvalData: VendorPOApprovalRequest = {
        poId: this.selectedPO._id,
        status: this.approvalForm.get('status')?.value,
        comments: this.approvalForm.get('comments')?.value
      };

      const currentPO = this.selectedPO;
      const previousStatus = currentPO.status;

      this.poService.vendorResponse(this.selectedPO._id, approvalData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          if (response.success) {
            const updatedPO = response.data;
            
            // Log the vendor approval/rejection
            this.auditLogService.logApproval(
              'po',
              this.selectedPO!._id,
              approvalData.status === 'accepted' ? 'approval' : 'rejection',
              { status: previousStatus },
              { status: updatedPO.status },
              approvalData.comments || `PO ${approvalData.status} by vendor account`,
              {
                approvalLevel: 'vendor_approval',
                approvedBy: this.currentUser?._id,
                approvalDate: new Date().toISOString()
              }
            ).subscribe();

            // Update local data
            const index = this.pos.findIndex(po => po._id === this.selectedPO!._id);
            if (index !== -1) {
              this.pos[index] = updatedPO;
            }
            
            this.showApprovalModal = false;
            this.approvalForm.reset();
            this.showSuccessMessage(`PO ${approvalData.status} successfully`);
          } else {
            this.showErrorMessage(response.message || 'Failed to process PO approval');
          }
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error processing PO approval:', error);
          this.showErrorMessage('Failed to process PO approval');
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
    this.selectedPO = null;
    this.selectedPOForAudit = null;
    this.approvalForm.reset();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPOs();
  }

  showAuditTrail(po: PO): void {
    this.selectedPOForAudit = po;
    this.showAuditTrailModal = true;
    this.changeDetectorRef.detectChanges();
  }

  closeAuditTrailModal(): void {
    this.showAuditTrailModal = false;
    this.selectedPOForAudit = null;
    this.changeDetectorRef.detectChanges();
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'finance_approved':
        return 'bg-blue-100 text-blue-800';
      case 'sent_to_vendor':
        return 'bg-purple-100 text-purple-800';
      case 'vendor_accepted':
        return 'bg-green-100 text-green-800';
      case 'vendor_rejected':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'completed':
        return 'bg-teal-100 text-teal-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  getPaymentTermsDisplay(po: PO): string {
    return po.customPaymentTerms || (po.paymentTerms ? po.paymentTerms.replace('_', ' ').toUpperCase() : 'N/A');
  }

  canApprovePO(po: PO): boolean {
    // Only vendor_account users can approve POs
    return this.currentUser?.organizationRole === 'vendor_account' && 
           po.status === 'sent_to_vendor';
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

  trackById(index: number, item: PO): string {
    return item._id || `po-${index}`;
  }

  // Helper methods for template
  getPendingPOsCount(): number {
    return this.pos.filter(po => po.status === 'sent_to_vendor').length;
  }

  getApprovedPOsCount(): number {
    return this.pos.filter(po => po.status === 'vendor_accepted').length;
  }

  getRejectedPOsCount(): number {
    return this.pos.filter(po => po.status === 'vendor_rejected').length;
  }

  getTotalValue(): number {
    return this.pos.reduce((sum, po) => sum + (po.totalAmount?.amount || 0), 0);
  }

  getNoRowsMessage(): string {
    return 'No POs pending approval';
  }
} 