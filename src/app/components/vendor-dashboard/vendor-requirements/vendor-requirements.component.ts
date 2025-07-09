// AG Grid Module Registration
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Angular
import { Component, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef, ValueGetterParams, SortChangedEvent } from 'ag-grid-community';
import { Router } from '@angular/router';
import { Requirement } from '../../../models/requirement.model';
import { PaginationState, PaginationParams } from '../../../models/pagination.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { ApiService } from '../../../services/api.service';
import { AdminSkill } from '../../../models/admin-skill.model';


@Component({
  selector: 'app-vendor-requirements',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AgGridModule, PaginationComponent],
  templateUrl: './vendor-requirements.component.html',
  styleUrls: ['./vendor-requirements.component.scss']
})
export class VendorRequirementsComponent implements OnInit, OnChanges, OnDestroy {
  requirements: Requirement[] = [];
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
  resourceFilter: string = '';

  icons = {
    search: 'assets/icons/lucide/lucide/search.svg',
    filter: 'assets/icons/lucide/lucide/filter.svg',
    x: 'assets/icons/lucide/lucide/x.svg',
    chevronDown: 'assets/icons/lucide/lucide/chevron-down.svg'
  };

  showFilters = false;
  showSkillsDropdown = false;
  availableSkills: AdminSkill[] = [];

  // Search and filter properties
  searchTerm = '';
  selectedSkillIds: string[] = [];
  skillLogic: 'AND' | 'OR' = 'OR';
  minBudget = '';
  maxBudget = '';
  minDuration = '';
  maxDuration = '';

  // AG Grid properties
  columnDefs: ColDef[] = [
    {
      headerName: 'Opportunity',
      field: 'title',
      flex: 2,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const requirement = params.data;
        const title = requirement.title || 'No Title';
        const description = requirement.description || 'No Description';
        const truncatedTitle = title.length > 20 ? title.substring(0, 20) + '...' : title;

        return `
          <div class="flex items-center justify-start text-left w-full min-w-0">
            <div class="min-w-0 flex-1 overflow-hidden">
              <div class="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline requirement-link"
                   title="${title}"
                   data-requirement-id="${requirement._id}">
                ${truncatedTitle}
              </div>
              <div class="text-xs text-gray-500 truncate" title="${description}">${description}</div>
            </div>
          </div>
        `;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        const id = target?.getAttribute('data-requirement-id');
        if (id) {
          // Use window object to get component reference
          const component = (window as any).vendorRequirementsComponent;
          if (component) {
            component.onNavigateToRequirement(id);
          }
        }
      }
    },
    {
      headerName: 'Skills', 
      field: 'skills', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      valueGetter: (params: any) => {
        const skills = params.data.skills || [];
        return skills.length > 0 ? skills[0].name : '';
      },
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        if (skills.length === 0) {
          return '<span class="text-xs text-gray-500 italic">None</span>';
        }

        const displaySkills = skills.slice(0, 2); // Show only first 2
        const remainingCount = skills.length - 2;

        let html = '<div class="flex flex-wrap gap-1 items-center">';
        displaySkills.forEach((skill: any) => {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">${skill.name}</span>`;
        });

        if (remainingCount > 0) {
          html += `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">+${remainingCount}</span>`;
        }

        html += '</div>';
        return html;
      }
    },
    { 
      headerName: 'Budget', 
      field: 'budget.charge', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const budgetDisplay = this.getBudgetDisplay(params.data);
        return `<span class="text-sm text-gray-900">${budgetDisplay}</span>`;
      }
    },
    { 
      headerName: 'Duration', 
      field: 'duration', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const duration = this.getDurationDisplay(params.data);
        return `<div class="text-sm text-gray-900">${duration}</div>`;
      }
    },
    { 
      headerName: 'Location', 
      field: 'location.city', 
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const location = this.getLocationDisplay(params.data);
        const isRemote = params.data.location?.remote;
        
        let html = `<div class="flex flex-col items-start text-left">`;
        html += `<span class="text-sm text-gray-900">${location}</span>`;
        if (isRemote) {
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
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const status = params.data.status || 'unknown';
        return `
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ${status}
          </span>
        `;
      }
    },
    {
      headerName: 'Actions',
      field: 'actions',
      flex: 1,
      sortable: false,
      filter: false,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      cellRenderer: (params: any) => {
        const requirement = params.data;
        
        const html = `
          <div class="flex justify-start">
            <button 
              class="apply-btn inline-flex items-center px-2 py-1 rounded-md text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 hover:bg-blue-100 transition-all duration-200"
              id="apply-${requirement._id}">
              <span class="mr-1">📋</span>
              Apply
            </button>
          </div>
        `;
        
        // Add event listeners after rendering
        setTimeout(() => {
          const applyBtn = document.getElementById(`apply-${requirement._id}`);
          
          if (applyBtn) {
            applyBtn.addEventListener('click', () => this.onApplyRequirement(requirement._id));
          }
        }, 100);
        
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
    private changeDetectorRef: ChangeDetectorRef,
    private apiService: ApiService,
    private router: Router
  ) {
    this.setupClickOutsideHandler();
  }

  ngOnInit(): void {
    console.log('🔧 VendorRequirementsComponent: ngOnInit called');
    this.loadAvailableSkills();
    this.loadRequirements();
    
    // Set component reference for AG Grid
    (window as any).vendorRequirementsComponent = this;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // This will be called whenever the properties change
    console.log('🔧 VendorRequirements: Requirements data changed:', this.requirements);
  }

  ngOnDestroy(): void {
    console.log('🔄 VendorRequirements: Component being destroyed');
    document.removeEventListener('click', this.handleClickOutside);
    
    // Clean up component reference
    delete (window as any).vendorRequirementsComponent;
  }

  private handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.skills-dropdown')) {
      this.showSkillsDropdown = false;
      this.changeDetectorRef.detectChanges();
    }
  };

  private setupClickOutsideHandler(): void {
    document.addEventListener('click', this.handleClickOutside);
  }

  private loadAvailableSkills(): void {
    console.log('🔧 VendorRequirements: Loading available skills...');
    this.apiService.getActiveSkills().subscribe({
      next: (response) => {
        console.log('✅ VendorRequirements: Skills loaded:', response);
        this.availableSkills = response.data || [];
      },
      error: (error) => {
        console.error('❌ VendorRequirements: Error loading skills:', error);
      }
    });
  }

  loadRequirements(): void {
    console.log('🔄 VendorRequirements: Loading requirements...');
    this.isLoading = true;
    this.paginationState.isLoading = true;

    const params: PaginationParams = {
      page: this.paginationState.currentPage,
      limit: this.paginationState.pageSize,
      search: this.searchTerm || undefined,
      status: 'active', // Only show active requirements
      skills: this.selectedSkillIds.length > 0 ? this.selectedSkillIds : undefined,
      skillLogic: this.selectedSkillIds.length > 0 ? this.skillLogic : undefined,
      minBudget: this.minBudget || undefined,
      maxBudget: this.maxBudget || undefined,
      minDuration: this.minDuration || undefined,
      maxDuration: this.maxDuration || undefined
    };

    this.apiService.getRequirements(params).subscribe({
      next: (response) => {
        console.log('✅ VendorRequirements: Requirements loaded successfully:', response);
        this.requirements = response.data || [];
        this.paginationState = {
          ...this.paginationState,
          totalItems: response.meta?.total || response.pagination?.total || 0,
          totalPages: response.meta?.totalPages || response.pagination?.totalPages || 0,
          hasNextPage: (response.meta?.page || response.pagination?.page || 1) < (response.meta?.totalPages || response.pagination?.totalPages || 1),
          hasPreviousPage: (response.meta?.page || response.pagination?.page || 1) > 1,
          isLoading: false
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ VendorRequirements: Error loading requirements:', error);
        this.isLoading = false;
        this.paginationState.isLoading = false;
      }
    });
  }

  onSearchChange(): void {
    this.paginationState.currentPage = 1;
    this.emitSearchChange();
  }

  onSkillsChange(): void {
    this.paginationState.currentPage = 1;
    this.emitSearchChange();
  }

  onBudgetChange(): void {
    this.paginationState.currentPage = 1;
    this.emitSearchChange();
  }

  onDurationChange(): void {
    this.paginationState.currentPage = 1;
    this.emitSearchChange();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleSkillsDropdown(): void {
    this.showSkillsDropdown = !this.showSkillsDropdown;
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
    this.minBudget = '';
    this.maxBudget = '';
    this.minDuration = '';
    this.maxDuration = '';
    this.paginationState.currentPage = 1;
    this.loadRequirements();
  }

  removeSearchTerm(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  removeSkill(skillId: string): void {
    this.selectedSkillIds = this.selectedSkillIds.filter(id => id !== skillId);
    this.onSkillsChange();
  }

  removeBudgetFilter(): void {
    this.minBudget = '';
    this.maxBudget = '';
    this.onBudgetChange();
  }

  removeDurationFilter(): void {
    this.minDuration = '';
    this.maxDuration = '';
    this.onDurationChange();
  }

  private emitSearchChange(): void {
    console.log('🔧 VendorRequirements: Emitting search change with filters:', {
      searchTerm: this.searchTerm,
      selectedSkillIds: this.selectedSkillIds,
      skillLogic: this.skillLogic,
      minBudget: this.minBudget,
      maxBudget: this.maxBudget,
      minDuration: this.minDuration,
      maxDuration: this.maxDuration
    });
    
    this.loadRequirements();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchTerm ||
      this.selectedSkillIds.length > 0 ||
      this.minBudget ||
      this.maxBudget ||
      this.minDuration ||
      this.maxDuration
    );
  }

  onSortChanged(event: SortChangedEvent): void {
    const sortModel = event.api.getColumnState().filter(col => col.sort);
    if (sortModel.length > 0) {
      const sort = sortModel[0];
      console.log('🔧 VendorRequirements: Sort changed:', sort);
      // TODO: Implement sorting logic
    }
  }

  getBudgetDisplay(req: Requirement): string {
    if (!req.budget) return 'Not specified';
    
    const { charge, currency = 'USD', type = 'hourly' } = req.budget;
    
    if (!charge) return 'Not specified';
    
    if (type === 'hourly') {
      return `$${charge}/${currency}/hr`;
    } else if (type === 'fixed') {
      return `$${charge} ${currency}`;
    } else {
      return `$${charge} ${currency}`;
    }
  }

  getDurationDisplay(req: Requirement): string {
    if (!req.duration) return 'Not specified';
    return `${req.duration} months`;
  }

  getLocationDisplay(req: Requirement): string {
    if (!req.location) return 'Not specified';
    
    const { city, state, country } = req.location;
    const parts = [city, state, country].filter(Boolean);
    
    if (parts.length === 0) return 'Not specified';
    
    return parts.join(', ');
  }

  onApplyRequirement(requirementId: string): void {
   
    console.log('🔧 VendorRequirements: Applying to requirement:', requirementId);
    console.log('🔧 VendorRequirements: Current URL before navigation:', this.router.url);
    
    // Navigate to apply-requirement-page route with requirementId as query parameter
    const targetUrl = `/vendor/apply-requirement-page?requirementId=${requirementId}`;
    console.log('🔧 VendorRequirements: Target URL:', targetUrl);
    
   
    this.router.navigate(['/vendor/apply-requirement-page'], { 
      queryParams: { requirementId: requirementId } 
    }).then(() => {
    
      console.log('🔧 VendorRequirements: Navigation completed to apply-requirement-page');
      console.log('🔧 VendorRequirements: Final URL after navigation:', this.router.url);
    }).catch(error => {
     
      console.error('🔧 VendorRequirements: Navigation error:', error);
      console.error('🔧 VendorRequirements: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    });
  }

  onNavigateToRequirement(requirementId: string): void {
    this.router.navigate(['/vendor/requirements', requirementId])
      .then(() => console.log('✅ Navigated to requirement details:', this.router.url))
      .catch(error => console.error('❌ Navigation error:', error));
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadRequirements();
  }

  trackById(index: number, item: Requirement): string {
    return item._id || `requirement-${index}`;
  }

  trackBySkill(index: number, skill: string): string {
    return skill;
  }

  getSkillNameById(skillId: string): string {
    const skill = this.availableSkills.find(s => s._id === skillId);
    return skill ? skill.name : 'Unknown Skill';
  }


} 