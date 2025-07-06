export interface AdminSkill {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminSkillRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateAdminSkillRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
} 