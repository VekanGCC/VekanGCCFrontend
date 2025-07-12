import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { VendorUser } from '../models/vendor-user.model';
import { VendorSkill } from '../models/vendor-skill.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VendorManagementService {
  private vendorUsersSubject = new BehaviorSubject<VendorUser[]>([]);
  private vendorSkillsSubject = new BehaviorSubject<VendorSkill[]>([]);

  public vendorUsers$ = this.vendorUsersSubject.asObservable();
  public vendorSkills$ = this.vendorSkillsSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.loadVendorUsers(),
        this.loadVendorSkills()
      ]);
    } catch (error) {
      console.error('Error loading vendor management data:', error);
    }
  }

  private async loadVendorUsers(): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getVendorUsers());
      if (response && response.success && response.data) {
        console.log('✅ Loaded vendor users:', response.data.length);
        
        // Debug: Log the actual status values from backend
        response.data.forEach((user: any, index: number) => {
          console.log(`👤 User ${index + 1}: ${user.firstName} ${user.lastName} - Backend status: "${user.status}"`);
        });
        
        // Transform the vendor API response to match VendorUser format
        const transformedUsers = response.data.map((user: any) => {
          // Map backend fields to frontend status
          // User is active if isActive is true AND isEmailVerified is true
          let frontendStatus: 'active' | 'inactive';
          if (user.isActive && user.isEmailVerified) {
            frontendStatus = 'active';
          } else {
            frontendStatus = 'inactive';
          }

          return {
            id: user._id || user.id,
            vendorId: user.organizationId || '',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            email: user.email || '',
            role: user.organizationRole === 'vendor_owner' ? 'admin' : 
                  user.organizationRole === 'vendor_employee' ? 'user' : 'user',
            department: user.department || 'N/A',
            phone: user.phone || '',
            status: frontendStatus,
            createdAt: user.createdAt || new Date().toISOString(),
            createdBy: user.createdBy || 'System'
          };
        });
        
        this.vendorUsersSubject.next(transformedUsers);
      } else {
        console.log('⚠️ No vendor users data received');
        this.vendorUsersSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading vendor users:', error);
      this.vendorUsersSubject.next([]);
    }
  }

  private async loadVendorSkills(): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.getVendorSkills());
      if (response && response.success && response.data) {
        console.log('✅ Loaded vendor skills:', response.data.length);
        this.vendorSkillsSubject.next(response.data);
      } else {
        console.log('⚠️ No vendor skills data received');
        this.vendorSkillsSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading vendor skills:', error);
      this.vendorSkillsSubject.next([]);
    }
  }

  async addVendorUser(userData: Omit<VendorUser, 'id' | 'createdAt'>): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.createVendorUser(userData));
      if (response.success) {
        const currentUsers = this.vendorUsersSubject.value;
        this.vendorUsersSubject.next([...currentUsers, response.data]);
      }
    } catch (error) {
      console.error('Error adding vendor user:', error);
      throw error;
    }
  }

  async addVendorSkill(skillData: Omit<VendorSkill, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.createVendorSkill(skillData));
      if (response.success) {
        const currentSkills = this.vendorSkillsSubject.value;
        this.vendorSkillsSubject.next([...currentSkills, response.data]);
      }
    } catch (error) {
      console.error('Error adding vendor skill:', error);
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: VendorUser['status']): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.updateVendorUserStatus(userId, status));
      if (response.success) {
        const currentUsers = this.vendorUsersSubject.value;
        const updatedUsers = currentUsers.map(user => 
          user.id === userId ? { ...user, status } : user
        );
        this.vendorUsersSubject.next(updatedUsers);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  async updateSkillStatus(skillId: string, status: VendorSkill['status'], reviewNotes?: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.apiService.updateVendorSkillStatus(skillId, status, reviewNotes));
      if (response.success) {
        const currentSkills = this.vendorSkillsSubject.value;
        const updatedSkills = currentSkills.map(skill => 
          skill._id === skillId 
            ? { 
                ...skill, 
                status
              } 
            : skill
        );
        this.vendorSkillsSubject.next(updatedSkills);
      }
    } catch (error) {
      console.error('Error updating skill status:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string, currentStatus: VendorUser['status']): Promise<void> {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await this.updateUserStatus(userId, newStatus);
  }

  async refreshVendorUsers(): Promise<void> {
    await this.loadVendorUsers();
  }

  get vendorUsers(): VendorUser[] {
    return this.vendorUsersSubject.value;
  }

  get vendorSkills(): VendorSkill[] {
    return this.vendorSkillsSubject.value;
  }
}