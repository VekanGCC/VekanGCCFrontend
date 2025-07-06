import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { Application } from '../../../models/application.model';
import { AuthService } from '../../../services/auth.service';
import { VendorService } from '../../../services/vendor.service';
import { AppService } from '../../../services/app.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-apply-requirement-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './apply-requirement-modal.component.html',
  styleUrls: ['./apply-requirement-modal.component.css']
})
export class ApplyRequirementModalComponent implements OnInit {
  @Input() requirementId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  currentUser: User | null = null;
  selectedResource: Resource | null = null;
  resources: Resource[] = [];
  requirement: Requirement | null = null;
  notes: string = '';
  proposedRate: number = 0;
  availability: string = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private vendorService: VendorService,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadResources();
    this.loadRequirement();
  }

  private loadResources(): void {
    this.isLoading = true;
    this.vendorService.getResources().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Only show active resources
          this.resources = response.data.filter((res: Resource) => res.status === 'active');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading resources:', error);
        this.errorMessage = 'Failed to load resources';
        this.isLoading = false;
      }
    });
  }

  private loadRequirement(): void {
    if (!this.requirementId) {
      console.error('No requirement ID provided');
      return;
    }
    
    console.log('Loading requirement with ID:', this.requirementId);
    const foundRequirement = this.appService.getRequirementById(this.requirementId);
    this.requirement = foundRequirement || null;
    
    if (!this.requirement) {
      console.error('Requirement not found with ID:', this.requirementId);
      this.errorMessage = 'Requirement not found';
    }
  }

  selectResource(resource: Resource): void {
    this.selectedResource = resource;
    // Pre-fill proposed rate with resource's current rate
    if (resource.rate && resource.rate.hourly) {
      this.proposedRate = resource.rate.hourly;
    }
    // Pre-fill availability with resource's current availability
    if (resource.availability && resource.availability.status) {
      this.availability = resource.availability.status;
    }
  }

  isResourceSelected(resourceId: string): boolean {
    return this.selectedResource?._id === resourceId;
  }

  onSubmit(): void {
    if (!this.selectedResource || !this.requirementId) {
      this.errorMessage = 'Please select a resource';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const applicationData = {
      requirement: this.requirementId,
      resource: this.selectedResource._id,
      notes: this.notes,
      proposedRate: this.proposedRate,
      availability: this.availability
    };

    this.vendorService.createApplication(applicationData).subscribe({
      next: (response) => {
        console.log('Application response:', response);
        if (response.success) {
          console.log('Application created successfully:', response);
          this.close.emit();
          this.success.emit();
        } else {
          console.error('Application creation failed:', response.message);
          this.errorMessage = response.message || 'Failed to create application. Please try again.';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error creating application:', error);
        
        let errorMessage = 'Failed to create application. Please try again.';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.status === 409) {
          errorMessage = 'This resource has already been applied to this requirement';
        } else if (error.status === 400) {
          errorMessage = 'Invalid request. Please check your input.';
        }
        
        this.errorMessage = errorMessage;
        this.isLoading = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getAvailabilityClass(status: string): string {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'partially_available': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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