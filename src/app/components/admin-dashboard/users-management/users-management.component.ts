import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';
import { AdminService } from '../../../services/admin.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
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

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUsers(): void {
    this.paginationState.isLoading = true;

    const subscription = this.adminService.getUsers(
      this.paginationState.currentPage,
      this.paginationState.pageSize
    ).subscribe({
      next: (response) => {
        console.log('🔧 UsersManagementComponent: Users loaded:', response);
        this.users = response.data || [];
        
        // Update pagination state
        if (response.pagination) {
          this.paginationState = {
            currentPage: response.pagination.page || 1,
            pageSize: response.pagination.limit || 10,
            totalItems: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 0,
            isLoading: false,
            hasNextPage: (response.pagination.page || 1) < (response.pagination.totalPages || 0),
            hasPreviousPage: (response.pagination.page || 1) > 1
          };
        } else {
          this.paginationState.isLoading = false;
        }
      },
      error: (error) => {
        console.error('🔧 UsersManagementComponent: Error loading users:', error);
        this.paginationState.isLoading = false;
        this.users = [];
      }
    });

    this.subscriptions.push(subscription);
  }

  getUserTypeColor(userType: string): string {
    const colors: { [key: string]: string } = {
      vendor: 'text-blue-600 bg-blue-100',
      client: 'text-purple-600 bg-purple-100',
      admin: 'text-red-600 bg-red-100'
    };
    return colors[userType] || 'text-gray-600 bg-gray-100';
  }

  getUserRoleDisplay(user: User): string {
    // For admin users, show "Admin"
    if (user.userType === 'admin') {
      return 'Admin';
    }
    
    // For vendor users, show organizationRole if available, otherwise fallback to userType
    if (user.userType === 'vendor') {
      if (user.organizationRole) {
        return user.organizationRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      return 'Vendor';
    }
    
    // For client users, show organizationRole if available, otherwise fallback to userType
    if (user.userType === 'client') {
      if (user.organizationRole) {
        return user.organizationRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      return 'Client';
    }
    
    return user.userType || 'Unknown';
  }

  getUserRoleColor(user: User): string {
    // For admin users
    if (user.userType === 'admin') {
      return 'text-red-600 bg-red-100';
    }
    
    // For vendor users
    if (user.userType === 'vendor') {
      if (user.organizationRole === 'vendor_owner') {
        return 'text-blue-600 bg-blue-100';
      } else if (user.organizationRole === 'vendor_employee') {
        return 'text-indigo-600 bg-indigo-100';
      } else if (user.organizationRole === 'vendor_account') {
        return 'text-cyan-600 bg-cyan-100';
      }
      return 'text-blue-600 bg-blue-100'; // Default vendor color
    }
    
    // For client users
    if (user.userType === 'client') {
      if (user.organizationRole === 'client_owner') {
        return 'text-purple-600 bg-purple-100';
      } else if (user.organizationRole === 'client_employee') {
        return 'text-violet-600 bg-violet-100';
      } else if (user.organizationRole === 'client_account') {
        return 'text-fuchsia-600 bg-fuchsia-100';
      }
      return 'text-purple-600 bg-purple-100'; // Default client color
    }
    
    return 'text-gray-600 bg-gray-100'; // Default color
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadUsers();
  }

  onEditUser(user: User): void {
    console.log('🔧 UsersManagementComponent: Edit user:', user);
    // Navigate to admin user profile page for editing
    this.router.navigate(['/admin/user-profile', user._id]);
  }

  onToggleUserStatus(user: User): void {
    console.log('🔧 UsersManagementComponent: Toggle user status:', user);
    
    const subscription = this.adminService.toggleUserStatus(user._id).subscribe({
      next: (response) => {
        console.log('🔧 UsersManagementComponent: User status updated successfully:', response);
        // Reload users to reflect changes
        this.loadUsers();
      },
      error: (error) => {
        console.error('🔧 UsersManagementComponent: Error updating user status:', error);
        // Reload users to ensure UI is in sync
        this.loadUsers();
      }
    });

    this.subscriptions.push(subscription);
  }

  refreshPage(): void {
    this.loadUsers();
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }
} 