import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SkillsService } from '../../../services/skills.service';
import { Skill, SkillCategory } from '../../../models/skill.model';
import { DeleteConfirmationModalComponent } from '../../modals/delete-confirmation-modal/delete-confirmation-modal.component';
import { EditSkillModalComponent } from '../../modals/edit-skill-modal/edit-skill-modal.component';
import { EditCategoryModalComponent } from '../../modals/edit-category-modal/edit-category-modal.component';

@Component({
  selector: 'app-skills-management',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    LucideAngularModule,
    DeleteConfirmationModalComponent,
    EditSkillModalComponent,
    EditCategoryModalComponent
  ],
  templateUrl: './skills-management.component.html',
  styleUrls: ['./skills-management.component.css']
})
export class SkillsManagementComponent implements OnInit {
  skills: Skill[] = [];
  categories: SkillCategory[] = [];
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

  // Forms
  skillForm: FormGroup;
  categoryForm: FormGroup;

  // UI State
  showSkillForm = false;
  showCategoryForm = false;
  editingSkill: Skill | null = null;
  editingCategory: SkillCategory | null = null;
  
  // Modal States
  showDeleteModal = false;
  showEditSkillModal = false;
  showEditCategoryModal = false;
  itemToDelete: { id: string; type: 'skill' | 'category'; name: string } | null = null;

  constructor(
    private skillsService: SkillsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    debugger; // Debugger at constructor level
    console.log('=== SKILLS MANAGEMENT CONSTRUCTOR DEBUG ===');
    console.log('SkillsManagementComponent constructor called');
    
    this.skillForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', Validators.required],
      description: ['', Validators.required],
      isActive: [true]
    });

    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      isActive: [true]
    });
    
    console.log('Forms initialized');
    console.log('=== END SKILLS MANAGEMENT CONSTRUCTOR DEBUG ===');
  }



  ngOnInit(): void {
    debugger; // Debugger at ngOnInit level
    console.log('=== SKILLS MANAGEMENT COMPONENT INIT ===');
    console.log('SkillsManagementComponent ngOnInit called');
    console.log('Modal components imported:', {
      hasDeleteModal: !!DeleteConfirmationModalComponent,
      hasEditSkillModal: !!EditSkillModalComponent,
      hasEditCategoryModal: !!EditCategoryModalComponent
    });
    this.loadSkills();
    this.loadCategories();
    console.log('=== END SKILLS MANAGEMENT COMPONENT INIT ===');
  }

  // Test method to verify component is working
  testMethod(): void {
    debugger;
    console.log('=== TEST METHOD CALLED ===');
    alert('Test method is working!');
  }

  loadSkills(): void {
    debugger; // Debugger at loadSkills level
    console.log('=== LOAD SKILLS DEBUG ===');
    this.isLoading = true;
    console.log('Calling skillsService.getSkills()');
    this.skillsService.getSkills().subscribe({
      next: (skills) => {
        console.log('Skills loaded:', skills);
        this.skills = skills;
        this.isLoading = false;
        console.log('Skills array updated, length:', this.skills.length);
      },
      error: (err) => {
        console.error('Error loading skills:', err);
        this.error = err.error?.message || 'Failed to load skills';
        this.isLoading = false;
      }
    });
    console.log('=== END LOAD SKILLS DEBUG ===');
  }

  loadCategories(): void {
    this.skillsService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load categories';
      }
    });
  }

  // Skill Management
  createSkill(): void {
    if (this.skillForm.invalid) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.createSkill(this.skillForm.value).subscribe({
      next: (skill) => {
        this.skills.push(skill);
        this.success = 'Skill created successfully';
        this.resetSkillForm();
      },
      error: (error) => {
        this.error = 'Failed to create skill. Please try again.';
        console.error('Error creating skill:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  updateSkill(): void {
    if (this.skillForm.invalid || !this.editingSkill) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.updateSkill(this.editingSkill._id!, this.skillForm.value).subscribe({
      next: (updatedSkill) => {
        const index = this.skills.findIndex(s => s._id === updatedSkill._id);
        if (index !== -1) {
          this.skills[index] = updatedSkill;
        }
        this.success = 'Skill updated successfully';
        this.resetSkillForm();
      },
      error: (error) => {
        this.error = 'Failed to update skill. Please try again.';
        console.error('Error updating skill:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  deleteSkill(skill: Skill): void {
    this.itemToDelete = {
      id: skill._id!,
      type: 'skill',
      name: skill.name
    };
    this.showDeleteModal = true;
    this.cdr.detectChanges();
    
    // Force change detection after a small delay to ensure modal renders
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  confirmDelete(): void {
    if (!this.itemToDelete) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    console.log('Deleting item:', this.itemToDelete);

    if (this.itemToDelete.type === 'skill') {
      this.skillsService.deleteSkill(this.itemToDelete.id).subscribe({
        next: (response) => {
          console.log('Delete response:', response);
          this.skills = this.skills.filter(s => s._id !== this.itemToDelete!.id);
          this.success = 'Skill deleted successfully';
          this.closeDeleteModal();
        },
        error: (error) => {
          console.error('Error deleting skill:', error);
          this.error = error.error?.message || 'Failed to delete skill. Please try again.';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      this.skillsService.deleteCategory(this.itemToDelete.id).subscribe({
        next: (response) => {
          console.log('Delete category response:', response);
          this.categories = this.categories.filter(c => c._id !== this.itemToDelete!.id);
          this.success = 'Category deleted successfully';
          this.closeDeleteModal();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.error = error.error?.message || 'Failed to delete category. Please try again.';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.itemToDelete = null;
    this.cdr.detectChanges();
  }

  toggleSkillStatus(id: string, currentStatus: boolean): void {
    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.updateSkill(id, { isActive: !currentStatus }).subscribe({
      next: (updatedSkill) => {
        const index = this.skills.findIndex(s => s._id === updatedSkill._id);
        if (index !== -1) {
          this.skills[index] = updatedSkill;
        }
        this.success = `Skill ${updatedSkill.isActive ? 'activated' : 'deactivated'} successfully`;
      },
      error: (error) => {
        this.error = 'Failed to update skill status. Please try again.';
        console.error('Error updating skill status:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Category Management
  createCategory(): void {
    if (this.categoryForm.invalid) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.createCategory(this.categoryForm.value).subscribe({
      next: (category) => {
        this.categories.push(category);
        this.success = 'Category created successfully';
        this.resetCategoryForm();
      },
      error: (error) => {
        this.error = 'Failed to create category. Please try again.';
        console.error('Error creating category:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  updateCategory(): void {
    if (this.categoryForm.invalid || !this.editingCategory) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.updateCategory(this.editingCategory._id!, this.categoryForm.value).subscribe({
      next: (updatedCategory) => {
        const index = this.categories.findIndex(c => c._id === updatedCategory._id);
        if (index !== -1) {
          this.categories[index] = updatedCategory;
        }
        this.success = 'Category updated successfully';
        this.resetCategoryForm();
      },
      error: (error) => {
        this.error = 'Failed to update category. Please try again.';
        console.error('Error updating category:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  deleteCategory(category: SkillCategory): void {
    this.itemToDelete = {
      id: category._id!,
      type: 'category',
      name: category.name
    };
    this.showDeleteModal = true;
    this.cdr.detectChanges();
    
    // Force change detection after a small delay to ensure modal renders
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  toggleCategoryStatus(id: string, currentStatus: boolean): void {
    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.updateCategory(id, { isActive: !currentStatus }).subscribe({
      next: (updatedCategory) => {
        const index = this.categories.findIndex(c => c._id === updatedCategory._id);
        if (index !== -1) {
          this.categories[index] = updatedCategory;
        }
        this.success = `Category ${updatedCategory.isActive ? 'activated' : 'deactivated'} successfully`;
      },
      error: (error) => {
        this.error = 'Failed to update category status. Please try again.';
        console.error('Error updating category status:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Form Helpers
  editSkill(skill: Skill): void {
    debugger; // Debugger statement to pause execution
    console.log('=== EDIT SKILL MODAL DEBUG ===');
    console.log('1. editSkill method called with skill:', skill);
    
    this.editingSkill = skill;
    console.log('2. editingSkill set to:', this.editingSkill);
    
    this.showEditSkillModal = true;
    console.log('3. showEditSkillModal set to:', this.showEditSkillModal);
    
    console.log('4. Current modal states:');
    console.log('   - showEditSkillModal:', this.showEditSkillModal);
    console.log('   - showEditCategoryModal:', this.showEditCategoryModal);
    console.log('   - showDeleteModal:', this.showDeleteModal);
    
    this.cdr.detectChanges();
    console.log('5. Change detection triggered');
    
    // Force change detection after a small delay to ensure modal renders
    setTimeout(() => {
      console.log('6. Timeout callback - forcing change detection again');
      this.cdr.detectChanges();
      console.log('7. Final modal state check - showEditSkillModal:', this.showEditSkillModal);
    }, 100);
    
    console.log('=== END EDIT SKILL MODAL DEBUG ===');
  }

  onEditSkillSave(skillData: Partial<Skill>): void {
    if (!this.editingSkill) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.updateSkill(this.editingSkill._id!, skillData).subscribe({
      next: (updatedSkill) => {
        const index = this.skills.findIndex(s => s._id === updatedSkill._id);
        if (index !== -1) {
          this.skills[index] = updatedSkill;
        }
        this.success = 'Skill updated successfully';
        this.closeEditSkillModal();
      },
      error: (error) => {
        this.error = 'Failed to update skill. Please try again.';
        console.error('Error updating skill:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  closeEditSkillModal(): void {
    this.showEditSkillModal = false;
    this.editingSkill = null;
    this.cdr.detectChanges();
  }

  onSubmitSkill(): void {
    if (this.skillForm.invalid) {
      console.log('Form is invalid:', this.skillForm.errors);
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.success = null;

    const skillData = this.skillForm.value;
    console.log('Submitting skill data:', skillData);

    if (this.editingSkill) {
      this.skillsService.updateSkill(this.editingSkill._id!, skillData).subscribe({
        next: (updatedSkill) => {
          console.log('Skill updated:', updatedSkill);
          const index = this.skills.findIndex(s => s._id === updatedSkill._id);
          if (index !== -1) {
            this.skills[index] = updatedSkill;
          }
          this.success = 'Skill updated successfully';
          this.resetSkillForm();
        },
        error: (err) => {
          console.error('Error updating skill:', err);
          this.error = err.error?.message || 'Failed to update skill';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      console.log('Creating new skill...');
      this.skillsService.createSkill(skillData).subscribe({
        next: (newSkill) => {
          console.log('Skill created:', newSkill);
          this.skills.push(newSkill);
          this.success = 'Skill created successfully';
          this.resetSkillForm();
        },
        error: (err) => {
          console.error('Error creating skill:', err);
          this.error = err.error?.message || 'Failed to create skill';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }

  editCategory(category: SkillCategory): void {
    this.editingCategory = category;
    this.showEditCategoryModal = true;
    console.log('Opening edit category modal for:', category);
    this.cdr.detectChanges();
    
    // Force change detection after a small delay to ensure modal renders
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  onEditCategorySave(categoryData: Partial<SkillCategory>): void {
    if (!this.editingCategory) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.updateCategory(this.editingCategory._id!, categoryData).subscribe({
      next: (updatedCategory) => {
        const index = this.categories.findIndex(c => c._id === updatedCategory._id);
        if (index !== -1) {
          this.categories[index] = updatedCategory;
        }
        this.success = 'Category updated successfully';
        this.closeEditCategoryModal();
      },
      error: (error) => {
        this.error = 'Failed to update category. Please try again.';
        console.error('Error updating category:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  closeEditCategoryModal(): void {
    this.showEditCategoryModal = false;
    this.editingCategory = null;
    this.cdr.detectChanges();
  }

  resetSkillForm(): void {
    this.skillForm.reset({ isActive: true });
    this.showSkillForm = false;
    this.editingSkill = null;
  }

  resetCategoryForm(): void {
    this.editingCategory = null;
    this.categoryForm.reset({ isActive: true });
    this.showCategoryForm = false;
  }

  // UI Helpers
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }
} 