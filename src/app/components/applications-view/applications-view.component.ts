import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-applications-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './applications-view.component.html',
  styleUrls: ['./applications-view.component.css']
})
export class ApplicationsViewComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = false;
  applications: any[] = [];
  userApplications: any[] = [];
  userRole: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Subscribe to user changes
    this.authService.user$.subscribe(user => {
      console.log('Applications View: User state changed:', user);
      this.currentUser = user;
      
      if (user) {
        console.log('Applications View: User type:', user.userType);
        this.userRole = user.userType;
        this.loadApplications();
      } else {
        this.userApplications = [];
      }
    });

    // Subscribe to loading state
    this.authService.loading$.subscribe(isLoading => {
      this.isLoading = isLoading;
    });
  }

  private loadApplications(): void {
    if (!this.currentUser) {
      this.userApplications = [];
      return;
    }

    const userId = this.currentUser._id;
    const userType = this.currentUser.userType;

    this.userApplications = this.applications.filter(app => 
      userType === 'vendor' ? app.vendorId === userId : app.clientId === userId
    );
  }

  getResourceName(resourceId: string): string {
    // This would need to be implemented based on your data structure
    return 'Resource Name';
  }

  getResourceVendorName(resourceId: string): string {
    // This would need to be implemented based on your data structure
    return 'Vendor Name';
  }

  getRequirementTitle(requirementId: string): string {
    // This would need to be implemented based on your data structure
    return 'Requirement Title';
  }

  getRequirementClientName(requirementId: string): string {
    // This would need to be implemented based on your data structure
    return 'Client Name';
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'applied':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'offer_created':
        return 'bg-indigo-100 text-indigo-800';
      case 'onboarded':
        return 'bg-teal-100 text-teal-800';
      case 'did_not_join':
        return 'bg-orange-100 text-orange-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'applied':
        return 'file-text';
      case 'pending':
        return 'clock';
      case 'shortlisted':
        return 'check';
      case 'interview':
        return 'users';
      case 'accepted':
        return 'check-circle';
      case 'rejected':
        return 'x-circle';
      case 'offer_created':
        return 'file-text';
      case 'onboarded':
        return 'plus';
      case 'did_not_join':
        return 'x';
      case 'withdrawn':
        return 'x';
      default:
        return 'help-circle';
    }
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  }

  getAvailableStatuses(currentStatus: string, userRole: string): string[] {
    // This would need to be implemented based on your business logic
    return [];
  }

  handleStatusUpdate(applicationId: string, newStatus: string): void {
    // This would need to be implemented based on your business logic
    console.log('Status update:', applicationId, newStatus);
  }
} 