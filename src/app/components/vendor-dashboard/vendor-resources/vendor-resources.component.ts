// AG Grid Module Registration
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Angular
import { Component, OnInit, OnChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular, AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams } from 'ag-grid-community';
import { Resource } from '../../../models/resource.model';
import { PaginationState, PaginationParams } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { VendorService } from '../../../services/vendor.service';
import { ApiService } from '../../../services/api.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ResourceModalComponent } from '../../modals/resource-modal/resource-modal.component';

@Component({
  selector: 'app-vendor-resources',
  standalone: true,
  imports: [CommonModule, AgGridModule, PaginationComponent, ResourceModalComponent],
  templateUrl: './vendor-resources.component.html',
  styleUrls: ['./vendor-resources.component.scss']
})
export class VendorResourcesComponent implements OnInit, OnChanges {
  resources: Resource[] = [];
  isLoading = false;
  showResourceModal = false;
  resourceToEdit: Resource | null = null;
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

  // AG Grid properties
  columnDefs: ColDef[] = [
    { 
      headerName: 'Resource', 
      field: 'name', 
      flex: 2,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const resource = params.data;
        const categoryName = resource.category?.name || 'N/A';
        return `
          <div class="flex items-center justify-start text-left">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-gray-900 truncate">${resource.name || 'N/A'}</div>
              <div class="text-xs text-gray-500 truncate">${categoryName}</div>
            </div>
          </div>
        `;
      }
    },
    { 
      headerName: 'Skills', 
      field: 'skills', 
      flex: 1,
      minWidth: 120,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      valueGetter: (params: any) => {
        const skills = params.data.skills || [];
        return skills.length > 0 ? skills[0]?.name || '' : '';
      },
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) return '<span class="text-xs text-gray-500 italic">No skills</span>';
        
        const displaySkills = skills.slice(0, 2);
        const remainingCount = skills.length - 2;
        
        let html = '<div class="flex flex-wrap gap-1 justify-start">';
        displaySkills.forEach((skill: any) => {
          const skillName = skill?.name || 'Unknown';
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">${skillName}</span>`;
        });
        if (remainingCount > 0) {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">+${remainingCount}</span>`;
        }
        html += '</div>';
        return html;
      }
    },
    { 
      headerName: 'Experience', 
      field: 'experience.years', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const experience = params.data.experience || {};
        return `
          <div class="text-left">
            <div class="text-sm text-gray-900">${experience.years || 0} years</div>
            <div class="text-xs text-gray-500">${experience.level || 'Not specified'}</div>
          </div>
        `;
      }
    },
    { 
      headerName: 'Rate', 
      field: 'rate.hourly', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const rate = params.data.rate || {};
        return `
          <div class="text-left">
            <div class="text-sm text-gray-900">$${rate.hourly || 0}/hr</div>
            <div class="text-xs text-gray-500">${rate.currency || 'USD'}</div>
          </div>
        `;
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
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${statusText}
          </span>
        `;
      }
    },
    {
      headerName: 'Attachment',
      field: 'attachment',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const attachment = params.data.attachment;
        if (!attachment || !attachment.originalName) {
          return '<span class="text-xs text-gray-500 italic">No file</span>';
        }
        
        return `
          <div class="flex items-center justify-center">
            <button 
              class="download-btn p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              id="download-${params.data._id}"
              title="${attachment.originalName}">
              <img src="assets/icons/lucide/lucide/file-text.svg" alt="file" class="w-4 h-4" />
            </button>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        const resource = params.data;
        
        console.log('🔧 VendorResources: Attachment cell clicked, target:', target);
        console.log('🔧 VendorResources: Resource data:', resource);
        
        // Check if the download button or its child was clicked
        if (target.classList.contains('download-btn') || target.closest('.download-btn')) {
          console.log('🔧 VendorResources: Download button clicked for resource:', resource._id);
          this.downloadAttachment(resource);
        }
      }
    },
    {
      headerName: 'Applications',
      field: 'applicationCount',
      flex: 1,
      minWidth: 100,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const count = params.data.applicationCount || 0;
        const resourceId = params.data._id;
        const countClass = count > 0 ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer' : 'bg-gray-100 text-gray-600';
        
        return `
          <div class="flex items-center justify-start">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass} transition-colors"
                  id="app-count-${resourceId}">
              ${count}
            </span>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const resourceId = params.data._id;
        const count = params.data.applicationCount || 0;
        if (count > 0) {
          this.onApplicationCountClick(resourceId);
        }
      }
    },

    {
      headerName: 'Matching',
      field: 'matchingCount',
      flex: 1,
      minWidth: 100,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const count = params.data.matchingCount || 0;
        const resourceId = params.data._id;
        const countClass = count > 0 ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer' : 'bg-gray-100 text-gray-600';
        
        return `
          <div class="flex items-center justify-start">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass} transition-colors"
                  id="matching-count-${resourceId}">
              ${count}
            </span>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const resourceId = params.data._id;
        const count = params.data.matchingCount || 0;
        if (count > 0) {
          this.onMatchingCountClick(resourceId);
        }
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 2,
      minWidth: 150,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const resource = params.data;
        const isActive = this.isResourceActive(resource);
        const toggleText = this.getToggleButtonText(resource);
        const toggleClass = this.getToggleButtonClass(resource);
        
        return `
          <div class="flex items-center justify-start space-x-2">
            <button 
              class="edit-btn text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              id="edit-${resource._id}">
              Edit
            </button>
            <button 
              class="toggle-btn text-xs px-3 py-1 rounded transition-colors ${toggleClass}"
              id="toggle-${resource._id}">
              ${toggleText}
            </button>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        const resource = params.data;
        
        console.log('🔧 VendorResources: Actions cell clicked, target:', target);
        console.log('🔧 VendorResources: Target classes:', target.classList);
        console.log('🔧 VendorResources: Resource data:', resource);
        
        if (target.classList.contains('edit-btn')) {
          console.log('🔧 VendorResources: Edit button clicked for resource:', resource._id);
          this.onEditResource(resource);
        } else if (target.classList.contains('toggle-btn')) {
          console.log('🔧 VendorResources: Toggle button clicked for resource:', resource._id);
          this.onToggleResourceStatus(resource);
        } else {
          console.log('🔧 VendorResources: Unknown button clicked');
        }
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
    suppressRowClickSelection: true,
    allowCellClick: true,
    onCellClicked: (params: any) => {
      console.log('🔧 VendorResources: Grid onCellClicked event:', params);
    }
  };

  constructor(private vendorService: VendorService, private apiService: ApiService, private router: Router) {}

  ngOnInit(): void {
    console.log('🔧 VendorResourcesComponent: ngOnInit called');
    this.loadResources();
  }

  ngOnChanges(changes: any): void {
    // This will be called whenever the properties change
    console.log('🔧 VendorResources: Resources data changed:', this.resources);
    
    // If resources data changed, refresh the grid
    if (changes['resources'] && this.agGrid && this.agGrid.api) {
      console.log('🔧 VendorResources: Resources changed, refreshing grid');
      this.refreshGridData();
    }
  }

  loadResources(): void {
    console.log('🔄 VendorResources: Loading resources...');
    this.isLoading = true;
    this.paginationState.isLoading = true;

    const params: PaginationParams = {
      page: this.paginationState.currentPage,
      limit: this.paginationState.pageSize
    };

    this.vendorService.getResources(params).subscribe({
      next: (response) => {
        console.log('✅ VendorResources: Resources loaded successfully:', response);
        this.resources = response.data || [];
        console.log('✅ VendorResources: Resources array:', this.resources);
        console.log('✅ VendorResources: Resources with IDs:', this.resources.map(r => ({ id: r._id, name: r.name })));
        
        this.paginationState = {
          ...this.paginationState,
          totalItems: response.meta?.total || response.pagination?.total || 0,
          totalPages: response.meta?.totalPages || response.pagination?.totalPages || 0,
          hasNextPage: (response.meta?.page || response.pagination?.page || 1) < (response.meta?.totalPages || response.pagination?.totalPages || 1),
          hasPreviousPage: (response.meta?.page || response.pagination?.page || 1) > 1,
          isLoading: false
        };
        
        // Load counts for the resources
        console.log('🔄 VendorResources: About to call loadResourcesWithCounts');
        this.loadResourcesWithCounts();
        
        this.isLoading = false;
        this.refreshGridData();
      },
      error: (error) => {
        console.error('❌ VendorResources: Error loading resources:', error);
        this.isLoading = false;
        this.paginationState.isLoading = false;
      }
    });
  }

  private loadResourcesWithCounts(): void {
    console.log('🔄 VendorResources: loadResourcesWithCounts method called');
    console.log('🔄 VendorResources: Loading counts for resources...');
    
    if (this.resources.length === 0) {
      console.log('🔄 VendorResources: No resources to load counts for');
      return;
    }

    const resourceIds = this.resources.map(resource => resource._id!);
    console.log('🔄 VendorResources: Resource IDs for counts:', resourceIds);
    
    // Use forkJoin to load both application counts and matching requirements counts in parallel
    const requests = {
      applicationCounts: this.vendorService.getApplicationCountsForResources(resourceIds).pipe(
        catchError(error => {
          console.error('❌ VendorResources: Error loading application counts:', error);
          return of({ success: false, data: {} });
        })
      ),
      matchingRequirementsCounts: this.vendorService.getMatchingRequirementsCountsBatch(resourceIds).pipe(
        catchError(error => {
          console.error('❌ VendorResources: Error loading matching requirements counts:', error);
          return of({ success: false, data: [] });
        })
      )
    };

    console.log('🔄 VendorResources: About to call forkJoin with requests:', requests);

    forkJoin(requests).subscribe({
      next: (results) => {
        console.log('✅ VendorResources: Counts loaded:', results);
        console.log('✅ VendorResources: Application counts result:', results.applicationCounts);
        console.log('✅ VendorResources: Matching requirements counts result:', results.matchingRequirementsCounts);
        
        // Update resources with application counts
        if (results.applicationCounts.success && results.applicationCounts.data) {
          console.log('✅ VendorResources: Processing application counts data:', results.applicationCounts.data);
          this.resources = this.resources.map(resource => {
            const count = results.applicationCounts.data[resource._id!] || 0;
            console.log(`✅ VendorResources: Resource ${resource._id} has ${count} applications`);
            return {
              ...resource,
              applicationCount: count
            };
          });
        } else {
          console.warn('⚠️ VendorResources: Application counts response not successful or no data');
          // Set default application counts to 0
          this.resources = this.resources.map(resource => ({
            ...resource,
            applicationCount: 0
          }));
        }
        
        // Update resources with matching requirements counts
        if (results.matchingRequirementsCounts.success && results.matchingRequirementsCounts.data) {
          console.log('✅ VendorResources: Processing matching requirements counts data:', results.matchingRequirementsCounts.data);
          
          // Handle array response format as shown in your example
          if (Array.isArray(results.matchingRequirementsCounts.data)) {
            this.resources = this.resources.map(resource => {
              const matchingData = results.matchingRequirementsCounts.data.find((item: any) => item.resourceId === resource._id);
              const count = matchingData ? matchingData.count : 0;
              console.log(`✅ VendorResources: Resource ${resource._id} has ${count} matching requirements`);
              return {
                ...resource,
                matchingCount: count
              };
            });
          } else if (typeof results.matchingRequirementsCounts.data === 'object') {
            // Fallback for object format
            const countsMap: { [key: string]: number } = {};
            Object.keys(results.matchingRequirementsCounts.data).forEach(resourceId => {
              countsMap[resourceId] = results.matchingRequirementsCounts.data[resourceId];
              console.log(`✅ VendorResources: Resource ${resourceId} has ${countsMap[resourceId]} matching requirements`);
            });
            
            this.resources = this.resources.map(resource => {
              const count = countsMap[resource._id!] || 0;
              console.log(`✅ VendorResources: Resource ${resource._id} has ${count} matching requirements`);
              return {
                ...resource,
                matchingCount: count
              };
            });
          }
        } else {
          console.warn('⚠️ VendorResources: Matching requirements counts response not successful or no data');
          // Set default matching counts to 0
          this.resources = this.resources.map(resource => ({
            ...resource,
            matchingCount: 0
          }));
        }
        
        console.log('✅ VendorResources: Resources updated with counts:', this.resources);
        this.refreshGridData();
      },
      error: (error) => {
        console.error('❌ VendorResources: Error loading counts:', error);
        // Set default counts to 0 on error
        this.resources = this.resources.map(resource => ({
          ...resource,
          applicationCount: 0,
          matchingCount: 0
        }));
        this.refreshGridData();
      }
    });
  }

  private refreshGridData(): void {
    if (this.agGrid && this.agGrid.api) {
      // Force AG Grid to refresh all data
      this.agGrid.api.refreshCells({ force: true });
      console.log('🔧 VendorResources: Grid data refreshed with new counts');
    } else {
      console.log('🔧 VendorResources: Grid not ready yet, will refresh when ready');
    }
  }

  onGridReady(params: any): void {
    console.log('🔧 VendorResources: Grid ready, API captured');
    console.log('🔧 VendorResources: Current resources data:', this.resources);
    
    // Set initial data if resources are already available
    if (this.resources && this.resources.length > 0) {
      console.log('🔧 VendorResources: Setting initial data in grid');
      this.refreshGridData();
    } else {
      console.log('🔧 VendorResources: No resources data available yet, will refresh when data loads');
    }
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadResources();
  }

  isResourceActive(resource: Resource): boolean {
    return resource.status?.toLowerCase() === 'active';
  }

  getToggleButtonText(resource: Resource): string {
    return this.isResourceActive(resource) ? 'Deactivate' : 'Activate';
  }

  getToggleButtonClass(resource: Resource): string {
    if (this.isResourceActive(resource)) {
      return 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:text-red-800 hover:border-red-300';
    } else {
      return 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-300';
    }
  }

  onToggleResourceStatus(resource: Resource): void {
    const newStatus = this.isResourceActive(resource) ? 'inactive' : 'active';
    
    this.vendorService.updateResourceStatus(resource._id!, newStatus).subscribe({
      next: (response) => {
        console.log('✅ VendorResources: Resource status updated:', response);
        this.loadResources(); // Reload data
      },
      error: (error) => {
        console.error('❌ VendorResources: Error updating resource status:', error);
      }
    });
  }

  getStatusClass(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'check-circle';
      case 'inactive':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  }

  formatStatus(status: string | undefined): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  getAvailabilityClass(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getAvailabilityIcon(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'check-circle';
      case 'busy':
        return 'clock';
      case 'unavailable':
        return 'x-circle';
      default:
        return 'help-circle';
    }
  }

  formatAvailability(status: string | undefined): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  onOpenResourceModal(): void {
    console.log('🔄 VendorResources: Opening resource modal');
    this.resourceToEdit = null; // Clear any existing resource to edit
    this.showResourceModal = true;
  }

  onEditResource(resource: Resource): void {
    console.log('🔄 VendorResources: Editing resource:', resource._id);
    this.resourceToEdit = resource;
    this.showResourceModal = true;
    console.log('🔄 VendorResources: Modal state after setting:', { showResourceModal: this.showResourceModal, resourceToEdit: this.resourceToEdit });
    
    // Force change detection
    setTimeout(() => {
      console.log('🔄 VendorResources: Modal state after timeout:', { showResourceModal: this.showResourceModal, resourceToEdit: this.resourceToEdit });
    }, 100);
  }

  onCloseResourceModal(): void {
    console.log('🔄 VendorResources: Closing resource modal');
    this.showResourceModal = false;
    this.resourceToEdit = null;
    // Refresh resources data after modal is closed
    this.loadResources();
  }

  trackById(index: number, item: Resource): string {
    return item._id || `resource-${index}`;
  }

  downloadAttachment(resource: Resource): void {
    console.log('🔄 VendorResources: Starting download for resource:', resource._id);
    console.log('🔄 VendorResources: Attachment data:', resource.attachment);
    
    if (!resource.attachment || !resource.attachment.fileId) {
      console.error('❌ VendorResources: No attachment found for resource:', resource._id);
      return;
    }

    console.log('🔄 VendorResources: Downloading file with ID:', resource.attachment.fileId);
    console.log('🔄 VendorResources: File name:', resource.attachment.originalName);

    this.apiService.downloadFile(resource.attachment.fileId).subscribe(
      (response: Blob) => {
        console.log('✅ VendorResources: File download successful, blob size:', response.size);
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(response);
        link.download = resource.attachment!.originalName;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ VendorResources: Download link clicked for file:', resource.attachment!.originalName);
      },
      (error) => {
        console.error('❌ VendorResources: Error downloading file:', error);
      }
    );
  }

  onApplicationCountClick(resourceId: string): void {
    console.log('🔧 VendorResources: Application count clicked for resource:', resourceId);
    // Navigate to applications page with filter
    this.router.navigate(['/vendor/applications'], { 
      queryParams: { resourceId } 
    });
  }

  onMatchingCountClick(resourceId: string): void {
    console.log('🔧 VendorResources: Matching count clicked for resource:', resourceId);
    // Navigate to matching requirements page
    this.router.navigate(['/vendor/matching-requirements'], { 
      queryParams: { resourceId } 
    });
  }
} 