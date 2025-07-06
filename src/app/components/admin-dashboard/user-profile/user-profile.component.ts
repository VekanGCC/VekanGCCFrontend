import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent {
  @Input() selectedUser: User | null = null;
  @Input() selectedUserProfileData: any = null;
  @Input() isProfileLoading: boolean = false;
  @Input() showProfileRejectModal: boolean = false;
  @Input() profileRejectNotes: string = '';

  @Output() backToUsers = new EventEmitter<void>();
  @Output() approveUserFromProfile = new EventEmitter<User>();
  @Output() openRejectModalFromProfile = new EventEmitter<User>();
  @Output() closeRejectModalFromProfile = new EventEmitter<void>();
  @Output() rejectUserFromProfile = new EventEmitter<{user: User, notes: string}>();

  activeProfileTab: string = 'personal';
  profileTabList = [
    { value: 'personal', label: 'Personal Information' },
    { value: 'business', label: 'Business Information' },
    { value: 'documents', label: 'Documents' }
  ];

  constructor() {}

  setActiveProfileTab(tab: string): void {
    this.activeProfileTab = tab;
  }

  onBackToUsers(): void {
    this.backToUsers.emit();
  }

  onApproveUserFromProfile(user: User): void {
    this.approveUserFromProfile.emit(user);
  }

  onOpenRejectModalFromProfile(user: User): void {
    this.openRejectModalFromProfile.emit(user);
  }

  onCloseRejectModalFromProfile(): void {
    this.closeRejectModalFromProfile.emit();
  }

  onRejectUserFromProfile(user: User, notes: string): void {
    this.rejectUserFromProfile.emit({ user, notes });
  }
} 