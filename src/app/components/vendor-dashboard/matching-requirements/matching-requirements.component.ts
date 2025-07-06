import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { VendorService } from '../../../services/vendor.service';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { Router, ActivatedRoute } from '@angular/router';

// Interfaces for API response data
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
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    organizationName: string;
  };
  matchPercentage: number;
  matchingSkills: number;
  totalRequiredSkills: number;
}

interface MatchingRequirementsResponse {
  resource: {
    _id: string;
    name: string;
    description: string;
    category?: {
      _id: string;
      name: string;
    };
    skills?: Array<{
      _id: string;
      name: string;
    }>;
    experience?: {
      years: number;
      level: string;
    };
    rate?: {
      hourly: number;
      currency: string;
    };
  };
  matchingRequirements: MatchingRequirement[];
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
  selector: 'app-matching-requirements',
  standalone: true,
  imports: [CommonModule, AgGridModule, PaginationComponent],
  templateUrl: './matching-requirements.component.html',
  styleUrls: ['./matching-requirements.component.scss']
})
export class MatchingRequirementsComponent implements OnInit, OnDestroy {
  resourceId: string = '';

  isLoading = false;
  resource: any = null;
  matchingRequirements: MatchingRequirement[] = [];
  totalCount = 0;
  matchingCriteria: any = null;

  // AG Grid configuration
  columnDefs: ColDef<MatchingRequirement>[] = [
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
      headerName: 'Requirement Title',
      field: 'title',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const title = params.data.title || '';
        const category = params.data.category?.name || 'N/A';
        return `<div class="flex items-center">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-gray-900 truncate">${title}</div>
            <div class="text-xs text-gray-500 truncate">${category}</div>
          </div>
        </div>`;
      }
    },
    {
      headerName: 'Client',
      field: 'client.organizationName',
      flex: 2,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
      sortable: true,
      filter: true,
      cellRenderer: (params: any) => {
        const client = params.data.client;
        const orgName = client?.organizationName || 'N/A';
        const contactName = client ? `${client.firstName} ${client.lastName}`.trim() : 'N/A';
        return `<div class="flex items-center">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-gray-900 truncate">${orgName}</div>
            <div class="text-xs text-gray-500 truncate">${contactName}</div>
          </div>
        </div>`;
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
      headerName: 'Budget',
      field: 'budget.charge',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const charge = params.data.budget?.charge || 0;
        const currency = params.data.budget?.currency || 'USD';
        return `<div class="text-center">
          <div class="font-medium">$${charge}/hr</div>
          <div class="text-xs text-gray-500">${currency}</div>
        </div>`;
      }
    },
    {
      headerName: 'Experience',
      field: 'experience.minYears',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const years = params.data.experience?.minYears || 0;
        const level = params.data.experience?.level || 'N/A';
        return `<div class="text-center">
          <div class="font-medium">${years} years</div>
          <div class="text-xs text-gray-500">${level}</div>
        </div>`;
      }
    },
    {
      headerName: 'Start Date',
      field: 'startDate',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const startDate = params.data.startDate;
        if (!startDate) return '<span class="text-xs text-gray-500">Not specified</span>';
        
        const date = new Date(startDate);
        return `<div class="text-center">
          <div class="text-sm">${date.toLocaleDateString()}</div>
        </div>`;
      }
    },
    {
      headerName: 'Actions',
      flex: 1,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const button = document.createElement('button');
        button.className = 'inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
        button.innerHTML = 'Apply';
        button.addEventListener('click', () => {
          this.onApplyRequirement(params.data._id);
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

  gridOptions = {
    rowHeight: 80,
    headerHeight: 50,
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

  constructor(private vendorService: VendorService, private changeDetectorRef: ChangeDetectorRef, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('🔧 MatchingRequirementsComponent: ngOnInit called');
    
    // Get resourceId from route parameters
    this.route.queryParams.subscribe(params => {
      this.resourceId = params['resourceId'] || '';
      console.log('🔧 MatchingRequirementsComponent: Resource ID from route:', this.resourceId);
      
      if (this.resourceId) {
        this.loadMatchingRequirements();
      } else {
        console.error('❌ MatchingRequirementsComponent: No resource ID provided');
        // Navigate back to resources page
        this.router.navigate(['/vendor/resources']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadMatchingRequirements(): void {
    if (!this.resourceId) return;

    console.log('🔧 MatchingRequirementsComponent: Loading matching requirements for resource:', this.resourceId, 'page:', this.paginationState.currentPage);
    this.isLoading = true;
    
    this.subscriptions.push(
      this.vendorService.getMatchingRequirementsDetails(
        this.resourceId, 
        this.paginationState.currentPage, 
        this.paginationState.pageSize
      ).subscribe({
        next: (response) => {
          console.log('🔧 MatchingRequirementsComponent: API response received:', response);
          if (response.success && response.data) {
            const data: MatchingRequirementsResponse = response.data;
            console.log('🔧 MatchingRequirementsComponent: Parsed data:', data);
            
            this.resource = data.resource;
            this.matchingRequirements = data.matchingRequirements || [];
            this.totalCount = data.totalCount || 0;
            this.matchingCriteria = data.matchingCriteria;
            
            // Update pagination state from API response
            if (data.pagination) {
              this.paginationState.currentPage = data.pagination.currentPage;
              this.paginationState.pageSize = data.pagination.pageSize;
              this.paginationState.totalPages = data.pagination.totalPages;
              this.paginationState.hasNextPage = data.pagination.hasNextPage;
              this.paginationState.hasPreviousPage = data.pagination.hasPreviousPage;
              this.paginationState.totalItems = this.totalCount;
            } else {
              // Fallback pagination calculation
              this.paginationState.totalItems = this.totalCount;
              this.paginationState.totalPages = Math.ceil(this.totalCount / this.paginationState.pageSize);
              this.paginationState.hasNextPage = this.paginationState.currentPage < this.paginationState.totalPages;
              this.paginationState.hasPreviousPage = this.paginationState.currentPage > 1;
            }
            
            console.log('🔧 MatchingRequirementsComponent: Updated component state:', {
              resource: this.resource,
              matchingRequirements: this.matchingRequirements,
              totalCount: this.totalCount,
              paginationState: this.paginationState,
              isLoading: this.isLoading
            });
            
            // Force change detection
            this.changeDetectorRef.detectChanges();
          } else {
            console.error('🔧 MatchingRequirementsComponent: API response not successful:', response);
          }
        },
        error: (error) => {
          console.error('🔧 MatchingRequirementsComponent: Error loading matching requirements:', error);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        complete: () => {
          console.log('🔧 MatchingRequirementsComponent: Loading completed, setting isLoading to false');
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      })
    );
  }

  onBackClick(): void {
    this.router.navigate(['/vendor-dashboard']);
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadMatchingRequirements();
  }

  onApplyRequirement(requirementId: string): void {
    console.log('🔄 MatchingRequirementsComponent: Applying for requirement:', requirementId);
    // TODO: Implement apply requirement logic (modal or page)
    alert(`Apply functionality for requirement ${requirementId} will be implemented soon.`);
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
} 