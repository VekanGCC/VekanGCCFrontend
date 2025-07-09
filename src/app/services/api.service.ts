import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, catchError, tap, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AdminSkill } from '../models/admin.model';
import { File, FileUploadRequest, FileUpdateRequest, FileApprovalRequest, BulkApprovalRequest, FileFilters, FileStats } from '../models/file.model';

import { PaginationParams, PaginatedResponse } from '../models/pagination.model';
import { ConnectionService } from './connection.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private useMockData = environment.useMockData;

  constructor(
    private http: HttpClient,
    private connectionService: ConnectionService
  ) {}

  private getHttpOptions() {
    const token = sessionStorage.getItem('authToken');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
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
    
    // New search parameters for resources
    if (params.skills) {
      // Handle skills as array - add each skill ID as a separate parameter
      if (Array.isArray(params.skills)) {
        params.skills.forEach(skillId => {
          httpParams = httpParams.append('skills', skillId);
        });
      } else {
        httpParams = httpParams.set('skills', params.skills);
      }
    }
    if (params.skillLogic) httpParams = httpParams.set('skillLogic', params.skillLogic);
    if (params.minExperience) httpParams = httpParams.set('minExperience', params.minExperience);
    if (params.maxExperience) httpParams = httpParams.set('maxExperience', params.maxExperience);
    if (params.minRate) httpParams = httpParams.set('minRate', params.minRate);
    if (params.maxRate) httpParams = httpParams.set('maxRate', params.maxRate);
    
    // New search parameters for requirements
    if (params.minBudget) httpParams = httpParams.set('minBudget', params.minBudget);
    if (params.maxBudget) httpParams = httpParams.set('maxBudget', params.maxBudget);
    if (params.minDuration) httpParams = httpParams.set('minDuration', params.minDuration);
    if (params.maxDuration) httpParams = httpParams.set('maxDuration', params.maxDuration);
    
    // Approved vendors filter
    if (params.approvedVendorsOnly !== undefined) {
      httpParams = httpParams.set('approvedVendorsOnly', params.approvedVendorsOnly.toString());
    }
    
    console.log('🔧 API: Built HTTP params:', httpParams.toString());
    return httpParams;
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    console.error('❌ API Error:', error);
    
    // Mark server as unavailable for connection errors
    if (error.status === 0 || error.error?.code === 'ECONNREFUSED') {
      console.warn('🚫 Connection refused - marking server unavailable');
      this.connectionService.markServerUnavailable();
      return throwError(() => new Error('Server is not available. Please check your connection.'));
    }
    
    // Don't retry for 4xx client errors (except 429)
    if (error.status >= 400 && error.status < 500 && error.status !== 429) {
      console.warn('🚫 Client error - not retrying');
      return throwError(() => new Error(error.error?.message || 'Request failed'));
    }
    
    // For other errors, allow one retry
    return throwError(() => new Error(error.error?.message || 'An error occurred'));
  };

  private clearAuthState(): void {
    console.log('API Service: Clearing authentication state');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }

  // Generic GET request
  get<T>(endpoint: string, params?: PaginationParams): Observable<T> {
    // Check if we should attempt the request
    if (!this.connectionService.shouldAttemptRequest()) {
      console.log('🚫 API: Skipping GET request - server unavailable');
      return throwError(() => new Error('Server is not available. Please check your connection.'));
    }

    const options = this.getHttpOptions();
    if (params) {
      const httpParams = this.buildHttpParams(params);
      (options as any).params = httpParams;
    }
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, options)
      .pipe(
        tap(() => this.connectionService.markServerAvailable()),
        retry(1),
        catchError(this.handleError)
      );
  }

  // Generic GET request with custom parameters (for reporting)
  getWithCustomParams<T>(endpoint: string, params?: any): Observable<T> {
    // Check if we should attempt the request
    if (!this.connectionService.shouldAttemptRequest()) {
      console.log('🚫 API: Skipping GET request - server unavailable');
      return throwError(() => new Error('Server is not available. Please check your connection.'));
    }

    const options = this.getHttpOptions();
    if (params) {
      let httpParams = new HttpParams();
      
      // Handle custom parameters for reporting
      if (params.period) httpParams = httpParams.set('period', params.period);
      if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
      if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
      
      // Also handle any pagination parameters that might be passed
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status) httpParams = httpParams.set('status', params.status);
      
      console.log('🔧 API: Built custom HTTP params:', httpParams.toString());
      (options as any).params = httpParams;
    }
    
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, options)
      .pipe(
        tap(() => this.connectionService.markServerAvailable()),
        retry(1),
        catchError(this.handleError)
      );
  }

  // Generic POST request
  post<T>(endpoint: string, data: any): Observable<T> {
    // Check if we should attempt the request
    if (!this.connectionService.shouldAttemptRequest()) {
      console.log('🚫 API: Skipping POST request - server unavailable');
      return throwError(() => new Error('Server is not available. Please check your connection.'));
    }

    const options = this.getHttpOptions();
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, options)
      .pipe(
        tap(() => this.connectionService.markServerAvailable()),
        retry(1),
        catchError(this.handleError)
      );
  }

  // Generic PUT request
  put<T>(endpoint: string, data: any): Observable<T> {
    const options = this.getHttpOptions();
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, options)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // Generic DELETE request
  delete<T>(endpoint: string): Observable<T> {
    const options = this.getHttpOptions();
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, options)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // User APIs
  getUsers(): Observable<any> {
    console.log('👥 API: Fetching users...');
    return this.get('/users');
  }

  // Resource APIs with pagination
  getResources(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    console.log('🧑‍💼 API: Fetching resources from:', `${this.apiUrl}/resources`);
    console.log('🧑‍💼 API: Parameters being sent:', params);
    return this.get<PaginatedResponse<any>>('/resources', params).pipe(
      tap(response => console.log('🧑‍💼 API: Resources response:', response)),
      catchError(error => {
        console.error('❌ API: Error fetching resources:', error);
        return throwError(() => error);
      })
    );
  }

  // Get single resource by ID
  getResource(id: string): Observable<any> {
    console.log('🧑‍💼 API: Fetching resource by ID:', id);
    console.log('🧑‍💼 API: Full URL will be:', `${this.apiUrl}/resources/${id}`);
    return this.get<any>(`/resources/${id}`);
  }

  // Requirement APIs with pagination
  getRequirements(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    console.log('📋 API: Fetching requirements...');
    return this.get<PaginatedResponse<any>>('/requirements', params);
  }

  // Get single requirement by ID
  getRequirement(id: string): Observable<any> {
   
    console.log('📋 API: Fetching requirement by ID:', id);
    console.log('📋 API: Full URL will be:', `${this.apiUrl}/requirements/${id}`);
    return this.get<any>(`/requirements/${id}`);
  }

  // Application APIs with pagination
  getApplications(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    console.log('📊 API: Fetching applications...');
    return this.get<PaginatedResponse<any>>('/applications', params);
  }

  // Vendor-specific applications with pagination
  getVendorApplications(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    console.log('📊 API: Fetching vendor applications...');
    return this.get<PaginatedResponse<any>>('/applications/vendor', params);
  }

  // Client-specific applications with pagination
  getClientApplications(params?: PaginationParams): Observable<PaginatedResponse<any>> {
    console.log('📊 API: Fetching client applications...');
    return this.get<PaginatedResponse<any>>('/applications/client', params);
  }

  // Generic Skills (Admin Skills)
  getAdminSkills(): Observable<ApiResponse<AdminSkill[]>> {
    console.log('🔧 API: Fetching admin skills...');
    return this.get<ApiResponse<AdminSkill[]>>('/admin/skills');
  }

  // Get active skills for vendors
  getActiveSkills(): Observable<ApiResponse<AdminSkill[]>> {
    console.log('🔧 API: Fetching active skills...');
    return this.get<ApiResponse<AdminSkill[]>>('/skills/active');
  }

  // Get active categories for dropdowns
  getActiveCategories(): Observable<ApiResponse<any[]>> {
    console.log('📂 API: Fetching active categories...');
    return this.get<ApiResponse<any[]>>('/categories/active');
  }

  // Get vendors for dropdowns
  getVendors(): Observable<ApiResponse<any[]>> {
    console.log('🏢 API: Fetching vendors from:', `${this.apiUrl}/vendors`);
    return this.get<ApiResponse<any[]>>('/vendors');
  }

  // Vendor Niche Skills
  getVendorSkills(): Observable<any> {
    console.log('🎯 API: Fetching vendor niche skills...');
    return this.get('/vendor/niche-skills');
  }

  // Admin APIs
  getAdminDashboard(): Observable<any> {
    console.log('📊 API: Fetching admin dashboard data...');
    return this.get('/admin/stats');
  }

  approveEntity(approvalId: string, notes?: string): Observable<any> {
    console.log('✅ API: Approving entity:', approvalId);
    return this.post('/admin/approvals/approve', { approvalId, notes });
  }

  rejectEntity(approvalId: string, notes: string): Observable<any> {
    console.log('❌ API: Rejecting entity:', approvalId);
    return this.post('/admin/approvals/reject', { approvalId, notes });
  }

  approveUser(userId: string, notes?: string): Observable<any> {
    console.log('✅ API: Approving user:', userId);
    return this.post('/admin/users/approve', { userId, notes });
  }

  rejectUser(userId: string, notes: string): Observable<any> {
    console.log('❌ API: Rejecting user:', userId);
    return this.post('/admin/users/reject', { userId, notes });
  }

  getPlatformStats(): Observable<any> {
    console.log('📈 API: Fetching platform statistics...');
    return this.get('/admin/stats');
  }

  // Authentication APIs
  login(credentials: { email: string; password: string }): Observable<any> {
    console.log('🔐 API: Login attempt for:', credentials.email);
    
    return this.http.post(`${this.apiUrl}/auth/login`, credentials, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      catchError(error => {
        console.error('❌ API: Login error:', error);
        return throwError(() => error);
      })
    );
  }

  verifyToken(token: string): Observable<any> {
    console.log('🔒 API: Verifying token');
    return this.http.get(`${this.apiUrl}/auth/verify`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    }).pipe(
      catchError(error => {
        console.error('❌ API: Token verification error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    try {
      const options = this.getHttpOptions();
      return this.http.post(`${this.apiUrl}/auth/logout`, {}, options).pipe(
        catchError(error => {
          console.error('❌ API: Logout error:', error);
          return of({ success: true });
        })
      );
    } catch (error) {
      console.error('❌ API: Logout error:', error);
      return of({ success: true });
    }
  }

  createResource(resource: any): Observable<any> {
    console.log('➕ API: Creating resource:', resource.name);
    
    if (this.useMockData) {
      return this.http.get<any>('/assets/mock-data/resources.json').pipe(
        delay(500),
        map(resources => {
          const newResource = {
            ...resource,
            id: Date.now().toString(),
            createdAt: new Date().toISOString().split('T')[0]
          };
          console.log('✅ API: Resource created:', newResource);
          return { success: true, data: newResource };
        }),
        catchError(error => {
          console.error('❌ API: Create resource error:', error);
          return of({ success: false, message: 'Error creating resource' });
        })
      );
    } else {
      return this.http.post(`${this.apiUrl}/resources`, resource, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Create resource error:', error);
          return of({ success: false, message: 'Error creating resource' });
        })
      );
    }
  }

  updateResource(id: string, resource: any): Observable<any> {
    console.log('📝 API: Updating resource:', id);
    
    if (this.useMockData) {
      return of({ success: true, data: { ...resource, id } }).pipe(delay(500));
    } else {
      return this.http.put(`${this.apiUrl}/resources/${id}`, resource, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Update resource error:', error);
          return of({ success: false, message: 'Error updating resource' });
        })
      );
    }
  }

  deleteResource(id: string): Observable<any> {
    console.log('🗑️ API: Deleting resource:', id);
    
    if (this.useMockData) {
      return of({ success: true }).pipe(delay(500));
    } else {
      return this.http.delete(`${this.apiUrl}/resources/${id}`, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Delete resource error:', error);
          return of({ success: false, message: 'Error deleting resource' });
        })
      );
    }
  }

  createRequirement(requirement: any): Observable<any> {
    console.log('➕ API: Creating requirement:', requirement.title);
    
    if (this.useMockData) {
      return this.http.get<any>('/assets/mock-data/requirements.json').pipe(
        delay(500),
        map(requirements => {
          const newRequirement = {
            ...requirement,
            id: Date.now().toString(),
            createdAt: new Date().toISOString().split('T')[0]
          };
          console.log('✅ API: Requirement created:', newRequirement);
          return { success: true, data: newRequirement };
        }),
        catchError(error => {
          console.error('❌ API: Create requirement error:', error);
          return of({ success: false, message: 'Error creating requirement' });
        })
      );
    } else {
      return this.http.post(`${this.apiUrl}/requirements`, requirement, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Create requirement error:', error);
          return of({ success: false, message: 'Error creating requirement' });
        })
      );
    }
  }

  updateRequirement(id: string, requirement: any): Observable<any> {
    console.log('📝 API: Updating requirement:', id);
    
    if (this.useMockData) {
      return of({ success: true, data: { ...requirement, id } }).pipe(delay(500));
    } else {
      return this.http.put(`${this.apiUrl}/requirements/${id}`, requirement, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Update requirement error:', error);
          return of({ success: false, message: 'Error updating requirement' });
        })
      );
    }
  }

  updateRequirementStatus(id: string, status: string): Observable<any> {
    console.log('🔄 API: Updating requirement status:', id, status);
    
    if (this.useMockData) {
      return of({ success: true, data: { id, status } }).pipe(delay(500));
    } else {
      return this.http.patch(`${this.apiUrl}/requirements/${id}/status`, { status }, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Update requirement status error:', error);
          return of({ success: false, message: 'Error updating requirement status' });
        })
      );
    }
  }

  createApplication(application: any): Observable<any> {
    console.log('➕ API: Creating application...');
    
    if (this.useMockData) {
      return this.http.get<any>('/assets/mock-data/applications.json').pipe(
        delay(500),
        map(applications => {
          const newApplication = {
            ...application,
            id: Date.now().toString(),
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0]
          };
          console.log('✅ API: Application created:', newApplication);
          return { success: true, data: newApplication };
        }),
        catchError(error => {
          console.error('❌ API: Create application error:', error);
          return of({ success: false, message: 'Error creating application' });
        })
      );
    } else {
      return this.http.post(`${this.apiUrl}/applications`, application, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Create application error:', error);
          
          // Extract the specific error message from the backend response
          let errorMessage = 'Error creating application';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return of({ success: false, message: errorMessage });
        })
      );
    }
  }

  updateApplicationStatus(id: string, status: string, notes?: string): Observable<any> {
    console.log('🔄 API: Updating application status:', id, status);
    
    if (this.useMockData) {
      return of({ 
        success: true, 
        data: { 
          id, 
          status, 
          notes,
          updatedAt: new Date().toISOString().split('T')[0]
        } 
      }).pipe(delay(500));
    } else {
      return this.http.patch(`${this.apiUrl}/applications/${id}/status`, { status, notes }, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Update application status error:', error);
          return of({ success: false, message: 'Error updating application status' });
        })
      );
    }
  }

  // Vendor User APIs
  getVendorUsers(): Observable<any> {
    console.log('👥 API: Fetching vendor users...');
    return this.get('/admin/vendor-employees');
  }

  createVendorUser(user: any): Observable<any> {
    console.log('➕ API: Creating vendor user:', user.name);
    
    if (this.useMockData) {
      return this.http.get<any>('/assets/mock-data/vendor-users.json').pipe(
        delay(500),
        map(users => {
          const newUser = {
            ...user,
            id: Date.now().toString(),
            createdAt: new Date().toISOString().split('T')[0]
          };
          console.log('✅ API: Vendor user created:', newUser);
          return { success: true, data: newUser };
        }),
        catchError(error => {
          console.error('❌ API: Create vendor user error:', error);
          return of({ success: false, message: 'Error creating vendor user' });
        })
      );
    } else {
      return this.http.post(`${this.apiUrl}/admin/users`, user, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Create vendor user error:', error);
          return of({ success: false, message: 'Error creating vendor user' });
        })
      );
    }
  }

  updateVendorUserStatus(id: string, status: string): Observable<any> {
    console.log('🔄 API: Updating vendor user status:', id, status);
    
    if (this.useMockData) {
      return of({ success: true, data: { id, status } }).pipe(delay(500));
    } else {
      return this.http.patch(`${this.apiUrl}/vendor-users/${id}/status`, { status }, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Update vendor user status error:', error);
          return of({ success: false, message: 'Error updating vendor user status' });
        })
      );
    }
  }

  // Generic Skills (Admin Skills)
  createAdminSkill(skill: any): Observable<any> {
    console.log('➕ API: Creating admin skill:', skill.name);
    
    if (this.useMockData) {
      return this.post('/admin/skills', skill);
    } else {
      return this.http.post(`${this.apiUrl}/skills`, skill, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Create admin skill error:', error);
          return of({ success: false, message: 'Error creating admin skill' });
        })
      );
    }
  }

  updateAdminSkill(id: string, updates: any): Observable<any> {
    console.log('📝 API: Updating admin skill:', id);
    
    if (this.useMockData) {
      return this.post('/admin/skills', updates);
    } else {
      return this.http.put(`${this.apiUrl}/skills/${id}`, updates, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Update admin skill error:', error);
          return of({ success: false, message: 'Error updating admin skill' });
        })
      );
    }
  }

  deleteAdminSkill(id: string): Observable<any> {
    console.log('🗑️ API: Deleting admin skill:', id);
    
    if (this.useMockData) {
      return this.delete('/admin/skills');
    } else {
      return this.http.delete(`${this.apiUrl}/skills/${id}`, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Delete admin skill error:', error);
          return of({ success: false, message: 'Error deleting admin skill' });
        })
      );
    }
  }

  // Vendor Niche Skills
  createVendorSkill(skill: any): Observable<any> {
    console.log('➕ API: Creating vendor niche skill:', skill);
    
    if (this.useMockData) {
      return this.post('/vendor-skills', skill);
    } else {
      return this.http.post(`${this.apiUrl}/vendor/niche-skills`, skill, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Create vendor niche skill error:', error);
          return of({ success: false, message: 'Error creating vendor niche skill' });
        })
      );
    }
  }

  updateVendorSkillStatus(id: string, status: string, reviewNotes?: string): Observable<any> {
    console.log('🔄 API: Updating vendor niche skill status:', id, status);
    
    if (this.useMockData) {
      return this.post('/vendor-skills', { status, reviewNotes });
    } else {
      return this.http.patch(`${this.apiUrl}/vendor/niche-skills/${id}/status`, { status, reviewNotes }, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Update vendor niche skill status error:', error);
          return of({ success: false, message: 'Error updating vendor niche skill status' });
        })
      );
    }
  }

  deleteVendorSkill(id: string): Observable<any> {
    console.log('🗑️ API: Deleting vendor niche skill:', id);
    
    if (this.useMockData) {
      return of({ success: true }).pipe(delay(500));
    } else {
      return this.http.delete(`${this.apiUrl}/vendor/niche-skills/${id}`, this.getHttpOptions()).pipe(
        catchError(error => {
          console.error('❌ API: Delete vendor niche skill error:', error);
          return of({ success: false, message: 'Error deleting vendor niche skill' });
        })
      );
    }
  }

  getPendingApprovals(): Observable<any> {
    console.log('⏳ API: Fetching pending approvals...');
    return this.get('/admin/approvals');
  }

  getAllTransactions(): Observable<any> {
    console.log('💰 API: Fetching all transactions...');
    return this.get('/admin/transactions');
  }

  getAdminUsers(): Observable<any> {
    console.log('👥 API: Fetching admin users...');
    return this.get('/admin/users');
  }

  createAdminUser(user: any): Observable<any> {
    console.log('➕ API: Creating admin user:', user.email);
    return this.post('/admin/users', user);
  }

  // File Management APIs
  uploadFile(file: globalThis.File, entityType: string, entityId: string, metadata?: any): Observable<ApiResponse<File>> {
    console.log('📁 API: Uploading file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);
    
    if (metadata) {
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.isPublic !== undefined) formData.append('isPublic', metadata.isPublic.toString());
      if (metadata.tags) formData.append('tags', metadata.tags);
    }

    const options = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
      })
    };

    return this.http.post<ApiResponse<File>>(`${this.apiUrl}/files/upload`, formData, options).pipe(
      tap(response => console.log('✅ API: File uploaded successfully:', response)),
      catchError(error => {
        console.error('❌ API: File upload error:', error);
        return throwError(() => error);
      })
    );
  }

  getFilesByEntity(entityType: string, entityId: string, filters?: FileFilters): Observable<PaginatedResponse<File>> {
    console.log('📁 API: Fetching files for entity:', entityType, entityId);
    
    let params = new HttpParams();
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.approvalStatus) params = params.set('approvalStatus', filters.approvalStatus);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    const options = this.getHttpOptions();
    (options as any).params = params;

    return this.http.get<PaginatedResponse<File>>(`${this.apiUrl}/files/entity/${entityType}/${entityId}`, options).pipe(
      tap(response => console.log('✅ API: Files retrieved successfully:', response)),
      catchError(error => {
        console.error('❌ API: Error fetching files:', error);
        return throwError(() => error);
      })
    );
  }

  getMyFiles(filters?: FileFilters): Observable<PaginatedResponse<File>> {
    console.log('📁 API: Fetching my files');
    
    let params = new HttpParams();
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.approvalStatus) params = params.set('approvalStatus', filters.approvalStatus);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    const options = this.getHttpOptions();
    (options as any).params = params;

    return this.http.get<PaginatedResponse<File>>(`${this.apiUrl}/files/my-files`, options).pipe(
      tap(response => console.log('✅ API: My files retrieved successfully:', response)),
      catchError(error => {
        console.error('❌ API: Error fetching my files:', error);
        return throwError(() => error);
      })
    );
  }

  getFile(fileId: string): Observable<ApiResponse<File>> {
    console.log('📁 API: Fetching file:', fileId);
    
    return this.http.get<ApiResponse<File>>(`${this.apiUrl}/files/${fileId}`, this.getHttpOptions()).pipe(
      tap(response => console.log('✅ API: File retrieved successfully:', response)),
      catchError(error => {
        console.error('❌ API: Error fetching file:', error);
        return throwError(() => error);
      })
    );
  }

  downloadFile(fileId: string): Observable<Blob> {
    console.log('📁 API: Downloading file:', fileId);
    
    const options = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
      }),
      responseType: 'blob' as 'json'
    };

    return this.http.get<Blob>(`${this.apiUrl}/files/${fileId}/download`, options).pipe(
      tap(() => console.log('✅ API: File download started')),
      catchError(error => {
        console.error('❌ API: Error downloading file:', error);
        return throwError(() => error);
      })
    );
  }

  updateFile(fileId: string, updates: FileUpdateRequest): Observable<ApiResponse<File>> {
    console.log('📁 API: Updating file:', fileId);
    
    return this.http.put<ApiResponse<File>>(`${this.apiUrl}/files/${fileId}`, updates, this.getHttpOptions()).pipe(
      tap(response => console.log('✅ API: File updated successfully:', response)),
      catchError(error => {
        console.error('❌ API: Error updating file:', error);
        return throwError(() => error);
      })
    );
  }

  deleteFile(fileId: string): Observable<ApiResponse<any>> {
    console.log('📁 API: Deleting file:', fileId);
    
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/files/${fileId}`, this.getHttpOptions()).pipe(
      tap(response => console.log('✅ API: File deleted successfully:', response)),
      catchError(error => {
        console.error('❌ API: Error deleting file:', error);
        return throwError(() => error);
      })
    );
  }

  // Admin file management
  getPendingFileApprovals(page?: number, limit?: number): Observable<PaginatedResponse<File>> {
    console.log('📁 API: Fetching pending file approvals');
    
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());

    const options = this.getHttpOptions();
    (options as any).params = params;

    return this.http.get<PaginatedResponse<File>>(`${this.apiUrl}/files/pending-approvals`, options).pipe(
      tap(response => console.log('✅ API: Pending approvals retrieved successfully:', response)),
      catchError(error => {
        console.error('❌ API: Error fetching pending approvals:', error);
        return throwError(() => error);
      })
    );
  }

  approveFile(fileId: string, approval: FileApprovalRequest): Observable<ApiResponse<File>> {
    console.log('📁 API: Approving file:', fileId, approval.approvalStatus);
    
    return this.http.patch<ApiResponse<File>>(`${this.apiUrl}/files/${fileId}/approval`, approval, this.getHttpOptions()).pipe(
      tap(response => console.log('✅ API: File approval updated successfully:', response)),
      catchError(error => {
        console.error('❌ API: Error updating file approval:', error);
        return throwError(() => error);
      })
    );
  }

  bulkApproveFiles(approval: BulkApprovalRequest): Observable<ApiResponse<any>> {
    console.log('📁 API: Bulk approving files:', approval.fileIds.length, 'files');
    
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/files/bulk-approval`, approval, this.getHttpOptions()).pipe(
      tap(response => console.log('✅ API: Bulk approval completed successfully:', response)),
      catchError(error => {
        console.error('❌ API: Error in bulk approval:', error);
        return throwError(() => error);
      })
    );
  }

  // Test methods for debugging file downloads
  testBasicDownload(): Observable<Blob> {
    console.log('🧪 API: Testing basic download...');
    
    const options = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
      }),
      responseType: 'blob' as 'json'
    };

    return this.http.get<Blob>(`${this.apiUrl}/files/test-file`, options).pipe(
      tap(() => console.log('✅ API: Basic download test started')),
      catchError(error => {
        console.error('❌ API: Basic download test error:', error);
        return throwError(() => error);
      })
    );
  }

  testFileDownload(fileId: string): Observable<Blob> {
    console.log('🧪 API: Testing file download for:', fileId);
    
    const options = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
      }),
      responseType: 'blob' as 'json'
    };

    return this.http.get<Blob>(`${this.apiUrl}/files/${fileId}/test-download`, options).pipe(
      tap(() => console.log('✅ API: Test file download started')),
      catchError(error => {
        console.error('❌ API: Test file download error:', error);
        return throwError(() => error);
      })
    );
  }

  checkFileIntegrity(fileId: string): Observable<any> {
    console.log('🧪 API: Checking file integrity for:', fileId);
    
    return this.http.get<any>(`${this.apiUrl}/files/${fileId}/integrity`, this.getHttpOptions()).pipe(
      tap(response => console.log('✅ API: File integrity check completed')),
      catchError(error => {
        console.error('❌ API: File integrity check error:', error);
        return throwError(() => error);
      })
    );
  }

  // Admin Reporting APIs
  getUserRegistrationReport(params?: any): Observable<any> {
    console.log('📊 API: Fetching user registration report...');
    return this.getWithCustomParams<any>('/admin/reports/user-registration-reporting', params);
  }

  getResourcesReport(params?: any): Observable<any> {
    console.log('📊 API: Fetching resources report...');
    return this.getWithCustomParams<any>('/admin/reports/resources-reporting', params);
  }

  getRequirementsReport(params?: any): Observable<any> {
    console.log('📊 API: Fetching requirements report...');
    return this.getWithCustomParams<any>('/admin/reports/requirements-reporting', params);
  }

  getApplicationsReport(params?: any): Observable<any> {
    console.log('📊 API: Fetching applications report...');
    return this.getWithCustomParams<any>('/admin/reports/applications-reporting', params);
  }

  getSkillsReport(params?: any): Observable<any> {
    console.log('📊 API: Fetching skills report...');
    return this.getWithCustomParams<any>('/admin/reports/skills-reporting', params);
  }

  getFinancialReport(params?: any): Observable<any> {
    console.log('📊 API: Fetching financial report...');
    return this.getWithCustomParams<any>('/admin/reports/financial-reporting', params);
  }

  getMonthlyGrowthReport(params?: any): Observable<any> {
    console.log('📊 API: Fetching monthly growth report...');
    return this.getWithCustomParams<any>('/admin/reports/monthly-growth-reporting', params);
  }

  // Custom reporting APIs
  createCustomReport(config: any): Observable<any> {
    console.log('📊 API: Creating custom report...');
    return this.post<any>('/admin/reports/custom-reporting', config);
  }

  getReportTemplates(): Observable<any> {
    console.log('📊 API: Fetching report templates...');
    return this.get<any>('/admin/reports/templates-reporting');
  }

  saveReportTemplate(template: any): Observable<any> {
    console.log('📊 API: Saving report template...');
    return this.post<any>('/admin/reports/save-template-reporting', template);
  }
}