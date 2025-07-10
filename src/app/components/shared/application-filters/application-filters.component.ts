import { Component, OnInit, OnChanges, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationStatusService, ApplicationStatusMapping } from '../../../services/application-status.service';

export interface ApplicationFilters {
  category: 'active' | 'inactive' | 'all';
  statuses: string[];
  searchTerm?: string;
}

@Component({
  selector: 'app-application-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="application-filters">
      <!-- Category Tabs -->
      <div class="category-tabs">
        <button 
          *ngFor="let category of categories" 
          [class.active]="selectedCategory === category.value"
          (click)="selectCategory(category.value)"
          class="category-tab"
        >
          <span class="tab-label">{{ category.label }}</span>
          <span class="tab-count" *ngIf="category.count !== undefined">({{ category.count }})</span>
        </button>
      </div>

      <!-- Status Filter Dropdown -->
      <div class="status-filter-dropdown" *ngIf="statusMapping">
        <div class="filter-header">
          <h4>Filter by Status</h4>
        </div>
        
        <div class="dropdown-container">
          <div 
            class="dropdown-trigger"
            (click)="toggleDropdown()"
            [class.open]="isDropdownOpen"
          >
            <span class="selected-text">
              {{ getSelectedStatusText() }}
            </span>
            <span class="dropdown-arrow">▼</span>
          </div>
          
          <div class="dropdown-menu" *ngIf="isDropdownOpen">
            <div class="dropdown-actions">
              <button 
                (click)="selectAllStatuses()" 
                class="action-btn select-all"
                type="button"
              >
                Select All
              </button>
              <button 
                (click)="clearAllStatuses()" 
                class="action-btn clear-all"
                type="button"
              >
                Clear All
              </button>
            </div>
            
            <div class="dropdown-divider"></div>
            
            <div class="status-options">
              <div 
                *ngFor="let status of availableStatuses" 
                class="status-option"
                (click)="toggleStatus(status)"
              >
                <input 
                  type="checkbox" 
                  [id]="'status-' + status"
                  [checked]="selectedStatuses.includes(status)"
                  (click)="$event.stopPropagation()"
                  (change)="toggleStatus(status)"
                />
                <label [for]="'status-' + status" class="status-label">
                  {{ formatStatus(status) }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Filter -->
      <div class="search-filter">
        <input 
          type="text" 
          [(ngModel)]="searchTerm"
          (input)="onSearchChange()"
          placeholder="Search applications..."
          class="search-input"
        />
      </div>

      <!-- Active Filters Display -->
      <div class="active-filters" *ngIf="hasActiveFilters">
        <span class="active-filters-label">Active Filters:</span>
        <span 
          *ngFor="let status of selectedStatuses" 
          class="filter-tag"
        >
          {{ formatStatus(status) }}
          <button 
            (click)="removeStatus(status)" 
            class="remove-filter"
            type="button"
          >
            ×
          </button>
        </span>
        <button 
          (click)="clearAllFilters()" 
          class="clear-all-btn"
          type="button"
        >
          Clear All
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./application-filters.component.scss']
})
export class ApplicationFiltersComponent implements OnInit, OnChanges {
  @Input() totalCounts: { active: number; inactive: number; all: number } = { active: 0, inactive: 0, all: 0 };
  @Output() filtersChanged = new EventEmitter<ApplicationFilters>();

  statusMapping: ApplicationStatusMapping | null = null;
  selectedCategory: 'active' | 'inactive' | 'all' = 'active';
  selectedStatuses: string[] = [];
  searchTerm: string = '';
  isDropdownOpen: boolean = false;

  categories = [
    { value: 'active' as const, label: 'Active Applications', count: 0 },
    { value: 'inactive' as const, label: 'Inactive Applications', count: 0 },
    { value: 'all' as const, label: 'All Applications', count: 0 }
  ];

  get availableStatuses(): string[] {
    if (!this.statusMapping) return [];
    
    switch (this.selectedCategory) {
      case 'active':
        return this.statusMapping.active;
      case 'inactive':
        return this.statusMapping.inactive;
      case 'all':
        return this.statusMapping.all;
      default:
        return [];
    }
  }

  get hasActiveFilters(): boolean {
    return this.selectedStatuses.length > 0 || this.searchTerm.trim().length > 0;
  }

  constructor(private applicationStatusService: ApplicationStatusService) {}

  ngOnInit() {
    this.loadStatusMapping();
    this.setupClickOutsideListener();
  }

  ngOnChanges() {
    this.updateCategoryCounts();
  }

  private setupClickOutsideListener() {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        this.isDropdownOpen = false;
      }
    });
  }

  private updateCategoryCounts() {
    this.categories = [
      { value: 'active' as const, label: 'Active Applications', count: this.totalCounts.active },
      { value: 'inactive' as const, label: 'Inactive Applications', count: this.totalCounts.inactive },
      { value: 'all' as const, label: 'All Applications', count: this.totalCounts.all }
    ];
  }

  private loadStatusMapping() {
    this.applicationStatusService.getStatusMapping().subscribe(mapping => {
      this.statusMapping = mapping;
      this.initializeDefaultFilters();
    });
  }

  private initializeDefaultFilters() {
    // Set default to active category and select all active statuses
    this.selectedCategory = 'active';
    this.selectedStatuses = [...this.statusMapping!.active];
    this.updateCategoryCounts();
    this.emitFilters();
  }

  selectCategory(category: string) {
    if (category === 'active' || category === 'inactive' || category === 'all') {
      this.selectedCategory = category as 'active' | 'inactive' | 'all';
      
      // Update selected statuses based on category
      if (this.statusMapping) {
        switch (category) {
          case 'active':
            this.selectedStatuses = [...this.statusMapping.active];
            break;
          case 'inactive':
            this.selectedStatuses = [...this.statusMapping.inactive];
            break;
          case 'all':
            this.selectedStatuses = [...this.statusMapping.all];
            break;
        }
      }
      
      this.emitFilters();
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectAllStatuses() {
    this.selectedStatuses = [...this.availableStatuses];
    this.emitFilters();
  }

  clearAllStatuses() {
    this.selectedStatuses = [];
    this.emitFilters();
  }

  toggleStatus(status: string) {
    const index = this.selectedStatuses.indexOf(status);
    if (index > -1) {
      this.selectedStatuses.splice(index, 1);
    } else {
      this.selectedStatuses.push(status);
    }
    this.emitFilters();
  }

  removeStatus(status: string) {
    const index = this.selectedStatuses.indexOf(status);
    if (index > -1) {
      this.selectedStatuses.splice(index, 1);
      this.emitFilters();
    }
  }

  onSearchChange() {
    this.emitFilters();
  }

  clearAllFilters() {
    this.selectedStatuses = [...this.availableStatuses];
    this.searchTerm = '';
    this.emitFilters();
  }

  getSelectedStatusText(): string {
    if (this.selectedStatuses.length === 0) {
      return 'Select Statuses';
    } else if (this.selectedStatuses.length === this.availableStatuses.length) {
      return 'All Statuses';
    } else if (this.selectedStatuses.length === 1) {
      return this.formatStatus(this.selectedStatuses[0]);
    } else {
      return `${this.selectedStatuses.length} Statuses Selected`;
    }
  }

  private emitFilters() {
    const filters: ApplicationFilters = {
      category: this.selectedCategory,
      statuses: this.selectedStatuses,
      searchTerm: this.searchTerm.trim() || undefined
    };
    this.filtersChanged.emit(filters);
  }

  formatStatus(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
} 