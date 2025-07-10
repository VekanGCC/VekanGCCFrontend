import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { AdminSkill, PlatformStats, TransactionData } from '../models/admin.model';
import { VendorSkill } from '../models/vendor-skill.model';
import { Category } from '../models/category.model';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/pagination.model';

interface SkillApproval {
  id: string;
  skill: VendorSkill;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewNotes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private skillApprovalsSubject = new BehaviorSubject<ApiResponse<SkillApproval[]>>({
    success: false,
    data: []
  });
  private adminSkillsSubject = new BehaviorSubject<AdminSkill[]>([]);
  private platformStatsSubject = new BehaviorSubject<PlatformStats>({
    totalUsers: 0,
    totalVendors: 0,
    totalClients: 0,
    totalResources: 0,
    totalRequirements: 0,
    totalApplications: 0,
    pendingApprovals: 0,
    activeSkills: 0,
    monthlyGrowth: {
      users: 0,
      applications: 0,
      placements: 0
    }
  });
  private transactionsSubject = new BehaviorSubject<TransactionData[]>([]);
  private applicationsSubject = new BehaviorSubject<any[]>([]);

  skillApprovals$ = this.skillApprovalsSubject.asObservable();
  adminSkills$ = this.adminSkillsSubject.asObservable();
  platformStats$ = this.platformStatsSubject.asObservable();
  transactions$ = this.transactionsSubject.asObservable();
  applications$ = this.applicationsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getUsers(page: number, limit: number): Observable<ApiResponse<User[]>> {
    return this.apiService.get<ApiResponse<User[]>>(`/admin/users?page=${page}&limit=${limit}`).pipe(
      map(response => {
        console.log('Admin Service: Users response:', response);
        // Ensure pagination data is present
        if (!response.pagination && response.data) {
          response.pagination = {
            total: response.data.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(response.data.length / limit)
          };
        }
        return response;
      }),
      catchError(error => {
        console.error('Admin Service: Error fetching users:', error);
        return of({
          success: false,
          data: [],
          message: 'Failed to fetch users',
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        });
      })
    );
  }

  getSkillApprovals(page: number, limit: number): Observable<ApiResponse<SkillApproval[]>> {
    return this.apiService.get<ApiResponse<SkillApproval[]>>(`/admin/skill-approvals?page=${page}&limit=${limit}`).pipe(
      map(response => {
        this.skillApprovalsSubject.next(response);
        return response;
      })
    );
  }

  getAdminSkills(): Observable<ApiResponse<AdminSkill[]>> {
    return this.apiService.getAdminSkills().pipe(
      map(response => {
        console.log('Admin Service: Skills response:', response);
        if (response.success) {
          this.adminSkillsSubject.next(response.data);
        }
        return response;
      }),
      catchError(error => {
        console.error('Admin Service: Error fetching skills:', error);
        return of({
          success: false,
          data: [],
          message: 'Failed to load skills'
        });
      })
    );
  }

  getPlatformStats(): Observable<PlatformStats> {
    console.log('Admin Service: Fetching platform stats...');
    return this.apiService.get<{success: boolean, data: PlatformStats}>('/admin/stats').pipe(
      map(response => {
        console.log('Admin Service: Platform stats received:', response);
        const stats = response.data;
        this.platformStatsSubject.next(stats);
        return stats;
      }),
      catchError(error => {
        console.error('Admin Service: Error fetching platform stats:', error);
        return of({
          totalUsers: 0,
          totalVendors: 0,
          totalClients: 0,
          totalResources: 0,
          totalRequirements: 0,
          totalApplications: 0,
          pendingApprovals: 0,
          activeSkills: 0,
          monthlyGrowth: {
            users: 0,
            applications: 0,
            placements: 0
          }
        });
      })
    );
  }

  getTransactions(): Observable<TransactionData[]> {
    return this.apiService.get<TransactionData[]>('/admin/transactions').pipe(
      map(transactions => {
        this.transactionsSubject.next(transactions);
        return transactions;
      })
    );
  }

  getApplications(page: number, limit: number): Observable<ApiResponse<any[]>> {
    return this.apiService.getApplications({ page, limit }).pipe(
      map(response => {
        console.log('Admin Service: Applications response:', response);
        this.applicationsSubject.next(response.data);
        // Convert PaginatedResponse to ApiResponse format
        return {
          success: response.success,
          data: response.data,
          message: response.message,
          pagination: response.pagination || response.meta
        };
      }),
      catchError(error => {
        console.error('Admin Service: Error fetching applications:', error);
        return of({
          success: false,
          data: [],
          message: 'Failed to load applications',
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
          }
        });
      })
    );
  }

  approveUser(userId: string): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`/admin/users/${userId}/approve`, {});
  }

  rejectUser(userId: string, notes: string): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`/admin/users/${userId}/reject`, { notes });
  }

  approveSkill(skillId: string): Observable<ApiResponse<SkillApproval>> {
    return this.apiService.post<ApiResponse<SkillApproval>>(`/admin/skill-approvals/${skillId}/approve`, {});
  }

  rejectSkill(skillId: string, notes: string): Observable<ApiResponse<SkillApproval>> {
    return this.apiService.post<ApiResponse<SkillApproval>>(`/admin/skill-approvals/${skillId}/reject`, { notes });
  }

  updateApplicationStatus(applicationId: string, status: string, notes?: string): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`/applications/${applicationId}/status`, { 
      status, 
      notes,
      notifyCandidate: true,
      notifyClient: true
    });
  }

  getApplicationHistory(applicationId: string): Observable<any> {
    return this.apiService.get<any>(`/applications/${applicationId}/history`);
  }

  approveVendorSkill(skillId: string): Observable<ApiResponse<any>> {
    return this.apiService.updateVendorSkillStatus(skillId, 'approved');
  }

  rejectVendorSkill(skillId: string, notes: string): Observable<ApiResponse<any>> {
    return this.apiService.updateVendorSkillStatus(skillId, 'rejected', notes);
  }

  updateSkill(skillId: string, skill: Partial<AdminSkill>): Observable<AdminSkill> {
    return this.apiService.put<AdminSkill>(`/admin/skills/${skillId}`, skill);
  }

  deleteSkill(skillId: string): Observable<void> {
    return this.apiService.delete<void>(`/admin/skills/${skillId}`);
  }

  updateUser(userId: string, user: Partial<User>): Observable<User> {
    return this.apiService.put<User>(`/admin/users/${userId}`, user);
  }

  toggleUserStatus(userId: string): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`/admin/users/all/${userId}/toggle-status`, {});
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.apiService.get<ApiResponse<Category[]>>('/admin/categories').pipe(
      map(response => {
        console.log('Admin Service: Categories response:', response);
        return response;
      }),
      catchError(error => {
        console.error('Admin Service: Error fetching categories:', error);
        return of({
          success: false,
          data: [],
          message: 'Failed to load categories'
        });
      })
    );
  }

  addCategory(category: Omit<Category, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Observable<ApiResponse<Category>> {
    return this.apiService.post<ApiResponse<Category>>('/admin/categories', category);
  }

  updateCategory(categoryId: string, category: Partial<Category>): Observable<Category> {
    return this.apiService.put<Category>(`/admin/categories/${categoryId}`, category);
  }

  deleteCategory(categoryId: string): Observable<void> {
    return this.apiService.delete<void>(`/admin/categories/${categoryId}`);
  }

  addAdminSkill(skill: Omit<AdminSkill, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Observable<ApiResponse<AdminSkill>> {
    return this.apiService.post<ApiResponse<AdminSkill>>('/admin/skills', skill);
  }

  getUserProfile(userId: string): Observable<ApiResponse<any>> {
    return this.apiService.get<ApiResponse<any>>(`/admin/users/${userId}/profile`);
  }

  // Admin-only profile update methods
  updateUserProfile(userId: string, profileData: Partial<any>): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`/admin/users/${userId}/profile`, profileData);
  }

  updateUserAddress(userId: string, addressId: string, address: Partial<any>): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`/admin/users/${userId}/addresses/${addressId}`, address);
  }

  addUserAddress(userId: string, address: any): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(`/admin/users/${userId}/addresses`, address);
  }

  deleteUserAddress(userId: string, addressId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(`/admin/users/${userId}/addresses/${addressId}`);
  }

  updateUserBankDetails(userId: string, bankDetailsId: string, bankDetails: Partial<any>): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`/admin/users/${userId}/bank-details/${bankDetailsId}`, bankDetails);
  }

  addUserBankDetails(userId: string, bankDetails: any): Observable<ApiResponse<any>> {
    return this.apiService.post<ApiResponse<any>>(`/admin/users/${userId}/bank-details`, bankDetails);
  }

  deleteUserBankDetails(userId: string, bankDetailsId: string): Observable<ApiResponse<any>> {
    return this.apiService.delete<ApiResponse<any>>(`/admin/users/${userId}/bank-details/${bankDetailsId}`);
  }

  updateUserCompliance(userId: string, compliance: Partial<any>): Observable<ApiResponse<any>> {
    return this.apiService.put<ApiResponse<any>>(`/admin/users/${userId}/compliance`, compliance);
  }
}