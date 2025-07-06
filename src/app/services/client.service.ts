import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginationParams, PaginatedResponse } from '../models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = `${environment.apiUrl}/client`;

  constructor(private http: HttpClient) {}

  private buildHttpParams(params: PaginationParams): HttpParams {
    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.priority) httpParams = httpParams.set('priority', params.priority);
    if (params.requirementId) httpParams = httpParams.set('requirementId', params.requirementId);
    
    return httpParams;
  }

  // Get client profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  // Update client profile
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data);
  }

  // Get client requirements with pagination
  getRequirements(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = params ? { params: this.buildHttpParams(params) } : {};
    return this.http.get<PaginatedResponse<any>>(`${this.apiUrl}/requirements`, options);
  }

  // Create new requirement
  createRequirement(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/requirements`, data);
  }

  // Update requirement
  updateRequirement(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/requirements/${id}`, data);
  }

  // Delete requirement
  deleteRequirement(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/requirements/${id}`);
  }

  // Get client applications with pagination
  getApplications(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = params ? { params: this.buildHttpParams(params) } : {};
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/applications/client`, options);
  }

  // Create application (client applying resource to requirement)
  createApplication(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/applications`, data);
  }

  // Update application status
  updateApplicationStatus(applicationId: string, status: string, notes?: string): Observable<any> {
    const payload: any = { status };
    if (notes) {
      payload.notes = notes;
    }
    return this.http.put(`${environment.apiUrl}/applications/${applicationId}/status`, payload);
  }

  // Get application history
  getApplicationHistory(applicationId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/applications/${applicationId}/history`);
  }

  // Get application counts for requirements
  getApplicationCountsForRequirements(requirementIds: string[]): Observable<any> {
    const params = new HttpParams().set('requirementIds', requirementIds.join(','));
    return this.http.get(`${environment.apiUrl}/applications/counts/requirements`, { params });
  }

  // Get matching resources count for a requirement
  getMatchingResourcesCount(requirementId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/requirements/${requirementId}/matching-resources`);
  }

  // Get matching resources counts for multiple requirements
  getMatchingResourcesCountsForRequirements(requirementIds: string[]): Observable<any> {
    // Use the new batch endpoint for better performance
    return this.http.post(`${environment.apiUrl}/requirements/matching-resources/batch`, {
      requirementIds
    });
  }

  // Get matching resources details for a requirement
  getMatchingResourcesDetails(requirementId: string, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get(`${this.apiUrl}/matching-resources/${requirementId}`, { params });
  }

  // Get client analytics
  getAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics`);
  }

  // Client User Management Methods
  // Get organization users
  getOrganizationUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/organization/users`);
  }

  // Add user to organization
  addOrganizationUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    organizationRole?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/organization/users`, userData);
  }

  // Update user status
  updateUserStatus(userId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/organization/users/${userId}/status`, { status });
  }
} 