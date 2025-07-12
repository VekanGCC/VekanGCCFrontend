import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Resource } from '../../../models/resource.model';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { ApiService } from '../../../services/api.service';
import { AdminSkill } from '../../../models/admin-skill.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-client-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AgGridModule, PaginationComponent],
  templateUrl: './client-resources.component.html',
  styleUrls: ['./client-resources.component.scss']
})
export class ClientResourcesComponent implements OnInit, OnDestroy {
  resources: Resource[] = [];
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

  icons = {
    search: 'assets/icons/lucide/lucide/search.svg',
    users: 'assets/icons/lucide/lucide/users.svg',
    filter: 'assets/icons/lucide/lucide/filter.svg',
    x: 'assets/icons/lucide/lucide/x.svg',
    chevronDown: 'assets/icons/lucide/lucide/chevron-down.svg',
    download: 'assets/icons/lucide/lucide/download.svg'
  };

  showFilters = false;
  showSkillsDropdown = false;
  availableSkills: AdminSkill[] = [];

  // Search and filter properties
  searchTerm = '';
  selectedSkillIds: string[] = [];
  skillLogic: 'AND' | 'OR' = 'OR';
  minExperience = '';
  maxExperience = '';
  minRate = '';
  maxRate = '';
  approvedVendorsOnly = false;

  // Experience levels for dropdown
  experienceLevels = [
    'entry',
    'junior',
    'mid',
    'senior',
    'lead',
    'principal'
  ];

  columnDefs: ColDef[] = [
    {
      headerName: 'Resource',
      field: 'name',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const resource = params.data;
        const categoryName = resource.category?.name || 'N/A';
        const truncatedName = (resource.name || 'N/A').length > 20 ? (resource.name || 'N/A').substring(0, 20) + '...' : (resource.name || 'N/A');
        const truncatedCategory = categoryName.length > 30 ? categoryName.substring(0, 30) + '...' : categoryName;

        return `
          <div class="flex items-center justify-start text-left w-full min-w-0">
            <div class="min-w-0 flex-1 overflow-hidden">
              <div class="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline resource-link"
                   title="${resource.name || 'N/A'}"
                   data-resource-id="${resource._id}">
                ${truncatedName}
              </div>
              <div class="text-xs text-gray-500 truncate" title="${categoryName}">${truncatedCategory}</div>
            </div>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        const id = target?.getAttribute('data-resource-id');
        if (id) {
          // Use window object to get component reference
          const component = (window as any).clientResourcesComponent;
          if (component) {
            component.onNavigateToResource(id);
          }
        }
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
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
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
      headerName: 'Location',
      field: 'location.city',
      flex: 1.5,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const location = params.data.location;
        if (!location) return '<span class="text-sm text-gray-500">N/A</span>';
        
        const city = location.city || 'N/A';
        const state = location.state || 'N/A';
        const remote = location.remote;
        
        let html = `<div class="flex flex-col"><span class="text-sm text-gray-900">${city}, ${state}</span>`;
        if (remote) {
          html += `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full w-fit">Remote</span>`;
        }
        html += '</div>';
        return html;
      }
    },
    {
      headerName: 'Availability',
      field: 'availability.status',
      flex: 1.5,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const availability = params.data.availability || {};
        const status = availability.status || 'Unknown';
        const hours = availability.hours_per_week || 0;
        const statusClass = this.getAvailabilityClass(status);
        return `
          <div>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}">${status}</span>
            <div class="text-xs text-gray-500 mt-1">${hours} hrs/week</div>
          </div>
        `;
      }
    },
    {
      headerName: 'Rate',
      field: 'rate.hourly',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
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
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const button = document.createElement('button');
        button.className = 'inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
        button.textContent = 'Apply';
        button.id = `apply-${params.data._id}`;
        
        // Add click event listener
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          this.onApplyResource(params.data._id);
        });
        
        return button;
      }
    }
  ];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true
  };

  gridOptions: any = {
    suppressRowClickSelection: true,
    suppressCellFocus: true,
    rowHeight: 70
  };

  constructor(
    private changeDetectorRef: ChangeDetectorRef, 
    private apiService: ApiService,
    private router: Router
  ) {}

  Math = Math;

  ngOnInit(): void {
    this.loadAvailableSkills();
    this.loadResources();
    this.setupClickOutsideHandler();
    
    // Set component reference for AG Grid
    (window as any).clientResourcesComponent = this;
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside);
    
    // Clean up component reference
    delete (window as any).clientResourcesComponent;
  }

  private handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.skills-dropdown-container')) {
      this.showSkillsDropdown = false;
      this.changeDetectorRef.detectChanges();
    }
  };

  private setupClickOutsideHandler(): void {
    document.addEventListener('click', this.handleClickOutside);
  }

  private loadAvailableSkills(): void {
    this.apiService.getActiveSkills().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableSkills = response.data;
        }
      },
      error: (error) => {
        // Handle error silently or show user-friendly message
      }
    });
  }

  private loadResources(): void {
    this.isLoading = true;
    this.paginationState.isLoading = true;

    const params: any = {
      page: this.paginationState.currentPage,
      limit: this.paginationState.pageSize,
      status: 'active' // Only show active resources
    };

    // Add search term
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    // Add skill filters
    if (this.selectedSkillIds.length > 0) {
      params.skills = this.selectedSkillIds;
      params.skillLogic = this.skillLogic;
    }

    // Add experience filters
    if (this.minExperience) {
      params.minExperience = this.minExperience;
    }
    if (this.maxExperience) {
      params.maxExperience = this.maxExperience;
    }

    // Add rate filters
    if (this.minRate) {
      params.minRate = this.minRate;
    }
    if (this.maxRate) {
      params.maxRate = this.maxRate;
    }

    // Add approved vendors filter
    if (this.approvedVendorsOnly) {
      params.approvedVendorsOnly = true;
    }

    this.apiService.getResources(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.resources = response.data;
          
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
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.resources = [];
        this.isLoading = false;
        this.paginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.paginationState.currentPage = 1;
    this.loadResources();
  }

  onSkillsChange(): void {
    this.paginationState.currentPage = 1;
    this.loadResources();
  }

  onExperienceChange(): void {
    this.paginationState.currentPage = 1;
    this.loadResources();
  }

  onRateChange(): void {
    this.paginationState.currentPage = 1;
    this.loadResources();
  }

  onApprovedVendorsChange(): void {
    this.paginationState.currentPage = 1;
    this.loadResources();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    this.changeDetectorRef.detectChanges();
  }

  toggleSkillsDropdown(): void {
    this.showSkillsDropdown = !this.showSkillsDropdown;
    this.changeDetectorRef.detectChanges();
  }

  toggleSkill(skillId: string): void {
    const index = this.selectedSkillIds.indexOf(skillId);
    if (index > -1) {
      this.selectedSkillIds.splice(index, 1);
    } else {
      this.selectedSkillIds.push(skillId);
    }
    this.onSkillsChange();
  }

  isSkillSelected(skillId: string): boolean {
    return this.selectedSkillIds.includes(skillId);
  }

  isAllSkillsSelected(): boolean {
    return this.availableSkills.length > 0 && this.selectedSkillIds.length === this.availableSkills.length;
  }

  toggleAllSkills(): void {
    if (this.isAllSkillsSelected()) {
      this.selectedSkillIds = [];
    } else {
      this.selectedSkillIds = this.availableSkills.map(skill => skill._id);
    }
    this.onSkillsChange();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedSkillIds = [];
    this.minExperience = '';
    this.maxExperience = '';
    this.minRate = '';
    this.maxRate = '';
    this.approvedVendorsOnly = false;
    this.paginationState.currentPage = 1;
    this.loadResources();
  }

  removeSearchTerm(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  removeSkill(skillId: string): void {
    this.selectedSkillIds = this.selectedSkillIds.filter(id => id !== skillId);
    this.onSkillsChange();
  }

  removeExperienceFilter(): void {
    this.minExperience = '';
    this.maxExperience = '';
    this.onExperienceChange();
  }

  removeRateFilter(): void {
    this.minRate = '';
    this.maxRate = '';
    this.onRateChange();
  }

  removeApprovedVendorsFilter(): void {
    this.approvedVendorsOnly = false;
    this.onApprovedVendorsChange();
  }

  getSkillNameById(skillId: string): string {
    const skill = this.availableSkills.find(s => s._id === skillId);
    return skill ? skill.name : 'Unknown Skill';
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedSkillIds.length > 0 ||
      this.minExperience ||
      this.maxExperience ||
      this.minRate ||
      this.maxRate ||
      this.approvedVendorsOnly
    );
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel.length > 0) {
      const sort = sortModel[0];
      // You can implement sorting logic here if needed
    }
  }

  onApplyResource(resourceId: string): void {
    // Navigate to apply resources page with the selected resource
    this.router.navigate(['/client/apply-resources'], { 
      queryParams: { resourceIds: resourceId } 
    });
  }

  downloadResourceAttachment(attachment: any): void {
    if (attachment && attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.filename || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  getAvailabilityClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'partially_available':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      case 'contract_ending_soon':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  trackById(index: number, item: Resource): string {
    return item._id || `item-${index}`;
  }

  onGridReady(params: any): void {
    // Grid is ready
  }

  onCellClicked(params: any): void {
    if (params.column.colId === 'actions') {
      // Handle action column clicks
      return;
    }
    
    // Handle other column clicks if needed
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadResources();
  }

  onNavigateToResource(resourceId: string): void {
    this.router.navigate(['/client/resources', resourceId])
      .then(() => {
        // Navigation successful
      })
      .catch(error => {
        // Handle navigation error
      });
  }
}