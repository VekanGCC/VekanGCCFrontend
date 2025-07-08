import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { LayoutComponent } from '../layout/layout.component';
import { AddAdminSkillModalComponent } from '../modals/add-admin-skill-modal/add-admin-skill-modal.component';
import { AddCategoryModalComponent } from '../modals/add-category-modal/add-category-modal.component';
import { EditCategoryModalComponent } from '../modals/edit-category-modal/edit-category-modal.component';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { AppService } from '../../services/app.service';
import { VendorManagementService } from '../../services/vendor-management.service';
import { WorkflowService } from '../../services/workflow.service';
import { AdminSkill, PlatformStats, TransactionData, SkillApproval } from '../../models/admin.model';
import { Category } from '../../models/category.model';
import { VendorSkill } from '../../models/vendor-skill.model';
import { User } from '../../models/user.model';
import { Resource } from '../../models/resource.model';
import { Requirement } from '../../models/requirement.model';
import { Application } from '../../models/application.model';
import { Router } from '@angular/router';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { PaginationComponent } from '../pagination/pagination.component';
import { PaginationState } from '../../models/pagination.model';
import { ApiService } from '../../services/api.service';

// Import new tab components
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { SkillApprovalsComponent } from './skill-approvals/skill-approvals.component';
import { SkillsManagementComponent } from './skills-management/skills-management.component';
import { CategoriesManagementComponent } from './categories-management/categories-management.component';
import { ApplicationsViewComponent } from './applications-view/applications-view.component';
import { UsersManagementComponent } from './users-management/users-management.component';
import { ProfileDashboardComponent } from '../profile/profile-dashboard.component';
import { AdminReportsComponent } from './admin-reports/admin-reports.component';
import { WorkflowManagementComponent } from './workflow-management/workflow-management.component';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface NavigationTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    LucideAngularModule, 
    LayoutComponent,
    AddAdminSkillModalComponent,
    AddCategoryModalComponent,
    EditCategoryModalComponent,
    PaginationComponent,
    // Import new tab components
    AdminOverviewComponent,
    SkillApprovalsComponent,
    SkillsManagementComponent,
    CategoriesManagementComponent,
    ApplicationsViewComponent,
    UsersManagementComponent,
    ProfileDashboardComponent,
    AdminReportsComponent,
    WorkflowManagementComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isLoading = false;
  activeTab: 'overview' | 'skill-approvals' | 'skills' | 'applications' | 'users' | 'user-profile' | 'categories' | 'reports' | 'workflows' = 'overview';
  
  // Data
  skillApprovals: SkillApproval[] = [];
  adminSkills: AdminSkill[] = [];
  categories: Category[] = [];
  platformStats: PlatformStats = {
    totalUsers: 0,
    totalVendors: 0,
    totalClients: 0,
    totalResources: 0,
    totalRequirements: 0,
    totalApplications: 0,
    pendingApprovals: 0,
    activeSkills: 0,
    monthlyGrowth: {
      users: 0,
      applications: 0,
      placements: 0
    }
  };
  transactions: TransactionData[] = [];
  allUsers: User[] = [];
  allResources: Resource[] = [];
  allRequirements: Requirement[] = [];
  allApplications: Application[] = [];
  
  // Store full datasets for client-side pagination
  private fullApplications: Application[] = [];
  private fullUsers: User[] = [];

  // Modals
  showAddSkillModal = false;
  showAddCategoryModal = false;
  showEditCategoryModal = false;
  showSkillApprovalModal = false;
  showSkillRejectModal = false;
  selectedVendorSkill: VendorSkill | null = null;
  selectedUserForProfile: User | null = null;
  selectedCategoryForEdit: Category | null = null;
  skillRejectNotes = '';
  profileRefreshTrigger = 0; // Trigger to refresh profile data

  // Filters
  transactionFilter = 'all';
  skillFilter = 'all';
  skillApprovalFilter = 'all';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Loading states
  loadingStates = {
    skillApprovals: false,
    skills: false,
    categories: false,
    stats: false,
    transactions: false,
    applications: false,
    users: false
  };

  // Navigation
  navigationTabs: NavigationTab[] = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'skill-approvals', label: 'Vendor Skill', icon: 'check-circle', badge: 0 },
    { id: 'skills', label: 'Skills', icon: 'list' },
    { id: 'categories', label: 'Categories', icon: 'folder' },
    { id: 'applications', label: 'Applications', icon: 'file-text' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'reports', label: 'Reports & Analytics', icon: 'bar-chart-3' },
    { id: 'workflows', label: 'Workflow Management', icon: 'git-branch' }
  ];

  // Get navigation tabs based on user organization role
  get availableNavigationTabs(): NavigationTab[] {
    if (!this.currentUser) {
      console.log('Admin Dashboard: No current user found');
      return [];
    }
    
    console.log('Admin Dashboard: Current user type:', this.currentUser.userType);
    console.log('Admin Dashboard: Current user organizationRole:', this.currentUser.organizationRole);
    
    // Admin owners can see all tabs including workflows
    if (this.currentUser.organizationRole === 'admin_owner') {
      console.log('Admin Dashboard: User is admin owner, showing all tabs');
      return this.navigationTabs;
    }
    
    // Admin employees can see all tabs except workflows
    if (this.currentUser.organizationRole === 'admin_employee') {
      console.log('Admin Dashboard: User is admin employee, hiding workflows tab');
      return this.navigationTabs.filter(tab => tab.id !== 'workflows');
    }
    
    // Admin accounts can see most tabs but not workflows
    if (this.currentUser.organizationRole === 'admin_account') {
      console.log('Admin Dashboard: User is admin account, hiding workflows tab');
      return this.navigationTabs.filter(tab => tab.id !== 'workflows');
    }
    
    // Legacy role support removed - only use organizationRole
    
    // Other users see limited tabs
    console.log('Admin Dashboard: User has no specific role, showing limited tabs');
    return this.navigationTabs.filter(tab => 
      ['overview', 'skill-approvals', 'skills', 'categories'].includes(tab.id)
    );
  }

  // Profile tab list
  profileTabList: { value: 'personal' | 'addresses' | 'bank' | 'compliance', label: string }[] = [
    { value: 'personal', label: 'Personal' },
    { value: 'addresses', label: 'Addresses' },
    { value: 'bank', label: 'Bank' },
    { value: 'compliance', label: 'Compliance' }
  ];

  // Pagination states
  applicationsPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  usersPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  skillApprovalsPaginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private appService: AppService,
    private vendorManagementService: VendorManagementService,
    private workflowService: WorkflowService,
    private router: Router,
    private apiService: ApiService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    // Check authentication state immediately
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.log('Admin Dashboard: No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    // Check if user is admin
    if (user.userType !== 'admin') {
      console.log('Admin Dashboard: User is not admin, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.currentUser = user;
    this.setupSubscriptions();
    await this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions(): void {
    // Subscribe to real-time updates if needed
    this.subscriptions.push(
      this.adminService.platformStats$.subscribe(stats => {
        this.platformStats = stats;
        this.changeDetectorRef.detectChanges();
      })
    );

    this.subscriptions.push(
      this.adminService.transactions$.subscribe(transactions => {
        this.transactions = transactions;
      })
    );

    this.subscriptions.push(
      this.adminService.applications$.subscribe(applications => {
        this.allApplications = applications;
      })
    );
  }

  private async loadDashboardData(): Promise<void> {
    await Promise.all([
      this.loadSkillApprovals(),
      this.loadAdminSkills(),
      this.loadCategories(),
      this.loadPlatformStats(),
      this.loadTransactions(),
      this.loadApplications(),
      this.loadUsers()
    ]);
  }

  private async loadSkillApprovals(): Promise<void> {
    this.skillApprovalsPaginationState.isLoading = true;
    try {
      // Load vendor skills instead of skill approvals
      const response = await firstValueFrom(
        this.apiService.getVendorSkills()
      );
      if (response.success) {
        // Convert vendor skills to the format expected by the UI
        this.skillApprovals = response.data.map((vendorSkill: VendorSkill) => ({
          id: vendorSkill._id,
          skill: vendorSkill,
          status: vendorSkill.status,
          submittedAt: vendorSkill.createdAt,
          reviewNotes: ''
        }));
        console.log('Admin Dashboard: Vendor skills data length:', this.skillApprovals.length);
        
        // Check for pagination data
        const paginationData = response.pagination;
        if (paginationData) {
          console.log('Admin Dashboard: Vendor skills pagination data:', paginationData);
          this.updateSkillApprovalsPagination(paginationData);
        } else {
          console.warn('Admin Dashboard: No pagination data in vendor skills response');
          // Fallback: calculate from data length
          this.updateSkillApprovalsPagination({
            page: this.skillApprovalsPaginationState.currentPage,
            limit: this.skillApprovalsPaginationState.pageSize,
            total: this.skillApprovals.length,
            pages: Math.max(1, Math.ceil(this.skillApprovals.length / this.skillApprovalsPaginationState.pageSize))
          });
        }
      } else {
        console.error('Admin Dashboard: Failed to load vendor skills:', response.message);
      }
    } catch (error) {
      console.error('Admin Dashboard: Error loading vendor skills:', error);
    } finally {
      this.skillApprovalsPaginationState.isLoading = false;
    }
  }

  private async loadAdminSkills(): Promise<void> {
    this.loadingStates.skills = true;
    try {
      const response = await firstValueFrom(this.adminService.getAdminSkills());
      if (response.success) {
        this.adminSkills = response.data;
        if (response.pagination) {
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
        }
      } else {
        console.error('Admin Dashboard: Failed to load skills:', response.message);
      }
    } catch (error) {
      console.error('Error loading admin skills:', error);
    } finally {
      this.loadingStates.skills = false;
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      const response = await firstValueFrom(this.adminService.getCategories());
      if (response.success) {
        this.categories = response.data;
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  private async loadPlatformStats(): Promise<void> {
    console.log('Admin Dashboard: Loading platform stats...');
    this.loadingStates.stats = true;
    try {
      const stats = await firstValueFrom(this.adminService.getPlatformStats());
      console.log('Admin Dashboard: Platform stats loaded:', stats);
      this.platformStats = stats;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Admin Dashboard: Error loading platform stats:', error);
    } finally {
      this.loadingStates.stats = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadTransactions(): Promise<void> {
    this.loadingStates.transactions = true;
    try {
      const transactions = await firstValueFrom(this.adminService.getTransactions());
      this.transactions = transactions;
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      this.loadingStates.transactions = false;
    }
  }

  private async loadApplications(): Promise<void> {
    this.applicationsPaginationState.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.adminService.getApplications(this.applicationsPaginationState.currentPage, this.applicationsPaginationState.pageSize)
      );
      console.log('Admin Dashboard: Full applications response:', response);
      
      if (response.success) {
        this.allApplications = response.data;
        console.log('Admin Dashboard: Applications data length:', this.allApplications.length);
        
        // Check for pagination data
        const paginationData = response.pagination;
        if (paginationData) {
          console.log('Admin Dashboard: Pagination data from response:', paginationData);
          this.updateApplicationsPagination(paginationData);
        } else {
          console.warn('Admin Dashboard: No pagination data in response');
          // Fallback: calculate from data length
          this.updateApplicationsPagination({
            page: this.applicationsPaginationState.currentPage,
            limit: this.applicationsPaginationState.pageSize,
            total: this.allApplications.length,
            pages: Math.max(1, Math.ceil(this.allApplications.length / this.applicationsPaginationState.pageSize))
          });
        }
      } else {
        console.error('Admin Dashboard: Failed to load applications:', response.message);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      this.applicationsPaginationState.isLoading = false;
    }
  }

  private async loadUsers(): Promise<void> {
    this.usersPaginationState.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.adminService.getUsers(this.usersPaginationState.currentPage, this.usersPaginationState.pageSize)
      );
      console.log('Admin Dashboard: Full users response:', response);
      
      if (response.success) {
        this.allUsers = response.data;
        console.log('Admin Dashboard: Users data length:', this.allUsers.length);
        
        // Check for pagination data
        const paginationData = response.pagination;
        if (paginationData) {
          console.log('Admin Dashboard: Pagination data from response:', paginationData);
          this.updateUsersPagination(paginationData);
        } else {
          console.warn('Admin Dashboard: No pagination data in response');
          // Fallback: calculate from data length
          this.updateUsersPagination({
            page: this.usersPaginationState.currentPage,
            limit: this.usersPaginationState.pageSize,
            total: this.allUsers.length,
            pages: Math.max(1, Math.ceil(this.allUsers.length / this.usersPaginationState.pageSize))
          });
        }
      } else {
        console.error('Admin Dashboard: Failed to load users:', response.message);
      }
    } catch (error) {
      console.error('Admin Dashboard: Error loading users:', error);
    } finally {
      this.usersPaginationState.isLoading = false;
    }
  }

  setActiveTab(tab: 'overview' | 'skill-approvals' | 'skills' | 'applications' | 'users' | 'user-profile' | 'categories' | 'reports' | 'workflows'): void {
    this.activeTab = tab;
    
    // Reset pagination states when switching tabs
    this.applicationsPaginationState.currentPage = 1;
    this.usersPaginationState.currentPage = 1;
    this.skillApprovalsPaginationState.currentPage = 1;
    
    this.loadTabData();
  }

  // Helper method to safely set active tab from template
  setActiveTabSafe(id: string): void {
    this.setActiveTab(id as 'overview' | 'skill-approvals' | 'skills' | 'applications' | 'users' | 'user-profile' | 'categories' | 'reports' | 'workflows');
  }

  loadTabData(): void {
    switch (this.activeTab) {
      case 'overview':
        // Reload platform stats when switching to overview tab
        this.loadPlatformStats();
        break;
      case 'skill-approvals':
        this.loadSkillApprovals();
        break;
      case 'skills':
        this.loadAdminSkills();
        break;
      case 'applications':
        this.loadApplications();
        break;
      case 'users':
        this.loadUsers();
        break;
      default:
        // Overview tab - data already loaded
        break;
    }
  }

  // Vendor Skill Approval Management
  openSkillApprovalModal(skill: VendorSkill): void {
    this.selectedVendorSkill = skill;
    this.showSkillApprovalModal = true;
  }

  closeSkillApprovalModal(): void {
    this.showSkillApprovalModal = false;
    this.selectedVendorSkill = null;
  }

  openSkillRejectModal(skill: VendorSkill): void {
    this.selectedVendorSkill = skill;
    this.showSkillRejectModal = true;
    this.skillRejectNotes = '';
  }

  closeSkillRejectModal(): void {
    this.showSkillRejectModal = false;
    this.selectedVendorSkill = null;
    this.skillRejectNotes = '';
  }

  approveSkill(skillId: string): void {
    if (!this.selectedVendorSkill) return;
    
    this.adminService.approveVendorSkill(skillId).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('Vendor skill approved successfully:', response);
          // Update local state
          const skillIndex = this.skillApprovals.findIndex(s => s.id === skillId);
          if (skillIndex !== -1) {
            this.skillApprovals[skillIndex].status = 'approved';
          }
          this.closeSkillApprovalModal();
          // Reload data
          this.loadSkillApprovals();
        } else {
          console.error('Failed to approve vendor skill:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error approving vendor skill:', error);
      }
    });
  }

  rejectSkill(skillId: string, notes: string): void {
    if (!this.selectedVendorSkill) return;
    
    this.adminService.rejectVendorSkill(skillId, notes).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('Vendor skill rejected successfully:', response);
          // Update local state
          const skillIndex = this.skillApprovals.findIndex(s => s.id === skillId);
          if (skillIndex !== -1) {
            this.skillApprovals[skillIndex].status = 'rejected';
            this.skillApprovals[skillIndex].reviewNotes = notes;
          }
          this.closeSkillRejectModal();
          // Reload data
          this.loadSkillApprovals();
        } else {
          console.error('Failed to reject vendor skill:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error rejecting vendor skill:', error);
      }
    });
  }

  // Skill Management
  async toggleSkillStatus(skill: AdminSkill): Promise<void> {
    try {
      const updatedSkill = await this.adminService.updateSkill(skill.id, {
        ...skill,
        isActive: !skill.isActive
      }).toPromise();
    } catch (error) {
      console.error('Error updating skill status:', error);
    }
  }



  // Utility Methods
  getApprovalTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      vendor: 'package',
      client: 'target',
      skill: 'briefcase'
    };
    return icons[type] || 'help-circle';
  }

  isObject(val: any): boolean {
    return val && typeof val === 'object';
  }

  getApprovalTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      vendor: 'text-blue-600 bg-blue-100',
      client: 'text-purple-600 bg-purple-100',
      skill: 'text-green-600 bg-green-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'text-yellow-800 bg-yellow-100',
      approved: 'text-green-800 bg-green-100',
      rejected: 'text-red-800 bg-red-100'
    };
    return colors[status] || 'text-gray-800 bg-gray-100';
  }

  getTransactionTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      application: 'trending-up',
      requirement: 'briefcase',
      resource: 'users',
      user_registration: 'user-plus'
    };
    return icons[type] || 'activity';
  }

  formatTransactionType(type: string): string {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getFilteredTransactions(): TransactionData[] {
    if (this.transactionFilter === 'all') {
      return this.transactions;
    }
    return this.transactions.filter(transaction => transaction.type === this.transactionFilter);
  }

  getFilteredSkills(): AdminSkill[] {
    if (this.skillFilter === 'all') {
      return this.adminSkills;
    }
    // Since AdminSkill doesn't have category, just return all skills
    // or filter by isActive if needed
    return this.adminSkills.filter(skill => skill.isActive === (this.skillFilter === 'active'));
  }

  getFilteredVendorSkills(): VendorSkill[] {
    if (this.skillApprovalFilter === 'all') {
      return this.skillApprovals.map(a => a.skill);
    }
    return this.skillApprovals.filter(a => a.status === this.skillApprovalFilter).map(a => a.skill);
  }

  getPaginatedItems<T>(items: T[]): T[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return items.slice(startIndex, endIndex);
  }

  getTotalPages<T>(items: T[]): number {
    return Math.ceil(items.length / this.itemsPerPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadTabData();
  }

  onApplicationsPageChange(page: number): void {
    this.applicationsPaginationState.currentPage = page;
    this.loadApplications();
  }

  onApplicationStatusUpdate(data: {applicationId: string, status: string, notes?: string}): void {
    console.log('Admin: Application status update requested:', data);
    
    this.adminService.updateApplicationStatus(data.applicationId, data.status, data.notes).subscribe({
      next: (response: any) => {
        if (response.success) {
          console.log('Application status updated successfully:', response);
          // Reload applications to reflect the change
          this.loadApplications();
        } else {
          console.error('Failed to update application status:', response.message);
        }
      },
      error: (error: any) => {
        console.error('Error updating application status:', error);
      }
    });
  }

  onUsersPageChange(page: number): void {
    this.usersPaginationState.currentPage = page;
    this.loadUsers();
  }

  onSkillApprovalsPageChange(page: number): void {
    this.skillApprovalsPaginationState.currentPage = page;
    this.loadSkillApprovals();
  }

  getProficiencyClass(level: string): string {
    const classes: { [key: string]: string } = {
      beginner: 'text-green-600 bg-green-100',
      intermediate: 'text-yellow-600 bg-yellow-100',
      advanced: 'text-blue-600 bg-blue-100',
      expert: 'text-purple-600 bg-purple-100'
    };
    return classes[level] || 'text-gray-600 bg-gray-100';
  }

  getVendorName(vendorId: string): string {
    const vendor = this.allUsers.find(user => user._id === vendorId);
    return vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Unknown Vendor';
  }

  getUserResourceCount(user: User): number {
    return this.allResources.filter(resource => resource.createdBy === user._id).length;
  }

  getUserRequirementCount(user: User): number {
    return this.allRequirements.filter(requirement => requirement.createdBy === user._id).length;
  }

  getUserVendorApplicationCount(user: User): number {
    return this.allApplications.filter(app => app.createdBy === user._id && app.appliedBy === 'vendor').length;
  }

  getUserClientApplicationCount(user: User): number {
    return this.allApplications.filter(app => app.createdBy === user._id && app.appliedBy === 'client').length;
  }

  getGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  isGrowthPositive(growth: number): boolean {
    return growth >= 0;
  }

  isSkillRejectNotesValid(): boolean {
    return this.skillRejectNotes.trim().length >= 10;
  }

  getPendingVendorSkills(): VendorSkill[] {
    return this.skillApprovals.filter(a => a.status === 'pending').map(a => a.skill);
  }

  hasPendingVendorSkills(): boolean {
    return this.skillApprovals.some(a => a.status === 'pending');
  }

  getUserTypeColor(userType: string): string {
    const colors: { [key: string]: string } = {
      vendor: 'text-blue-600 bg-blue-100',
      client: 'text-purple-600 bg-purple-100',
      admin: 'text-red-600 bg-red-100'
    };
    return colors[userType] || 'text-gray-600 bg-gray-100';
  }

  getUserTypeIcon(userType: string): string {
    const icons: { [key: string]: string } = {
      vendor: 'package',
      client: 'target',
      admin: 'shield'
    };
    return icons[userType] || 'user';
  }

  onFilterChange(): void {
    // Trigger re-render of filtered data
    // This is handled by getters in the template
  }

  editSkill(skill: AdminSkill): void {
    // This method is now handled by the Skills Management component
    // The edit functionality is implemented in the child component
    console.log('Edit skill event received from Skills Management:', skill);
  }

  onSkillUpdated(updateData: {skillId: string, skillData: Partial<AdminSkill>}): void {
    console.log('=== ADMIN DASHBOARD SKILL UPDATED ===');
    console.log('Skill updated from Skills Management:', updateData);
    
    // Set loading state for skills
    this.loadingStates.skills = true;
    
    // Call the backend API to update the skill
    this.subscriptions.push(
      this.adminService.updateSkill(updateData.skillId, updateData.skillData).subscribe({
        next: (response) => {
          console.log('Skill updated successfully on backend:', response);
          
          // Refresh the admin skills data to ensure UI shows correct data
          this.loadAdminSkills().then(() => {
            this.loadingStates.skills = false;
            this.changeDetectorRef.detectChanges();
            
            // Show success message (you can add a toast notification here)
            console.log('Skill updated successfully and data refreshed');
          });
        },
        error: (error) => {
          console.error('Error updating skill on backend:', error);
          this.loadingStates.skills = false;
          this.changeDetectorRef.detectChanges();
          
          // Show error message (you can add a toast notification here)
          console.error('Failed to update skill');
        }
      })
    );
    
    console.log('=== END ADMIN DASHBOARD SKILL UPDATED ===');
  }

  editUser(user: User): void {
    this.selectedUserForProfile = user;
    this.setActiveTab('user-profile');
  }

  backToUsers(): void {
    this.selectedUserForProfile = null;
    this.setActiveTab('users');
  }

  approveUserFromProfile(user: User): void {
    if (!user || !user._id) {
      console.error('Invalid user data');
      return;
    }

    this.subscriptions.push(
      this.adminService.approveUser(user._id).subscribe({
        next: (response) => {
          if (response.success) {
            // Update the user's approval status in the profile
            if (this.selectedUserForProfile) {
              this.selectedUserForProfile.approvalStatus = 'approved';
            }
            // Trigger profile refresh
            this.profileRefreshTrigger++;
            // Show success message (you can add a toast notification here)
            console.log('User approved successfully');
          } else {
            console.error('Failed to approve user:', response.message);
          }
        },
        error: (error) => {
          console.error('Error approving user:', error);
        }
      })
    );
  }

  rejectUserFromProfile(user: User, notes: string): void {
    if (!user || !user._id || !notes.trim()) {
      return;
    }
    this.subscriptions.push(
      this.adminService.rejectUser(user._id, notes).subscribe({
        next: (response) => {
          if (response.success) {
            if (this.selectedUserForProfile) {
              this.selectedUserForProfile.approvalStatus = 'rejected';
            }
            // Trigger profile refresh
            this.profileRefreshTrigger++;
            console.log('User rejected successfully');
          } else {
            console.error('Failed to reject user:', response.message);
          }
        },
        error: (error) => {
          console.error('Error rejecting user:', error);
        }
      })
    );
  }

  toggleUserStatus(user: User): void {
    // TODO: Implement user status toggle
    console.log('Toggle user status:', user);
  }

  // Computed properties for template bindings
  get pendingSkillApprovalsCount(): number {
    return this.skillApprovals.filter(a => a.status === 'pending').length;
  }

  get filteredSkillApprovals(): SkillApproval[] {
    return this.skillApprovals;
  }

  get currentPlatformStats(): PlatformStats {
    console.log('Admin Dashboard: Getting current platform stats:', this.platformStats);
    return this.platformStats;
  }

  onSkillAdded(newSkill: AdminSkill): void {
    // Add the new skill to the list
    this.adminSkills = [...this.adminSkills, newSkill];
    
    // Update platform stats
    this.platformStats = {
      ...this.platformStats,
      activeSkills: this.platformStats.activeSkills + 1
    };
  }

  onCategoryAdded(newCategory: Category): void {
    // Add the new category to the list
    this.categories = [...this.categories, newCategory];
    console.log('Category added:', newCategory);
  }

  editCategory(category: Category): void {
    console.log('=== ADMIN DASHBOARD EDIT CATEGORY ===');
    console.log('Edit category called with:', category);
    
    this.selectedCategoryForEdit = category;
    this.showEditCategoryModal = true;
    
    console.log('selectedCategoryForEdit set to:', this.selectedCategoryForEdit);
    console.log('showEditCategoryModal set to:', this.showEditCategoryModal);
    
    this.changeDetectorRef.detectChanges();
    console.log('=== END ADMIN DASHBOARD EDIT CATEGORY ===');
  }



  onCategoryUpdated(updatedCategory: Category): void {
    console.log('=== ADMIN DASHBOARD CATEGORY UPDATED ===');
    console.log('Category updated from Categories Management:', updatedCategory);
    
    // Set loading state for categories
    this.loadingStates.categories = true;
    
    // Call the backend API to update the category
    this.subscriptions.push(
      this.adminService.updateCategory(updatedCategory._id, updatedCategory).subscribe({
        next: (response) => {
          console.log('Category updated successfully on backend:', response);
          
          // Refresh the categories data to ensure UI shows correct data
          this.loadCategories().then(() => {
            this.loadingStates.categories = false;
            this.changeDetectorRef.detectChanges();
            
            // Show success message (you can add a toast notification here)
            console.log('Category updated successfully and data refreshed');
          });
        },
        error: (error) => {
          console.error('Error updating category on backend:', error);
          this.loadingStates.categories = false;
          this.changeDetectorRef.detectChanges();
          
          // Show error message (you can add a toast notification here)
          console.error('Failed to update category');
        }
      })
    );
    
    console.log('=== END ADMIN DASHBOARD CATEGORY UPDATED ===');
  }

  closeEditCategoryModal(): void {
    this.showEditCategoryModal = false;
    this.selectedCategoryForEdit = null;
    this.changeDetectorRef.detectChanges();
  }

  onEditCategorySave(updatedCategoryData: Partial<Category>): void {
    console.log('Category updated in Admin Dashboard:', updatedCategoryData);
    
    if (this.selectedCategoryForEdit) {
      const updatedCategory: Category = {
        ...this.selectedCategoryForEdit,
        name: updatedCategoryData.name || this.selectedCategoryForEdit.name,
        description: updatedCategoryData.description || this.selectedCategoryForEdit.description,
        isActive: updatedCategoryData.isActive !== undefined ? updatedCategoryData.isActive : this.selectedCategoryForEdit.isActive
      };
      
      this.onCategoryUpdated(updatedCategory);
    }
    
    this.closeEditCategoryModal();
  }

  getApplicationTitle(application: any): string {
    if (this.isObject(application.resource)) {
      return application.resource.name || 'Resource';
    }
    if (this.isObject(application.requirement)) {
      return application.requirement.title || 'Requirement';
    }
    return 'Unknown';
  }

  getApplicationCreator(application: any): string {
    if (this.isObject(application.createdBy)) {
      const firstName = application.createdBy.firstName || '';
      const lastName = application.createdBy.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'User';
    }
    return 'User';
  }

  private updateApplicationsPagination(paginationData: any): void {
    this.applicationsPaginationState.currentPage = paginationData.page;
    this.applicationsPaginationState.pageSize = paginationData.limit;
    this.applicationsPaginationState.totalItems = paginationData.total;
    this.applicationsPaginationState.totalPages = paginationData.pages;
    this.applicationsPaginationState.hasNextPage = paginationData.hasNextPage;
    this.applicationsPaginationState.hasPreviousPage = paginationData.hasPreviousPage;
  }

  private updateUsersPagination(paginationData: any): void {
    this.usersPaginationState.currentPage = paginationData.page;
    this.usersPaginationState.pageSize = paginationData.limit;
    this.usersPaginationState.totalItems = paginationData.total;
    this.usersPaginationState.totalPages = paginationData.pages;
    this.usersPaginationState.hasNextPage = paginationData.hasNextPage;
    this.usersPaginationState.hasPreviousPage = paginationData.hasPreviousPage;
  }

  private updateSkillApprovalsPagination(paginationData: any): void {
    this.skillApprovalsPaginationState.currentPage = paginationData.page;
    this.skillApprovalsPaginationState.pageSize = paginationData.limit;
    this.skillApprovalsPaginationState.totalItems = paginationData.total;
    this.skillApprovalsPaginationState.totalPages = paginationData.pages;
    this.skillApprovalsPaginationState.hasNextPage = paginationData.hasNextPage;
    this.skillApprovalsPaginationState.hasPreviousPage = paginationData.hasPreviousPage;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}