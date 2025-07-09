import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent {
  @Input() users: User[] = [];
  @Input() paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  @Output() pageChange = new EventEmitter<number>();
  @Output() editUser = new EventEmitter<User>();
  @Output() toggleUserStatus = new EventEmitter<User>();

  constructor() {}

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
    this.pageChange.emit(page);
  }

  onEditUser(user: User): void {
    this.editUser.emit(user);
  }

  onToggleUserStatus(user: User): void {
    this.toggleUserStatus.emit(user);
  }

  trackById(index: number, item: any): string {
    return item._id || `item-${index}`;
  }
} 