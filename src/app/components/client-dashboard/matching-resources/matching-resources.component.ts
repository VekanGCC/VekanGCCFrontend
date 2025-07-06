import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { ClientService } from '../../../services/client.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { ActivatedRoute, Router } from '@angular/router';

// Interfaces for API response data
interface MatchingResource {
  _id: string;
  name: string;
  description: string;
  category: {
    _id: string;
    name: string;
  };
  skills: Array<{
    _id: string;
    name: string;
  }>;
  experience: {
    years: number;
    level: string;
  };
  availability: {
    status: string;
    hours_per_week?: number;
    start_date?: string;
  };
  rate: {
    hourly: number;
    currency: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
    remote: boolean;
  };
  status: string;
  matchPercentage: number;
  matchingSkills: number;
  totalRequiredSkills: number;
  vendor?: {
    firstName: string;
    lastName: string;
    email: string;
    organizationName: string;
  };
}

interface MatchingRequirement {
  _id: string;
  title: string;
  description: string;
  category?: {
    _id: string;
    name: string;
  };
  skills?: Array<{
    _id: string;
    name: string;
  }>;
  budget?: {
    charge: number;
    currency: string;
  };
  startDate?: string;
  experience?: {
    minYears: number;
    level: string;
  };
}

interface MatchingResourcesResponse {
  requirement: MatchingRequirement;
  matchingResources: MatchingResource[];
  totalCount: number;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  matchingCriteria: {
    minSkillsToMatch: number;
    maxBudget?: number;
    requiredStartDate?: string;
    minExperienceYears?: number;
  };
}

@Component({
  selector: 'app-matching-resources',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AgGridModule, PaginationComponent],
  templateUrl: './matching-resources.component.html',
  styleUrls: ['./matching-resources.component.scss']
})
export class MatchingResourcesComponent implements OnInit, OnDestroy {
  requirementId: string = '';
  isLoading = false;
  requirement: MatchingRequirement | null = null;
  matchingResources: MatchingResource[] = [];
  totalCount = 0;
  matchingCriteria: any = null;

  // AG Grid configuration
  columnDefs: ColDef<MatchingResource>[] = [
    {
      headerName: 'Match %',
      field: 'matchPercentage',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const percentage = params.value || 0;
        let colorClass = 'text-red-600';
        if (percentage >= 80) colorClass = 'text-green-600';
        else if (percentage >= 60) colorClass = 'text-yellow-600';
        
        return `<div class="flex items-center justify-center">
          <span class="font-semibold ${colorClass}">${percentage}%</span>
        </div>`;
      }
    },
    {
      headerName: 'Resource Name',
      field: 'name',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const name = params.data.name || '';
        return `<div class="flex items-center">
          <span class="font-medium text-gray-900">${name}</span>
        </div>`;
      }
    },
    {
      headerName: 'Vendor',
      field: 'vendor.organizationName',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const vendor = params.data.vendor;
        const orgName = vendor?.organizationName || 'N/A';
        return `<span class="text-sm text-gray-600">${orgName}</span>`;
      }
    },
    {
      headerName: 'Skills',
      field: 'skills',
      flex: 3,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const skills = params.data.skills || [];
        const matchingSkills = params.data.matchingSkills || 0;
        const totalRequired = params.data.totalRequiredSkills || 0;
        
        const skillTags = skills.slice(0, 3).map((skill: any) => 
          `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">${skill.name}</span>`
        ).join('');
        
        const matchInfo = `<span class="text-xs text-gray-500 ml-2">(${matchingSkills}/${totalRequired} skills match)</span>`;
        
        return `<div class="flex flex-wrap items-center">
          ${skillTags}
          ${matchInfo}
        </div>`;
      }
    },
    {
      headerName: 'Experience',
      field: 'experience.years',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const years = params.data.experience?.years || 0;
        const level = params.data.experience?.level || 'N/A';
        return `<div class="text-center">
          <div class="font-medium">${years} years</div>
          <div class="text-xs text-gray-500">${level}</div>
        </div>`;
      }
    },
    {
      headerName: 'Rate',
      field: 'rate.hourly',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const rate = params.data.rate;
        const hourly = rate?.hourly || 0;
        const currency = rate?.currency || 'USD';
        return `<div class="text-center">
          <div class="font-medium">$${hourly}/hr</div>
          <div class="text-xs text-gray-500">${currency}</div>
        </div>`;
      }
    },
    {
      headerName: 'Location',
      field: 'location.city',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const location = params.data.location;
        const city = location?.city || 'N/A';
        const state = location?.state || '';
        const remote = location?.remote;
        
        let html = `<div class="flex flex-col items-start">`;
        html += `<span class="text-sm text-gray-900">${city}${state ? `, ${state}` : ''}</span>`;
        if (remote) {
          html += `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Remote</span>`;
        }
        html += `</div>`;
        return html;
      }
    },
    {
      headerName: 'Availability',
      field: 'availability.status',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const availability = params.data.availability;
        const status = availability?.status || 'unknown';
        const hoursPerWeek = availability?.hours_per_week;
        
        const statusClass = this.getAvailabilityStatusClass(status);
        let html = `<div class="text-center">`;
        html += `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClass}">${status}</span>`;
        if (hoursPerWeek) {
          html += `<div class="text-xs text-gray-500 mt-1">${hoursPerWeek}h/week</div>`;
        }
        html += `</div>`;
        return html;
      }
    },
    {
      headerName: 'Actions',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const resource = params.data;
        const button = document.createElement('button');
        button.className = 'inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
        button.innerHTML = 'Apply';
        button.addEventListener('click', () => {
          this.onApplyResource(resource._id);
        });
        return button;
      }
    }
  ];

  defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1,
    minWidth: 100
  };

  gridOptions = {
    pagination: false,
    rowHeight: 60,
    tooltipShowDelay: 500,
    suppressRowClickSelection: true,
    suppressCellFocus: true
  };

  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private clientService: ClientService, 
    private changeDetectorRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🔧 MatchingResourcesComponent: ngOnInit called');
    
    // Get requirementId from route parameters
    this.route.queryParams.subscribe(params => {
      this.requirementId = params['requirementId'] || '';
      console.log('🔧 MatchingResourcesComponent: Requirement ID from route:', this.requirementId);
      
      if (this.requirementId) {
        this.loadMatchingResources();
      } else {
        console.error('❌ MatchingResourcesComponent: No requirement ID provided');
        // Navigate back to requirements page
        this.router.navigate(['/client/requirements']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadMatchingResources(): void {
    console.log('🔄 MatchingResourcesComponent: Loading matching resources for requirement:', this.requirementId);
    
    if (!this.requirementId) {
      console.error('❌ MatchingResourcesComponent: No requirement ID available');
      return;
    }

    this.isLoading = true;
    this.paginationState.isLoading = true;

    const params = {
      page: this.paginationState.currentPage,
      limit: this.paginationState.pageSize
    };

    this.clientService.getMatchingResourcesDetails(this.requirementId, params.page, params.limit).subscribe({
      next: (response: any) => {
        console.log('✅ MatchingResourcesComponent: Raw API response:', response);
        
        // Handle wrapped response structure
        let data: MatchingResourcesResponse;
        if (response.success && response.data) {
          data = response.data;
        } else if (response.requirement) {
          // Direct response structure
          data = response;
        } else {
          console.error('❌ MatchingResourcesComponent: Unexpected response structure:', response);
          this.isLoading = false;
          this.paginationState.isLoading = false;
          this.changeDetectorRef.detectChanges();
          return;
        }
        
        console.log('✅ MatchingResourcesComponent: Parsed data:', data);
        
        this.requirement = data.requirement;
        this.matchingResources = data.matchingResources || [];
        this.totalCount = data.totalCount || 0;
        this.matchingCriteria = data.matchingCriteria;
        
        // Update pagination state
        if (data.pagination) {
          this.paginationState = {
            currentPage: data.pagination.currentPage,
            pageSize: data.pagination.pageSize,
            totalItems: data.totalCount,
            totalPages: data.pagination.totalPages,
            isLoading: false,
            hasNextPage: data.pagination.hasNextPage,
            hasPreviousPage: data.pagination.hasPreviousPage
          };
        } else {
          // Fallback pagination calculation
          this.paginationState.totalItems = data.totalCount;
          this.paginationState.totalPages = Math.ceil(data.totalCount / this.paginationState.pageSize);
          this.paginationState.hasNextPage = this.paginationState.currentPage < this.paginationState.totalPages;
          this.paginationState.hasPreviousPage = this.paginationState.currentPage > 1;
          this.paginationState.isLoading = false;
        }
        
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('❌ MatchingResourcesComponent: Error loading matching resources:', error);
        this.isLoading = false;
        this.paginationState.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onBackClick(): void {
    console.log('🔄 MatchingResourcesComponent: Navigating back to requirements');
    this.router.navigate(['/client/requirements']);
  }

  onPageChange(page: number): void {
    console.log('🔄 MatchingResourcesComponent: Page changed to:', page);
    this.paginationState.currentPage = page;
    this.loadMatchingResources();
  }

  getMatchPercentageColor(percentage: number): string {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  getMatchPercentageClass(percentage: number): string {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getAvailabilityStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'partially_available':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onApplyResource(resourceId: string): void {
    console.log('🔄 MatchingResourcesComponent: Applying for resource:', resourceId);
    // Navigate to apply resource page with the resource ID
    this.router.navigate(['/client/apply-resources'], { 
      queryParams: { resourceId, requirementId: this.requirementId } 
    });
  }
} 