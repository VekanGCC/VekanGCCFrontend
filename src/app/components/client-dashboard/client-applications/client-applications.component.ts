import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Application } from '../../../models/application.model';
import { AgGridModule, AgGridAngular } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { ClientService } from '../../../services/client.service';
import { ClientApplicationsService } from '../../../services/client-applications.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ApplicationFiltersComponent, ApplicationFilters } from '../../shared/application-filters/application-filters.component';
import { ApplicationStatusService } from '../../../services/application-status.service';

@Component({
  selector: 'app-client-applications',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule, PaginationComponent, ApplicationFiltersComponent],
  templateUrl: './client-applications.component.html',
  styleUrls: ['./client-applications.component.scss']
})
export class ClientApplicationsComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  isLoading = false;
  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };
  currentFilter: any = {};
  
  // Filtering properties
  currentFilters: ApplicationFilters = {
    category: 'active',
    statuses: [],
    searchTerm: undefined
  };
  applicationCounts = { active: 0, inactive: 0, all: 0 };

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  availableStatuses = [
    { value: 'applied', label: 'Applied', color: 'bg-gray-100 text-gray-800' },
    { value: 'shortlisted', label: 'Shortlist', color: 'bg-blue-100 text-blue-800' },
    { value: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
    { value: 'rejected', label: 'Reject', color: 'bg-red-100 text-red-800' },
    { value: 'accepted', label: 'Accept', color: 'bg-green-100 text-green-800' },
    { value: 'offer_created', label: 'Create Offer', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'onboarded', label: 'Onboarded', color: 'bg-teal-100 text-teal-800' },
    { value: 'did_not_join', label: 'Did Not Join', color: 'bg-orange-100 text-orange-800' }
  ];

  columnDefs: ColDef[] = [
    { 
      headerName: 'Application ID', 
      field: '_id', 
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const appId = params.data._id;
        return `<div class="text-sm font-medium text-gray-900">#${appId ? appId.slice(-6) : 'N/A'}</div>`;
      }
    },
    { 
      headerName: 'Resource', 
      field: 'resource.name', 
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      valueGetter: (params: any) => {
        if (typeof params.data.resource === 'string') {
          return 'Unknown';
        }
        return params.data.resource?.name || 'Unknown';
      },
      cellRenderer: (params: any) => {
        const resourceName = this.getResourceName(params.data);
        const truncatedName = resourceName.length > 20 ? resourceName.substring(0, 20) + '...' : resourceName;
        return `<div class="text-sm text-gray-900 truncate" title="${resourceName}">${truncatedName}</div>`;
      }
    },
    { 
      headerName: 'Requirement', 
      field: 'requirement.title', 
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      valueGetter: (params: any) => {
        if (typeof params.data.requirement === 'string') {
          return 'Unknown';
        }
        return params.data.requirement?.title || 'Unknown';
      },
      cellRenderer: (params: any) => {
        const requirementTitle = this.getRequirementTitle(params.data);
        const truncatedTitle = requirementTitle.length > 20 ? requirementTitle.substring(0, 20) + '...' : requirementTitle;
        return `<div class="text-sm text-gray-900 truncate" title="${requirementTitle}">${truncatedTitle}</div>`;
      }
    },
    { 
      headerName: 'Status', 
      field: 'status', 
      flex: 2,
      width: 200,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const status = params.data.status;
        const statusClass = this.getStatusClass(status);
        const statusText = this.formatStatus(status);
        
        // Truncate to 15 characters and add ellipsis if longer
        const displayText = statusText.length > 15 ? statusText.substring(0, 15) + '...' : statusText;
        
        return `
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}" title="${statusText}">
            ${displayText}
          </span>
        `;
      }
    },
    { 
      headerName: 'Applied Date', 
      field: 'createdAt', 
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
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
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const application = params.data;
        const hasOptions = this.hasStatusOptions(application.status);
        const statusOptions = this.getAvailableStatusOptions(application.status);
        
        let html = '<div class="flex items-center justify-start space-x-2">';
        
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
    private clientService: ClientService,
    private clientApplicationsService: ClientApplicationsService,
    private router: Router,
    private route: ActivatedRoute,
    private applicationStatusService: ApplicationStatusService
  ) {}

  ngOnInit(): void {
    console.log('🔧 ClientApplicationsComponent: ngOnInit called');
    this.initializeFilters();
    this.checkQueryParams();
  }

  private initializeFilters() {
    this.applicationStatusService.getActiveStatuses().subscribe(activeStatuses => {
      this.currentFilters = {
        category: 'active',
        statuses: activeStatuses,
        searchTerm: undefined
      };
      this.loadApplicationCounts();
    });
  }

  private loadApplicationCounts() {
    // Load counts for active, inactive, and all applications
    this.applicationStatusService.getStatusMapping().subscribe(mapping => {
      // For now, we'll use placeholder counts
      // In a real implementation, you'd call API endpoints to get actual counts
      this.applicationCounts = {
        active: this.applications.filter(app => mapping.active.includes(app.status)).length,
        inactive: this.applications.filter(app => mapping.inactive.includes(app.status)).length,
        all: this.applications.length
      };
    });
  }

  onFiltersChanged(filters: ApplicationFilters) {
    this.currentFilters = filters;
    this.loadApplications();
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions if needed
  }

  private checkQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['requirementId']) {
        this.currentFilter = { requirementId: params['requirementId'] };
        console.log('🔧 ClientApplications: Filtering by requirement:', params['requirementId']);
      } else {
        this.currentFilter = {};
      }
      this.loadApplications();
    });
  }

  private loadApplications(): void {
    console.log('🔄 ClientApplications: Loading applications...');
    this.isLoading = true;
    this.paginationState.isLoading = true;

    // Get status mapping first, then make the API call
    this.applicationStatusService.getStatusMapping().subscribe(statusMapping => {
      const params: any = {
        page: this.paginationState.currentPage,
        limit: this.paginationState.pageSize
      };

      // Add filter if present
      if (this.currentFilter?.requirementId) {
        params.requirementId = this.currentFilter.requirementId;
      }

      // Add status filters based on current category and selected statuses
      if (this.currentFilters.statuses && this.currentFilters.statuses.length > 0) {
        // User has selected specific statuses - use OR logic
        params.status = this.currentFilters.statuses;
      } else {
        // No specific statuses selected - use all statuses from current category
        let categoryStatuses: string[] = [];
        
        switch (this.currentFilters.category) {
          case 'active':
            categoryStatuses = statusMapping.active;
            break;
          case 'inactive':
            categoryStatuses = statusMapping.inactive;
            break;
          case 'all':
            categoryStatuses = statusMapping.all;
            break;
        }
        
        // Add all statuses from the current category
        params.status = categoryStatuses;
      }

      // Add search term if provided
      if (this.currentFilters.searchTerm) {
        params.search = this.currentFilters.searchTerm;
      }

      console.log('🔄 ClientApplications: Loading applications with filters:', this.currentFilters);
      console.log('🔄 ClientApplications: API params:', params);

      this.clientService.getApplications(params).subscribe({
        next: (response) => {
          console.log('✅ ClientApplications: Applications loaded:', response);
          if (response.success && response.data) {
            this.applications = response.data;
            
            // Update pagination state
            const paginationData = response.pagination || response.meta;
            if (paginationData) {
              this.paginationState = {
                currentPage: paginationData.page || 1,
                pageSize: paginationData.limit || 10,
                totalItems: paginationData.total || 0,
                totalPages: paginationData.totalPages || Math.ceil((paginationData.total || 0) / (paginationData.limit || 10)),
                isLoading: false,
                hasNextPage: (paginationData.page || 1) < (paginationData.totalPages || Math.ceil((paginationData.total || 0) / (paginationData.limit || 10))),
                hasPreviousPage: (paginationData.page || 1) > 1
              };
            }
          }
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.loadApplicationCounts(); // Update counts after loading applications
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('❌ ClientApplications: Error loading applications:', error);
          this.applications = [];
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      });
    });
  }

  private refreshGridData(): void {
    if (this.agGrid && this.agGrid.api) {
      // Force AG Grid to refresh all data
      this.agGrid.api.refreshCells({ force: true });
      console.log('🔧 ClientApplicationsComponent: Grid data refreshed');
    }
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel && sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('🔧 ClientApplicationsComponent: Sort changed:', sort);
      
      // Map AG Grid field names to backend field names
      const fieldMapping: { [key: string]: string } = {
        '_id': '_id',
        'resource.name': 'resource.name',
        'requirement.title': 'requirement.title',
        'status': 'status',
        'createdAt': 'createdAt',
        'updatedAt': 'updatedAt'
      };
      
      const sortBy = fieldMapping[sort.colId] || sort.colId;
      const sortOrder = sort.sort as 'asc' | 'desc';
      
      // You can implement sorting logic here if needed
      console.log('🔄 ClientApplications: Sort by:', sortBy, 'Order:', sortOrder);
    }
  }

  onGridReady(event: any): void {
    console.log('🔧 ClientApplicationsComponent: Grid ready');
    // Store reference to grid API for later use
    this.agGrid = event;
  }

  getApplicationResourceName(app: any): string {
    if (typeof app.resource === 'object' && app.resource?.name) {
      return app.resource.name;
    } else if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return 'Unknown Resource';
  }

  getApplicationRequirementTitle(app: any): string {
    if (typeof app.requirement === 'object' && app.requirement?.title) {
      return app.requirement.title;
    } else if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return 'Unknown Requirement';
  }

  getStatusBadge(status: string): { color: string; icon: string } {
    switch (status.toLowerCase()) {
      case 'applied':
        return { color: 'bg-gray-100 text-gray-800', icon: 'file-text' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: 'clock' };
      case 'shortlisted':
        return { color: 'bg-blue-100 text-blue-800', icon: 'check' };
      case 'interview':
        return { color: 'bg-purple-100 text-purple-800', icon: 'users' };
      case 'accepted':
        return { color: 'bg-green-100 text-green-800', icon: 'check-circle' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: 'x-circle' };
      case 'offer_created':
        return { color: 'bg-indigo-100 text-indigo-800', icon: 'file-text' };
      case 'offer_accepted':
        return { color: 'bg-emerald-100 text-emerald-800', icon: 'check-circle' };
      case 'onboarded':
        return { color: 'bg-teal-100 text-teal-800', icon: 'plus' };
      case 'did_not_join':
        return { color: 'bg-orange-100 text-orange-800', icon: 'x' };
      case 'withdrawn':
        return { color: 'bg-gray-100 text-gray-800', icon: 'x' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: 'help-circle' };
    }
  }

  formatStatus(status: string): string {
    // Special display for applied status to show pending admin approval
    if (status.toLowerCase() === 'applied') {
      return 'Applied: Pending Admin Approval';
    }
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getResourceName(app: Application): string {
    if (typeof app.resource === 'object' && app.resource?.name) {
      return app.resource.name;
    } else if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return 'Unknown Resource';
  }

  getRequirementTitle(app: Application): string {
    if (typeof app.requirement === 'object' && app.requirement?.title) {
      return app.requirement.title;
    } else if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return 'Unknown Requirement';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
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

  trackById(index: number, item: Application): string {
    return item._id || `application-${index}`;
  }

  onStatusChange(applicationId: string, newStatus: string): void {
    console.log('🔧 ClientApplicationsComponent: Status change requested:', applicationId, newStatus);
    
    // Update local state immediately for responsive UI
    const applicationIndex = this.applications.findIndex(app => app._id === applicationId);
    if (applicationIndex !== -1) {
      // Create a new array reference to force change detection
      this.applications = [...this.applications];
      this.applications[applicationIndex].status = newStatus as any;
      this.changeDetectorRef.detectChanges();
    }

    // Make API call to update status
    this.clientService.updateApplicationStatus(applicationId, newStatus).subscribe({
      next: (response) => {
        console.log('✅ ClientApplications: Application status updated successfully:', response);
        // Refresh the grid to show updated data
        this.refreshGridData();
      },
      error: (error) => {
        console.error('❌ ClientApplications: Error updating application status:', error);
        // Revert local change if API call failed
        if (applicationIndex !== -1) {
          this.applications[applicationIndex].status = this.applications.find(app => app._id === applicationId)?.status || 'applied';
          this.changeDetectorRef.detectChanges();
        }
      }
    });
  }

  onViewHistory(applicationId: string): void {
    console.log('🔧 ClientApplicationsComponent: View history clicked for application:', applicationId);
    this.clientApplicationsService.viewApplicationHistory(applicationId);
  }

  onViewDetails(application: Application): void {
    console.log('🔧 ClientApplicationsComponent: View details clicked for application:', application._id);
    this.clientApplicationsService.viewApplicationDetails(application);
  }

  getAvailableStatuses(currentStatus: string): any[] {
    // Return available status transitions based on current status
    switch (currentStatus) {
      case 'applied':
        return [
          { value: 'rejected', label: 'Reject' }
        ];
      case 'shortlisted':
        return [
          { value: 'interview', label: 'Interview' },
          { value: 'rejected', label: 'Reject' }
        ];
      case 'interview':
        return [
          { value: 'accepted', label: 'Accept' },
          { value: 'rejected', label: 'Reject' }
        ];
      case 'accepted':
        return [
          { value: 'offer_created', label: 'Create Offer' }
        ];
      case 'offer_created':
        return [
          { value: 'withdrawn', label: 'Remove Offer' }
        ];
      case 'offer_accepted':
        return [
          { value: 'onboarded', label: 'Onboarded' },
          { value: 'did_not_join', label: 'Did Not Join' }
        ];
      default:
        return [];
    }
  }

  onPageChange(page: number): void {
    console.log('🔄 ClientApplications: Page changed to:', page);
    this.paginationState.currentPage = page;
    this.loadApplications();
  }

  hasStatusOptions(status: string): boolean {
    const availableStatuses = this.getAvailableStatuses(status);
    return availableStatuses.length > 0;
  }

  getAvailableStatusOptions(status: string): any[] {
    return this.getAvailableStatuses(status);
  }

  clearFilter(): void {
    console.log('🔄 ClientApplications: Clearing filter');
    this.currentFilter = {};
    this.router.navigate([], { 
      queryParams: {}, 
      queryParamsHandling: 'merge' 
    });
    this.loadApplications();
  }
} 