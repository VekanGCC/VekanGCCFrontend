import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SOW, CreateSOWRequest, UpdateSOWRequest, SOWResponse } from '../models/sow.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SOWService {
  private baseApiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getApiUrl(): string {
    const currentUser = this.authService.getCurrentUser();
    const userType = currentUser?.userType;
    
    let apiUrl: string;
    if (userType === 'vendor') {
      apiUrl = `${this.baseApiUrl}/vendor/sow`;
    } else {
      apiUrl = `${this.baseApiUrl}/client/sow`;
    }
    
    console.log('🔧 SOW Service: Using API URL:', apiUrl, 'for user type:', userType);
    return apiUrl;
  }

  // Get all SOWs with optional filters
  getSOWs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    vendorId?: string;
    clientId?: string;
  }): Observable<any> {
    const apiUrl = this.getApiUrl();
    console.log('🔧 SOW Service: Fetching SOWs from:', apiUrl);
    console.log('🔧 SOW Service: Parameters:', params);
    return this.http.get(apiUrl, { params });
  }

  // Get single SOW by ID
  getSOW(id: string): Observable<any> {
    return this.http.get(`${this.getApiUrl()}/${id}`);
  }

  // Create new SOW
  createSOW(sowData: CreateSOWRequest): Observable<any> {
    return this.http.post(this.getApiUrl(), sowData);
  }

  // Update SOW
  updateSOW(id: string, sowData: UpdateSOWRequest): Observable<any> {
    return this.http.put(`${this.getApiUrl()}/${id}`, sowData);
  }

  // Submit SOW for internal approval
  submitSOW(id: string): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/submit`, {});
  }

  // Submit SOW for PM approval
  submitForPMApproval(id: string, comments?: string): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/submit-for-pm-approval`, { comments });
  }

  // Approve SOW internally (client admin only)
  approveSOW(id: string, comments?: string): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/approve`, { comments });
  }

  // Send SOW to vendor
  sendToVendor(id: string): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/send-to-vendor`, {});
  }

  // Vendor response to SOW
  vendorResponse(id: string, response: SOWResponse): Observable<any> {
    return this.http.post(`${this.getApiUrl()}/${id}/vendor-response`, response);
  }

  // Delete SOW
  deleteSOW(id: string): Observable<any> {
    return this.http.delete(`${this.getApiUrl()}/${id}`);
  }
} 