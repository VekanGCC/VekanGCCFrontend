import { Category } from './category.model';
import { AdminSkill } from './admin-skill.model';

export interface Resource {
  _id: string;
  name: string;
  description: string;
  category: Category;
  skills: AdminSkill[];
  experience: {
    years: number;
    level: 'junior' | 'mid' | 'senior' | 'expert';
  };
  availability: {
    status: 'available' | 'partially_available' | 'unavailable';
    hours_per_week?: number;
    start_date?: string;
  };
  rate: {
    hourly: number;
    currency: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
    remote: boolean;
  };
  contact: {
    email?: string;
    phone?: string;
  };
  status: 'active' | 'inactive' | 'archived';
  createdBy: string;
  attachment?: {
    originalName: string;
    fileSize: number;
    fileType: string;
    fileId: string;
    filename: string;
    path: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceRequest {
  name: string;
  description: string;
  category: string; // Category ID
  skills: string[]; // Skill IDs array
  experience: {
    years: number;
    level: 'junior' | 'mid' | 'senior' | 'expert';
  };
  availability: {
    status: 'available' | 'partially_available' | 'unavailable';
    hours_per_week?: number;
    start_date?: string;
  };
  rate: {
    hourly: number;
    currency: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
    remote: boolean;
  };
  contact: {
    email?: string;
    phone?: string;
  };
  attachment?: {
    originalName: string;
    fileSize: number;
    fileType: string;
    fileId: string;
    filename: string;
    path: string;
  };
}