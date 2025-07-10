import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Application } from '../models/application.model';
import { AdminService } from './admin.service';

export interface ApplicationModalAction {
  type: 'viewHistory' | 'viewDetails';
  applicationId?: string;
  application?: Application;
  history?: any[];
  applicationDetails?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AdminApplicationsService {
  private modalActionSubject = new Subject<ApplicationModalAction>();
  public modalAction$ = this.modalActionSubject.asObservable();

  constructor(private adminService: AdminService) {}

  viewApplicationHistory(applicationId: string): void {
    this.adminService.getApplicationHistory(applicationId).subscribe({
      next: (response) => {
        this.modalActionSubject.next({
          type: 'viewHistory',
          applicationId,
          history: response.data?.history || [],
          applicationDetails: response.data?.application || null
        });
      },
      error: (error) => {
        console.error('🔧 AdminApplicationsService: Error fetching application history:', error);
      }
    });
  }

  viewApplicationDetails(application: Application): void {
    console.log('🔧 AdminApplicationsService: Opening details modal for application:', application._id);
    this.modalActionSubject.next({
      type: 'viewDetails',
      application
    });
  }
} 