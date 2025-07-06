import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendorService } from '../../../services/vendor.service';
import { AddUserModalComponent } from '../../modals/add-user-modal/add-user-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vendor-user-management',
  standalone: true,
  imports: [CommonModule, AddUserModalComponent],
  templateUrl: './vendor-user-management.component.html',
  styleUrls: ['./vendor-user-management.component.scss']
})
export class VendorUserManagementComponent implements OnInit, OnDestroy {
  users: any[] = [];
  isLoading = false;
  showAddUserModal = false;
  private subscription = new Subscription();

  constructor(private vendorService: VendorService) {}

  ngOnInit(): void {
    console.log('🔧 VendorUserManagement: Initializing component');
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadUsers(): void {
    console.log('🔧 VendorUserManagement: Loading users from service');
    this.isLoading = true;

    this.subscription.add(
      this.vendorService.getEmployees().subscribe({
        next: (response: any) => {
          console.log('🔧 VendorUserManagement: Users loaded successfully:', response);
          if (response.success && response.data) {
            this.users = response.data;
            console.log('🔧 VendorUserManagement: Users data:', this.users);
            console.log('🔧 VendorUserManagement: First user details:', this.users[0]);
          } else {
            this.users = [];
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('🔧 VendorUserManagement: Error loading users:', error);
          this.users = [];
          this.isLoading = false;
        }
      })
    );
  }

  getUserRoleClass(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getUserStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  onOpenAddUserModal(): void {
    console.log('🔧 VendorUserManagement: Opening add user modal');
    this.showAddUserModal = true;
  }

  onCloseAddUserModal(): void {
    console.log('🔧 VendorUserManagement: Closing add user modal');
    this.showAddUserModal = false;
  }

  onUserAdded(user: any): void {
    console.log('🔧 VendorUserManagement: User added successfully:', user);
    // Add the new user to the local array
    this.users = [...this.users, user];
    this.showAddUserModal = false;
  }

  onToggleUserStatus(id: string, status: string): void {
    console.log('🔧 VendorUserManagement: Toggling user status:', id, status);
    const newStatus = status === 'active' ? 'inactive' : 'active';
    
    // Update the user status in the local array
    this.users = this.users.map(user => 
      user._id === id ? { ...user, status: newStatus } : user
    );
    
    // TODO: Call API to update user status
    // this.vendorService.updateUserStatus(id, newStatus).subscribe({...});
  }

  trackById(index: number, item: any): string {
    return item._id || `user-${index}`;
  }
} 