import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { LayoutComponent } from '../layout/layout.component';

interface NavigationTab {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  route: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LayoutComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  showMobileMenu = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Check authentication and initialize
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (user.userType !== 'admin') {
      this.router.navigate(['/']);
      return;
    }

    this.currentUser = user;

    // Subscribe to user changes
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return;
        }
        if (user.userType !== 'admin') {
          this.router.navigate(['/']);
          return;
        }
        this.currentUser = user;
      })
    );
  }

  // Navigation methods
  navigateToTab(tabId: string): void {
    this.router.navigate(['/admin', tabId]);
    this.showMobileMenu = false; // Close mobile menu on navigation
  }

  // Layout methods
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  // User management
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Get available menu items based on user role
  getAvailableMenuItems(): NavigationTab[] {
    const allMenuItems: NavigationTab[] = [
      { id: 'overview', label: 'Overview', icon: 'home.svg', route: '/admin/overview' },
      { id: 'skill-approvals', label: 'Vendor Skill Approvals', icon: 'check-circle.svg', route: '/admin/skill-approvals' },
      { id: 'skills', label: 'Skills Management', icon: 'list.svg', route: '/admin/skills' },
      { id: 'categories', label: 'Categories Management', icon: 'folder.svg', route: '/admin/categories' },
      { id: 'applications', label: 'Applications', icon: 'file-text.svg', route: '/admin/applications' },
      { id: 'users', label: 'Users Management', icon: 'users.svg', route: '/admin/users' },
      { id: 'reports', label: 'Reports & Analytics', icon: 'bar-chart-3.svg', route: '/admin/reports' },
      { id: 'custom-report-builder', label: 'Custom Report Builder', icon: 'pie-chart.svg', route: '/admin/custom-report-builder' },
      { id: 'workflows', label: 'Workflow Management', icon: 'git-branch.svg', route: '/admin/workflows' }
    ];

    // Filter based on user organization role
    if (this.currentUser?.organizationRole === 'admin_owner') {
      return allMenuItems; // Show all items
    }
    
    if (this.currentUser?.organizationRole === 'admin_employee') {
      return allMenuItems.filter(item => item.id !== 'workflows'); // Hide workflows
    }
    
    if (this.currentUser?.organizationRole === 'admin_account') {
      return allMenuItems.filter(item => item.id !== 'workflows'); // Hide workflows
    }
    
    // Default: show limited items
    return allMenuItems.filter(item => 
      ['overview', 'skill-approvals', 'skills', 'categories'].includes(item.id)
    );
  }

  // Check if current route is active
  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}