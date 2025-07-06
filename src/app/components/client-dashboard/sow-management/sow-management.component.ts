import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, GridOptions } from 'ag-grid-community';
import { LucideAngularModule } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { SOW } from '../../../models/sow.model';
import { SOWService } from '../../../services/sow.service';
import { AuthService } from '../../../services/auth.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { AuditTrailComponent } from '../../shared/audit-trail/audit-trail.component';
import { AuditLogService } from '../../../services/audit-log.service';
import { VendorService } from '../../../services/vendor.service';
import { ApiService } from '../../../services/api.service';
import { PaginationState } from '../../../models/pagination.model';
import { ApiResponse } from '../../../models/api-response.model';

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
  showCreateModal = false;
  showViewModal = false;
  showActionModal = false;
  showPMApprovalModal = false;
  selectedSOW: SOW | null = null;
  actionType: 'approve' | 'reject' | 'pm-approval' | 'send-to-vendor' = 'approve';

  // Forms
  sowForm!: FormGroup;
  actionForm!: FormGroup;
  pmApprovalForm!: FormGroup;

  // Stats
  pendingSOWsCount = 0;
  approvedSOWsCount = 0;
  totalAmountPending = 0;

  // Precomputed values for selected SOW (fixing template expressions)
  selectedSOWShortId = '';
  selectedSOWStatusClass = '';
  selectedSOWStatusLabel = '';
  selectedSOWAmountDisplay = '';
  selectedSOWVendorName = '';
  selectedSOWStartDate = '';
  selectedSOWEndDate = '';

  // Precomputed values for audit trail
  selectedSOWForAuditShortId = '';

  // Precomputed vendor display values for form
  vendorDisplayOptions: Array<{id: string, display: string}> = [];
  isLoadingVendors = false;

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'SOW ID',
      field: '_id',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const sowId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${sowId ? sowId.slice(-6) : 'N/A'}</div>`;
      }
    },
    {
      headerName: 'Title',
      field: 'title',
      flex: 2,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        return `<div class="text-sm text-gray-900">${params.data.title || 'N/A'}</div>`;
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
      field: 'estimatedCost',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
        const sow = params.data;
        const actions = this.getAvailableActions(sow);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
        // View button
        html += `
          <button 
            onclick="window.sowViewAction('${sow._id}')"
            class="view-btn text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View SOW Details">
            <span>👁️</span>
          </button>
        `;
        
        // Action buttons
        actions.forEach((action: any) => {
          const buttonClass = action.type === 'pm-approval' ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' : 
                             action.type === 'approve' ? 'text-green-600 hover:text-green-900 hover:bg-green-50' :
                             'text-red-600 hover:text-red-900 hover:bg-red-50';
          
          html += `
            <button 
              onclick="window.sowActionAction('${sow._id}', '${action.type}')"
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

  // Audit trail modal
  showAuditTrailModal = false;
  selectedSOWForAudit: SOW | null = null;

  constructor(
    private sowService: SOWService,
    private vendorService: VendorService,
    private authService: AuthService,
    private auditLogService: AuditLogService,
    private fb: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private apiService: ApiService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadSOWs();
    this.loadVendors();
    
    // Test API connection
    this.testApiConnection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up global functions
    delete (window as any).sowViewAction;
    delete (window as any).sowActionAction;
  }

  private initializeForms(): void {
    this.sowForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      vendorId: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(20)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      estimatedCost: this.fb.group({
        amount: ['', [Validators.required, Validators.min(0)]],
        currency: ['USD', Validators.required]
      })
    });

    this.actionForm = this.fb.group({
      comments: ['', Validators.required]
    });

    this.pmApprovalForm = this.fb.group({
      comments: ['', [Validators.required, this.noWhitespaceValidator]]
    });

    // Set up form validation triggers
    this.pmApprovalForm.get('comments')?.valueChanges.subscribe(() => {
      this.pmApprovalForm.updateValueAndValidity();
    });
  }

  // Custom validator to ensure comments are not just whitespace
  private noWhitespaceValidator(control: any) {
    if (control.value && control.value.trim().length === 0) {
      return { whitespaceOnly: true };
    }
    return null;
  }

  loadSOWs(): void {
    this.isLoading = true;
    this.paginationState.isLoading = true;

    this.sowService.getSOWs({
      page: this.currentPage,
      limit: this.pageSize
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.sows = response.data.docs || [];
            this.totalSOWs = response.data.totalDocs || 0;
            
            // Update pagination state
            this.paginationState = {
              currentPage: this.currentPage,
              pageSize: this.pageSize,
              totalItems: this.totalSOWs,
              totalPages: Math.ceil(this.totalSOWs / this.pageSize),
              isLoading: false,
              hasNextPage: this.currentPage < Math.ceil(this.totalSOWs / this.pageSize),
              hasPreviousPage: this.currentPage > 1
            };
            
            this.updateSOWCounts();
          }
        },
        error: (error: any) => {
          console.error('Error loading SOWs:', error);
        },
        complete: () => {
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private updateSOWCounts(): void {
    this.pendingSOWsCount = this.sows.filter(sow => sow.status === 'submitted').length;
    this.approvedSOWsCount = this.sows.filter(sow => sow.status === 'internal_approved').length;
    this.totalAmountPending = this.sows
      .filter(sow => sow.status === 'submitted')
      .reduce((total, sow) => total + (sow.estimatedCost?.amount || 0), 0);
  }

  loadVendors(): void {
    console.log('🔧 SOW Management: Loading vendors from database...');
    this.isLoadingVendors = true;
    this.apiService.getVendors().subscribe({
      next: (response: any) => {
        console.log('🔧 SOW Management: Vendors API response:', response);
        
        // Handle different response formats
        let vendors = [];
        if (response.success && response.data) {
          vendors = response.data;
        } else if (Array.isArray(response)) {
          vendors = response;
        } else if (response.data && Array.isArray(response.data)) {
          vendors = response.data;
        }
        
        if (vendors.length > 0) {
          this.vendorDisplayOptions = vendors.map((vendor: any) => ({
            id: vendor._id || vendor.id,
            display: `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || vendor.email || 'Unknown Vendor'
          }));
          console.log('🔧 SOW Management: Loaded vendors:', this.vendorDisplayOptions);
        } else {
          console.warn('🔧 SOW Management: No vendors found in response');
          this.vendorDisplayOptions = [];
        }
        this.isLoadingVendors = false;
      },
      error: (error: any) => {
        console.error('🔧 SOW Management: Error loading vendors:', error);
        console.error('🔧 SOW Management: Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url
        });
        this.isLoadingVendors = false;
        this.vendorDisplayOptions = [];
      }
    });
  }

  onCreateSOW(): void {
    console.log('🔧 SOW Management: Opening create SOW modal');
    this.showCreateModal = true;
    this.sowForm.reset({
      estimatedCost: {
        amount: '',
        currency: 'USD'
      }
    });
    
    // Ensure vendors are loaded when modal opens
    this.loadVendors();
  }

  onSubmitSOW(): void {
    if (this.sowForm.valid) {
      this.isLoading = true;
      const formValue = this.sowForm.value;
      
      const sowData = {
        ...formValue,
        estimatedCost: {
          amount: parseFloat(formValue.estimatedCost.amount),
          currency: formValue.estimatedCost.currency
        }
      };

      this.sowService.createSOW(sowData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.showCreateModal = false;
            this.loadSOWs();
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error creating SOW:', error);
            this.isLoading = false;
          }
        });
    }
  }

  onViewSOW(sow: SOW): void {
    console.log('🔧 SOW Management: Opening view modal for SOW:', sow._id);
    this.selectedSOW = sow;
    this.updateSelectedSOWDisplay();
    this.showViewModal = true;
  }

  onActionClick(sow: SOW, actionType: string): void {
    console.log('🔧 SOW Management: Action clicked for SOW:', sow._id, 'Action:', actionType);
    this.selectedSOW = sow;
    this.actionType = actionType as 'approve' | 'reject' | 'pm-approval' | 'send-to-vendor';
    
    if (actionType === 'pm-approval') {
      console.log('🔧 SOW Management: Opening PM approval modal');
      this.showPMApprovalModal = true;
      this.showActionModal = false;
      this.showViewModal = false;
      this.showCreateModal = false;
      
      // Reset and initialize PM approval form with proper validation
      this.pmApprovalForm.reset();
      this.pmApprovalForm.get('comments')?.setValue('');
      this.pmApprovalForm.get('comments')?.markAsUntouched();
      this.pmApprovalForm.get('comments')?.markAsPristine();
      this.pmApprovalForm.updateValueAndValidity();
      
      // Force change detection
      this.changeDetectorRef.detectChanges();
    } else if (actionType === 'send-to-vendor') {
      console.log('🔧 SOW Management: Processing send to vendor action');
      // For send-to-vendor, we don't need a modal - just process the action directly
      this.onSendToVendor(sow);
    } else {
      console.log('🔧 SOW Management: Opening action modal');
      this.showActionModal = true;
      this.showPMApprovalModal = false;
      this.showViewModal = false;
      this.showCreateModal = false;
      
      // Reset action form
      this.actionForm.reset();
      this.actionForm.markAsUntouched();
      this.actionForm.markAsPristine();
    }
    
    // Force change detection
    this.changeDetectorRef.detectChanges();
  }

  onActionSubmit(): void {
    if (this.actionForm.valid && this.selectedSOW) {
      this.isLoading = true;
      const comments = this.actionForm.get('comments')?.value;

      const action = this.actionType;
      
      if (action === 'approve') {
        this.sowService.approveSOW(this.selectedSOW._id, comments)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: any) => {
              if (response.success) {
                this.loadSOWs();
                this.onCloseModal();
              }
            },
            error: (error: any) => {
              console.error('Error approving SOW:', error);
            },
            complete: () => {
              this.isLoading = false;
            }
          });
      } else if (action === 'reject') {
        // For reject action, you might need to implement a reject method in the service
        console.log('Reject action not implemented yet');
        this.isLoading = false;
      } else if (action === 'pm-approval') {
        this.showPMApprovalModal = true;
        this.showActionModal = false;
      } else if (action === 'send-to-vendor') {
        this.onSendToVendor(this.selectedSOW);
      }
    }
  }

  onPMApprovalSubmit(): void {
    if (this.pmApprovalForm.valid && this.selectedSOW) {
      this.isLoading = true;
      const comments = this.pmApprovalForm.get('comments')?.value;

      console.log('🔧 SOW Management: Submitting for PM approval - SOW ID:', this.selectedSOW._id, 'Comments:', comments);

      this.sowService.submitForPMApproval(this.selectedSOW._id, comments)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            console.log('🔧 SOW Management: PM approval response:', response);
            if (response.success) {
              this.showSuccessMessage('SOW submitted for PM approval successfully');
              this.loadSOWs();
              this.onCloseModal();
              // Force change detection to ensure modal closes
              this.changeDetectorRef.detectChanges();
            } else {
              console.error('🔧 SOW Management: PM approval failed:', response.message);
              this.showErrorMessage(response.message || 'Failed to submit SOW for PM approval');
              this.isLoading = false;
            }
          },
          error: (error: any) => {
            console.error('🔧 SOW Management: Error submitting SOW for PM approval:', error);
            this.showErrorMessage('Failed to submit SOW for PM approval');
            this.isLoading = false;
          },
          complete: () => {
            console.log('🔧 SOW Management: PM approval request completed');
            this.isLoading = false;
          }
        });
    }
  }

  onSendToVendor(sow: SOW): void {
    console.log('🔧 SOW Management: Sending SOW to vendor - SOW ID:', sow._id);
    this.isLoading = true;

    this.sowService.sendToVendor(sow._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('🔧 SOW Management: Send to vendor response:', response);
          if (response.success) {
            this.showSuccessMessage('SOW sent to vendor successfully');
            this.loadSOWs();
            this.onCloseModal();
            // Force change detection to ensure modal closes
            this.changeDetectorRef.detectChanges();
          } else {
            console.error('🔧 SOW Management: Send to vendor failed:', response.message);
            this.showErrorMessage(response.message || 'Failed to send SOW to vendor');
            this.isLoading = false;
          }
        },
        error: (error: any) => {
          console.error('🔧 SOW Management: Error sending SOW to vendor:', error);
          this.showErrorMessage('Failed to send SOW to vendor');
          this.isLoading = false;
        },
        complete: () => {
          console.log('🔧 SOW Management: Send to vendor request completed');
          this.isLoading = false;
        }
      });
  }

  onCommentsInput(): void {
    // Trigger form validation when user types in comments
    const commentsControl = this.pmApprovalForm.get('comments');
    if (commentsControl) {
      commentsControl.markAsTouched();
      this.pmApprovalForm.updateValueAndValidity();
      this.changeDetectorRef.detectChanges();
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSOWs();
  }

  onCloseModal(): void {
    console.log('🔧 SOW Management: Closing modal - Current states before:', {
      showCreateModal: this.showCreateModal,
      showViewModal: this.showViewModal,
      showActionModal: this.showActionModal,
      showPMApprovalModal: this.showPMApprovalModal
    });
    
    this.showCreateModal = false;
    this.showViewModal = false;
    this.showActionModal = false;
    this.showPMApprovalModal = false;
    this.selectedSOW = null;
    this.resetSelectedSOWDisplay();
    
    // Reset forms
    this.sowForm?.reset();
    this.actionForm?.reset();
    this.pmApprovalForm?.reset();
    
    console.log('🔧 SOW Management: Modal states after reset:', {
      showCreateModal: this.showCreateModal,
      showViewModal: this.showViewModal,
      showActionModal: this.showActionModal,
      showPMApprovalModal: this.showPMApprovalModal
    });
    
    // Force change detection
    this.changeDetectorRef.detectChanges();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'pm_approval_pending':
        return 'bg-orange-100 text-orange-800';
      case 'internal_approved':
        return 'bg-green-100 text-green-800';
      case 'sent_to_vendor':
        return 'bg-blue-100 text-blue-800';
      case 'vendor_accepted':
        return 'bg-purple-100 text-purple-800';
      case 'vendor_rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getAvailableActions(sow: SOW): Array<{type: string, icon: string, label: string}> {
    const actions = [];
    
    console.log('🔧 SOW Management: Getting actions for SOW:', sow._id, 'Status:', sow.status);
    
    if (sow.status === 'draft') {
      actions.push({ type: 'pm-approval', icon: '📋', label: 'Submit for PM Approval' });
    }
    
    if (sow.status === 'pm_approval_pending') {
      actions.push({ type: 'approve', icon: '✅', label: 'PM Approve' });
      actions.push({ type: 'reject', icon: '❌', label: 'PM Reject' });
    }
    
    if (sow.status === 'submitted') {
      actions.push({ type: 'approve', icon: '✅', label: 'Approve' });
      actions.push({ type: 'reject', icon: '❌', label: 'Reject' });
    }
    
    if (sow.status === 'internal_approved') {
      actions.push({ type: 'send-to-vendor', icon: '📧', label: 'Send to Vendor' });
    }
    
    console.log('🔧 SOW Management: Available actions:', actions);
    return actions;
  }

  trackById(index: number, item: SOW): string {
    return item._id;
  }

  getShortSOWId(sowId: string): string {
    return sowId ? `#${sowId.slice(-6)}` : 'N/A';
  }

  getSOWAmountDisplay(sow: SOW): string {
    if (sow.estimatedCost && sow.estimatedCost.amount) {
      return `${sow.estimatedCost.currency} ${sow.estimatedCost.amount.toLocaleString()}`;
    }
    return 'N/A';
  }

  getVendorDisplay(vendor: any): string {
    if (!vendor) return 'Unknown';
    if (typeof vendor === 'object') {
      return vendor.companyName || `${vendor.firstName} ${vendor.lastName}`;
    }
    return 'Unknown';
  }

  getVendorDisplayName(vendor: any): string {
    if (!vendor) return 'Unknown';
    if (typeof vendor === 'object') {
      return vendor.companyName || `${vendor.firstName} ${vendor.lastName}`;
    }
    return 'Unknown';
  }

  getAmountDisplay(cost: any): string {
    if (!cost) return 'N/A';
    if (typeof cost === 'object' && cost.currency && cost.amount) {
      return `${cost.currency} ${cost.amount.toLocaleString()}`;
    }
    if (typeof cost === 'number') {
      return `$ ${cost.toLocaleString()}`;
    }
    return 'N/A';
  }

  private updateSelectedSOWDisplay(): void {
    if (!this.selectedSOW) {
      this.resetSelectedSOWDisplay();
      return;
    }

    this.selectedSOWShortId = this.getShortSOWId(this.selectedSOW._id);
    this.selectedSOWStatusClass = this.getStatusClass(this.selectedSOW.status);
    this.selectedSOWStatusLabel = this.formatStatus(this.selectedSOW.status);
    this.selectedSOWAmountDisplay = this.getSOWAmountDisplay(this.selectedSOW);
    this.selectedSOWVendorName = this.getVendorDisplayName(this.selectedSOW.vendorId);
    this.selectedSOWStartDate = this.selectedSOW.startDate ? new Date(this.selectedSOW.startDate).toLocaleDateString() : 'N/A';
    this.selectedSOWEndDate = this.selectedSOW.endDate ? new Date(this.selectedSOW.endDate).toLocaleDateString() : 'N/A';
  }

  private resetSelectedSOWDisplay(): void {
    this.selectedSOWShortId = '';
    this.selectedSOWStatusClass = '';
    this.selectedSOWStatusLabel = '';
    this.selectedSOWAmountDisplay = '';
    this.selectedSOWVendorName = '';
    this.selectedSOWStartDate = '';
    this.selectedSOWEndDate = '';
  }

  showAuditTrail(sow: SOW): void {
    this.selectedSOWForAudit = sow;
    this.selectedSOWForAuditShortId = this.getShortSOWId(sow._id);
    this.showAuditTrailModal = true;
  }

  closeAuditTrailModal(): void {
    this.showAuditTrailModal = false;
    this.selectedSOWForAudit = null;
    this.selectedSOWForAuditShortId = '';
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get showSOWModal() {
    const hasModal = this.showCreateModal || this.showViewModal || this.showActionModal || this.showPMApprovalModal;
    console.log('🔧 SOW Management: Modal states - Create:', this.showCreateModal, 'View:', this.showViewModal, 'Action:', this.showActionModal, 'PM:', this.showPMApprovalModal, 'HasModal:', hasModal);
    return hasModal;
  }

  showSuccessMessage(message: string): void {
    // Implement success message display
    console.log('Success:', message);
  }

  showErrorMessage(message: string): void {
    // Implement error message display
    console.error('Error:', message);
  }

  // Test method to check API connection
  testApiConnection(): void {
    console.log('🔧 SOW Management: Testing API connection...');
    
    // Test vendors route
    this.apiService.getVendors().subscribe({
      next: (response: any) => {
        console.log('🔧 SOW Management: Vendors API test successful:', response);
      },
      error: (error: any) => {
        console.error('🔧 SOW Management: Vendors API test failed:', error);
      }
    });
  }

  onGridReady(params: any): void {
    console.log('🔧 SOW Management: Grid ready, setting up button handlers');
    
    // Set up global functions for button clicks
    (window as any).sowViewAction = (sowId: string) => {
      console.log('🔧 SOW Management: View button clicked for SOW:', sowId);
      const sow = this.sows.find(s => s._id === sowId);
      if (sow) {
        this.onViewSOW(sow);
      }
    };

    (window as any).sowActionAction = (sowId: string, actionType: string) => {
      console.log('🔧 SOW Management: Action button clicked for SOW:', sowId, 'Action:', actionType);
      const sow = this.sows.find(s => s._id === sowId);
      if (sow) {
        this.onActionClick(sow, actionType);
      }
    };
  }
} 