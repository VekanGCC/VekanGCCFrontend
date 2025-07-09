import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginationParams, PaginatedResponse } from '../models/pagination.model';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private apiUrl = `${environment.apiUrl}/vendors`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

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
    if (params.resourceId) httpParams = httpParams.set('resourceId', params.resourceId);
    if (params.vendorId) httpParams = httpParams.set('vendorId', params.vendorId);
    if (params.clientId) httpParams = httpParams.set('clientId', params.clientId);
    
    // Handle skills parameter
    if (params.skills) {
      if (Array.isArray(params.skills)) {
        params.skills.forEach(skill => {
          httpParams = httpParams.append('skills', skill);
        });
      } else {
        httpParams = httpParams.set('skills', params.skills);
      }
    }
    
    // Handle skillLogic parameter
    if (params.skillLogic) httpParams = httpParams.set('skillLogic', params.skillLogic);
    
    // Handle experience range
    if (params.minExperience) httpParams = httpParams.set('minExperience', params.minExperience);
    if (params.maxExperience) httpParams = httpParams.set('maxExperience', params.maxExperience);
    
    // Handle rate range
    if (params.minRate) httpParams = httpParams.set('minRate', params.minRate);
    if (params.maxRate) httpParams = httpParams.set('maxRate', params.maxRate);
    
    // Handle budget range
    if (params.minBudget) httpParams = httpParams.set('minBudget', params.minBudget);
    if (params.maxBudget) httpParams = httpParams.set('maxBudget', params.maxBudget);
    
    // Handle duration range
    if (params.minDuration) httpParams = httpParams.set('minDuration', params.minDuration);
    if (params.maxDuration) httpParams = httpParams.set('maxDuration', params.maxDuration);
    
    // Handle approved vendors only
    if (params.approvedVendorsOnly !== undefined) {
      httpParams = httpParams.set('approvedVendorsOnly', params.approvedVendorsOnly.toString());
    }
    
    return httpParams;
  }

  // Get vendor profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`, { headers: this.getAuthHeaders() });
  }

  // Update vendor profile
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, data, { headers: this.getAuthHeaders() });
  }

  // Get vendor resources with pagination
  getResources(params?: PaginationParams): Observable<PaginatedResponse<any>> {
   
    console.log('🔧 VendorService: getResources called with params:', params);
    console.log('🔧 VendorService: Full URL will be:', `${environment.apiUrl}/resources`);
    const options = { 
      headers: this.getAuthHeaders(),
      params: params ? this.buildHttpParams(params) : undefined 
    };
    console.log('🔧 VendorService: Request options:', options);
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/resources`, options);
  }

  // Get requirement by ID
  getRequirement(requirementId: string): Observable<any> {
    console.log('🔧 VendorService: getRequirement called with ID:', requirementId);
    return this.http.get(`${environment.apiUrl}/requirements/${requirementId}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Create new resource
  createResource(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/resources`, data, { headers: this.getAuthHeaders() });
  }

  // Update resource
  updateResource(id: string, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/resources/${id}`, data, { headers: this.getAuthHeaders() });
  }

  // Update resource status
  updateResourceStatus(id: string, status: 'active' | 'inactive'): Observable<any> {
    return this.http.put(`${environment.apiUrl}/resources/${id}`, { status }, { headers: this.getAuthHeaders() });
  }

  // Delete resource
  deleteResource(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/resources/${id}`, { headers: this.getAuthHeaders() });
  }

  // Get vendor applications with pagination
  getApplications(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = { 
      headers: this.getAuthHeaders(),
      params: params ? this.buildHttpParams(params) : undefined 
    };
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/applications/vendor`, options);
  }

  // Get vendor applications filtered by resource ID
  getApplicationsByResourceId(resourceId: string, params?: PaginationParams): Observable<PaginatedResponse<any>> {
    const options = { 
      headers: this.getAuthHeaders(),
      params: params ? this.buildHttpParams(params) : undefined 
    };
    return this.http.get<PaginatedResponse<any>>(`${environment.apiUrl}/applications/vendor/resource/${resourceId}`, options);
  }

  // Create application (vendor applying resource to requirement)
  createApplication(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/applications`, data, { headers: this.getAuthHeaders() });
  }

  // Update application status
  updateApplicationStatus(applicationId: string, status: string, notes?: string, actionData?: any): Observable<any> {
    const payload: any = { status };
    if (notes) {
      payload.notes = notes;
    }
    
    // Add enhanced decision data if provided
    if (actionData) {
      if (actionData.decisionReason) {
        payload.decisionReason = actionData.decisionReason;
      }
      if (actionData.notifyCandidate !== undefined) {
        payload.notifyCandidate = actionData.notifyCandidate;
      }
      if (actionData.notifyClient !== undefined) {
        payload.notifyClient = actionData.notifyClient;
      }
      if (actionData.followUpRequired !== undefined) {
        payload.followUpRequired = actionData.followUpRequired;
      }
      if (actionData.followUpDate) {
        payload.followUpDate = actionData.followUpDate;
      }
      if (actionData.followUpNotes) {
        payload.followUpNotes = actionData.followUpNotes;
      }
    }
    
    console.log('🔄 VendorService: Updating application status with enhanced data:', payload);
    
    return this.http.put(`${environment.apiUrl}/applications/${applicationId}/status`, payload, { headers: this.getAuthHeaders() });
  }

  // Get application history
  getApplicationHistory(applicationId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/applications/${applicationId}/history`, { headers: this.getAuthHeaders() }).pipe(
      tap((response: any) => {
        console.log('🔧 VendorService: Application history response:', response);
      }),
      catchError(error => {
        console.error('🔧 VendorService: Error in getApplicationHistory:', error);
        throw error;
      })
    );
  }

  // Get application counts for resources
  getApplicationCountsForResources(resourceIds: string[]): Observable<any> {
    const params = new HttpParams().set('resourceIds', resourceIds.join(','));
    return this.http.get(`${environment.apiUrl}/applications/counts/resources`, { 
      headers: this.getAuthHeaders(),
      params 
    });
  }

  // Get matching requirements count for a resource
  getMatchingRequirementsCount(resourceId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/resources/${resourceId}/matching-requirements`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Get matching requirements counts for multiple resources (batch)
  getMatchingRequirementsCountsBatch(resourceIds: string[]): Observable<any> {
    console.log('🔄 VendorService: getMatchingRequirementsCountsBatch called with resourceIds:', resourceIds);
    console.log('🔄 VendorService: Making POST request to:', `${environment.apiUrl}/resources/matching-requirements/batch`);
    
    return this.http.post(`${environment.apiUrl}/resources/matching-requirements/batch`, 
      { resourceIds }, 
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap((response: any) => {
        console.log('✅ VendorService: getMatchingRequirementsCountsBatch response:', response);
      }),
      catchError(error => {
        console.error('❌ VendorService: Error in getMatchingRequirementsCountsBatch:', error);
        throw error;
      })
    );
  }

  // Get detailed matching requirements for a specific resource
  getMatchingRequirementsDetails(resourceId: string, page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get(`${environment.apiUrl}/resources/${resourceId}/matching-requirements/details`, { 
      headers: this.getAuthHeaders(),
      params 
    }).pipe(
      tap((response: any) => {
        console.log('🔧 VendorService: Matching requirements details response:', response);
      }),
      catchError(error => {
        console.error('🔧 VendorService: Error in getMatchingRequirementsDetails:', error);
        throw error;
      })
    );
  }

  // Get vendor analytics
  getAnalytics(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/vendor/analytics`, { headers: this.getAuthHeaders() });
  }

  // Get vendor skills
  getSkills(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/vendor/niche-skills`, { headers: this.getAuthHeaders() });
  }

  // Add vendor skill
  addSkill(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/vendor/niche-skills`, data, { headers: this.getAuthHeaders() });
  }

  // Remove vendor skill
  removeSkill(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/vendor/niche-skills/${id}`, { headers: this.getAuthHeaders() });
  }

  // Add employee to organization
  addEmployee(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    organizationRole?: string;
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/vendor/organization/add-employee`, data, { headers: this.getAuthHeaders() });
  }

  // Get organization employees
  getEmployees(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/vendor/organization/employees`, { headers: this.getAuthHeaders() });
  }

  // Verify employee OTP
  verifyEmployeeOTP(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/vendor/organization/verify-otp`, data);
  }

  // Resend OTP
  resendOTP(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/vendor/organization/resend-otp`, data, { headers: this.getAuthHeaders() });
  }
} 