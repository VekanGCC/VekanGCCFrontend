import { Component, OnInit, ChangeDetectorRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { AuthService } from '../../../services/auth.service';
import { VendorService } from '../../../services/vendor.service';
import { AppService } from '../../../services/app.service';
import { ApiService } from '../../../services/api.service';
import { User } from '../../../models/user.model';


@Component({
  selector: 'app-browse-requirements-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './browse-requirements-page.component.html',
  styleUrls: ['./browse-requirements-page.component.scss']
})
export class BrowseRequirementsPageComponent implements OnInit {
  currentUser: User | null = null;
  selectedResources: Resource[] = [];
  resources: Resource[] = [];
  filteredResources: Resource[] = [];
  requirement: Requirement | null = null;
  notes: string = '';
  isLoading = false;
  errorMessage = '';
  applicationResults: { success: boolean; message: string; resourceId: string; requirementId: string }[] = [];
  
  // Multi-select dropdown properties
  showResourcesDropdown = false;
  resourceSearchTerm = '';
  selectedResourceIds: string[] = [];

  @Input() selectedRequirementId: string = '';
  @Output() selectedRequirementIdChange = new EventEmitter<string>();
  @Output() navigateBack = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private vendorService: VendorService,
    private appService: AppService,
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {
    console.log('🔧 BrowseRequirementsPage: Constructor called');
  }

  ngOnInit(): void {
    console.log('🔧 BrowseRequirementsPage: Component initialized');
    this.currentUser = this.authService.getCurrentUser();
    
    // Get requirement ID from query parameters
    this.route.queryParams.subscribe(params => {
      this.selectedRequirementId = params['requirementId'] || '';
      console.log('🔧 BrowseRequirementsPage: Selected requirement ID from query params:', this.selectedRequirementId);
      this.loadRequirementFromInput();
    });
    
    this.loadResources();
  }

  private loadRequirementFromInput(): void {
    console.log('🔧 BrowseRequirementsPage: Loading requirement from input:', this.selectedRequirementId);
    
    if (!this.selectedRequirementId) {
      this.errorMessage = 'No requirement selected';
      return;
    }
    
    console.log('🔧 BrowseRequirementsPage: Loading requirement with ID:', this.selectedRequirementId);
    
    // Load requirement from API
    this.isLoading = true;
    this.apiService.getRequirement(this.selectedRequirementId).subscribe({
      next: (response: any) => {
        console.log('🔧 BrowseRequirementsPage: API response:', response);
        if (response.success && response.data) {
          this.requirement = response.data;
          console.log('🔧 BrowseRequirementsPage: Loaded requirement:', this.requirement);
        } else {
          console.error('🔧 BrowseRequirementsPage: No requirement found with ID:', this.selectedRequirementId);
          this.errorMessage = 'Requirement not found';
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error: any) => {
        console.error('🔧 BrowseRequirementsPage: Error loading requirement:', error);
        this.errorMessage = 'Failed to load requirement';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private loadResources(): void {
    console.log('🔧 Loading vendor resources...');
    this.isLoading = true;
    this.vendorService.getResources().subscribe({
      next: (response) => {
        console.log('🔧 Resources response:', response);
        if (response.success && response.data) {
          // Only show active resources
          this.resources = response.data.filter((resource: Resource) => resource.status === 'active');
          this.filteredResources = [...this.resources];
          console.log('🔧 Loaded resources:', this.resources.length);
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading resources:', error);
        this.errorMessage = 'Failed to load resources';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  // Multi-select dropdown methods
  toggleResourcesDropdown() {
    console.log('🔧 Toggle dropdown clicked, current state:', this.showResourcesDropdown);
    console.log('🔧 Available resources:', this.resources.length);
    this.showResourcesDropdown = !this.showResourcesDropdown;
    if (this.showResourcesDropdown) {
      this.filteredResources = [...this.resources];
    }
    console.log('🔧 New dropdown state:', this.showResourcesDropdown);
    this.changeDetectorRef.detectChanges();
  }

  filterResources() {
    console.log('🔧 Filtering resources, search term:', this.resourceSearchTerm);
    console.log('🔧 Total resources available:', this.resources.length);
    
    if (!this.resourceSearchTerm.trim()) {
      this.filteredResources = [...this.resources];
      console.log('🔧 No search term, showing all resources:', this.filteredResources.length);
    } else {
      const searchTerm = this.resourceSearchTerm.toLowerCase();
      this.filteredResources = this.resources.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm) ||
        resource.description.toLowerCase().includes(searchTerm) ||
        (resource.skills && resource.skills.length > 0 && resource.skills[0].name && resource.skills[0].name.toLowerCase().includes(searchTerm))
      );
      console.log('🔧 Filtered resources:', this.filteredResources.length);
    }
    
    this.changeDetectorRef.detectChanges();
  }

  toggleResourceSelection(resourceId: string) {
    const index = this.selectedResourceIds.indexOf(resourceId);
    if (index > -1) {
      this.selectedResourceIds.splice(index, 1);
    } else {
      this.selectedResourceIds.push(resourceId);
    }
    this.updateSelectedResources();
    this.changeDetectorRef.detectChanges();
  }

  isResourceSelected(resourceId: string): boolean {
    return this.selectedResourceIds.includes(resourceId);
  }

  areAllResourcesSelected(): boolean {
    return this.filteredResources.length > 0 && 
           this.filteredResources.every(resource => this.isResourceSelected(resource._id));
  }

  toggleAllResources() {
    if (this.areAllResourcesSelected()) {
      // Deselect all filtered resources
      this.filteredResources.forEach(resource => {
        const index = this.selectedResourceIds.indexOf(resource._id);
        if (index > -1) {
          this.selectedResourceIds.splice(index, 1);
        }
      });
    } else {
      // Select all filtered resources
      this.filteredResources.forEach(resource => {
        if (!this.isResourceSelected(resource._id)) {
          this.selectedResourceIds.push(resource._id);
        }
      });
    }
    this.updateSelectedResources();
    this.changeDetectorRef.detectChanges();
  }

  removeResource(resourceId: string) {
    const index = this.selectedResourceIds.indexOf(resourceId);
    if (index > -1) {
      this.selectedResourceIds.splice(index, 1);
      this.updateSelectedResources();
      this.changeDetectorRef.detectChanges();
    }
  }

  onSubmit(): void {
    if (this.selectedResourceIds.length === 0 || !this.requirement) {
      this.errorMessage = 'Please select at least one resource and ensure requirement is loaded';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.applicationResults = [];
    
    this.selectedResourceIds.forEach(resourceId => {
      const applicationData = {
        requirement: this.requirement!._id,
        resource: resourceId,
        notes: this.notes
      };
      
      this.vendorService.createApplication(applicationData).subscribe({
        next: (response) => {
          this.applicationResults.push({
            success: response.success,
            message: response.success ? 'Application created successfully' : (response.message || 'Failed to create application'),
            resourceId: resourceId,
            requirementId: this.requirement!._id
          });
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'An error occurred while creating the application';
          this.applicationResults.push({
            success: false,
            message: errorMessage,
            resourceId: resourceId,
            requirementId: this.requirement!._id
          });
        }
      });
    });
    
    setTimeout(() => {
      this.isLoading = false;
      if (this.applicationResults.every(result => result.success)) {
        this.navigateBackToBrowse();
      } else {
        this.errorMessage = 'Some applications failed. Please try again.';
        this.changeDetectorRef.detectChanges();
      }
    }, 2000);
  }

  navigateBackToBrowse(): void {
    console.log('🔧 BrowseRequirementsPage: Navigating back to requirements');
    this.router.navigate(['/vendor/requirements']);
  }

  onCancel(): void {
    console.log('🔧 BrowseRequirementsPage: Cancel clicked');
    this.router.navigate(['/vendor/requirements']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdown if clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.resources-dropdown-container')) {
      this.showResourcesDropdown = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  getResourceName(resourceId: string): string {
    const resource = this.resources.find(r => r._id === resourceId);
    return resource ? resource.name : 'Unknown Resource';
  }

  getSkillDisplayName(skill: any): string {
    if (!skill) return 'Unknown Skill';
    
    // If skill is a string, return it directly
    if (typeof skill === 'string') {
      return skill;
    }
    
    // If skill is an object with a name property, return the name
    if (skill && typeof skill === 'object' && skill.name) {
      return skill.name;
    }
    
    // Fallback
    return 'Unknown Skill';
  }

  getLocationDisplay(location: any): string {
    if (!location) return 'Location not specified';
    
    const city = location.city || '';
    const state = location.state || '';
    
    if (city && state) {
      return `${city}, ${state}`;
    } else if (city) {
      return city;
    } else if (state) {
      return state;
    } else {
      return 'Location not specified';
    }
  }

  getCategoryDisplayName(category: any): string {
    if (!category) return 'No Category';
    
    // If category is a string, return it directly
    if (typeof category === 'string') {
      return category;
    }
    
    // If category is an object with a name property, return the name
    if (category && typeof category === 'object' && category.name) {
      return category.name;
    }
    
    // Fallback
    return 'No Category';
  }

  private updateSelectedResources(): void {
    this.selectedResources = this.resources.filter(resource => 
      this.selectedResourceIds.includes(resource._id)
    );
  }
} 