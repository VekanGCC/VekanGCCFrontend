import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  WorkflowConfiguration,
  WorkflowInstance,
  WorkflowStepInstance,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ProcessWorkflowStepRequest,
  WorkflowFilters,
  WorkflowInstanceFilters
} from '../models/workflow.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders() {
    const token = sessionStorage.getItem('authToken');
    return { Authorization: `Bearer ${token}` };
  }

  // Workflow Configuration Methods
  getWorkflowConfigurations(filters?: WorkflowFilters): Observable<PaginatedResponse<WorkflowConfiguration>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.isActive !== undefined) {
        params = params.set('isActive', filters.isActive.toString());
      }
      if (filters.applicationTypes && filters.applicationTypes.length > 0) {
        params = params.set('applicationTypes', filters.applicationTypes.join(','));
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
      if (filters.sortBy) {
        params = params.set('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params = params.set('sortOrder', filters.sortOrder);
      }
    }

    return this.http.get<PaginatedResponse<WorkflowConfiguration>>(
      `${this.apiUrl}/workflows`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  getWorkflowConfiguration(id: string): Observable<{ success: boolean; data: WorkflowConfiguration }> {
    return this.http.get<{ success: boolean; data: WorkflowConfiguration }>(
      `${this.apiUrl}/workflows/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  createWorkflowConfiguration(workflow: CreateWorkflowRequest): Observable<{ success: boolean; data: WorkflowConfiguration }> {
    return this.http.post<{ success: boolean; data: WorkflowConfiguration }>(
      `${this.apiUrl}/workflows`,
      workflow,
      { headers: this.getAuthHeaders() }
    );
  }

  updateWorkflowConfiguration(id: string, workflow: UpdateWorkflowRequest): Observable<{ success: boolean; data: WorkflowConfiguration }> {
    return this.http.put<{ success: boolean; data: WorkflowConfiguration }>(
      `${this.apiUrl}/workflows/${id}`,
      workflow,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteWorkflowConfiguration(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/workflows/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Workflow Instance Methods
  getWorkflowInstances(filters?: WorkflowInstanceFilters): Observable<PaginatedResponse<WorkflowInstance>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.applicationId) {
        params = params.set('applicationId', filters.applicationId);
      }
      if (filters.assignedTo) {
        params = params.set('assignedTo', filters.assignedTo);
      }
      if (filters.page) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.limit) {
        params = params.set('limit', filters.limit.toString());
      }
      if (filters.sortBy) {
        params = params.set('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params = params.set('sortOrder', filters.sortOrder);
      }
    }

    return this.http.get<PaginatedResponse<WorkflowInstance>>(
      `${this.apiUrl}/workflows/instances`,
      { headers: this.getAuthHeaders(), params }
    );
  }

  getWorkflowInstance(id: string): Observable<{ success: boolean; data: WorkflowInstance }> {
    return this.http.get<{ success: boolean; data: WorkflowInstance }>(
      `${this.apiUrl}/workflows/instances/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  processWorkflowStep(instanceId: string, request: ProcessWorkflowStepRequest): Observable<{ success: boolean; data: WorkflowInstance }> {
    return this.http.post<{ success: boolean; data: WorkflowInstance }>(
      `${this.apiUrl}/workflows/instances/${instanceId}/process-step`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  // Helper Methods
  getDefaultWorkflow(applicationType: string): Observable<PaginatedResponse<WorkflowConfiguration>> {
    const filters: WorkflowFilters = {
      isActive: true,
      applicationTypes: [applicationType],
      limit: 1
    };
    
    return this.http.get<PaginatedResponse<WorkflowConfiguration>>(
      `${this.apiUrl}/workflows`,
      { 
        headers: this.getAuthHeaders(), 
        params: new HttpParams()
          .set('isActive', 'true')
          .set('applicationTypes', applicationType)
          .set('limit', '1')
      }
    );
  }

  // Utility Methods
  getWorkflowStepStatus(instance: WorkflowInstance, stepOrder: number): string {
    const step = instance.steps.find(s => s.order === stepOrder);
    return step ? step.status : 'pending';
  }

  getCurrentWorkflowStep(instance: WorkflowInstance): WorkflowStepInstance | null {
    return instance.steps.find(s => s.order === instance.currentStep) || null;
  }

  canUserProcessStep(userRole: string, stepRole: string): boolean {
    const roleHierarchy = {
      'super_admin': ['superadmin'],
      'admin': ['superadmin', 'admin'],
      'hr_admin': ['superadmin', 'admin', 'hr_admin'],
      'client': ['client'],
      'vendor': ['vendor']
    };

    const allowedRoles = roleHierarchy[stepRole as keyof typeof roleHierarchy] || [];
    return allowedRoles.includes(userRole);
  }
} 