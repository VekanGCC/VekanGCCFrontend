import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { ColDef, GridOptions, SortChangedEvent } from 'ag-grid-community';
import { Application } from '../../../models/application.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { AdminApplicationsService } from '../../../services/admin-applications.service';
import { AdminService } from '../../../services/admin.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-applications-view',
  standalone: true,
  imports: [CommonModule, PaginationComponent, AgGridModule],
  templateUrl: './applications-view.component.html',
  styleUrls: ['./applications-view.component.scss']
})
export class ApplicationsViewComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  private subscriptions: Subscription[] = [];

  columnDefs: ColDef[] = [
    {
      headerName: 'Resource',
      field: 'resource',
      flex: 2,
      cellRenderer: (params: any) => {
        const resource = params.data.resource;
        const resourceName = this.getResourceName(resource);
        return `<div class="font-medium text-gray-900">${resourceName}</div>`;
      }
    },
    {
      headerName: 'Requirement',
      field: 'requirement',
      flex: 2,
      cellRenderer: (params: any) => {
        const requirement = params.data.requirement;
        const requirementTitle = this.getRequirementTitle(requirement);
        return `<div class="font-medium text-gray-900">${requirementTitle}</div>`;
      }
    },
    {
      headerName: 'Applicant',
      field: 'createdBy',
      flex: 1.5,
      cellRenderer: (params: any) => {
        const createdBy = params.data.createdBy;
        const applicantName = this.getApplicantName(createdBy);
        return `<div class="text-sm text-gray-600">${applicantName}</div>`;
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 1.5,
      cellRenderer: (params: any) => {
        const status = params.data.status;
        const statusClass = this.getStatusClass(status);
        const statusText = this.formatStatus(status);
        const truncatedText = statusText.length > 15 ? statusText.substring(0, 15) + '...' : statusText;
        
        return `
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}" title="${statusText}">
            ${truncatedText}
          </span>
        `;
      }
    },
    {
      headerName: 'Applied Date',
      field: 'createdAt',
      flex: 1.5,
      cellRenderer: (params: any) => {
        const date = new Date(params.data.createdAt);
        return `<div class="text-sm text-gray-500">${date.toLocaleDateString()}</div>`;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1.5,
      cellRenderer: (params: any) => {
        const application = params.data;
        const statusOptions = this.getAvailableStatusOptions(application.status);
        const hasOptions = statusOptions.length > 0;
        
        let html = '<div class="flex items-center gap-2">';
        
        // Status dropdown
        if (hasOptions) {
          html += `
            <select 
              class="status-select text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="status-${application._id}">
              <option value="" disabled selected>Actions</option>
          `;
          
          statusOptions.forEach((option: any) => {
            html += `<option value="${option.value}" class="text-sm">${option.label}</option>`;
          });
          
          html += '</select>';
        } else {
          html += '<span class="text-xs text-gray-400">No actions available</span>';
        }
        
        // History button
        html += `
          <button 
            class="history-btn text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
            id="history-${application._id}">
            <span>📋</span>
          </button>
        `;
        
        html += '</div>';
        
        // Add event listeners after rendering
        setTimeout(() => {
          const statusSelect = document.getElementById(`status-${application._id}`) as HTMLSelectElement;
          const historyBtn = document.getElementById(`history-${application._id}`);
          
          if (statusSelect) {
            // Remove existing event listener if it exists
            const existingHandler = (statusSelect as any)._changeHandler;
            if (existingHandler) {
              statusSelect.removeEventListener('change', existingHandler);
            }
            
            const changeHandler = (event: Event) => {
              const newStatus = (event.target as HTMLSelectElement).value;
              if (newStatus) {
                this.onStatusChange(application._id, newStatus);
              }
            };
            statusSelect.addEventListener('change', changeHandler);
            (statusSelect as any)._changeHandler = changeHandler; // Store reference for removal
          }
          
          if (historyBtn) {
            // Remove existing event listener if it exists
            const existingHandler = (historyBtn as any)._clickHandler;
            if (existingHandler) {
              historyBtn.removeEventListener('click', existingHandler);
            }
            
            const clickHandler = () => this.onViewHistory(application._id);
            historyBtn.addEventListener('click', clickHandler);
            (historyBtn as any)._clickHandler = clickHandler; // Store reference for removal
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

  gridOptions: any = {
    pagination: false,
    rowHeight: 60,
    tooltipShowDelay: 500,
    suppressRowClickSelection: true,
    suppressCellFocus: true
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private adminApplicationsService: AdminApplicationsService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadApplications(): void {
    this.paginationState.isLoading = true;
    this.changeDetectorRef.detectChanges();

    const subscription = this.adminService.getApplications(
      this.paginationState.currentPage,
      this.paginationState.pageSize
    ).subscribe({
      next: (response) => {
        console.log('🔧 ApplicationsViewComponent: Applications loaded:', response);
        this.applications = response.data || [];
        
        // Update pagination state
        if (response.pagination) {
          this.paginationState = {
            currentPage: response.pagination.page || 1,
            pageSize: response.pagination.limit || 10,
            totalItems: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 0,
            isLoading: false,
            hasNextPage: (response.pagination.page || 1) < (response.pagination.totalPages || 0),
            hasPreviousPage: (response.pagination.page || 1) > 1
          };
        } else {
          this.paginationState.isLoading = false;
        }
        
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('🔧 ApplicationsViewComponent: Error loading applications:', error);
        this.paginationState.isLoading = false;
        this.applications = [];
        this.changeDetectorRef.detectChanges();
      }
    });

    this.subscriptions.push(subscription);
  }

  getResourceName(resource: any): string {
    if (this.isObject(resource)) {
      return resource.name || 'Unknown Resource';
    }
    return 'Unknown Resource';
  }

  getRequirementTitle(requirement: any): string {
    if (this.isObject(requirement)) {
      return requirement.title || 'Unknown Requirement';
    }
    return 'Unknown Requirement';
  }

  getApplicantName(createdBy: any): string {
    if (this.isObject(createdBy)) {
      const firstName = createdBy.firstName || '';
      const lastName = createdBy.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown User';
    }
    return 'Unknown User';
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'applied':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'offer_created':
        return 'bg-indigo-100 text-indigo-800';
      case 'offer_accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'onboarded':
        return 'bg-teal-100 text-teal-800';
      case 'did_not_join':
        return 'bg-orange-100 text-orange-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatStatus(status: string): string {
    if (!status) return 'Unknown';
    
    const statusMap: { [key: string]: string } = {
      'applied': 'Applied: Pending Admin Approval',
      'pending': 'Pending Review',
      'shortlisted': 'Shortlisted',
      'interview': 'Interview Scheduled',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'offer_created': 'Offer Created',
      'offer_accepted': 'Offer Accepted',
      'onboarded': 'Onboarded',
      'did_not_join': 'Did Not Join',
      'withdrawn': 'Withdrawn'
    };
    
    return statusMap[status.toLowerCase()] || status;
  }

  getAvailableStatusOptions(currentStatus: string): any[] {
    const statusOptions: { [key: string]: any[] } = {
      'applied': [
        { value: 'shortlisted', label: 'Shortlist' },
        { value: 'rejected', label: 'Reject' }
      ],
      'pending': [
        { value: 'shortlisted', label: 'Shortlist' },
        { value: 'rejected', label: 'Reject' }
      ],
      'shortlisted': [
        { value: 'interview', label: 'Schedule Interview' },
        { value: 'rejected', label: 'Reject' }
      ],
      'interview': [
        { value: 'accepted', label: 'Accept' },
        { value: 'rejected', label: 'Reject' }
      ],
      'accepted': [
        { value: 'offer_created', label: 'Create Offer' }
      ],
      'offer_created': [
        { value: 'offer_accepted', label: 'Mark Offer Accepted' },
        { value: 'did_not_join', label: 'Did Not Join' }
      ],
      'offer_accepted': [
        { value: 'onboarded', label: 'Mark Onboarded' }
      ]
    };
    
    return statusOptions[currentStatus.toLowerCase()] || [];
  }

  onStatusChange(applicationId: string, newStatus: string): void {
    console.log('🔧 ApplicationsViewComponent: Updating application status:', applicationId, newStatus);
    
    const subscription = this.adminService.updateApplicationStatus(applicationId, newStatus).subscribe({
      next: (response) => {
        console.log('🔧 ApplicationsViewComponent: Status updated successfully:', response);
        // Reload applications to reflect changes
        this.loadApplications();
      },
      error: (error) => {
        console.error('🔧 ApplicationsViewComponent: Error updating status:', error);
        // Reload applications to ensure UI is in sync
        this.loadApplications();
      }
    });

    this.subscriptions.push(subscription);
  }

  onViewHistory(applicationId: string): void {
    console.log('🔧 ApplicationsViewComponent: Viewing history for application:', applicationId);
    this.adminApplicationsService.viewApplicationHistory(applicationId);
  }

  refreshPage(): void {
    this.loadApplications();
  }

  isObject(val: any): boolean {
    return val !== null && typeof val === 'object';
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadApplications();
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }

  onGridReady(event: any): void {
    // Grid is ready, no additional setup needed
  }
} 