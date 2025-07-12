import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Resource } from '../models/resource.model';
import { Requirement } from '../models/requirement.model';
import { Application } from '../models/application.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private resourcesSubject = new BehaviorSubject<Resource[]>([]);
  private requirementsSubject = new BehaviorSubject<Requirement[]>([]);
  private applicationsSubject = new BehaviorSubject<Application[]>([]);

  public resources$ = this.resourcesSubject.asObservable();
  public requirements$ = this.requirementsSubject.asObservable();
  public applications$ = this.applicationsSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Add a small delay to prevent immediate retries
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await Promise.all([
        this.loadResources(),
        this.loadRequirements(),
        this.loadApplications()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Don't retry immediately for connection errors
      if (error instanceof Error && error.message.includes('Server is not available')) {
        // Server unavailable, skipping initial data load
      }
    }
  }

  private async loadResources(): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getResources());
      if (response.success && response.data) {
        const filteredResources = response.data.filter((item: any) => item != null);
        this.resourcesSubject.next(filteredResources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      // Don't retry for connection errors
      if (error instanceof Error && error.message.includes('Server is not available')) {
        // Server unavailable, skipping resources load
      }
    }
  }

  private async loadRequirements(): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getRequirements());
      if (response.success && response.data) {
        const filteredRequirements = response.data.filter((item: any) => item != null);
        this.requirementsSubject.next(filteredRequirements);
      }
    } catch (error) {
      console.error('Error loading requirements:', error);
      // Don't retry for connection errors
      if (error instanceof Error && error.message.includes('Server is not available')) {
        // Server unavailable, skipping requirements load
      }
    }
  }

  private async loadApplications(): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getApplications());
      if (response.success && response.data) {
        const filteredApplications = response.data.filter((item: any) => item != null);
        this.applicationsSubject.next(filteredApplications);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      // Don't retry for connection errors
      if (error instanceof Error && error.message.includes('Server is not available')) {
        // Server unavailable, skipping applications load
      }
    }
  }

  async addResource(resourceData: Omit<Resource, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.createResource(resourceData));
      if (response.success) {
        await this.loadResources();
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      throw error;
    }
  }

  async addRequirement(requirementData: Omit<Requirement, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.createRequirement(requirementData));
      
      if (response.success) {
        const currentRequirements = this.requirementsSubject.value;
        this.requirementsSubject.next([...currentRequirements, response.data]);
      }
    } catch (error) {
      console.error('Error adding requirement:', error);
      throw error;
    }
  }

  async addApplication(applicationData: Omit<Application, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.createApplication(applicationData));
      if (response.success) {
        const currentApplications = this.applicationsSubject.value;
        this.applicationsSubject.next([...currentApplications, response.data]);
      }
    } catch (error) {
      console.error('Error adding application:', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId: string, status: Application['status'], notes?: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.updateApplicationStatus(applicationId, status, notes));
      if (response.success) {
        const currentApplications = this.applicationsSubject.value;
        const updatedApplications = currentApplications.map(app => 
          app._id === applicationId 
            ? { ...app, status, updatedAt: response.data.updatedAt, notes: notes || app.notes }
            : app
        );
        this.applicationsSubject.next(updatedApplications);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  async updateRequirementStatus(requirementId: string, status: Requirement['status']): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.updateRequirementStatus(requirementId, status));
      if (response.success) {
        const currentRequirements = this.requirementsSubject.value;
        const updatedRequirements = currentRequirements.map(req => 
          req._id === requirementId 
            ? { ...req, status }
            : req
        );
        this.requirementsSubject.next(updatedRequirements);
      }
    } catch (error) {
      console.error('Error updating requirement status:', error);
      throw error;
    }
  }

  get resources(): Resource[] {
    return this.resourcesSubject.value;
  }

  get requirements(): Requirement[] {
    return this.requirementsSubject.value;
  }

  get applications(): Application[] {
    return this.applicationsSubject.value;
  }

  getRequirementById(requirementId: string): Requirement | undefined {
    const req = this.requirements.find(req => req && req._id === requirementId);
    return req;
  }

  getResourceById(resourceId: string): Resource | undefined {
    const resource = this.resources.find(res => res && res._id === resourceId);
    return resource;
  }

  // Public methods to reload data
  async reloadResources(): Promise<void> {
    await this.loadResources();
  }

  async reloadRequirements(): Promise<void> {
    await this.loadRequirements();
  }

  async reloadApplications(): Promise<void> {
    await this.loadApplications();
  }

  // Get resources directly from API
  getResources(): Observable<any> {
    return this.apiService.getResources();
  }

  deleteResource(resourceId: string): Observable<any> {
    return this.apiService.deleteResource(resourceId);
  }
}