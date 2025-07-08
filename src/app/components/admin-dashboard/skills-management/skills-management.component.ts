import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class SkillsManagementComponent {
  @Input() adminSkills: AdminSkill[] = [];
  @Input() categories: any[] = [];
  @Input() isLoading = false;

  @Output() editSkill = new EventEmitter<AdminSkill>();
  @Output() skillUpdated = new EventEmitter<{skillId: string, skillData: Partial<AdminSkill>}>();
  @Output() openAddModal = new EventEmitter<void>();

  // Search and filter properties
  searchTerm = '';
  statusFilter = '';

  // Modal states
  showEditSkillModal = false;
  selectedSkillForEdit: Skill | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  onEditSkill(skill: AdminSkill): void {
    debugger; // Debugger statement
    console.log('=== SKILLS MANAGEMENT EDIT SKILL DEBUG ===');
    console.log('Edit skill called with:', skill);
    
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
    
    console.log('selectedSkillForEdit set to:', this.selectedSkillForEdit);
    console.log('showEditSkillModal set to:', this.showEditSkillModal);
    
    this.cdr.detectChanges();
    
    // Force change detection after a small delay
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('Final modal state - showEditSkillModal:', this.showEditSkillModal);
    }, 100);
    
    console.log('=== END SKILLS MANAGEMENT EDIT SKILL DEBUG ===');
  }



  closeEditSkillModal(): void {
    console.log('=== CLOSING EDIT SKILL MODAL ===');
    console.log('showEditSkillModal before close:', this.showEditSkillModal);
    this.showEditSkillModal = false;
    this.selectedSkillForEdit = null;
    this.cdr.detectChanges();
    console.log('showEditSkillModal after close:', this.showEditSkillModal);
    console.log('=== EDIT SKILL MODAL CLOSED ===');
  }

  onEditSkillSave(updatedSkillData: Partial<Skill>): void {
    console.log('Skill updated in Skills Management:', updatedSkillData);
    
    // Convert back to AdminSkill format for the parent component
    if (this.selectedSkillForEdit) {
      const updatedAdminSkill: Partial<AdminSkill> = {
        name: updatedSkillData.name || this.selectedSkillForEdit.name,
        description: updatedSkillData.description || this.selectedSkillForEdit.description,
        isActive: updatedSkillData.isActive !== undefined ? updatedSkillData.isActive : this.selectedSkillForEdit.isActive
        // Don't include createdBy, createdAt, or updatedAt - let the backend handle these
      };
      
      this.skillUpdated.emit({
        skillId: this.selectedSkillForEdit._id,
        skillData: updatedAdminSkill
      });
    }
    
    this.closeEditSkillModal();
  }

  trackById(index: number, item: any): string {
    return item.id || `item-${index}`;
  }

  onSearch(): void {
    // This method will be called when search term changes
    // For now, we'll just log the search term
    console.log('Search term:', this.searchTerm);
  }
} 