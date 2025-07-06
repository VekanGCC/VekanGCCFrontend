import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Resource } from '../../../models/resource.model';

@Component({
  selector: 'app-resource-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resource-details.component.html',
  styleUrls: ['./resource-details.component.scss']
})
export class ResourceDetailsComponent implements OnInit, OnDestroy {
  resource: Resource | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadResourceDetails();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private loadResourceDetails(): void {
    const resourceId = this.route.snapshot.paramMap.get('id');
    
    if (!resourceId) {
      this.errorMessage = 'No resource ID provided';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getResource(resourceId).subscribe({
      next: (response) => {
        console.log('🔧 ResourceDetails: API response:', response);
        if (response.success && response.data) {
          this.resource = response.data;
        } else {
          this.errorMessage = response.message || 'Failed to load resource details';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('🔧 ResourceDetails: Error loading resource:', error);
        this.errorMessage = 'Failed to load resource details';
        this.isLoading = false;
      }
    });
  }

  onBackToResources(): void {
    this.router.navigate(['/client/resources']);
  }

  onApplyResource(): void {
    if (this.resource) {
      this.router.navigate(['/client/apply-resources'], { 
        queryParams: { resourceIds: this.resource._id } 
      });
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
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getExperienceLevelClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'entry':
        return 'bg-blue-100 text-blue-800';
      case 'junior':
        return 'bg-green-100 text-green-800';
      case 'mid':
        return 'bg-yellow-100 text-yellow-800';
      case 'senior':
        return 'bg-orange-100 text-orange-800';
      case 'lead':
        return 'bg-purple-100 text-purple-800';
      case 'principal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
} 