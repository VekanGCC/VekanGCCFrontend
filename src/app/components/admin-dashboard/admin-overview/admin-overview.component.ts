import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillApproval, PlatformStats } from '../../../models/admin.model';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss']
})
export class AdminOverviewComponent implements OnChanges {
  @Input() skillApprovals: SkillApproval[] = [];
  @Input() platformStats: PlatformStats = {
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

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['platformStats']) {
      console.log('Admin Overview: Platform stats changed:', this.platformStats);
    }
    if (changes['skillApprovals']) {
      console.log('Admin Overview: Skill approvals changed:', this.skillApprovals);
    }
  }

  getStatusBadge(status: string): { color: string; icon: string } {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: 'assets/icons/lucide/lucide/clock.svg' };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: 'assets/icons/lucide/lucide/check-circle.svg' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: 'assets/icons/lucide/lucide/x-circle.svg' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: 'assets/icons/lucide/lucide/help-circle.svg' };
    }
  }

  trackById(index: number, item: any): string {
    return item.id || `item-${index}`;
  }
} 