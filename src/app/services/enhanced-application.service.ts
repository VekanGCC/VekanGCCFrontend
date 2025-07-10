import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApplicationStatusService } from './application-status.service';
import { ApplicationFilters } from '../components/shared/application-filters/application-filters.component';

export interface Application {
  _id: string;
  requirement: {
    _id: string;
    title: string;
    status: string;
    priority: string;
  };
  resource: {
    _id: string;
    name: string;
    status: string;
    category: string;
  };
  status: string;
  notes?: string;
  proposedRate?: {
    amount: number;
    currency: string;
    type: string;
  };
  availability?: {
    startDate: string;
    hoursPerWeek: number;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationCounts {
  active: number;
  inactive: number;
  all: number;
}

export interface ApplicationsResponse {
  success: boolean;
  data: Application[];
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EnhancedApplicationService {
  private apiUrl = `${environment.apiUrl}/applications`;
  
  // Behavior subjects for reactive filtering
  private filtersSubject = new BehaviorSubject<ApplicationFilters>({
    category: 'active',
    statuses: [],
    searchTerm: undefined
  });
  
  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(10);
  private sortBySubject = new BehaviorSubject<string>('createdAt');
  private sortOrderSubject = new BehaviorSubject<'asc' | 'desc'>('desc');

  // Observable streams
  public filters$ = this.filtersSubject.asObservable();
  public page$ = this.pageSubject.asObservable();
  public limit$ = this.limitSubject.asObservable();
  public sortBy$ = this.sortBySubject.asObservable();
  public sortOrder$ = this.sortOrderSubject.asObservable();

  // Combined observable for applications with filtering
  public applications$ = combineLatest([
    this.filters$,
    this.page$,
    this.limit$,
    this.sortBy$,
    this.sortOrder$
  ]).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(([filters, page, limit, sortBy, sortOrder]) => 
      this.getApplications(filters, page, limit, sortBy, sortOrder)
    )
  );

  // Observable for application counts
  public applicationCounts$ = this.getApplicationCounts();

  constructor(
    private http: HttpClient,
    private applicationStatusService: ApplicationStatusService
  ) {
    // Initialize with default active filters
    this.initializeDefaultFilters();
  }

  private async initializeDefaultFilters() {
    this.applicationStatusService.getActiveStatuses().subscribe(activeStatuses => {
      this.filtersSubject.next({
        category: 'active',
        statuses: activeStatuses,
        searchTerm: undefined
      });
    });
  }

  // Update filters
  updateFilters(filters: ApplicationFilters) {
    this.filtersSubject.next(filters);
    this.pageSubject.next(1); // Reset to first page when filters change
  }

  // Update pagination
  updatePage(page: number) {
    this.pageSubject.next(page);
  }

  updateLimit(limit: number) {
    this.limitSubject.next(limit);
    this.pageSubject.next(1); // Reset to first page when limit changes
  }

  // Update sorting
  updateSort(sortBy: string, sortOrder: 'asc' | 'desc') {
    this.sortBySubject.next(sortBy);
    this.sortOrderSubject.next(sortOrder);
  }

  // Get applications with filtering
  private getApplications(
    filters: ApplicationFilters,
    page: number,
    limit: number,
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): Observable<ApplicationsResponse> {
    return this.applicationStatusService.getStatusMapping().pipe(
      switchMap(statusMapping => {
        let params = new HttpParams()
          .set('page', page.toString())
          .set('limit', limit.toString())
          .set('sortBy', sortBy)
          .set('sortOrder', sortOrder);

        // Add status filters
        if (filters.statuses && filters.statuses.length > 0) {
          // User has selected specific statuses
          filters.statuses.forEach(status => {
            params = params.append('status', status);
          });
        } else {
          // No specific statuses selected, use all statuses from current category
          let categoryStatuses: string[] = [];
          
          switch (filters.category) {
            case 'active':
              categoryStatuses = statusMapping.active;
              break;
            case 'inactive':
              categoryStatuses = statusMapping.inactive;
              break;
            case 'all':
              categoryStatuses = statusMapping.all;
              break;
          }
          
          // Add all statuses from the current category
          categoryStatuses.forEach(status => {
            params = params.append('status', status);
          });
        }

        // Add search term if provided
        if (filters.searchTerm) {
          params = params.set('search', filters.searchTerm);
        }

        return this.http.get<ApplicationsResponse>(`${this.apiUrl}/vendor`, { params });
      })
    );
  }

  // Get application counts for different categories
  private getApplicationCounts(): Observable<ApplicationCounts> {
    return combineLatest([
      this.applicationStatusService.getActiveStatuses(),
      this.applicationStatusService.getInactiveStatuses()
    ]).pipe(
      switchMap(([activeStatuses, inactiveStatuses]) => {
        const activeParams = new HttpParams();
        activeStatuses.forEach(status => {
          activeParams.append('status', status);
        });

        const inactiveParams = new HttpParams();
        inactiveStatuses.forEach(status => {
          inactiveParams.append('status', status);
        });

        return combineLatest([
          this.http.get<{ success: boolean; data: { count: number } }>(`${this.apiUrl}/vendor`, { params: activeParams }),
          this.http.get<{ success: boolean; data: { count: number } }>(`${this.apiUrl}/vendor`, { params: inactiveParams })
        ]).pipe(
          map(([activeResponse, inactiveResponse]) => ({
            active: activeResponse.data.count,
            inactive: inactiveResponse.data.count,
            all: activeResponse.data.count + inactiveResponse.data.count
          }))
        );
      })
    );
  }

  // Get applications by resource
  getApplicationsByResource(resourceId: string, filters?: ApplicationFilters): Observable<ApplicationsResponse> {
    let params = new HttpParams();
    
    if (filters?.statuses && filters.statuses.length > 0) {
      filters.statuses.forEach(status => {
        params = params.append('status', status);
      });
    }

    if (filters?.searchTerm) {
      params = params.set('search', filters.searchTerm);
    }

    return this.http.get<ApplicationsResponse>(`${this.apiUrl}/vendor/resource/${resourceId}`, { params });
  }

  // Update application status
  updateApplicationStatus(applicationId: string, status: string, notes?: string): Observable<any> {
    const updateData: any = { status };
    if (notes) {
      updateData.notes = notes;
    }

    return this.http.put(`${this.apiUrl}/${applicationId}/status`, updateData).pipe(
      tap(() => {
        // Refresh the applications list after status update
        this.refreshApplications();
      })
    );
  }

  // Get application details
  getApplication(applicationId: string): Observable<Application> {
    return this.http.get<{ success: boolean; data: Application }>(`${this.apiUrl}/${applicationId}`).pipe(
      map(response => response.data)
    );
  }

  // Get application history
  getApplicationHistory(applicationId: string): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/${applicationId}/history`).pipe(
      map(response => response.data)
    );
  }

  // Refresh applications (trigger a reload)
  refreshApplications() {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters });
  }

  // Get current filters
  getCurrentFilters(): ApplicationFilters {
    return this.filtersSubject.value;
  }

  // Clear all filters and reset to default
  clearAllFilters() {
    this.applicationStatusService.getActiveStatuses().subscribe(activeStatuses => {
      this.filtersSubject.next({
        category: 'active',
        statuses: activeStatuses,
        searchTerm: undefined
      });
    });
  }

  // Format status for display
  formatStatus(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'applied': 'badge-primary',
      'pending': 'badge-warning',
      'shortlisted': 'badge-info',
      'interview': 'badge-purple',
      'accepted': 'badge-success',
      'offer_created': 'badge-success',
      'offer_accepted': 'badge-success',
      'onboarded': 'badge-success',
      'rejected': 'badge-danger',
      'withdrawn': 'badge-secondary',
      'did_not_join': 'badge-danger',
      'cancelled': 'badge-secondary'
    };

    return statusClasses[status] || 'badge-secondary';
  }
} 