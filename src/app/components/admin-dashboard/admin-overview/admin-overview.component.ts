import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { SkillApproval, PlatformStats } from '../../../models/admin.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-overview.component.scss']
})
export class AdminOverviewComponent implements OnInit, OnDestroy {
  skillApprovals: SkillApproval[] = [];
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
  isLoading = false;
  error: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    console.log('🔧 AdminOverviewComponent: ngOnInit called');
    this.loadOverviewData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadOverviewData(): void {
    console.log('🔄 AdminOverview: Loading overview data...');
    this.isLoading = true;
    this.error = null;

    // Load platform statistics
    const statsSubscription = this.adminService.getPlatformStats().subscribe({
      next: (stats) => {
        console.log('✅ AdminOverview: Platform stats loaded:', stats);
        this.platformStats = stats;
      },
      error: (error) => {
        console.error('❌ AdminOverview: Error loading platform stats:', error);
        this.error = 'Failed to load platform statistics';
        // Set default stats if API fails
        this.platformStats = {
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
      }
    });

    // Load recent skill approvals
    const approvalsSubscription = this.adminService.getSkillApprovals(1, 5).subscribe({
      next: (response) => {
        console.log('✅ AdminOverview: Skill approvals loaded:', response);
        if (response.success) {
          this.skillApprovals = response.data;
        } else {
          this.skillApprovals = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ AdminOverview: Error loading skill approvals:', error);
        this.skillApprovals = [];
        if (!this.error) {
          this.error = 'Failed to load skill approvals';
        }
        this.isLoading = false;
      }
    });

    this.subscriptions.push(statsSubscription, approvalsSubscription);
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

  refreshData(): void {
    this.error = null;
    this.loadOverviewData();
  }
} 