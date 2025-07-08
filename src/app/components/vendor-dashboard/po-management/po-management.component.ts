import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, GridOptions } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { PO } from '../../../models/po.model';
import { POService } from '../../../services/po.service';
import { AuthService } from '../../../services/auth.service';
import { AuditLogService } from '../../../services/audit-log.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { AuditTrailComponent } from '../../shared/audit-trail/audit-trail.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-po-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    LucideAngularModule,
    PaginationComponent,
    AuditTrailComponent
  ],
  templateUrl: './po-management.component.html',
  styleUrls: ['./po-management.component.scss']
})
export class POManagementComponent implements OnInit, OnDestroy {
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
  showViewModal = false;
  showAuditTrailModal = false;
  selectedPO: PO | null = null;
  selectedPOForAudit: PO | null = null;

  // Filter form
  filterForm: FormGroup;

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
      headerName: 'Start Date',
      field: 'startDate',
      flex: 1,
      cellRenderer: (params: any) => {
        const date = params.data.startDate;
        const formattedDate = date ? new Date(date).toLocaleDateString() : 'N/A';
        return `<div class="text-sm text-gray-500">${formattedDate}</div>`;
      }
    },
    {
      headerName: 'End Date',
      field: 'endDate',
      flex: 1,
      cellRenderer: (params: any) => {
        const date = params.data.endDate;
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
        
        html += '</div>';
        
        // Add event listeners
        setTimeout(() => {
          const viewBtn = document.getElementById(`view-${po._id}`);
          const auditBtn = document.getElementById(`audit-${po._id}`);
          
          if (viewBtn) {
            viewBtn.addEventListener('click', () => this.onViewPO(po));
          }
          
          if (auditBtn) {
            auditBtn.addEventListener('click', () => this.showAuditTrail(po));
          }
        }, 0);
        
        return html;
      }
    }
  ];

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  gridOptions: GridOptions<PO> = {
    domLayout: 'autoHeight',
    suppressCellFocus: true,
    suppressRowClickSelection: true
  };

  constructor(
    private poService: POService,
    private authService: AuthService,
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      dateRange: ['']
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
    
    console.log('🔧 PO Management: Loading POs for vendor');
    console.log('🔧 PO Management: Current user:', this.currentUser);
    
    const filterParams = this.filterForm.value;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    // Add status filter if selected
    if (filterParams.status) {
      params.status = filterParams.status;
    }

    this.poService.getPOs(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('✅ PO Management: POs loaded successfully:', response);
        this.pos = response.data.docs || [];
        this.totalPOs = response.data.totalDocs || 0;
        console.log('🔧 PO Management: Found POs:', this.pos.length, 'Total:', this.totalPOs);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('❌ PO Management: Error loading POs:', error);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onViewPO(po: PO): void {
    this.selectedPO = po;
    this.showViewModal = true;
  }

  onCloseModal(): void {
    this.showViewModal = false;
    this.showAuditTrailModal = false;
    this.selectedPO = null;
    this.selectedPOForAudit = null;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPOs();
  }

  onFilterChange(): void {
    this.currentPage = 1;
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
    return po.paymentTerms ? po.paymentTerms.replace('_', ' ').toUpperCase() : 'N/A';
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
  getPendingPOCount(): number {
    return this.pos.filter(po => po.status === 'sent_to_vendor').length;
  }

  getApprovedPOCount(): number {
    return this.pos.filter(po => po.status === 'vendor_accepted').length;
  }

  getRejectedPOCount(): number {
    return this.pos.filter(po => po.status === 'vendor_rejected').length;
  }

  getActivePOCount(): number {
    return this.pos.filter(po => po.status === 'active').length;
  }

  getTotalValue(): number {
    return this.pos.reduce((sum, po) => sum + (po.totalAmount?.amount || 0), 0);
  }

  getNoRowsMessage(): string {
    return 'No POs found';
  }

  // Helper methods for template
  isClientObject(clientId: any): boolean {
    return clientId && typeof clientId === 'object';
  }

  getClientDisplayName(clientId: any): string {
    if (this.isClientObject(clientId)) {
      return `${clientId.firstName} ${clientId.lastName}`;
    }
    return clientId || 'Unknown';
  }
} 