import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ApplicationFiltersComponent, ApplicationFilters } from '../../shared/application-filters/application-filters.component';
import { EnhancedApplicationService, Application, ApplicationCounts } from '../../../services/enhanced-application.service';
import { ApplicationStatusService } from '../../../services/application-status.service';

@Component({
  selector: 'app-enhanced-vendor-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, ApplicationFiltersComponent],
  template: `
    <div class="enhanced-applications-container">
      <!-- Header -->
      <div class="page-header">
        <h1>My Applications</h1>
        <p class="subtitle">Manage and track your resource applications</p>
      </div>

      <!-- Application Filters -->
      <app-application-filters
        [totalCounts]="applicationCounts"
        (filtersChanged)="onFiltersChanged($event)"
      ></app-application-filters>

      <!-- Applications Table -->
      <div class="applications-table-container">
        <div class="table-header">
          <div class="table-title">
            <h3>Applications</h3>
            <span class="results-count" *ngIf="applicationsResponse">
              Showing {{ applicationsResponse.data.length }} of {{ applicationsResponse.pagination?.total || 0 }} applications
            </span>
          </div>
          
          <!-- Sort Controls -->
          <div class="sort-controls">
            <select 
              [(ngModel)]="sortBy" 
              (change)="onSortChange()"
              class="sort-select"
            >
              <option value="createdAt">Date Created</option>
              <option value="status">Status</option>
              <option value="requirement.title">Requirement</option>
              <option value="resource.name">Resource</option>
            </select>
            
            <button 
              (click)="toggleSortOrder()" 
              class="sort-order-btn"
              [class.asc]="sortOrder === 'asc'"
            >
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Loading applications...</p>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="error">
          <p class="error-message">{{ error }}</p>
          <button (click)="retryLoad()" class="retry-btn">Retry</button>
        </div>

        <!-- Applications Table -->
        <div class="table-wrapper" *ngIf="!loading && !error && applicationsResponse">
          <table class="applications-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Resource</th>
                <th>Status</th>
                <th>Proposed Rate</th>
                <th>Availability</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let application of applicationsResponse.data" class="application-row">
                <td class="requirement-cell">
                  <div class="requirement-info">
                    <strong>{{ application.requirement.title }}</strong>
                    <span class="priority-badge" [class]="'priority-' + application.requirement.priority">
                      {{ application.requirement.priority }}
                    </span>
                  </div>
                </td>
                
                <td class="resource-cell">
                  <div class="resource-info">
                    <strong>{{ application.resource.name }}</strong>
                    <span class="category-badge">{{ application.resource.category }}</span>
                  </div>
                </td>
                
                <td class="status-cell">
                  <span 
                    class="status-badge" 
                    [class]="getStatusBadgeClass(application.status)"
                  >
                    {{ formatStatus(application.status) }}
                  </span>
                </td>
                
                <td class="rate-cell">
                  <div *ngIf="application.proposedRate" class="rate-info">
                    <span class="amount">{{ application.proposedRate.currency }} {{ application.proposedRate.amount }}</span>
                    <span class="type">{{ application.proposedRate.type }}</span>
                  </div>
                  <span *ngIf="!application.proposedRate" class="no-rate">Not specified</span>
                </td>
                
                <td class="availability-cell">
                  <div *ngIf="application.availability" class="availability-info">
                    <span class="start-date">{{ application.availability.startDate | date:'shortDate' }}</span>
                    <span class="hours">{{ application.availability.hoursPerWeek }}h/week</span>
                  </div>
                  <span *ngIf="!application.availability" class="no-availability">Not specified</span>
                </td>
                
                <td class="created-cell">
                  <span class="date">{{ application.createdAt | date:'shortDate' }}</span>
                  <span class="time">{{ application.createdAt | date:'shortTime' }}</span>
                </td>
                
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button 
                      (click)="viewApplication(application._id)" 
                      class="btn-view"
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button 
                      (click)="updateStatus(application._id)" 
                      class="btn-edit"
                      title="Update Status"
                    >
                      ✏️
                    </button>
                    <button 
                      (click)="viewHistory(application._id)" 
                      class="btn-history"
                      title="View History"
                    >
                      📋
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="applicationsResponse.data.length === 0">
            <div class="empty-icon">📋</div>
            <h3>No applications found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button (click)="clearFilters()" class="clear-filters-btn">Clear Filters</button>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-container" *ngIf="applicationsResponse?.pagination && applicationsResponse.pagination.pages > 1">
          <div class="pagination-info">
            <span>Page {{ applicationsResponse.pagination.page }} of {{ applicationsResponse.pagination.pages }}</span>
          </div>
          
          <div class="pagination-controls">
            <button 
              (click)="goToPage(applicationsResponse.pagination.page - 1)"
              [disabled]="applicationsResponse.pagination.page <= 1"
              class="pagination-btn"
            >
              Previous
            </button>
            
            <div class="page-numbers">
              <button 
                *ngFor="let page of getPageNumbers(applicationsResponse.pagination)"
                (click)="goToPage(page)"
                [class.active]="page === applicationsResponse.pagination.page"
                class="page-btn"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              (click)="goToPage(applicationsResponse.pagination.page + 1)"
              [disabled]="applicationsResponse.pagination.page >= applicationsResponse.pagination.pages"
              class="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./enhanced-vendor-applications.component.scss']
})
export class EnhancedVendorApplicationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  applicationsResponse: any = null;
  applicationCounts: ApplicationCounts = { active: 0, inactive: 0, all: 0 };
  
  // UI State
  loading = false;
  error: string | null = null;
  
  // Sorting
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private enhancedApplicationService: EnhancedApplicationService,
    private applicationStatusService: ApplicationStatusService
  ) {}

  ngOnInit() {
    this.loadApplications();
    this.loadApplicationCounts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplications() {
    this.loading = true;
    this.error = null;

    this.enhancedApplicationService.applications$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.applicationsResponse = response;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load applications. Please try again.';
          this.loading = false;
          console.error('Error loading applications:', err);
        }
      });
  }

  private loadApplicationCounts() {
    this.enhancedApplicationService.applicationCounts$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (counts) => {
          this.applicationCounts = counts;
        },
        error: (err) => {
          console.error('Error loading application counts:', err);
        }
      });
  }

  onFiltersChanged(filters: ApplicationFilters) {
    this.enhancedApplicationService.updateFilters(filters);
  }

  onSortChange() {
    this.enhancedApplicationService.updateSort(this.sortBy, this.sortOrder);
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.enhancedApplicationService.updateSort(this.sortBy, this.sortOrder);
  }

  goToPage(page: number) {
    this.enhancedApplicationService.updatePage(page);
  }

  retryLoad() {
    this.loadApplications();
  }

  clearFilters() {
    this.enhancedApplicationService.clearAllFilters();
  }

  viewApplication(applicationId: string) {
    // Navigate to application details
    console.log('View application:', applicationId);
  }

  updateStatus(applicationId: string) {
    // Open status update modal
    console.log('Update status for application:', applicationId);
  }

  viewHistory(applicationId: string) {
    // Open history modal
    console.log('View history for application:', applicationId);
  }

  getPageNumbers(pagination: any): number[] {
    const pages: number[] = [];
    const currentPage = pagination.page;
    const totalPages = pagination.pages;
    
    // Show up to 5 pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatStatus(status: string): string {
    return this.enhancedApplicationService.formatStatus(status);
  }

  getStatusBadgeClass(status: string): string {
    return this.enhancedApplicationService.getStatusBadgeClass(status);
  }
} 