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
        if (response.success) {
          this.skillApprovals = response.data;
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
    if (this.skillApprovalFilter === 'all') return this.skillApprovals;
    return this.skillApprovals.filter(a => a.status === this.skillApprovalFilter);
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
    this.loadSkillApprovals();
  }

  onPageChange(page: number): void {
    this.paginationState.currentPage = page;
    this.loadSkillApprovals();
  }

  onOpenApprovalModal(skill: VendorSkill): void {
    // TODO: Implement approval modal
    console.log('Opening approval modal for skill:', skill);
  }

  onOpenRejectModal(skill: VendorSkill): void {
    // TODO: Implement reject modal
    console.log('Opening reject modal for skill:', skill);
  }

  trackById(index: number, item: any): string {
    return item.id || `item-${index}`;
  }

  refreshData(): void {
    this.loadSkillApprovals();
  }
} 