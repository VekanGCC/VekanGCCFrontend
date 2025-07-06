import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProfileService, ProfileData } from '../../services/profile.service';
import { User as UserModel, UserAddress } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile-dashboard.component.html',
  styleUrls: ['./profile-dashboard.component.css']
})
export class ProfileDashboardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() userId?: string; // Optional userId for admin use
  @Input() isAdminView: boolean = false; // Flag to indicate if this is admin view
  @Input() refreshTrigger: number = 0; // Trigger to refresh profile data
  
  @Output() backToUsers = new EventEmitter<void>();
  @Output() approveUser = new EventEmitter<User>();
  @Output() rejectUser = new EventEmitter<{user: User, notes: string}>();
  
  profileData: ProfileData | null = null;
  isLoading = false;
  activeTab: 'personal' | 'addresses' | 'bank' | 'compliance' = 'personal';
  showRejectModal = false;
  rejectNotes = '';

  // Edit states
  isEditingPersonal = false;
  isEditingCompliance = false;
  showAddAddressModal = false;
  showAddBankDetailsModal = false;

  // Form data for editing
  editPersonalForm: any = {};
  editComplianceForm: any = {};

  // Define the tab list as a type-safe array
  tabList: { value: 'personal' | 'addresses' | 'bank' | 'compliance', label: string }[] = [
    { value: 'personal', label: 'Personal' },
    { value: 'addresses', label: 'Addresses' },
    { value: 'bank', label: 'Bank' },
    { value: 'compliance', label: 'Compliance' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshTrigger']) {
      this.loadProfileData();
    }
  }

  loadProfileData(): void {
    this.isLoading = true;
    
    if (this.isAdminView && this.userId) {
      // Load specific user's profile for admin view
      this.subscriptions.add(
        this.adminService.getUserProfile(this.userId).subscribe({
          next: (response) => {
            if (response.success) {
              this.profileData = response.data;
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading user profile:', error);
            this.isLoading = false;
          }
        })
      );
    } else {
      // Load current user's profile
      this.subscriptions.add(
        this.profileService.getProfile().subscribe({
          next: (data) => {
            this.profileData = data;
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
          }
        })
      );
    }
  }

  setActiveTab(tab: 'personal' | 'addresses' | 'bank' | 'compliance'): void {
    this.activeTab = tab;
  }

  isVendor(): boolean {
    return this.profileData?.user.userType === 'vendor';
  }

  getDefaultAddress(): UserAddress | null {
    return this.profileData?.addresses.find(addr => addr.isDefault) || null;
  }

  // Admin-only methods
  onBackToUsers(): void {
    this.backToUsers.emit();
  }

  onApproveUser(): void {
    if (this.profileData?.user) {
      this.approveUser.emit(this.profileData.user);
    }
  }

  onOpenRejectModal(): void {
    this.showRejectModal = true;
    this.rejectNotes = '';
  }

  onCloseRejectModal(): void {
    this.showRejectModal = false;
    this.rejectNotes = '';
  }

  onRejectUser(): void {
    if (this.profileData?.user && this.rejectNotes.trim()) {
      this.rejectUser.emit({ user: this.profileData.user, notes: this.rejectNotes });
      this.onCloseRejectModal();
    }
  }

  // Method to refresh profile data (called after approve/reject)
  refreshProfileData(): void {
    if (this.isAdminView && this.userId) {
      this.loadProfileData();
    }
  }

  // Check if current user is admin
  isCurrentUserAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.userType === 'admin';
  }

  // Check if profile can be edited (only admins can edit)
  canEditProfile(): boolean {
    return this.isCurrentUserAdmin();
  }

  // Admin-only update methods
  updateProfile(profileData: Partial<any>): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.subscriptions.add(
      this.adminService.updateUserProfile(this.userId, profileData).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProfileData(); // Refresh data
          }
        },
        error: (error) => {
          console.error('Error updating profile:', error);
        }
      })
    );
  }

  updateAddress(addressId: string, address: Partial<any>): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.subscriptions.add(
      this.adminService.updateUserAddress(this.userId, addressId, address).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProfileData(); // Refresh data
          }
        },
        error: (error) => {
          console.error('Error updating address:', error);
        }
      })
    );
  }

  addAddress(address: any): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.subscriptions.add(
      this.adminService.addUserAddress(this.userId, address).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProfileData(); // Refresh data
          }
        },
        error: (error) => {
          console.error('Error adding address:', error);
        }
      })
    );
  }

  deleteAddress(addressId: string): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.subscriptions.add(
      this.adminService.deleteUserAddress(this.userId, addressId).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProfileData(); // Refresh data
          }
        },
        error: (error) => {
          console.error('Error deleting address:', error);
        }
      })
    );
  }

  updateBankDetails(bankDetailsId: string, bankDetails: Partial<any>): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.subscriptions.add(
      this.adminService.updateUserBankDetails(this.userId, bankDetailsId, bankDetails).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProfileData(); // Refresh data
          }
        },
        error: (error) => {
          console.error('Error updating bank details:', error);
        }
      })
    );
  }

  addBankDetails(bankDetails: any): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.subscriptions.add(
      this.adminService.addUserBankDetails(this.userId, bankDetails).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProfileData(); // Refresh data
          }
        },
        error: (error) => {
          console.error('Error adding bank details:', error);
        }
      })
    );
  }

  deleteBankDetails(bankDetailsId: string): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.subscriptions.add(
      this.adminService.deleteUserBankDetails(this.userId, bankDetailsId).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProfileData(); // Refresh data
          }
        },
        error: (error) => {
          console.error('Error deleting bank details:', error);
        }
      })
    );
  }

  updateCompliance(compliance: Partial<any>): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.subscriptions.add(
      this.adminService.updateUserCompliance(this.userId, compliance).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadProfileData(); // Refresh data
          }
        },
        error: (error) => {
          console.error('Error updating compliance:', error);
        }
      })
    );
  }

  // Edit methods for UI
  startEditingPersonal(): void {
    if (!this.canEditProfile() || !this.profileData?.user) return;
    
    this.editPersonalForm = {
      firstName: this.profileData.user.firstName,
      lastName: this.profileData.user.lastName,
      phone: this.profileData.user.phone,
      companyName: this.profileData.user.companyName,
      contactPerson: this.profileData.user.contactPerson,
      gstNumber: this.profileData.user.gstNumber,
      serviceType: this.profileData.user.serviceType,
      paymentTerms: this.profileData.user.paymentTerms
    };
    this.isEditingPersonal = true;
  }

  savePersonalInfo(): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.updateProfile(this.editPersonalForm);
    this.isEditingPersonal = false;
  }

  cancelEditingPersonal(): void {
    this.isEditingPersonal = false;
    this.editPersonalForm = {};
  }

  startEditingCompliance(): void {
    if (!this.canEditProfile() || !this.profileData?.compliance) return;
    
    this.editComplianceForm = {
      panNumber: this.profileData.compliance.panNumber,
      registeredUnderESI: this.profileData.compliance.registeredUnderESI,
      esiRegistrationNumber: this.profileData.compliance.esiRegistrationNumber,
      registeredUnderPF: this.profileData.compliance.registeredUnderPF,
      pfRegistrationNumber: this.profileData.compliance.pfRegistrationNumber,
      registeredUnderMSMED: this.profileData.compliance.registeredUnderMSMED,
      msmedRegistrationNumber: this.profileData.compliance.msmedRegistrationNumber,
      compliesWithStatutoryRequirements: this.profileData.compliance.compliesWithStatutoryRequirements,
      hasCloseRelativesInCompany: this.profileData.compliance.hasCloseRelativesInCompany,
      hasAdequateSafetyStandards: this.profileData.compliance.hasAdequateSafetyStandards,
      hasOngoingLitigation: this.profileData.compliance.hasOngoingLitigation
    };
    this.isEditingCompliance = true;
  }

  saveCompliance(): void {
    if (!this.canEditProfile() || !this.userId) return;

    this.updateCompliance(this.editComplianceForm);
    this.isEditingCompliance = false;
  }

  cancelEditingCompliance(): void {
    this.isEditingCompliance = false;
    this.editComplianceForm = {};
  }

  // Edit methods for addresses and bank details
  editAddress(address: any): void {
    if (!this.canEditProfile()) return;
    // TODO: Implement address editing modal
    console.log('Edit address:', address);
  }

  editBankDetails(bankDetails: any): void {
    if (!this.canEditProfile()) return;
    // TODO: Implement bank details editing modal
    console.log('Edit bank details:', bankDetails);
  }
} 