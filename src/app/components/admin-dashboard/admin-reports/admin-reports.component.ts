import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { CustomReportBuilderComponent } from '../custom-report-builder/custom-report-builder.component';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomReportBuilderComponent],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss']
})
export class AdminReportsComponent implements OnInit, OnDestroy {
  // Report types
  reportTypes = [
    { id: 'user-registration', label: 'User Registration & Approval', icon: 'users' },
    { id: 'resources', label: 'Resources Analytics', icon: 'briefcase' },
    { id: 'requirements', label: 'Requirements Analytics', icon: 'file-text' },
    { id: 'applications', label: 'Applications Analytics', icon: 'clipboard-list' },
    { id: 'skills', label: 'Skills Analytics', icon: 'award' },
    { id: 'financial', label: 'Financial Reports', icon: 'dollar-sign' },
    { id: 'monthly-growth', label: 'Monthly Growth Trends', icon: 'trending-up' },
    { id: 'custom-builder', label: 'Custom Report Builder', icon: 'settings' }
  ];

  selectedReport = 'user-registration';
  dateRange = 'month'; // week, month, quarter, year, custom
  startDate = '';
  endDate = '';
  isLoading = false;

  // Data containers
  userRegistrationData: any = {};
  resourcesData: any = {};
  requirementsData: any = {};
  applicationsData: any = {};
  skillsData: any = {};
  financialData: any = {};
  monthlyGrowthData: any = {};

  // Charts
  charts: { [key: string]: Chart | null } = {};

  private subscriptions = new Subscription();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Set default custom dates (last 30 days) if none are set
    if (!this.startDate || !this.endDate) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      this.startDate = startDate.toISOString().split('T')[0];
      this.endDate = endDate.toISOString().split('T')[0];
    }
    
    this.loadReport();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroyCharts();
  }

  onReportChange(): void {
    this.loadReport();
  }

  onDateRangeChange(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading = true;
    this.destroyCharts();

    const params = this.buildQueryParams();

    switch (this.selectedReport) {
      case 'user-registration':
        this.loadUserRegistrationReport(params);
        break;
      case 'resources':
        this.loadResourcesReport(params);
        break;
      case 'requirements':
        this.loadRequirementsReport(params);
        break;
      case 'applications':
        this.loadApplicationsReport(params);
        break;
      case 'skills':
        this.loadSkillsReport(params);
        break;
      case 'financial':
        this.loadFinancialReport(params);
        break;
      case 'monthly-growth':
        this.loadMonthlyGrowthReport(params);
        break;
    }
  }

  private buildQueryParams(): any {
    const params: any = { period: this.dateRange };
    
    if (this.dateRange === 'custom') {
      if (this.startDate && this.endDate) {
        params.startDate = this.startDate;
        params.endDate = this.endDate;
      } else {
        params.period = 'month'; // Fallback to month if custom dates are not set
      }
    }
    
    return params;
  }

  private loadUserRegistrationReport(params: any): void {
    this.subscriptions.add(
      this.apiService.getUserRegistrationReport(params).subscribe({
        next: (response) => {
          this.userRegistrationData = response.data || response;
          this.createUserRegistrationCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        }
      })
    );
  }

  private loadResourcesReport(params: any): void {
    this.subscriptions.add(
      this.apiService.getResourcesReport(params).subscribe({
        next: (response) => {
          this.resourcesData = response.data || response;
          this.createResourcesCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        }
      })
    );
  }

  private loadRequirementsReport(params: any): void {
    this.subscriptions.add(
      this.apiService.getRequirementsReport(params).subscribe({
        next: (response) => {
          this.requirementsData = response.data || response;
          this.createRequirementsCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        }
      })
    );
  }

  private loadApplicationsReport(params: any): void {
    this.subscriptions.add(
      this.apiService.getApplicationsReport(params).subscribe({
        next: (response) => {
          this.applicationsData = response.data || response;
          this.createApplicationsCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        }
      })
    );
  }

  private loadSkillsReport(params: any): void {
    this.subscriptions.add(
      this.apiService.getSkillsReport(params).subscribe({
        next: (response) => {
          this.skillsData = response.data || response;
          this.createSkillsCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        }
      })
    );
  }

  private loadFinancialReport(params: any): void {
    this.subscriptions.add(
      this.apiService.getFinancialReport(params).subscribe({
        next: (response) => {
          this.financialData = response.data || response;
          this.createFinancialCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        }
      })
    );
  }

  private loadMonthlyGrowthReport(params: any): void {
    this.subscriptions.add(
      this.apiService.getMonthlyGrowthReport(params).subscribe({
        next: (response) => {
          this.monthlyGrowthData = response.data || response;
          this.createMonthlyGrowthCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        }
      })
    );
  }

  private createUserRegistrationCharts(): void {
    // User registration trend chart
    const ctx = document.getElementById('userRegistrationChart') as HTMLCanvasElement;
    if (ctx) {
      this.charts['userRegistration'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.userRegistrationData.timeline?.map((item: any) => item.date) || [],
          datasets: [
            {
              label: 'Total Users',
              data: this.userRegistrationData.timeline?.map((item: any) => item.totalUsers) || [],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.1
            },
            {
              label: 'Vendors',
              data: this.userRegistrationData.timeline?.map((item: any) => item.vendors) || [],
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.1
            },
            {
              label: 'Clients',
              data: this.userRegistrationData.timeline?.map((item: any) => item.clients) || [],
              borderColor: 'rgb(245, 158, 11)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'User Registration Trends'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // User approval status chart
    const approvalCtx = document.getElementById('userApprovalChart') as HTMLCanvasElement;
    if (approvalCtx) {
      this.charts['userApproval'] = new Chart(approvalCtx, {
        type: 'doughnut',
        data: {
          labels: ['Approved', 'Pending', 'Rejected'],
          datasets: [{
            data: [
              this.userRegistrationData.approvalStats?.approved || 0,
              this.userRegistrationData.approvalStats?.pending || 0,
              this.userRegistrationData.approvalStats?.rejected || 0
            ],
            backgroundColor: [
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'User Approval Status'
            }
          }
        }
      });
    }
  }

  private createResourcesCharts(): void {
    // Resources by vendor chart
    const ctx = document.getElementById('resourcesByVendorChart') as HTMLCanvasElement;
    if (ctx) {
      this.charts['resourcesByVendor'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.resourcesData.byVendor?.map((item: any) => item.vendorName) || [],
          datasets: [{
            label: 'Resources Count',
            data: this.resourcesData.byVendor?.map((item: any) => item.resourceCount) || [],
            backgroundColor: 'rgba(59, 130, 246, 0.8)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Resources by Vendor'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // Resources by skill chart
    const skillCtx = document.getElementById('resourcesBySkillChart') as HTMLCanvasElement;
    if (skillCtx) {
      this.charts['resourcesBySkill'] = new Chart(skillCtx, {
        type: 'doughnut',
        data: {
          labels: this.resourcesData.bySkill?.map((item: any) => item.skillName) || [],
          datasets: [{
            data: this.resourcesData.bySkill?.map((item: any) => item.resourceCount) || [],
            backgroundColor: [
              'rgb(59, 130, 246)',
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(139, 92, 246)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Resources by Skill'
            }
          }
        }
      });
    }
  }

  private createRequirementsCharts(): void {
    // Requirements by client chart
    const ctx = document.getElementById('requirementsByClientChart') as HTMLCanvasElement;
    if (ctx) {
      this.charts['requirementsByClient'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.requirementsData.byClient?.map((item: any) => item.clientName) || [],
          datasets: [{
            label: 'Requirements Count',
            data: this.requirementsData.byClient?.map((item: any) => item.requirementCount) || [],
            backgroundColor: 'rgba(16, 185, 129, 0.8)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Requirements by Client'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // Requirements by status chart
    const statusCtx = document.getElementById('requirementsByStatusChart') as HTMLCanvasElement;
    if (statusCtx) {
      this.charts['requirementsByStatus'] = new Chart(statusCtx, {
        type: 'pie',
        data: {
          labels: this.requirementsData.byStatus?.map((item: any) => item.status) || [],
          datasets: [{
            data: this.requirementsData.byStatus?.map((item: any) => item.count) || [],
            backgroundColor: [
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(107, 114, 128)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Requirements by Status'
            }
          }
        }
      });
    }
  }

  private createApplicationsCharts(): void {
    // Applications by status chart
    const ctx = document.getElementById('applicationsByStatusChart') as HTMLCanvasElement;
    if (ctx) {
      this.charts['applicationsByStatus'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.applicationsData.byStatus?.map((item: any) => item.status) || [],
          datasets: [{
            data: this.applicationsData.byStatus?.map((item: any) => item.count) || [],
            backgroundColor: [
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(107, 114, 128)',
              'rgb(59, 130, 246)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Applications by Status'
            }
          }
        }
      });
    }

    // Applications timeline chart
    const timelineCtx = document.getElementById('applicationsTimelineChart') as HTMLCanvasElement;
    if (timelineCtx) {
      this.charts['applicationsTimeline'] = new Chart(timelineCtx, {
        type: 'line',
        data: {
          labels: this.applicationsData.timeline?.map((item: any) => item.date) || [],
          datasets: [{
            label: 'Applications',
            data: this.applicationsData.timeline?.map((item: any) => item.count) || [],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Applications Timeline'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private createSkillsCharts(): void {
    // Top skills for resources chart
    const resourceCtx = document.getElementById('topSkillsForResourcesChart') as HTMLCanvasElement;
    if (resourceCtx) {
      this.charts['topSkillsForResources'] = new Chart(resourceCtx, {
        type: 'bar',
        data: {
          labels: this.skillsData.topSkillsForResources?.map((item: any) => item.skillName) || [],
          datasets: [{
            label: 'Resource Count',
            data: this.skillsData.topSkillsForResources?.map((item: any) => item.resourceCount) || [],
            backgroundColor: 'rgba(59, 130, 246, 0.8)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Top Skills for Resources'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // Top skills for requirements chart
    const requirementCtx = document.getElementById('topSkillsForRequirementsChart') as HTMLCanvasElement;
    if (requirementCtx) {
      this.charts['topSkillsForRequirements'] = new Chart(requirementCtx, {
        type: 'bar',
        data: {
          labels: this.skillsData.topSkillsForRequirements?.map((item: any) => item.skillName) || [],
          datasets: [{
            label: 'Requirement Count',
            data: this.skillsData.topSkillsForRequirements?.map((item: any) => item.requirementCount) || [],
            backgroundColor: 'rgba(16, 185, 129, 0.8)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Top Skills for Requirements'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private createFinancialCharts(): void {
    // SOW, PO, Invoice counts chart
    const ctx = document.getElementById('financialCountsChart') as HTMLCanvasElement;
    if (ctx) {
      this.charts['financialCounts'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['SOWs', 'POs', 'Invoices'],
          datasets: [{
            label: 'Count',
            data: [
              this.financialData.sowCount || 0,
              this.financialData.poCount || 0,
              this.financialData.invoiceCount || 0
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Financial Document Counts'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // Invoice status chart
    const invoiceCtx = document.getElementById('invoiceStatusChart') as HTMLCanvasElement;
    if (invoiceCtx) {
      this.charts['invoiceStatus'] = new Chart(invoiceCtx, {
        type: 'doughnut',
        data: {
          labels: ['Paid', 'Pending', 'Past Due'],
          datasets: [{
            data: [
              this.financialData.invoiceStats?.paid || 0,
              this.financialData.invoiceStats?.pending || 0,
              this.financialData.invoiceStats?.pastDue || 0
            ],
            backgroundColor: [
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Invoice Status Distribution'
            }
          }
        }
      });
    }
  }

  private createMonthlyGrowthCharts(): void {
    // Monthly growth trends chart
    const ctx = document.getElementById('monthlyGrowthChart') as HTMLCanvasElement;
    if (ctx) {
      this.charts['monthlyGrowth'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.monthlyGrowthData.timeline?.map((item: any) => item.month) || [],
          datasets: [
            {
              label: 'Users',
              data: this.monthlyGrowthData.timeline?.map((item: any) => item.users) || [],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.1
            },
            {
              label: 'Resources',
              data: this.monthlyGrowthData.timeline?.map((item: any) => item.resources) || [],
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.1
            },
            {
              label: 'Requirements',
              data: this.monthlyGrowthData.timeline?.map((item: any) => item.requirements) || [],
              borderColor: 'rgb(245, 158, 11)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.1
            },
            {
              label: 'Applications',
              data: this.monthlyGrowthData.timeline?.map((item: any) => item.applications) || [],
              borderColor: 'rgb(139, 92, 246)',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Growth Trends'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private destroyCharts(): void {
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
  }

  exportReport(): void {
    // TODO: Implement report export functionality
  }
} 