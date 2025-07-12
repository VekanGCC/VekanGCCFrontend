import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AdminSkill } from '../../../models/admin.model';
import { Skill } from '../../../models/skill.model';
import { EditSkillModalComponent } from '../../modals/edit-skill-modal/edit-skill-modal.component';
import { EditCategoryModalComponent } from '../../modals/edit-category-modal/edit-category-modal.component';

@Component({
  selector: 'app-skills-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EditSkillModalComponent,
    EditCategoryModalComponent
  ],
  templateUrl: './skills-management.component.html',
  styleUrls: ['./skills-management.component.scss']
})
export class SkillsManagementComponent implements OnInit {
  adminSkills: AdminSkill[] = [];
  categories: any[] = [];
  isLoading = false;
  error: string | null = null;

  // Search and filter properties
  searchTerm = '';
  statusFilter = '';

  // Modal states
  showEditSkillModal = false;
  selectedSkillForEdit: Skill | null = null;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔧 SkillsManagementComponent: ngOnInit called');
    this.loadSkills();
    this.loadCategories();
  }

  loadSkills(): void {
    console.log('🔄 SkillsManagement: Loading admin skills...');
    this.isLoading = true;
    this.error = null;

    this.adminService.getAdminSkills().subscribe({
      next: (response) => {
        console.log('✅ SkillsManagement: Admin skills loaded:', response);
        if (response.success) {
          this.adminSkills = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ SkillsManagement: Error loading admin skills:', error);
        this.error = 'Failed to load admin skills';
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    console.log('🔄 SkillsManagement: Loading categories...');
    
    this.adminService.getCategories().subscribe({
      next: (response) => {
        console.log('✅ SkillsManagement: Categories loaded:', response);
        if (response.success) {
          this.categories = response.data;
        }
      },
      error: (error) => {
        console.error('❌ SkillsManagement: Error loading categories:', error);
      }
    });
  }

  onEditSkill(skill: AdminSkill): void {
    // Convert AdminSkill to Skill format
    this.selectedSkillForEdit = {
      _id: skill._id,
      name: skill.name,
      category: '', // AdminSkill doesn't have category, so use empty string
      description: skill.description,
      isActive: skill.isActive,
      createdAt: new Date(skill.createdAt),
      updatedAt: new Date(skill.updatedAt)
    };
    
    this.showEditSkillModal = true;
    
    this.cdr.detectChanges();
    
    // Force change detection after a small delay
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  closeEditSkillModal(): void {
    this.showEditSkillModal = false;
    this.selectedSkillForEdit = null;
    this.cdr.detectChanges();
  }

  onEditSkillSave(updatedSkillData: Partial<Skill>): void {
    // Convert back to AdminSkill format and update
    if (this.selectedSkillForEdit) {
      const updatedAdminSkill: Partial<AdminSkill> = {
        name: updatedSkillData.name || this.selectedSkillForEdit.name,
        description: updatedSkillData.description || this.selectedSkillForEdit.description,
        isActive: updatedSkillData.isActive !== undefined ? updatedSkillData.isActive : this.selectedSkillForEdit.isActive
      };
      
      this.adminService.updateSkill(this.selectedSkillForEdit._id, updatedAdminSkill).subscribe({
        next: (response) => {
          console.log('✅ SkillsManagement: Skill updated successfully:', response);
          this.loadSkills(); // Reload the skills list
        },
        error: (error) => {
          console.error('❌ SkillsManagement: Error updating skill:', error);
        }
      });
    }
    
    this.closeEditSkillModal();
  }

  trackById(index: number, item: any): string {
    return item.id || `item-${index}`;
  }

  onSearch(): void {
    console.log('Search term:', this.searchTerm);
    // TODO: Implement search functionality
  }

  refreshData(): void {
    this.loadSkills();
    this.loadCategories();
  }
} 