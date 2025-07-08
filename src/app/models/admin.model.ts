import { User } from './user.model';
import { VendorSkill } from './vendor-skill.model';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  company: string;
  permissions: AdminPermission[];
  createdAt: string;
  lastLogin?: string;
}

export interface AdminPermission {
  module: string;
  actions: string[];
}

export interface SkillApproval {
  id: string;
  skill: VendorSkill;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewNotes?: string;
}

export interface AdminSkill {
  _id: string;
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalVendors: number;
  totalClients: number;
  totalResources: number;
  totalRequirements: number;
  totalApplications: number;
  pendingApprovals: number;
  activeSkills: number;
  monthlyGrowth: {
    users: number;
    applications: number;
    placements: number;
  };
}

export interface TransactionData {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}