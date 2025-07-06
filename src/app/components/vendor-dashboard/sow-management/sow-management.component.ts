import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, GridOptions } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { SOW } from '../../../models/sow.model';
import { SOWService } from '../../../services/sow.service';
import { AuthService } from '../../../services/auth.service';
import { AuditLogService } from '../../../services/audit-log.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { AuditTrailComponent } from '../../shared/audit-trail/audit-trail.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-sow-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    LucideAngularModule,
    PaginationComponent,
    AuditTrailComponent
  ],
  templateUrl: './sow-management.component.html',
  styleUrls: ['./sow-management.component.scss']
})
export class SOWManagementComponent implements OnInit, OnDestroy {
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
  showViewModal = false;
  showAuditTrailModal = false;
  selectedSOW: SOW | null = null;
  selectedSOWForAudit: SOW | null = null;

  // Filter form
  filterForm: FormGroup;

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'SOW Reference',
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
        const title = params.data.title;
        return `<div class="text-sm text-gray-900">${title || 'N/A'}</div>`;
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
        const sow = params.data;
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
        // View button
        html += `
          <button 
            class="view-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            id="view-${sow._id}">
            <span>👁️</span>
          </button>
        `;
        
        // Audit trail button
        html += `
          <button 
            class="audit-btn text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
            id="audit-${sow._id}">
            <span>📋</span>
          </button>
        `;
        
        html += '</div>';
        
        // Add event listeners
        setTimeout(() => {
          const viewBtn = document.getElementById(`view-${sow._id}`);
          const auditBtn = document.getElementById(`audit-${sow._id}`);
          
          if (viewBtn) {
            viewBtn.addEventListener('click', () => this.onViewSOW(sow));
          }
          
          if (auditBtn) {
            auditBtn.addEventListener('click', () => this.showAuditTrail(sow));
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

  gridOptions: GridOptions<SOW> = {
    domLayout: 'autoHeight',
    suppressCellFocus: true,
    suppressRowClickSelection: true
  };

  constructor(
    private sowService: SOWService,
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
    this.loadSOWs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSOWs(): void {
    this.isLoading = true;
    
    console.log('🔧 SOW Management: Loading SOWs for vendor');
    console.log('🔧 SOW Management: Current user:', this.currentUser);
    
    const filterParams = this.filterForm.value;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    // Add status filter if selected
    if (filterParams.status) {
      params.status = filterParams.status;
    }

    this.sowService.getSOWs(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        console.log('✅ SOW Management: SOWs loaded successfully:', response);
        this.sows = response.data.docs || [];
        this.totalSOWs = response.data.totalDocs || 0;
        console.log('🔧 SOW Management: Found SOWs:', this.sows.length, 'Total:', this.totalSOWs);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('❌ SOW Management: Error loading SOWs:', error);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onViewSOW(sow: SOW): void {
    this.selectedSOW = sow;
    this.showViewModal = true;
  }

  onCloseModal(): void {
    this.showViewModal = false;
    this.showAuditTrailModal = false;
    this.selectedSOW = null;
    this.selectedSOWForAudit = null;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSOWs();
  }

  onFilterChange(): void {
    this.currentPage = 1;
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
      case 'pm_approved':
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
    return this.sows.filter(sow => sow.status === 'sent_to_vendor').length;
  }

  getApprovedSOWsCount(): number {
    return this.sows.filter(sow => sow.status === 'vendor_accepted').length;
  }

  getRejectedSOWsCount(): number {
    return this.sows.filter(sow => sow.status === 'vendor_rejected').length;
  }

  getTotalValue(): number {
    return this.sows.reduce((sum, sow) => sum + (sow.estimatedCost?.amount || 0), 0);
  }

  getNoRowsMessage(): string {
    return 'No SOWs found';
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