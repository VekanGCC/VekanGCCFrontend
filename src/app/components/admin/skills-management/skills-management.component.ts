import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SkillsService } from '../../../services/skills.service';
import { Skill, SkillCategory } from '../../../models/skill.model';

@Component({
  selector: 'app-skills-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
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

  constructor(
    private skillsService: SkillsService,
    private fb: FormBuilder
  ) {
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
  }

  ngOnInit(): void {
    this.loadSkills();
    this.loadCategories();
  }

  loadSkills(): void {
    this.isLoading = true;
    this.skillsService.getSkills().subscribe({
      next: (skills) => {
        this.skills = skills;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load skills';
        this.isLoading = false;
      }
    });
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

  deleteSkill(id: string): void {
    if (!confirm('Are you sure you want to delete this skill?')) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.deleteSkill(id).subscribe({
      next: () => {
        this.skills = this.skills.filter(s => s._id !== id);
        this.success = 'Skill deleted successfully';
      },
      error: (error) => {
        this.error = 'Failed to delete skill. Please try again.';
        console.error('Error deleting skill:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
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

  deleteCategory(id: string): void {
    if (!confirm('Are you sure you want to delete this category?')) return;

    this.isLoading = true;
    this.error = null;
    this.success = null;

    this.skillsService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c._id !== id);
        this.success = 'Category deleted successfully';
      },
      error: (error) => {
        this.error = 'Failed to delete category. Please try again.';
        console.error('Error deleting category:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
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
    this.editingSkill = skill;
    this.skillForm.patchValue({
      name: skill.name,
      category: skill.category,
      description: skill.description,
      isActive: skill.isActive
    });
    this.showSkillForm = true;
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
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
    this.showCategoryForm = true;
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