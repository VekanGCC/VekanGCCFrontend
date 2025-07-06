import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../models/user.model';
import { ClientService } from '../../../services/client.service';
import { AddUserModalComponent } from '../../modals/add-user-modal/add-user-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-user-management',
  standalone: true,
  imports: [CommonModule, AddUserModalComponent],
  templateUrl: './client-user-management.component.html',
  styleUrls: ['./client-user-management.component.scss']
})
export class ClientUserManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  isLoading: boolean = false;
  showAddUserModal = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private clientService: ClientService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔧 ClientUserManagement: Initializing...');
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUsers(): void {
    console.log('🔄 ClientUserManagement: Loading organization users...');
    this.isLoading = true;
    this.changeDetectorRef.detectChanges();

    this.subscriptions.push(
      this.clientService.getOrganizationUsers().subscribe({
        next: (response) => {
          console.log('✅ ClientUserManagement: Users loaded:', response);
          if (response.success && response.data) {
            this.users = response.data;
          } else {
            this.users = [];
          }
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('❌ ClientUserManagement: Error loading users:', error);
          this.users = [];
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        }
      })
    );
  }

  getUserRoleClass(role: string): string {
    switch (role) {
      case 'client_owner':
        return 'bg-purple-100 text-purple-800';
      case 'client_employee':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getUserStatusClass(status: boolean): string {
    switch (status) {
      case true:
        return 'bg-green-100 text-green-800';
      case false:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatRole(role: string): string {
    switch (role) {
      case 'client_owner':
        return 'Client Owner';
      case 'client_employee':
        return 'Client Employee';
      default:
        return role || 'Unknown Role';
    }
  }

  formatStatus(status: boolean): string {
    return status ? 'Active' : 'Inactive';
  }

  onToggleUserStatus(userId: string, currentStatus: boolean): void {
    console.log('🔄 ClientUserManagement: Toggling user status:', userId, currentStatus);
    
    const newStatus = currentStatus ? 'inactive' : 'active';
    
    this.subscriptions.push(
      this.clientService.updateUserStatus(userId, newStatus).subscribe({
        next: (response) => {
          console.log('✅ ClientUserManagement: User status updated:', response);
          // Reload users to get updated data
          this.loadUsers();
        },
        error: (error) => {
          console.error('❌ ClientUserManagement: Error updating user status:', error);
        }
      })
    );
  }

  onOpenAddUserModal(): void {
    console.log('🔄 ClientUserManagement: Opening add user modal');
    this.showAddUserModal = true;
  }

  onCloseAddUserModal(): void {
    console.log('🔄 ClientUserManagement: Closing add user modal');
    this.showAddUserModal = false;
  }

  onUserAdded(user: any): void {
    console.log('✅ ClientUserManagement: User added:', user);
    this.showAddUserModal = false;
    // Reload users to show the new user
    this.loadUsers();
  }

  trackById(index: number, item: any): any {
    return item?._id || index;
  }
} 