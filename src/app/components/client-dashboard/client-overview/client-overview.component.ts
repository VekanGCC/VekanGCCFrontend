import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { Application } from '../../../models/application.model';
import { ClientService } from '../../../services/client.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-client-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-overview.component.html',
  styleUrls: ['./client-overview.component.scss']
})
export class ClientOverviewComponent implements OnInit {
  resources: Resource[] = [];
  requirements: Requirement[] = [];
  applications: Application[] = [];
  stats: any[] = [];
  isLoading = false;

  constructor(
    private clientService: ClientService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    console.log('🔧 ClientOverviewComponent: ngOnInit called');
    this.loadOverviewData();
  }

  loadOverviewData(): void {
    console.log('🔄 ClientOverview: Loading overview data...');
    this.isLoading = true;

    // Load resources
    this.apiService.getResources({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        console.log('✅ ClientOverview: Resources loaded:', response);
        this.resources = response.data || [];
      },
      error: (error) => {
        console.error('❌ ClientOverview: Error loading resources:', error);
      }
    });

    // Load requirements
    this.clientService.getRequirements({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        console.log('✅ ClientOverview: Requirements loaded:', response);
        this.requirements = response.data || [];
      },
      error: (error) => {
        console.error('❌ ClientOverview: Error loading requirements:', error);
      }
    });

    // Load applications
    this.clientService.getApplications({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        console.log('✅ ClientOverview: Applications loaded:', response);
        this.applications = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ ClientOverview: Error loading applications:', error);
        this.isLoading = false;
      }
    });

    // Load stats
    this.clientService.getAnalytics().subscribe({
      next: (response) => {
        console.log('✅ ClientOverview: Analytics loaded:', response);
        this.stats = response.data || [];
      },
      error: (error) => {
        console.error('❌ ClientOverview: Error loading analytics:', error);
      }
    });
  }

  getApplicationResourceName(app: Application): string {
    if (typeof app.resource === 'string') {
      return 'Unknown Resource';
    }
    return app.resource?.name || 'Unknown Resource';
  }

  getApplicationRequirementTitle(app: Application): string {
    if (typeof app.requirement === 'string') {
      return 'Unknown Requirement';
    }
    return app.requirement?.title || 'Unknown Requirement';
  }

  getStatusBadge(status: string): { color: string; icon: string } {
    if (!status) {
      return { color: 'bg-gray-100 text-gray-800', icon: 'help-circle' };
    }
    
    switch (status.toLowerCase()) {
      case 'applied':
        return { color: 'bg-gray-100 text-gray-800', icon: 'file-text' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: 'clock' };
      case 'shortlisted':
        return { color: 'bg-blue-100 text-blue-800', icon: 'check' };
      case 'interview':
        return { color: 'bg-purple-100 text-purple-800', icon: 'users' };
      case 'accepted':
        return { color: 'bg-green-100 text-green-800', icon: 'check-circle' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: 'x-circle' };
      case 'offer_created':
        return { color: 'bg-indigo-100 text-indigo-800', icon: 'file-text' };
      case 'onboarded':
        return { color: 'bg-teal-100 text-teal-800', icon: 'plus' };
      case 'did_not_join':
        return { color: 'bg-orange-100 text-orange-800', icon: 'x' };
      case 'withdrawn':
        return { color: 'bg-gray-100 text-gray-800', icon: 'x' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: 'help-circle' };
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }
} 