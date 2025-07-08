import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill, SkillCategory } from '../models/skill.model';
import { environment } from '../../environments/environment';
import { map, tap, catchError } from 'rxjs/operators';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SkillsService {
  private apiUrl = `${environment.apiUrl}/skills`;

  constructor(private http: HttpClient) {}

  // Skills
  getSkills(): Observable<Skill[]> {
    return this.http.get<ApiResponse<Skill[]>>(this.apiUrl).pipe(
      map(response => response.data || response)
    );
  }

  getSkill(id: string): Observable<Skill> {
    return this.http.get<Skill>(`${this.apiUrl}/${id}`);
  }

  createSkill(skill: Omit<Skill, '_id' | 'createdAt' | 'updatedAt'>): Observable<Skill> {
    console.log('SkillsService: Creating skill with data:', skill);
    return this.http.post<ApiResponse<Skill>>(this.apiUrl, skill).pipe(
      map(response => response.data),
      tap(response => console.log('SkillsService: API Response:', response)),
      catchError(error => {
        console.error('SkillsService: API Error:', error);
        throw error;
      })
    );
  }

  updateSkill(id: string, skill: Partial<Skill>): Observable<Skill> {
    return this.http.put<ApiResponse<Skill>>(`${this.apiUrl}/${id}`, skill).pipe(
      map(response => response.data)
    );
  }

  deleteSkill(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  toggleSkillStatus(id: string, isActive: boolean): Observable<Skill> {
    return this.http.patch<ApiResponse<Skill>>(`${this.apiUrl}/${id}/status`, { isActive }).pipe(
      map(response => response.data || response)
    );
  }

  // Categories
  getCategories(): Observable<SkillCategory[]> {
    return this.http.get<ApiResponse<SkillCategory[]>>(`${this.apiUrl}/categories`).pipe(
      map(response => response.data || response)
    );
  }

  getCategory(id: string): Observable<SkillCategory> {
    return this.http.get<SkillCategory>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: Omit<SkillCategory, '_id' | 'createdAt' | 'updatedAt'>): Observable<SkillCategory> {
    return this.http.post<ApiResponse<SkillCategory>>(`${this.apiUrl}/categories`, category).pipe(
      map(response => response.data)
    );
  }

  updateCategory(id: string, category: Partial<SkillCategory>): Observable<SkillCategory> {
    return this.http.put<ApiResponse<SkillCategory>>(`${this.apiUrl}/categories/${id}`, category).pipe(
      map(response => response.data)
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/categories/${id}`).pipe(
      map(response => response.data)
    );
  }

  toggleCategoryStatus(id: string, isActive: boolean): Observable<SkillCategory> {
    return this.http.patch<ApiResponse<SkillCategory>>(`${this.apiUrl}/categories/${id}/status`, { isActive }).pipe(
      map(response => response.data || response)
    );
  }
} 