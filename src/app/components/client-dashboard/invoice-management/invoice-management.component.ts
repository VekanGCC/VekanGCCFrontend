import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { Invoice, InvoiceApprovalRequest } from '../../../models/invoice.model';
import { PaginationState } from '../../../models/pagination.model';
import { InvoiceService } from '../../../services/invoice.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ApiResponse } from '../../../models/api-response.model';

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
  showViewModal = false;
  showActionModal = false;
  selectedInvoice: Invoice | null = null;
  actionType: 'approve' | 'reject' = 'approve';

  // Forms
  actionForm!: FormGroup;

  // Stats
  pendingInvoicesCount = 0;
  approvedInvoicesCount = 0;
  totalAmountPending = 0;

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'Invoice ID',
      field: '_id',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const invoiceId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${invoiceId ? invoiceId.slice(-6) : 'N/A'}</div>`;
      }
    },
    {
      headerName: 'Vendor',
      field: 'vendorId',
      flex: 2,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const vendor = params.data.vendorId;
        if (vendor && typeof vendor === 'object') {
          return `<div class="text-sm text-gray-900">${vendor.companyName || vendor.firstName + ' ' + vendor.lastName}</div>`;
        }
        return '<div class="text-sm text-gray-500">Unknown</div>';
      }
    },
    {
      headerName: 'PO Reference',
      field: 'poId',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const po = params.data.poId;
        if (po && typeof po === 'object') {
          return `<div class="text-sm text-gray-900">#${po._id ? po._id.slice(-6) : 'N/A'}</div>`;
        }
        return '<div class="text-sm text-gray-500">N/A</div>';
      }
    },
    {
      headerName: 'Amount',
      field: 'invoiceAmount',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
    private invoiceService: InvoiceService,
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadInvoices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.actionForm = this.formBuilder.group({
      comments: ['', Validators.required]
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
          if (response.success) {
            this.invoices = response.data.docs || [];
            this.totalInvoices = response.data.totalDocs || 0;
            
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
          }
        },
        error: (error: any) => {
          console.error('Error loading invoices:', error);
        },
        complete: () => {
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private updateInvoiceCounts(): void {
    this.pendingInvoicesCount = this.invoices.filter(invoice => invoice.paymentStatus === 'pending').length;
    this.approvedInvoicesCount = this.invoices.filter(invoice => invoice.paymentStatus === 'approved').length;
    this.totalAmountPending = this.invoices
      .filter(invoice => invoice.paymentStatus === 'pending')
      .reduce((total, invoice) => total + (invoice.invoiceAmount?.amount || 0), 0);
  }

  onViewInvoice(invoice: Invoice): void {
    this.selectedInvoice = invoice;
    this.showViewModal = true;
  }

  onActionClick(invoice: Invoice, actionType: string): void {
    this.selectedInvoice = invoice;
    this.actionType = actionType as 'approve' | 'reject';
    this.showActionModal = true;
  }

  onActionSubmit(): void {
    if (this.actionForm.valid && this.selectedInvoice) {
      this.isLoading = true;
      const comments = this.actionForm.get('comments')?.value;

      const approvalData: InvoiceApprovalRequest = {
        status: this.actionType === 'approve' ? 'approved' : 'rejected',
        rejectionReason: this.actionType === 'reject' ? comments : undefined
      };
      
      this.invoiceService.approveInvoice(this.selectedInvoice._id, approvalData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.loadInvoices();
              this.onCloseModal();
            }
          },
          error: (error: any) => {
            console.error('Error updating invoice status:', error);
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadInvoices();
  }

  onCloseModal(): void {
    this.showViewModal = false;
    this.showActionModal = false;
    this.selectedInvoice = null;
    this.actionForm.reset();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getAvailableActions(invoice: Invoice): Array<{type: string, icon: string, label: string}> {
    const actions = [];
    
    if (invoice.paymentStatus === 'pending') {
      actions.push({ type: 'approve', icon: '✅', label: 'Approve' });
      actions.push({ type: 'reject', icon: '❌', label: 'Reject' });
    }
    
    return actions;
  }

  trackById(index: number, item: Invoice): string {
    return item._id;
  }

  getVendorDisplayName(vendorId: any): string {
    if (vendorId && typeof vendorId === 'object') {
      return vendorId.companyName || `${vendorId.firstName} ${vendorId.lastName}`;
    }
    return 'Unknown Vendor';
  }

  getPODisplayName(poId: any): string {
    if (poId && typeof poId === 'object') {
      return '#' + poId._id.slice(-6);
    }
    return 'N/A';
  }

  getAmountDisplay(amount: any): string {
    if (amount && amount.currency && amount.amount) {
      return `${amount.currency} ${amount.amount.toLocaleString()}`;
    }
    return 'N/A';
  }
} 