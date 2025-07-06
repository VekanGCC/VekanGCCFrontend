import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Requirement } from '../../../models/requirement.model';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { ClientService } from '../../../services/client.service';
import { ApiService } from '../../../services/api.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RequirementModalComponent } from '../../modals/requirement-modal/requirement-modal.component';

@Component({
  selector: 'app-client-requirements',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule, PaginationComponent, RequirementModalComponent],
  templateUrl: './client-requirements.component.html',
  styleUrls: ['./client-requirements.component.scss']
})
export class ClientRequirementsComponent implements OnInit, OnDestroy {
  requirements: Requirement[] = [];
  isLoading = false;
  showRequirementModal = false;
  requirementToEdit: Requirement | null = null;
  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  columnDefs: ColDef[] = [
    {
      headerName: 'Title',
      field: 'title',
      flex: 1,
      minWidth: 150,
      maxWidth: 250,
      cellStyle: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        overflow: 'hidden'
      },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const requirement = params.data;
        const title = requirement.title || 'No Title';
        const description = requirement.description || 'No Description';
        
        // Truncate title after 20 characters
        const truncatedTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;
        // Truncate description after 20 characters
        const truncatedDescription = description.length > 20 ? description.substring(0, 20) + '...' : description;
        
        return `
          <div class="flex items-center justify-start text-left w-full min-w-0">
            <div class="min-w-0 flex-1 overflow-hidden">
              <div class="text-sm font-medium text-gray-900" title="${title}">${truncatedTitle}</div>
              <div class="text-xs text-gray-500" title="${description}">${truncatedDescription}</div>
            </div>
          </div>
        `;
      }
    },
    {
      headerName: 'Skills',
      field: 'skills',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      valueGetter: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) return '';
        
        // Handle both populated objects and ObjectIds
        const firstSkill = skills[0];
        if (typeof firstSkill === 'object' && firstSkill.name) {
          return firstSkill.name;
        } else if (typeof firstSkill === 'string') {
          return firstSkill; // Return ObjectId as fallback
        }
        return '';
      },
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) return '<span class="text-xs text-gray-500 italic">None</span>';
        
        const displaySkills = skills.slice(0, 2);
        const remainingCount = skills.length - 2;
        
        let html = '<div class="flex flex-wrap gap-1 justify-start">';
        displaySkills.forEach((skill: any) => {
          let skillName = 'Unknown';
          
          // Handle both populated objects and ObjectIds
          if (typeof skill === 'object' && skill.name) {
            skillName = skill.name;
          } else if (typeof skill === 'string') {
            skillName = skill; // Use ObjectId as fallback
          }
          
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
      headerName: 'Category',
      field: 'category',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        let categoryName = 'N/A';
        
        // Handle both populated objects and ObjectIds
        if (typeof params.data.category === 'object' && params.data.category.name) {
          categoryName = params.data.category.name;
        } else if (typeof params.data.category === 'string') {
          categoryName = params.data.category; // Use ObjectId as fallback
        }
        
        return `<span class="text-sm text-gray-900">${categoryName}</span>`;
      }
    },
    {
      headerName: 'Experience',
      field: 'experience.minYears',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const experience = params.data.experience || {};
        return `
          <div class="text-left">
            <div class="text-sm text-gray-900">${experience.minYears || 0} years</div>
            <div class="text-xs text-gray-500">${experience.level || 'Not specified'}</div>
          </div>
        `;
      }
    },
    {
      headerName: 'Location',
      field: 'location.city',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const location = params.data.location;
        if (!location) return '<span class="text-sm text-gray-500">N/A</span>';
        
        const city = location.city || 'N/A';
        const state = location.state || 'N/A';
        const remote = location.remote;
        
        let html = `<div class="flex flex-col items-start text-left">`;
        html += `<span class="text-sm text-gray-900">${city}, ${state}</span>`;
        if (remote) {
          html += `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full w-fit">Remote</span>`;
        }
        html += `</div>`;
        return html;
      }
    },
    {
      headerName: 'Status',
      field: 'status',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const status = params.data.status || 'unknown';
        const statusClass = this.getStatusClass(status);
        return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${status}</span>`;
      }
    },
    {
      headerName: 'Applications',
      field: 'applicationCount',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const count = params.data.applicationCount || 0;
        const countClass = count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600';
        const cursorClass = count > 0 ? 'cursor-pointer hover:bg-blue-200' : 'cursor-default';
        
        const button = document.createElement('button');
        button.className = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass} ${cursorClass} transition-colors`;
        button.innerHTML = `${count}`;
        button.id = `app-count-${params.data._id}`;
        button.title = count > 0 ? `View ${count} application(s) for this requirement` : 'No applications';
        
        // Add click event listener if there are applications
        if (count > 0) {
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.onViewApplications(params.data._id);
          });
        }
        
        return button;
      }
    },
    {
      headerName: 'Matching Resources',
      field: 'matchingResourcesCount',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const count = params.data.matchingResourcesCount || 0;
        const countClass = count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
        const cursorClass = count > 0 ? 'cursor-pointer hover:bg-green-200' : 'cursor-default';
        
        const button = document.createElement('button');
        button.className = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${countClass} ${cursorClass} transition-colors`;
        button.innerHTML = `${count}`;
        button.id = `resource-count-${params.data._id}`;
        button.title = count > 0 ? `View ${count} matching resource(s) for this requirement` : 'No matching resources';
        
        // Add click event listener if there are matching resources
        if (count > 0) {
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.onViewMatchingResources(params.data._id);
          });
        }
        
        return button;
      }
    },
    {
      headerName: 'Posted',
      field: 'createdAt',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const date = new Date(params.value);
        return `<span class="text-sm text-gray-500">${date.toLocaleDateString()}</span>`;
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
        const requirement = params.data;
        const attachment = requirement.attachment;
        
        if (!attachment || !attachment.originalName) {
          return '<span class="text-xs text-gray-500 italic">No file</span>';
        }
        
        const button = document.createElement('button');
        button.className = 'download-btn p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors';
        button.innerHTML = `
          <img src="assets/icons/lucide/lucide/file-text.svg" class="w-4 h-4" alt="file">
        `;
        button.id = `download-${requirement._id}`;
        button.title = `Download ${attachment.originalName}`;
        
        // Add click event listener
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          this.downloadAttachment(requirement);
        });
        
        return button;
      }
    },
    {
      headerName: 'Actions',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const requirement = params.data;
        let html = '<div class="flex space-x-2 justify-start">';
        
        if (['open', 'in_progress', 'on_hold', 'draft'].includes(requirement.status)) {
          html += `
            <button 
              class="close-btn inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 transition-all duration-200"
              id="close-${requirement._id}">
              Close
            </button>
          `;
        }
        
        html += `
          <button 
            class="edit-btn inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 transition-all duration-200"
            id="edit-${requirement._id}">
            Edit
          </button>
        `;
        
        html += '</div>';
        
        // Add event listeners after rendering
        setTimeout(() => {
          const closeBtn = document.getElementById(`close-${requirement._id}`);
          const editBtn = document.getElementById(`edit-${requirement._id}`);
          
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              console.log('🔍 DEBUG: Close button clicked for requirement:', requirement._id);
              this.onOpenCloseRequirementModal(requirement);
              // Force change detection to ensure modal opens immediately
              this.changeDetectorRef.detectChanges();
            });
          }
          
          if (editBtn) {
            editBtn.addEventListener('click', () => {
              this.onOpenEditRequirementModal(requirement);
              // Force change detection to ensure modal opens immediately
              this.changeDetectorRef.detectChanges();
            });
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
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🔧 ClientRequirementsComponent: ngOnInit called');
    this.loadRequirements();
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions if needed
  }

  private loadRequirements(): void {
    console.log('🔄 ClientRequirements: Loading requirements...');
    this.isLoading = true;
    this.paginationState.isLoading = true;

    const params: any = {
      page: this.paginationState.currentPage,
      limit: this.paginationState.pageSize
    };

    this.clientService.getRequirements(params).subscribe({
      next: (response) => {
        console.log('✅ ClientRequirements: Requirements loaded:', response);
        if (response.success && response.data) {
          this.requirements = response.data;
          
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
          
          // Load counts for the requirements
          this.loadRequirementsWithCounts();
        }
        this.isLoading = false;
        this.paginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('❌ ClientRequirements: Error loading requirements:', error);
        this.requirements = [];
        this.isLoading = false;
        this.paginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private loadRequirementsWithCounts(): void {
    console.log('🔄 ClientRequirements: Loading counts for requirements...');
    
    if (this.requirements.length === 0) {
      console.log('🔄 ClientRequirements: No requirements to load counts for');
      return;
    }

    const requirementIds = this.requirements.map(req => req._id);
    
    // Use forkJoin to load both application counts and matching resources counts in parallel
    const requests = {
      applicationCounts: this.clientService.getApplicationCountsForRequirements(requirementIds).pipe(
        catchError(error => {
          console.error('❌ ClientRequirements: Error loading application counts:', error);
          return of({ success: false, data: {} });
        })
      ),
      matchingResourcesCounts: this.clientService.getMatchingResourcesCountsForRequirements(requirementIds).pipe(
        catchError(error => {
          console.error('❌ ClientRequirements: Error loading matching resources counts:', error);
          return of({ success: false, data: {} });
        })
      )
    };

    forkJoin(requests).subscribe({
      next: (results) => {
        console.log('✅ ClientRequirements: Counts loaded:', results);
        
        // Update requirements with application counts
        if (results.applicationCounts.success && results.applicationCounts.data) {
          this.requirements = this.requirements.map(req => ({
            ...req,
            applicationCount: results.applicationCounts.data[req._id] || 0
          }));
        }
        
        // Update requirements with matching resources counts
        if (results.matchingResourcesCounts.success && results.matchingResourcesCounts.data) {
          this.requirements = this.requirements.map(req => ({
            ...req,
            matchingResourcesCount: results.matchingResourcesCounts.data[req._id] || 0
          }));
        }
        
        console.log('✅ ClientRequirements: Requirements updated with counts:', this.requirements);
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('❌ ClientRequirements: Error loading counts:', error);
      }
    });
  }

  onPageChange(page: number): void {
    console.log('🔄 ClientRequirements: Page changed to:', page);
    this.paginationState.currentPage = page;
    this.loadRequirements();
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('🔄 ClientRequirements: Sort changed:', sort);
      // You can implement sorting logic here if needed
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onOpenRequirementModal(): void {
    console.log('🔄 ClientRequirements: Opening new requirement modal');
    this.requirementToEdit = null; // Clear any existing requirement to edit
    this.showRequirementModal = true;
  }

  onOpenCloseRequirementModal(requirement: Requirement): void {
    console.log('🔄 ClientRequirements: Opening close requirement modal for:', requirement._id);
    this.requirementToEdit = requirement;
    this.showRequirementModal = true;
  }

  onOpenEditRequirementModal(requirement: Requirement): void {
    console.log('🔄 ClientRequirements: Opening edit requirement modal for:', requirement._id);
    this.requirementToEdit = requirement;
    this.showRequirementModal = true;
  }

  onCloseRequirementModal(): void {
    console.log('🔄 ClientRequirements: Closing requirement modal');
    this.showRequirementModal = false;
    this.requirementToEdit = null;
    // Refresh requirements data after modal is closed
    this.loadRequirements();
  }

  onRequirementCreated(requirement: Requirement): void {
    console.log('🔄 ClientRequirements: New requirement created:', requirement);
    
    // Make API call to create the requirement
    this.clientService.createRequirement(requirement).subscribe({
      next: (response) => {
        console.log('✅ ClientRequirements: Requirement created successfully:', response);
        if (response.success) {
          // Refresh the requirements list to show new data
          this.loadRequirements();
        } else {
          console.error('❌ ClientRequirements: Failed to create requirement:', response.message);
        }
        this.onCloseRequirementModal();
      },
      error: (error) => {
        console.error('❌ ClientRequirements: Error creating requirement:', error);
        this.onCloseRequirementModal();
      }
    });
  }

  onRequirementUpdated(requirement: Requirement): void {
    console.log('🔄 ClientRequirements: Requirement updated:', requirement);
    
    // Make API call to update the requirement
    this.clientService.updateRequirement(requirement._id, requirement).subscribe({
      next: (response) => {
        console.log('✅ ClientRequirements: Requirement updated successfully:', response);
        if (response.success) {
          // Refresh the requirements list to show updated data
          this.loadRequirements();
        } else {
          console.error('❌ ClientRequirements: Failed to update requirement:', response.message);
        }
        this.onCloseRequirementModal();
      },
      error: (error) => {
        console.error('❌ ClientRequirements: Error updating requirement:', error);
        this.onCloseRequirementModal();
      }
    });
  }

  onViewApplications(requirementId: string): void {
    console.log('🔄 ClientRequirements: Viewing applications for requirement:', requirementId);
    // Navigate to applications page with filter
    this.router.navigate(['/client/applications'], { 
      queryParams: { requirementId } 
    });
  }

  onViewMatchingResources(requirementId: string): void {
    console.log('🔄 ClientRequirements: Viewing matching resources for requirement:', requirementId);
    // Navigate to matching resources page
    this.router.navigate(['/client/matching-resources'], { 
      queryParams: { requirementId } 
    });
  }

  downloadAttachment(requirement: Requirement): void {
    console.log('🔄 ClientRequirements: Downloading attachment for requirement:', requirement._id);
    
    if (!requirement.attachment || !requirement.attachment.fileId) {
      console.error('🔄 ClientRequirements: No file ID found for download');
      return;
    }

    // Use the API service to download the file
    this.apiService.downloadFile(requirement.attachment.fileId).subscribe({
      next: (response: Blob) => {
        console.log('🔄 ClientRequirements: File download successful');
        
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(response);
        link.download = requirement.attachment!.originalName || 'download';
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(link.href);
      },
      error: (error: any) => {
        console.error('🔄 ClientRequirements: File download error:', error);
        // Handle download error - could show a toast notification here
      }
    });
  }
} 