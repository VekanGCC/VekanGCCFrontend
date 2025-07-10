import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApplicationStatusMapping {
  active: string[];
  inactive: string[];
  all: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationStatusService {
  private apiUrl = `${environment.apiUrl}/applications`;
  private statusMapping: ApplicationStatusMapping | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get the application status mapping from the server
   */
  getStatusMapping(): Observable<ApplicationStatusMapping> {
    if (this.statusMapping) {
      return of(this.statusMapping);
    }

    return this.http.get<{ success: boolean; data: ApplicationStatusMapping }>(`${this.apiUrl}/status-mapping`)
      .pipe(
        map(response => {
          this.statusMapping = response.data;
          return response.data;
        }),
        catchError(error => {
          console.error('Error fetching status mapping:', error);
          // Return default mapping if server fails
          return of(this.getDefaultStatusMapping());
        })
      );
  }

  /**
   * Check if an application status is considered active
   */
  isActiveStatus(status: string): Observable<boolean> {
    return this.getStatusMapping().pipe(
      map(mapping => mapping.active.includes(status))
    );
  }

  /**
   * Check if an application status is considered inactive
   */
  isInactiveStatus(status: string): Observable<boolean> {
    return this.getStatusMapping().pipe(
      map(mapping => mapping.inactive.includes(status))
    );
  }

  /**
   * Get the status category (active/inactive) for a given status
   */
  getStatusCategory(status: string): Observable<'active' | 'inactive'> {
    return this.getStatusMapping().pipe(
      map(mapping => {
        if (mapping.active.includes(status)) {
          return 'active';
        } else if (mapping.inactive.includes(status)) {
          return 'inactive';
        } else {
          // Default to inactive for unknown statuses
          return 'inactive';
        }
      })
    );
  }

  /**
   * Get all active statuses
   */
  getActiveStatuses(): Observable<string[]> {
    return this.getStatusMapping().pipe(
      map(mapping => mapping.active)
    );
  }

  /**
   * Get all inactive statuses
   */
  getInactiveStatuses(): Observable<string[]> {
    return this.getStatusMapping().pipe(
      map(mapping => mapping.inactive)
    );
  }

  /**
   * Clear the cached status mapping (useful for testing or when mapping changes)
   */
  clearCache(): void {
    this.statusMapping = null;
  }

  /**
   * Get default status mapping (fallback when server is unavailable)
   */
  private getDefaultStatusMapping(): ApplicationStatusMapping {
    return {
      active: [
        'applied',
        'pending',
        'shortlisted',
        'interview',
        'accepted',
        'offer_created',
        'offer_accepted',
        'onboarded'
      ],
      inactive: [
        'rejected',
        'withdrawn',
        'did_not_join',
        'cancelled'
      ],
      all: [
        'applied',
        'pending',
        'shortlisted',
        'interview',
        'accepted',
        'offer_created',
        'offer_accepted',
        'onboarded',
        'rejected',
        'withdrawn',
        'did_not_join',
        'cancelled'
      ]
    };
  }
} 