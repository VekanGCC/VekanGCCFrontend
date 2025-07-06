import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, GridOptions } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { Invoice } from '../../../models/invoice.model';
import { PO } from '../../../models/po.model';
import { InvoiceService } from '../../../services/invoice.service';
import { POService } from '../../../services/po.service';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-invoice-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    LucideAngularModule,
    PaginationComponent
  ],
  templateUrl: './invoice-management.component.html',
  styleUrls: ['./invoice-management.component.scss']
})
export class InvoiceManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  invoices: Invoice[] = [];
  availablePOs: PO[] = [];
  isLoading = false;
  totalInvoices = 0;
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
  showCreateModal = false;
  showViewModal = false;
  showActionModal = false;
  selectedInvoice: Invoice | null = null;
  actionType: 'submit' | 'approve' | 'reject' = 'submit';

  // Forms
  invoiceForm!: FormGroup;
  actionForm!: FormGroup;

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'Invoice ID',
      field: '_id',
      flex: 1,
      cellRenderer: (params: any) => {
        const invoiceId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${invoiceId ? invoiceId.slice(-6) : 'N/A'}</div>`;
      }
    },
    {
      headerName: 'Invoice Number',
      field: 'invoiceNumber',
      flex: 1,
      cellRenderer: (params: any) => {
        return `<div class="text-sm text-gray-900">${params.data.invoiceNumber}</div>`;
      }
    },
    {
      headerName: 'PO Reference',
      field: 'poId',
      flex: 2,
      cellRenderer: (params: any) => {
        const po = params.data.poId;
        if (typeof po === 'object' && po) {
          return `<div class="text-sm text-gray-900">${po.poNumber}</div>`;
        }
        return '<div class="text-sm text-gray-500">Unknown</div>';
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
      field: 'invoiceAmount',
      flex: 1,
      cellRenderer: (params: any) => {
        const amount = params.data.invoiceAmount;
        if (amount) {
          return `<div class="text-sm text-gray-900">${amount.currency} ${amount.amount.toLocaleString()}</div>`;
        }
        return '<div class="text-sm text-gray-500">N/A</div>';
      }
    },
    {
      headerName: 'Status',
      field: 'paymentStatus',
      flex: 1,
      cellRenderer: (params: any) => {
        const status = params.data.paymentStatus;
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
      headerName: 'Due Date',
      field: 'dueDate',
      flex: 1,
      cellRenderer: (params: any) => {
        const date = params.data.dueDate;
        const formattedDate = date ? new Date(date).toLocaleDateString() : 'N/A';
        return `<div class="text-sm text-gray-500">${formattedDate}</div>`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 2,
      cellRenderer: (params: any) => {
        const invoice = params.data;
        const actions = this.getAvailableActions(invoice);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
        // View button
        html += `
          <button 
            class="view-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            id="view-${invoice._id}">
            <span>👁️</span>
          </button>
        `;
        
        // Action buttons
        actions.forEach((action: any) => {
          html += `
            <button 
              class="action-btn text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
              id="${action.type}-${invoice._id}">
              <span>${action.icon}</span>
            </button>
          `;
        });
        
        html += '</div>';
        
        // Add event listeners
        setTimeout(() => {
          const viewBtn = document.getElementById(`view-${invoice._id}`);
          if (viewBtn) {
            viewBtn.addEventListener('click', () => this.onViewInvoice(invoice));
          }
          
          actions.forEach((action: any) => {
            const actionBtn = document.getElementById(`${action.type}-${invoice._id}`);
            if (actionBtn) {
              actionBtn.addEventListener('click', () => this.onActionClick(invoice, action.type));
            }
          });
        });
        
        return html;
      }
    }
  ];

  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  gridOptions: GridOptions = {
    rowSelection: 'single',
    suppressRowClickSelection: true,
    onRowClicked: (event: any) => {
      // Handle row click if needed
    }
  };

  // Precomputed properties for template (fixing NG5002)
  submittedInvoicesCount = 0;
  approvedInvoicesCount = 0;
  paidInvoicesCount = 0;

  // Precomputed values for selected invoice (fixing template expressions)
  selectedInvoiceShortId = '';
  selectedInvoiceStatusClass = '';
  selectedInvoiceStatusLabel = '';
  selectedInvoiceAmountDisplay = '';
  selectedInvoicePONumber = '';
  selectedInvoiceClientName = '';

  // Precomputed PO display values for form
  poDisplayOptions: Array<{id: string, display: string}> = [];

  // Helper methods for template
  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  constructor(
    private invoiceService: InvoiceService,
    private poService: POService,
    private authService: AuthService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadInvoices();
    this.loadAvailablePOs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.invoiceForm = this.fb.group({
      poId: ['', Validators.required],
      invoiceNumber: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      totalAmount: this.fb.group({
        amount: ['', [Validators.required, Validators.min(0)]],
        currency: ['USD', Validators.required]
      }),
      dueDate: ['', Validators.required],
      paymentTerms: ['net_30', Validators.required]
    });

    this.actionForm = this.fb.group({
      comments: ['']
    });
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.paginationState.isLoading = true;

    this.invoiceService.getInvoices({
      page: this.currentPage,
      limit: this.pageSize
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Handle new API response structure
          if (response.data && response.data.docs) {
            this.invoices = response.data.docs || [];
            this.totalInvoices = response.data.totalDocs || 0;
          } else {
            // Fallback to old structure
            this.invoices = response.data || [];
            this.totalInvoices = response.total || 0;
          }
          
          // Update pagination state
          this.paginationState = {
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            totalItems: this.totalInvoices,
            totalPages: Math.ceil(this.totalInvoices / this.pageSize),
            isLoading: false,
            hasNextPage: this.currentPage < Math.ceil(this.totalInvoices / this.pageSize),
            hasPreviousPage: this.currentPage > 1
          };

          this.updateInvoiceCounts();
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading invoices:', error);
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private updateInvoiceCounts(): void {
    this.submittedInvoicesCount = this.invoices.filter(inv => inv.paymentStatus === 'pending').length;
    this.approvedInvoicesCount = this.invoices.filter(inv => inv.paymentStatus === 'approved').length;
    this.paidInvoicesCount = this.invoices.filter(inv => inv.paymentStatus === 'paid').length;
  }

  loadAvailablePOs(): void {
    this.poService.getPOs({
      page: 1,
      limit: 1000
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Handle new API response structure
          if (response.data && response.data.docs) {
            this.availablePOs = response.data.docs || [];
          } else {
            // Fallback to old structure
            this.availablePOs = response.data || [];
          }
          this.updatePODisplayOptions();
        },
        error: (error: any) => {
          console.error('Error loading POs:', error);
        }
      });
  }

  private updatePODisplayOptions(): void {
    this.poDisplayOptions = this.availablePOs.map(po => ({
      id: po._id,
      display: `${po.poNumber} - ${po.totalAmount.currency} ${po.totalAmount.amount.toLocaleString()}`
    }));
  }

  onCreateInvoice(): void {
    this.showCreateModal = true;
    this.invoiceForm.reset();
    this.invoiceForm.patchValue({
      totalAmount: { currency: 'USD' },
      paymentTerms: 'net_30'
    });
  }

  onSubmitInvoice(): void {
    if (this.invoiceForm.valid) {
      this.isLoading = true;
      
      this.invoiceService.createInvoice(this.invoiceForm.value).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          this.showCreateModal = false;
          this.loadInvoices();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error creating invoice:', error);
          this.isLoading = false;
        }
      });
    }
  }

  onViewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.updateSelectedInvoiceDisplay();
    this.showViewModal = true;
  }

  private updateSelectedInvoiceDisplay(): void {
    if (!this.selectedInvoice) {
      this.resetSelectedInvoiceDisplay();
      return;
    }

    this.selectedInvoiceShortId = this.getShortInvoiceId(this.selectedInvoice._id);
    this.selectedInvoiceStatusClass = this.getStatusClass(this.selectedInvoice.paymentStatus);
    this.selectedInvoiceStatusLabel = this.formatStatus(this.selectedInvoice.paymentStatus);
    this.selectedInvoiceAmountDisplay = this.getInvoiceAmountDisplay(this.selectedInvoice);
    this.selectedInvoicePONumber = this.getPONumber(this.selectedInvoice.poId);
    this.selectedInvoiceClientName = this.getClientName(this.selectedInvoice.clientId);
  }

  private resetSelectedInvoiceDisplay(): void {
    this.selectedInvoiceShortId = '';
    this.selectedInvoiceStatusClass = '';
    this.selectedInvoiceStatusLabel = '';
    this.selectedInvoiceAmountDisplay = '';
    this.selectedInvoicePONumber = '';
    this.selectedInvoiceClientName = '';
  }

  getShortInvoiceId(invoiceId: string): string {
    return invoiceId ? `#${invoiceId.slice(-6)}` : 'N/A';
  }

  getInvoiceAmountDisplay(invoice: Invoice): string {
    if (invoice.invoiceAmount && invoice.invoiceAmount.amount) {
      return `${invoice.invoiceAmount.currency} ${invoice.invoiceAmount.amount.toLocaleString()}`;
    }
    return 'N/A';
  }

  getPONumber(poId: any): string {
    if (this.isObject(poId)) {
      return (poId as any).poNumber || 'N/A';
    }
    return 'N/A';
  }

  getClientName(clientId: any): string {
    if (this.isObject(clientId)) {
      return `${(clientId as any).firstName} ${(clientId as any).lastName}`;
    }
    return 'Unknown Client';
  }

  onActionClick(invoice: Invoice, actionType: string): void {
    this.selectedInvoice = invoice;
    this.actionType = actionType as any;
    this.showActionModal = true;
    this.actionForm.reset();
  }

  onActionSubmit(): void {
    if (this.actionForm.valid && this.selectedInvoice) {
      this.isLoading = true;
      const comments = this.actionForm.get('comments')?.value;

      let action$;
      switch (this.actionType) {
        case 'submit':
          action$ = this.invoiceService.updateInvoice(this.selectedInvoice._id, {});
          break;
        case 'approve':
          action$ = this.invoiceService.approveInvoice(this.selectedInvoice._id, { status: 'approved', rejectionReason: comments });
          break;
        case 'reject':
          action$ = this.invoiceService.approveInvoice(this.selectedInvoice._id, { status: 'rejected', rejectionReason: comments });
          break;
        default:
          return;
      }

      action$.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          this.showActionModal = false;
          this.loadInvoices();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error performing action:', error);
          this.isLoading = false;
        }
      });
    }
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadInvoices();
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showViewModal = false;
    this.showActionModal = false;
    this.selectedInvoice = null;
  }

  getAvailableActions(invoice: Invoice): Array<{type: string, icon: string, label: string}> {
    const actions: Array<{type: string, icon: string, label: string}> = [];
    const user = this.authService.getCurrentUser();
    
    if (!user) return actions;

    switch (invoice.paymentStatus) {
      case 'pending':
        if (['vendor_owner', 'vendor_account'].includes(user.organizationRole || '')) {
          actions.push({ type: 'submit', icon: '📤', label: 'Submit' });
        }
        break;
      case 'approved':
        if (user.organizationRole === 'client_owner') {
          actions.push({ type: 'approve', icon: '✅', label: 'Approve' });
          actions.push({ type: 'reject', icon: '❌', label: 'Reject' });
        }
        break;
    }

    return actions;
  }

  trackById(index: number, item: Invoice): string {
    return item._id || `invoice-${index}`;
  }
} 