import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resource } from '../../../models/resource.model';
import { Requirement } from '../../../models/requirement.model';
import { Application } from '../../../models/application.model';
import { VendorService } from '../../../services/vendor.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-vendor-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vendor-overview.component.html',
  styleUrls: ['./vendor-overview.component.scss']
})
export class VendorOverviewComponent implements OnInit {
  resources: Resource[] = [];
  requirements: Requirement[] = [];
  applications: Application[] = [];
  stats: any[] = [];
  isLoading = false;

  constructor(
    private vendorService: VendorService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    console.log('🔧 VendorOverviewComponent: ngOnInit called');
    this.loadOverviewData();
  }

  loadOverviewData(): void {
    console.log('🔄 VendorOverview: Loading overview data...');
    this.isLoading = true;

    // Load resources
    this.vendorService.getResources({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        console.log('✅ VendorOverview: Resources loaded:', response);
        this.resources = response.data || [];
      },
      error: (error) => {
        console.error('❌ VendorOverview: Error loading resources:', error);
      }
    });

    // Load requirements
    this.apiService.getRequirements({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        console.log('✅ VendorOverview: Requirements loaded:', response);
        this.requirements = response.data || [];
      },
      error: (error) => {
        console.error('❌ VendorOverview: Error loading requirements:', error);
      }
    });

    // Load applications
    this.vendorService.getApplications({ page: 1, limit: 5 }).subscribe({
      next: (response) => {
        console.log('✅ VendorOverview: Applications loaded:', response);
        this.applications = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ VendorOverview: Error loading applications:', error);
        this.isLoading = false;
      }
    });

    // Load stats
    this.vendorService.getAnalytics().subscribe({
      next: (response) => {
        console.log('✅ VendorOverview: Analytics loaded:', response);
        this.stats = response.data || [];
      },
      error: (error) => {
        console.error('❌ VendorOverview: Error loading analytics:', error);
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
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: 'assets/icons/lucide/lucide/clock.svg' };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: 'assets/icons/lucide/lucide/check-circle.svg' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: 'assets/icons/lucide/lucide/x-circle.svg' };
      case 'in progress':
        return { color: 'bg-blue-100 text-blue-800', icon: 'assets/icons/lucide/lucide/play-circle.svg' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: 'assets/icons/lucide/lucide/help-circle.svg' };
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  formatBudget(budget: any): string {
    if (!budget) return 'TBD';
    
    if (typeof budget === 'object' && budget.charge) {
      const currency = budget.currency || '$';
      const charge = budget.charge;
      const type = budget.type || 'hr';
      return `${currency}${charge}/${type}`;
    }
    
    if (typeof budget === 'number') {
      return `$${budget}/hr`;
    }
    
    return 'TBD';
  }

  getClientName(requirement: any): string {
    // Try to get client name from different possible sources
    if (requirement?.clientName) {
      return requirement.clientName;
    }
    
    if (requirement?.organization?.name) {
      return requirement.organization.name;
    }
    
    if (requirement?.createdBy?.firstName && requirement?.createdBy?.lastName) {
      return `${requirement.createdBy.firstName} ${requirement.createdBy.lastName}`;
    }
    
    if (requirement?.createdBy?.companyName) {
      return requirement.createdBy.companyName;
    }
    
    return 'Client';
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }
} 