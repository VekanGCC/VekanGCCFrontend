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
import { ApiService } from '../../../services/api.service';
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
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged() // Only emit if value has changed
    ).subscribe(searchTerm => {
      this.loadRequirementsWithSearch(searchTerm);
    });
    
    // Read resource IDs from query parameters
    this.route.queryParams.subscribe(params => {
      const resourceIdsParam = params['resourceIds'];
      if (resourceIdsParam) {
        // Handle both single ID and comma-separated IDs
        this.selectedResourceIds = resourceIdsParam.split(',').map((id: string) => id.trim());
      }
      this.loadResourcesFromInput();
    });
    
    this.loadRequirements();
  }

  private loadResourcesFromInput(): void {
    if (this.selectedResourceIds.length === 0) {
      this.errorMessage = 'No resources selected';
      return;
    }
    
    // Fetch resource data by IDs from the API
    this.loadResourcesByIds(this.selectedResourceIds);
  }

  private loadResourcesByIds(resourceIds: string[]): void {
    this.isLoading = true;
    
    // Use Promise.all to fetch all resources in parallel
    const resourcePromises = resourceIds.map(id => 
      this.apiService.getResource(id).toPromise()
    );
    
    Promise.all(resourcePromises)
      .then((responses: any[]) => {
        // Extract successful responses
        this.resources = responses
          .filter((response: any) => response && response.success && response.data)
          .map((response: any) => response.data);
        
        if (this.resources.length === 0) {
          this.errorMessage = 'Resources not found. Please try again.';
        } else {
          this.errorMessage = '';
        }
        
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      })
      .catch(error => {
        console.error('Error fetching resources:', error);
        this.errorMessage = 'Failed to load resources. Please try again.';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      });
  }

  private loadResourcesFromAvailableData(availableResources: Resource[]): void {
    // Load resources from the available data
    this.resources = this.selectedResourceIds
      .map((id: string) => availableResources.find(resource => resource._id === id))
      .filter((resource: Resource | undefined) => resource !== undefined) as Resource[];
    
    if (this.resources.length === 0) {
      this.errorMessage = 'Resources not found. Please try again.';
    } else {
      this.errorMessage = ''; // Clear any previous error
    }
    
    this.changeDetectorRef.detectChanges();
  }

  private loadRequirements(): void {
    this.isLoading = true;
    this.clientService.getRequirements().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Only show open requirements
          this.requirements = response.data.filter((req: Requirement) => req.status === 'active');
          this.filteredRequirements = [...this.requirements];
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
    this.isLoading = true;
    
    // Use search parameter which now includes skill name search
    const params = {
      search: searchTerm,
      status: 'active',
      limit: 50 // Limit results for better performance
    };
    
    this.clientService.getRequirements(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.requirements = response.data;
          this.filteredRequirements = [...this.requirements];
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
    
    // Safety timeout - if applications don't complete within 10 seconds, force reset
    const safetyTimeout = setTimeout(() => {
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }, 10000);
    
    this.resources.forEach(resource => {
      this.selectedRequirementIds.forEach(requirementId => {
        const applicationData = {
          requirement: requirementId,
          resource: resource._id
        };
        
        this.clientService.createApplication(applicationData).subscribe({
          next: (response) => {
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
            console.error('Application error:', error);
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
    if (completedApplications === totalApplications) {
      clearTimeout(safetyTimeout); // Clear the safety timeout
      
      this.ngZone.run(() => {
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
        
        if (this.applicationResults.every(result => result.success)) {
          this.navigateBackToBrowse();
        } else {
          this.errorMessage = 'Some applications failed. Please try again.';
          this.changeDetectorRef.detectChanges();
        }
      });
    }
  }

  navigateBackToBrowse(): void {
    this.navigateBack.emit();
  }

  onCancel(): void {
    this.navigateBack.emit();
  }

  // Manual reset method for debugging
  resetLoadingState(): void {
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
    this.showRequirementsDropdown = !this.showRequirementsDropdown;
    if (this.showRequirementsDropdown) {
      this.filteredRequirements = [...this.requirements];
    }
    this.changeDetectorRef.detectChanges();
  }

  filterRequirements() {
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