import { Component, OnInit, ChangeDetectorRef, HostListener, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { AuthService } from '../../../services/auth.service';
import { ClientService } from '../../../services/client.service';
import { AppService } from '../../../services/app.service';
import { SkillsService } from '../../../services/skills.service';
import { User } from '../../../models/user.model';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-apply-resources-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './apply-resources-page.component.html',
  styleUrls: ['./apply-resources-page.component.scss']
})
export class ApplyResourcesPageComponent implements OnInit {
  currentUser: User | null = null;
  selectedRequirements: Requirement[] = [];
  requirements: Requirement[] = [];
  filteredRequirements: Requirement[] = [];
  resources: Resource[] = [];
  isLoading = false;
  errorMessage = '';
  applicationResults: { success: boolean; message: string; resourceId: string; requirementId: string }[] = [];
  
  // Multi-select dropdown properties
  showRequirementsDropdown = false;
  requirementSearchTerm = '';
  selectedRequirementIds: string[] = [];
  
  // Search debouncing
  private searchSubject = new Subject<string>();

  @Input() selectedResourceIds: string[] = [];
  @Output() selectedResourceIdsChange = new EventEmitter<string[]>();
  @Output() navigateBack = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private clientService: ClientService,
    private appService: AppService,
    private skillsService: SkillsService,
    private changeDetectorRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone
  ) {
    console.log('🔧 ApplyResourcesPage: Constructor called');
  }

  ngOnInit(): void {
    console.log('🔧 ApplyResourcesPage: Component initialized');
    this.currentUser = this.authService.getCurrentUser();
    console.log('🔧 ApplyResourcesPage: Current user:', this.currentUser);
    
    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged() // Only emit if value has changed
    ).subscribe(searchTerm => {
      console.log('🔧 Search debounced, making API call with term:', searchTerm);
      this.loadRequirementsWithSearch(searchTerm);
    });
    
    // Read resource IDs from query parameters
    this.route.queryParams.subscribe(params => {
      console.log('🔧 ApplyResourcesPage: Query params:', params);
      const resourceIdsParam = params['resourceIds'];
      if (resourceIdsParam) {
        // Handle both single ID and comma-separated IDs
        this.selectedResourceIds = resourceIdsParam.split(',').map((id: string) => id.trim());
        console.log('🔧 ApplyResourcesPage: Resource IDs from query params:', this.selectedResourceIds);
      }
      this.loadResourcesFromInput();
    });
    
    this.loadRequirements();
    
    // Test dropdown functionality after a short delay
    setTimeout(() => {
      console.log('🔧 Testing dropdown functionality...');
      console.log('🔧 Requirements dropdown state:', this.showRequirementsDropdown);
    }, 2000);
  }

  private loadResourcesFromInput(): void {
    console.log('🔧 ApplyResourcesPage: Loading resources from input:', this.selectedResourceIds);
    
    if (this.selectedResourceIds.length === 0) {
      this.errorMessage = 'No resources selected';
      return;
    }
    
    console.log('🔧 ApplyResourcesPage: Loading resources with IDs:', this.selectedResourceIds);
    
    // First, try to get resources from the current app service state
    let availableResources = this.appService.resources;
    console.log('🔧 ApplyResourcesPage: Current resources in app service:', availableResources);
    
    // If no resources are loaded, try to reload them
    if (availableResources.length === 0) {
      console.log('🔧 ApplyResourcesPage: No resources in app service, reloading...');
      this.appService.reloadResources().then(() => {
        availableResources = this.appService.resources;
        console.log('🔧 ApplyResourcesPage: Resources after reload:', availableResources);
        this.loadResourcesFromAvailableData(availableResources);
      });
    } else {
      this.loadResourcesFromAvailableData(availableResources);
    }
  }

  private loadResourcesFromAvailableData(availableResources: Resource[]): void {
    console.log('🔧 ApplyResourcesPage: Loading from available data:', availableResources.length, 'resources');
    
    // Load resources from the available data
    this.resources = this.selectedResourceIds
      .map((id: string) => availableResources.find(resource => resource._id === id))
      .filter((resource: Resource | undefined) => resource !== undefined) as Resource[];
    
    console.log('🔧 ApplyResourcesPage: Loaded resources:', this.resources);
    
    if (this.resources.length === 0) {
      console.error('🔧 ApplyResourcesPage: No resources found with IDs:', this.selectedResourceIds);
      this.errorMessage = 'Resources not found. Please try again.';
    } else {
      this.errorMessage = ''; // Clear any previous error
    }
    
    this.changeDetectorRef.detectChanges();
  }

  private loadRequirements(): void {
    console.log('🔧 Loading requirements...');
    this.isLoading = true;
    this.clientService.getRequirements().subscribe({
      next: (response) => {
        console.log('🔧 Requirements response:', response);
        if (response.success && response.data) {
          // Only show open requirements
          this.requirements = response.data.filter((req: Requirement) => req.status === 'open');
          this.filteredRequirements = [...this.requirements];
          
          console.log('🔧 Loaded requirements:', this.requirements.length);
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading requirements:', error);
        this.errorMessage = 'Failed to load requirements';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  private loadRequirementsWithSearch(searchTerm: string): void {
    console.log('🔧 Loading requirements with search:', searchTerm);
    this.isLoading = true;
    
    // Use search parameter which now includes skill name search
    const params = {
      search: searchTerm,
      status: 'open',
      limit: 50 // Limit results for better performance
    };
    
    console.log('🔧 Frontend: Sending search params:', params);
    
    this.clientService.getRequirements(params).subscribe({
      next: (response) => {
        console.log('🔧 Requirements search response:', response);
        if (response.success && response.data) {
          this.requirements = response.data;
          this.filteredRequirements = [...this.requirements];
          
          console.log('🔧 Loaded requirements with search:', this.requirements.length);
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading requirements with search:', error);
        this.errorMessage = 'Failed to load requirements';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.selectedRequirementIds.length === 0 || this.resources.length === 0) {
      this.errorMessage = 'Please select at least one requirement and ensure resources are loaded';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.applicationResults = [];
    
    const totalApplications = this.resources.length * this.selectedRequirementIds.length;
    let completedApplications = 0;
    
    console.log('🔧 ApplyResourcesPage: Starting to create', totalApplications, 'applications');
    
    // Safety timeout - if applications don't complete within 10 seconds, force reset
    const safetyTimeout = setTimeout(() => {
      console.warn('🔧 ApplyResourcesPage: Safety timeout reached, forcing isLoading to false');
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }, 10000);
    
    this.resources.forEach(resource => {
      this.selectedRequirementIds.forEach(requirementId => {
        const applicationData = {
          requirement: requirementId,
          resource: resource._id
        };
        
        console.log('🔧 ApplyResourcesPage: Creating application for resource', resource._id, 'and requirement', requirementId);
        
        this.clientService.createApplication(applicationData).subscribe({
          next: (response) => {
            console.log('🔧 ApplyResourcesPage: Application response:', response);
            this.applicationResults.push({
              success: response.success,
              message: response.success ? 'Application created successfully' : (response.message || 'Failed to create application'),
              resourceId: resource._id,
              requirementId: requirementId
            });
            completedApplications++;
            this.checkAllApplicationsCompleted(totalApplications, completedApplications, safetyTimeout);
          },
          error: (error) => {
            console.error('🔧 ApplyResourcesPage: Application error:', error);
            const errorMessage = error.error?.message || 'An error occurred while creating the application';
            this.applicationResults.push({
              success: false,
              message: errorMessage,
              resourceId: resource._id,
              requirementId: requirementId
            });
            completedApplications++;
            this.checkAllApplicationsCompleted(totalApplications, completedApplications, safetyTimeout);
          }
        });
      });
    });
  }

  private checkAllApplicationsCompleted(totalApplications: number, completedApplications: number, safetyTimeout: any): void {
    console.log('🔧 ApplyResourcesPage: Completed', completedApplications, 'of', totalApplications, 'applications');
    console.log('🔧 ApplyResourcesPage: Current isLoading state:', this.isLoading);
    console.log('🔧 ApplyResourcesPage: Application results:', this.applicationResults);
    
    if (completedApplications === totalApplications) {
      console.log('🔧 ApplyResourcesPage: All applications completed, setting isLoading to false');
      clearTimeout(safetyTimeout); // Clear the safety timeout
      
      this.ngZone.run(() => {
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
        
        console.log('🔧 ApplyResourcesPage: isLoading after setting to false:', this.isLoading);
        
        if (this.applicationResults.every(result => result.success)) {
          console.log('🔧 ApplyResourcesPage: All applications successful, navigating back');
          this.navigateBackToBrowse();
        } else {
          console.log('🔧 ApplyResourcesPage: Some applications failed');
          this.errorMessage = 'Some applications failed. Please try again.';
          this.changeDetectorRef.detectChanges();
        }
      });
    } else {
      console.log('🔧 ApplyResourcesPage: Still waiting for', totalApplications - completedApplications, 'more applications to complete');
    }
  }

  navigateBackToBrowse(): void {
    console.log('🔧 ApplyResourcesPage: Navigating back to browse');
    this.navigateBack.emit();
  }

  onCancel(): void {
    console.log('🔧 ApplyResourcesPage: Cancel clicked');
    this.navigateBack.emit();
  }

  // Manual reset method for debugging
  resetLoadingState(): void {
    console.log('🔧 ApplyResourcesPage: Manually resetting loading state');
    this.isLoading = false;
    this.errorMessage = '';
    this.applicationResults = [];
    this.changeDetectorRef.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close dropdowns if clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.requirements-section')) {
      this.showRequirementsDropdown = false;
    }
    this.changeDetectorRef.detectChanges();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getResourceName(resourceId: string): string {
    const resource = this.resources.find(r => r._id === resourceId);
    return resource ? resource.name : 'Unknown Resource';
  }

  getRequirementName(requirementId: string): string {
    const requirement = this.requirements.find(r => r._id === requirementId);
    return requirement ? requirement.title : 'Unknown Requirement';
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

  private updateSelectedRequirements(): void {
    this.selectedRequirements = this.requirements.filter(req => 
      this.selectedRequirementIds.includes(req._id)
    );
  }

  // Multi-select dropdown methods
  toggleRequirementsDropdown() {
    console.log('🔧 Toggle dropdown clicked, current state:', this.showRequirementsDropdown);
    console.log('🔧 Available requirements:', this.requirements.length);
    this.showRequirementsDropdown = !this.showRequirementsDropdown;
    if (this.showRequirementsDropdown) {
      this.filteredRequirements = [...this.requirements];
    }
    console.log('🔧 New dropdown state:', this.showRequirementsDropdown);
    this.changeDetectorRef.detectChanges();
  }

  filterRequirements() {
    console.log('🔧 Filtering requirements, search term:', this.requirementSearchTerm);
    
    if (!this.requirementSearchTerm.trim()) {
      // If search is cleared, load all requirements
      this.loadRequirements();
    } else {
      // Emit search term to trigger debounced API call
      this.searchSubject.next(this.requirementSearchTerm);
    }
    
    this.changeDetectorRef.detectChanges();
  }

  clearRequirementSearch() {
    this.requirementSearchTerm = '';
    this.loadRequirements(); // Load all requirements when search is cleared
    this.changeDetectorRef.detectChanges();
  }

  toggleRequirementSelection(requirementId: string) {
    const index = this.selectedRequirementIds.indexOf(requirementId);
    if (index > -1) {
      this.selectedRequirementIds.splice(index, 1);
    } else {
      this.selectedRequirementIds.push(requirementId);
    }
    this.updateSelectedRequirements();
    this.changeDetectorRef.detectChanges();
  }

  isRequirementSelected(requirementId: string): boolean {
    return this.selectedRequirementIds.includes(requirementId);
  }

  areAllRequirementsSelected(): boolean {
    return this.filteredRequirements.length > 0 && 
           this.filteredRequirements.every(req => this.isRequirementSelected(req._id));
  }

  toggleAllRequirements() {
    if (this.areAllRequirementsSelected()) {
      // Deselect all filtered requirements
      this.filteredRequirements.forEach(req => {
        const index = this.selectedRequirementIds.indexOf(req._id);
        if (index > -1) {
          this.selectedRequirementIds.splice(index, 1);
        }
      });
    } else {
      // Select all filtered requirements
      this.filteredRequirements.forEach(req => {
        if (!this.isRequirementSelected(req._id)) {
          this.selectedRequirementIds.push(req._id);
        }
      });
    }
    this.updateSelectedRequirements();
    this.changeDetectorRef.detectChanges();
  }

  removeRequirement(requirementId: string) {
    const index = this.selectedRequirementIds.indexOf(requirementId);
    if (index > -1) {
      this.selectedRequirementIds.splice(index, 1);
      this.updateSelectedRequirements();
      this.changeDetectorRef.detectChanges();
    }
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
} 