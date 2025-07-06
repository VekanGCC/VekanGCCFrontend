import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Application } from '../models/application.model';
import { ClientService } from './client.service';

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
export class ClientApplicationsService {
  private modalActionSubject = new Subject<ApplicationModalAction>();
  public modalAction$ = this.modalActionSubject.asObservable();

  constructor(private clientService: ClientService) {}

  viewApplicationHistory(applicationId: string): void {
    console.log('🔧 ClientApplicationsService: Opening history modal for application:', applicationId);
    this.clientService.getApplicationHistory(applicationId).subscribe({
      next: (response) => {
        console.log('🔧 ClientApplicationsService: History response:', response);
        this.modalActionSubject.next({
          type: 'viewHistory',
          applicationId,
          history: response.data?.history || [],
          applicationDetails: response.data?.application || null
        });
      },
      error: (error) => {
        console.error('🔧 ClientApplicationsService: Error fetching application history:', error);
      }
    });
  }

  viewApplicationDetails(application: Application): void {
    console.log('🔧 ClientApplicationsService: Opening details modal for application:', application._id);
    this.modalActionSubject.next({
      type: 'viewDetails',
      application
    });
  }
} 