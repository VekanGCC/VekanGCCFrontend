import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { SkillApproval } from '../../../models/admin.model';
import { VendorSkill } from '../../../models/vendor-skill.model';
import { PaginationComponent } from '../../pagination/pagination.component';
import { PaginationState } from '../../../models/pagination.model';

@Component({
  selector: 'app-skill-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './skill-approvals.component.html',
  styleUrls: ['./skill-approvals.component.scss']
})
export class SkillApprovalsComponent implements OnInit {
  skillApprovals: SkillApproval[] = [];
  skillApprovalFilter: string = 'all';
  paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };
  isLoading = false;
  error: string | null = null;
  
  // Modal properties
  showRejectModal = false;
  showApproveModal = false;
  showViewModal = false;
  selectedSkill: VendorSkill | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    console.log('🔧 SkillApprovalsComponent: ngOnInit called');
    this.loadSkillApprovals();
  }

  loadSkillApprovals(): void {
    console.log('🔄 SkillApprovals: Loading skill approvals...');
    this.isLoading = true;
    this.error = null;

    this.adminService.getSkillApprovals(this.paginationState.currentPage, this.paginationState.pageSize).subscribe({
      next: (response) => {
        console.log('✅ SkillApprovals: Skill approvals loaded:', response);
        console.log('🔧 SkillApprovals: Raw data:', response.data);
        console.log('🔧 SkillApprovals: Data length:', response.data?.length);
        if (response.success) {
          this.skillApprovals = response.data;
          console.log('🔧 SkillApprovals: Set skillApprovals to:', this.skillApprovals);
          console.log('🔧 SkillApprovals: Filtered skills:', this.filteredSkillApprovals);
          this.paginationState = {
            currentPage: response.pagination?.page || 1,
            pageSize: response.pagination?.limit || 10,
            totalItems: response.pagination?.total || 0,
            totalPages: response.pagination?.totalPages || 0,
            isLoading: false,
            hasNextPage: (response.pagination?.page || 1) < (response.pagination?.totalPages || 0),
            hasPreviousPage: (response.pagination?.page || 1) > 1
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ SkillApprovals: Error loading skill approvals:', error);
        this.error = 'Failed to load skill approvals';
        this.isLoading = false;
      }
    });
  }

  get filteredSkillApprovals(): SkillApproval[] {
    console.log('🔧 SkillApprovals: Filtering with status:', this.skillApprovalFilter);
    console.log('🔧 SkillApprovals: Total skills:', this.skillApprovals.length);
    console.log('🔧 SkillApprovals: Skills statuses:', this.skillApprovals.map(s => s.status));
    
    if (this.skillApprovalFilter === 'all') {
      console.log('🔧 SkillApprovals: Returning all skills:', this.skillApprovals.length);
      return this.skillApprovals;
    }
    
    const filtered = this.skillApprovals.filter(a => a.status === this.skillApprovalFilter);
    console.log('🔧 SkillApprovals: Filtered skills for status', this.skillApprovalFilter, ':', filtered.length);
    return filtered;
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

  onFilterChange(): void {
    // Don't reload from server, just apply client-side filter
    // The filteredSkillApprovals getter will handle the filtering
    console.log('🔧 SkillApprovals: Filter changed to:', this.skillApprovalFilter);
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadSkillApprovals();
  }

  onOpenApprovalModal(skill: VendorSkill): void {
    console.log('Opening approval modal for skill:', skill);
    this.selectedSkill = skill;
    this.showApproveModal = true;
  }

  onOpenRejectModal(skill: VendorSkill): void {
    console.log('Opening reject modal for skill:', skill);
    this.selectedSkill = skill;
    this.showRejectModal = true;
  }

  onViewDetails(skill: VendorSkill): void {
    console.log('Viewing details for skill:', skill);
    this.selectedSkill = skill;
    this.showViewModal = true;
  }

  trackById(index: number, item: any): string {
    return item.id || `item-${index}`;
  }

  refreshData(): void {
    this.loadSkillApprovals();
  }

  private approveSkill(skill: VendorSkill): void {
    console.log('Approving skill:', skill);
    this.adminService.approveVendorSkill(skill._id).subscribe({
      next: (response: any) => {
        console.log('✅ Skill approved successfully:', response);
        this.showSuccessMessage('Skill approved successfully!');
        // Reset to first page and reload data to ensure we see the updated skill
        this.paginationState.currentPage = 1;
        this.loadSkillApprovals(); // Reload the data
        this.closeApproveModal();
      },
      error: (error: any) => {
        console.error('❌ Error approving skill:', error);
        this.showErrorMessage('Failed to approve skill. Please try again.');
      }
    });
  }

  private rejectSkill(skill: VendorSkill, reason: string): void {
    console.log('Rejecting skill:', skill, 'Reason:', reason);
    this.adminService.rejectVendorSkill(skill._id, reason).subscribe({
      next: (response: any) => {
        console.log('✅ Skill rejected successfully:', response);
        this.showSuccessMessage('Skill rejected successfully!');
        // Reset to first page and reload data to ensure we see the updated skill
        this.paginationState.currentPage = 1;
        this.loadSkillApprovals(); // Reload the data
        this.closeRejectModal();
      },
      error: (error: any) => {
        console.error('❌ Error rejecting skill:', error);
        this.showErrorMessage('Failed to reject skill. Please try again.');
      }
    });
  }

  onRejectConfirm(reason: string): void {
    if (!reason || !reason.trim()) {
      this.showErrorMessage('Please provide a rejection reason.');
      return;
    }
    
    if (this.selectedSkill) {
      this.rejectSkill(this.selectedSkill, reason.trim());
    }
  }

  onApproveConfirm(): void {
    if (this.selectedSkill) {
      this.approveSkill(this.selectedSkill);
    }
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedSkill = null;
  }

  closeApproveModal(): void {
    this.showApproveModal = false;
    this.selectedSkill = null;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedSkill = null;
  }

  showSuccessMessage(message: string): void {
    // Create a temporary success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-in-out';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);

    // Remove after 3 seconds
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }

  showErrorMessage(message: string): void {
    // Create a temporary error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ease-in-out';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    // Remove after 3 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }
} 