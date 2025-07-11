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
import { PO } from '../../../models/po.model';
import { SOW } from '../../../models/sow.model';
import { PaginationState } from '../../../models/pagination.model';
import { POService } from '../../../services/po.service';
import { SOWService } from '../../../services/sow.service';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ApiService } from '../../../services/api.service';
import { VendorService } from '../../../services/vendor.service';

@Component({
  selector: 'app-po-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AgGridModule,
    LucideAngularModule,
    PaginationComponent
  ],
  templateUrl: './po-management.component.html',
  styleUrls: ['./po-management.component.scss']
})
export class POManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  pos: PO[] = [];
  availableSOWs: SOW[] = [];
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
  showCreateModal = false;
  showViewModal = false;
  showActionModal = false;
  selectedPO: PO | null = null;
  actionType: 'submit' | 'approve' | 'send-to-vendor' = 'submit';

  // Forms
  poForm!: FormGroup;
  actionForm!: FormGroup;

  // Precomputed properties for template (fixing NG5002)
  submittedPOCount = 0;
  financeApprovedPOCount = 0;
  vendorAcceptedPOCount = 0;

  // Precomputed values for selected PO (fixing template expressions)
  selectedPOShortId = '';
  selectedPOStatusClass = '';
  selectedPOStatusLabel = '';
  selectedPOAmountDisplay = '';
  selectedPOSOWTitle = '';
  selectedPOVendorName = '';
  selectedPOPaymentTerms = '';
  selectedPOCreatedDate = '';
  selectedPOFinanceApprovalStatus = '';
  selectedPOFinanceApprovalComments = '';
  selectedPOFinanceApprovalDate = '';
  selectedPOVendorResponseStatus = '';
  selectedPOVendorResponseComments = '';
  selectedPOVendorResponseDate = '';

  // Precomputed SOW display values for form
  sowDisplayOptions: Array<{id: string, display: string}> = [];
  vendorDisplayOptions: Array<{id: string, display: string}> = [];

  // View model for PO grid data
  poGridData: Array<{
    id: string;
    shortId: string;
    sowTitle: string;
    vendorName: string;
    amountDisplay: string;
    statusClass: string;
    statusLabel: string;
    createdDate: string;
    actions: Array<{type: string, icon: string, label: string}>;
  }> = [];

  // Stats
  pendingPOsCount = 0;
  approvedPOsCount = 0;
  totalAmountPending = 0;

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'PO ID',
      field: '_id',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const poId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${poId ? poId.slice(-6) : 'N/A'}</div>`;
      }
    },
    {
      headerName: 'SOW Reference',
      field: 'sowId',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const sow = params.data.sowId;
        if (sow && typeof sow === 'object') {
          return `<div class="text-sm text-gray-900">#${sow._id ? sow._id.slice(-6) : 'N/A'}</div>`;
        }
        return '<div class="text-sm text-gray-500">N/A</div>';
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
      headerName: 'Amount',
      field: 'totalAmount',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const amount = params.data.totalAmount;
        if (amount) {
          return `<div class="text-sm text-gray-900">${amount.currency} ${amount.amount.toLocaleString()}</div>`;
        }
        return '<div class="text-sm text-gray-500">N/A</div>';
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const po = params.data;
        const actions = this.getAvailableActions(po);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
        // View button
        html += `
          <button 
            onclick="window.poViewAction('${po._id}')"
            class="view-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View PO Details">
            <span>👁️</span>
          </button>
        `;
        
        // Action buttons
        actions.forEach((action: any) => {
          const buttonClass = action.type === 'submit' ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' : 
                             action.type === 'approve' ? 'text-green-600 hover:text-green-900 hover:bg-green-50' :
                             'text-blue-600 hover:text-blue-900 hover:bg-blue-50';
          
          html += `
            <button 
              onclick="window.poActionAction('${po._id}', '${action.type}')"
              class="action-btn ${buttonClass} p-1 rounded"
              title="${action.label}">
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
    tooltipShowDelay: 500,
    onGridReady: (params: any) => {
      this.onGridReady(params);
    }
  };

  constructor(
    private poService: POService,
    private sowService: SOWService,
    private authService: AuthService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private apiService: ApiService,
    private vendorService: VendorService
  ) {
    this.initializeForms();
    this.loadPOs();
    this.loadAvailableSOWs();
  }

  ngOnInit(): void {
    this.loadPOs();
    this.loadAvailableSOWs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.poForm = this.fb.group({
      sowId: ['', Validators.required],
      vendorId: ['', Validators.required],
      poAmount: this.fb.group({
        amount: ['', [Validators.required, Validators.min(0)]],
        currency: ['USD', Validators.required]
      }),
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      paymentTerms: ['net_30', Validators.required],
      justification: ['']
    });

    this.actionForm = this.fb.group({
      comments: ['']
    });
  }

  loadPOs(): void {
    this.isLoading = true;
    this.paginationState.isLoading = true;

    this.poService.getPOs({
      page: this.currentPage,
      limit: this.pageSize
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.pos = response.data.docs || [];
            this.totalPOs = response.data.totalDocs || 0;
            
            // Update pagination state
            this.paginationState = {
              currentPage: this.currentPage,
              pageSize: this.pageSize,
              totalItems: this.totalPOs,
              totalPages: Math.ceil(this.totalPOs / this.pageSize),
              isLoading: false,
              hasNextPage: this.currentPage < Math.ceil(this.totalPOs / this.pageSize),
              hasPreviousPage: this.currentPage > 1
            };
            
            this.updatePOCounts();
            this.updatePOGridData();
            
            // Re-setup button handlers after data is loaded
            this.setupButtonHandlers();
          }
        },
        error: (error: any) => {
          console.error('Error loading POs:', error);
        },
        complete: () => {
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private updatePOCounts(): void {
    this.pendingPOsCount = this.pos.filter(po => po.status === 'submitted').length;
    this.approvedPOsCount = this.pos.filter(po => po.status === 'finance_approved').length;
    this.totalAmountPending = this.pos
      .filter(po => po.status === 'submitted')
      .reduce((total, po) => total + (po.totalAmount?.amount || 0), 0);
  }

  private updatePOGridData(): void {
    this.poGridData = this.pos.map(po => ({
      id: po._id,
      shortId: this.getShortPOId(po._id),
      sowTitle: this.getSOWDisplay(po.sowId),
      vendorName: this.getVendorDisplay(po.vendorId),
      amountDisplay: this.getPOAmountDisplay(po),
      statusClass: this.getStatusClass(po.status),
      statusLabel: this.formatStatus(po.status),
      createdDate: po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A',
      actions: this.getAvailableActions(po)
    }));
  }

  getShortPOId(poId: string): string {
    return poId ? `#${poId.slice(-6)}` : 'N/A';
  }

  getSOWDisplay(sow: any): string {
    if (this.isSOWPopulated(sow)) {
      return this.getSOWTitle(sow);
    }
    return 'Unknown SOW';
  }

  getVendorDisplay(vendor: any): string {
    if (this.isVendorPopulated(vendor)) {
      return this.getVendorName(vendor);
    }
    return 'Unknown Vendor';
  }

  getPOAmountDisplay(po: PO): string {
    if (po.totalAmount && po.totalAmount.amount) {
      return `${po.totalAmount.currency} ${po.totalAmount.amount.toLocaleString()}`;
    }
    return 'N/A';
  }

  private updateSelectedPODisplay(): void {
    if (!this.selectedPO) {
      this.resetSelectedPODisplay();
      return;
    }

    this.selectedPOShortId = this.getShortPOId(this.selectedPO._id);
    this.selectedPOStatusClass = this.getStatusClass(this.selectedPO.status);
    this.selectedPOStatusLabel = this.formatStatus(this.selectedPO.status);
    this.selectedPOAmountDisplay = this.getPOAmountDisplay(this.selectedPO);
    this.selectedPOSOWTitle = this.getSOWDisplay(this.selectedPO.sowId);
    this.selectedPOVendorName = this.getVendorDisplay(this.selectedPO.vendorId);
    this.selectedPOPaymentTerms = this.selectedPO.paymentTermsDisplay || this.selectedPO.paymentTerms || 'N/A';
    this.selectedPOCreatedDate = this.selectedPO.createdAt ? new Date(this.selectedPO.createdAt).toLocaleDateString() : 'N/A';

    // Finance approval details
    if (this.selectedPO.financeApproval) {
      this.selectedPOFinanceApprovalStatus = this.selectedPO.financeApproval.status || 'N/A';
      this.selectedPOFinanceApprovalComments = this.selectedPO.financeApproval.comments || 'N/A';
      this.selectedPOFinanceApprovalDate = this.selectedPO.financeApproval.date ? 
        new Date(this.selectedPO.financeApproval.date).toLocaleDateString() : 'N/A';
    } else {
      this.selectedPOFinanceApprovalStatus = 'N/A';
      this.selectedPOFinanceApprovalComments = 'N/A';
      this.selectedPOFinanceApprovalDate = 'N/A';
    }

    // Vendor response details
    if (this.selectedPO.vendorResponse) {
      this.selectedPOVendorResponseStatus = this.selectedPO.vendorResponse.status || 'N/A';
      this.selectedPOVendorResponseComments = this.selectedPO.vendorResponse.comments || 'N/A';
      this.selectedPOVendorResponseDate = this.selectedPO.vendorResponse.responseDate ? 
        new Date(this.selectedPO.vendorResponse.responseDate).toLocaleDateString() : 'N/A';
    } else {
      this.selectedPOVendorResponseStatus = 'N/A';
      this.selectedPOVendorResponseComments = 'N/A';
      this.selectedPOVendorResponseDate = 'N/A';
    }
  }

  private resetSelectedPODisplay(): void {
    this.selectedPOShortId = '';
    this.selectedPOStatusClass = '';
    this.selectedPOStatusLabel = '';
    this.selectedPOAmountDisplay = '';
    this.selectedPOSOWTitle = '';
    this.selectedPOVendorName = '';
    this.selectedPOPaymentTerms = '';
    this.selectedPOCreatedDate = '';
    this.selectedPOFinanceApprovalStatus = '';
    this.selectedPOFinanceApprovalComments = '';
    this.selectedPOFinanceApprovalDate = '';
    this.selectedPOVendorResponseStatus = '';
    this.selectedPOVendorResponseComments = '';
    this.selectedPOVendorResponseDate = '';
  }

  loadAvailableSOWs(): void {
    this.sowService.getSOWs({
      page: 1,
      limit: 1000,
      status: 'vendor_accepted' // Only load fully approved SOWs
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Handle new API response structure
          if (response.data && response.data.docs) {
            this.availableSOWs = response.data.docs || [];
          } else {
            // Fallback to old structure
            this.availableSOWs = response.data || [];
          }
          
          // Filter out SOWs that already have POs created
          this.filterSOWsWithoutPOs();
          
          this.updateSOWDisplayOptions();
        },
        error: (error: any) => {
          console.error('Error loading SOWs:', error);
        }
      });
  }

  private updateSOWDisplayOptions(): void {
    this.sowDisplayOptions = this.availableSOWs.map(sow => ({
      id: sow._id,
      display: this.getSOWDisplay(sow)
    }));
  }

  // Auto-populate vendor when SOW is selected
  onSOWSelectionChange(): void {
    const sowId = this.poForm.get('sowId')?.value;
    if (sowId) {
      const selectedSOW = this.availableSOWs.find(sow => sow._id === sowId);
      if (selectedSOW && selectedSOW.vendorId) {
        // Auto-populate vendor from SOW
        let vendorId: string;
        if (selectedSOW.vendorId && typeof selectedSOW.vendorId === 'object' && '_id' in selectedSOW.vendorId) {
          vendorId = (selectedSOW.vendorId as any)._id;
        } else {
          vendorId = selectedSOW.vendorId as string;
        }
        
        this.poForm.get('vendorId')?.setValue(vendorId);
        this.poForm.get('vendorId')?.disable(); // Make vendor field non-editable
        
        // Update vendor display options for the dropdown
        this.vendorDisplayOptions = [{
          id: vendorId,
          display: this.getVendorDisplay(selectedSOW.vendorId)
        }];
      }
    } else {
      // Clear vendor when SOW is deselected
      this.poForm.get('vendorId')?.setValue('');
      this.poForm.get('vendorId')?.enable(); // Re-enable vendor field
      this.vendorDisplayOptions = []; // Clear vendor options
    }
    
    // Check amount validation
    this.checkAmountValidation();
  }

  // Check if justification is required when PO amount differs from SOW amount
  checkAmountValidation(): void {
    const sowId = this.poForm.get('sowId')?.value;
    const poAmount = this.poForm.get('poAmount.amount')?.value;
    
    if (sowId && poAmount) {
      const selectedSOW = this.availableSOWs.find(sow => sow._id === sowId);
      if (selectedSOW && selectedSOW.estimatedCost) {
        const sowAmount = selectedSOW.estimatedCost.amount;
        const amountDifference = Math.abs(poAmount - sowAmount);
        const percentageDifference = (amountDifference / sowAmount) * 100;
        
        // If difference is more than 5%, require justification
        if (percentageDifference > 5) {
          this.poForm.get('justification')?.setValidators([Validators.required]);
          this.poForm.get('justification')?.updateValueAndValidity();
        } else {
          this.poForm.get('justification')?.clearValidators();
          this.poForm.get('justification')?.updateValueAndValidity();
        }
      }
    }
  }

  // Get selected SOW amount for comparison
  getSelectedSOWAmount(): number | null {
    const sowId = this.poForm.get('sowId')?.value;
    if (sowId) {
      const selectedSOW = this.availableSOWs.find(sow => sow._id === sowId);
      return selectedSOW?.estimatedCost?.amount || null;
    }
    return null;
  }

  // Check if justification is required
  isJustificationRequired(): boolean {
    const sowAmount = this.getSelectedSOWAmount();
    const poAmount = this.poForm.get('poAmount.amount')?.value;
    
    if (sowAmount && poAmount) {
      const amountDifference = Math.abs(poAmount - sowAmount);
      const percentageDifference = (amountDifference / sowAmount) * 100;
      return percentageDifference > 5;
    }
    return false;
  }

  onCreatePO(): void {
    this.showCreateModal = true;
    this.poForm.reset({
      poAmount: {
        amount: '',
        currency: 'USD'
      }
    });
    // Ensure vendor field is disabled and clear vendor options
    this.poForm.get('vendorId')?.disable();
    this.vendorDisplayOptions = [];
  }

  onSubmitPO(): void {
    if (this.poForm.valid) {
      // Additional validation to ensure vendorId is present
      const vendorId = this.poForm.get('vendorId')?.value;
      if (!vendorId) {
        console.error('🔧 Error: Vendor ID is missing from form');
        return;
      }

      this.isLoading = true;
      
      // Use getRawValue() to include disabled form controls (like vendorId)
      const formValue = this.poForm.getRawValue();
      
      // Map form data to backend model structure
      // Note: Frontend uses 'poAmount' but backend expects 'totalAmount'
      const poData = {
        sowId: formValue.sowId,
        vendorId: formValue.vendorId,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        totalAmount: {
          amount: parseFloat(formValue.poAmount.amount),
          currency: formValue.poAmount.currency
        },
        paymentTerms: formValue.paymentTerms
      };

      this.poService.createPO(poData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.showCreateModal = false;
            this.loadPOs();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ Error creating PO:', error);
            
            // Handle specific error messages
            let errorMessage = 'Failed to create Purchase Order';
            if (error.error?.message) {
              if (error.error.message.includes('SOW amount is already utilized')) {
                errorMessage = 'This SOW has already been used to create a Purchase Order. Each SOW can only be used once.';
              } else if (error.error.message.includes('Only clients can create POs')) {
                errorMessage = 'You do not have permission to create Purchase Orders.';
              } else if (error.error.message.includes('PO can only be created for accepted SOWs')) {
                errorMessage = 'Purchase Orders can only be created for SOWs that have been accepted by the vendor.';
              } else if (error.error.message.includes('Invalid vendor or vendor not approved')) {
                errorMessage = 'The selected vendor is not valid or not approved.';
              } else {
                errorMessage = error.error.message;
              }
            }
            
            // You can add a toast notification here if you have one
            alert(errorMessage);
            this.isLoading = false;
          }
        });
    }
  }

  onViewPO(po: PO): void {
    this.selectedPO = po;
    this.updateSelectedPODisplay();
    this.showViewModal = true;
  }

  onActionClick(po: PO, actionType: string): void {
    this.selectedPO = po;
    this.actionType = actionType as 'submit' | 'approve' | 'send-to-vendor';
    this.actionForm.reset();
    this.showActionModal = true;
    this.changeDetectorRef.detectChanges();
  }

  onActionSubmit(): void {
    if (this.selectedPO && this.actionForm.valid) {
      this.isLoading = true;
      const comments = this.actionForm.get('comments')?.value;

      let actionObservable;
      switch (this.actionType) {
        case 'submit':
          actionObservable = this.poService.submitPO(this.selectedPO._id);
          break;
        case 'approve':
          actionObservable = this.poService.financeApproval(this.selectedPO._id, { 
            status: 'approved', 
            comments 
          });
          break;
        case 'send-to-vendor':
          actionObservable = this.poService.sendToVendor(this.selectedPO._id);
          break;
        default:
          console.error('❌ PO Management: Unknown action type:', this.actionType);
          this.isLoading = false;
          return;
      }

      actionObservable.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showActionModal = false;
            this.loadPOs();
            this.showSuccessMessage(`PO ${this.actionType} successfully`);
          } else {
            console.error('❌ PO Management: Action failed:', response.message);
            this.showErrorMessage(response.message || `Failed to ${this.actionType} PO`);
          }
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error: any) => {
          console.error(`❌ PO Management: Error performing ${this.actionType} action:`, error);
          this.showErrorMessage(`Failed to ${this.actionType} PO`);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPOs();
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showViewModal = false;
    this.showActionModal = false;
    this.selectedPO = null;
    this.resetSelectedPODisplay();
    
    // Reset form and clear vendor options
    this.poForm.reset({
      poAmount: {
        amount: '',
        currency: 'USD'
      }
    });
    this.poForm.get('vendorId')?.disable();
    this.vendorDisplayOptions = [];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'finance_approved':
        return 'bg-green-100 text-green-800';
      case 'vendor_accepted':
        return 'bg-purple-100 text-purple-800';
      case 'vendor_rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getAvailableActions(po: PO): Array<{type: string, icon: string, label: string}> {
    const actions = [];
    const currentUser = this.authService.getCurrentUser();
    
    // client_owner has full access to all actions
    const isClientOwner = currentUser?.organizationRole === 'client_owner';
    
    if (po.status === 'draft') {
      actions.push({ type: 'submit', icon: '📤', label: 'Submit' });
    }
    
    // Finance approval - available to client_owner for all submitted POs
    if (po.status === 'submitted' && isClientOwner) {
      actions.push({ type: 'approve', icon: '✅', label: 'Approve' });
    }
    
    if (po.status === 'finance_approved') {
      actions.push({ type: 'send-to-vendor', icon: '📧', label: 'Send to Vendor' });
    }
    
    return actions;
  }

  trackById(index: number, item: PO): string {
    return item._id;
  }

  isSOWPopulated(sowId: any): boolean {
    return sowId && typeof sowId === 'object' && sowId.title;
  }

  isVendorPopulated(vendorId: any): boolean {
    return vendorId && typeof vendorId === 'object' && vendorId.companyName;
  }

  getSOWTitle(sowId: any): string {
    if (this.isSOWPopulated(sowId)) {
      return sowId.title;
    }
    return 'Unknown SOW';
  }

  getVendorName(vendorId: any): string {
    if (this.isVendorPopulated(vendorId)) {
      return vendorId.companyName;
    }
    return 'Unknown Vendor';
  }

  private filterSOWsWithoutPOs(): void {
    // Get all existing POs to check which SOWs already have POs
    this.poService.getPOs({ page: 1, limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const existingPOs = response.data?.docs || response.data || [];
          const sowIdsWithPOs = new Set(existingPOs.map((po: any) => po.sowId));
          
          // Filter out SOWs that already have POs
          this.availableSOWs = this.availableSOWs.filter(sow => !sowIdsWithPOs.has(sow._id));
          
          this.updateSOWDisplayOptions();
        },
        error: (error: any) => {
          console.error('Error filtering SOWs:', error);
          // If filtering fails, still show all SOWs (backend will handle validation)
          this.updateSOWDisplayOptions();
        }
      });
  }

  onGridReady(params: any): void {
    this.setupButtonHandlers();
  }

  setupButtonHandlers(): void {
    // Set up global functions for button clicks
    (window as any).poViewAction = (poId: string) => {
      const po = this.pos.find(p => p._id === poId);
      if (po) {
        this.onViewPO(po);
      } else {
        console.error('❌ PO Management: PO not found for view:', poId);
      }
    };

    (window as any).poActionAction = (poId: string, actionType: string) => {
      const po = this.pos.find(p => p._id === poId);
      if (po) {
        this.onActionClick(po, actionType);
      } else {
        console.error('❌ PO Management: PO not found for action:', poId);
      }
    };
  }

  showSuccessMessage(message: string): void {
    // Implement success message display
    // console.log('Success:', message);
  }

  showErrorMessage(message: string): void {
    // Implement error message display
    console.error('❌ Error:', message);
  }
} 