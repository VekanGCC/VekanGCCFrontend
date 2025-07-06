import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class SkillApprovalsComponent {
  @Input() skillApprovals: SkillApproval[] = [];
  @Input() skillApprovalFilter: string = 'all';
  @Input() paginationState: PaginationState = {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
    hasNextPage: false,
    hasPreviousPage: false
  };

  @Output() filterChange = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() openApprovalModal = new EventEmitter<VendorSkill>();
  @Output() openRejectModal = new EventEmitter<VendorSkill>();

  constructor() {}

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
    this.filterChange.emit();
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onOpenApprovalModal(skill: VendorSkill): void {
    this.openApprovalModal.emit(skill);
  }

  onOpenRejectModal(skill: VendorSkill): void {
    this.openRejectModal.emit(skill);
  }

  trackById(index: number, item: any): string {
    return item.id || `item-${index}`;
  }
} 