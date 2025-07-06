import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { Category } from '../../../models/category.model';
import { ApiResponse } from '../../../models/api-response.model';

@Component({
  selector: 'app-add-category-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Add New Category</h3>
          <button 
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <img src="assets/icons/lucide/lucide/x.svg" alt="close" class="w-5 h-5" />
          </button>
        </div>

        <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="p-6">
          <div class="space-y-4">
            <!-- Category Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input 
                type="text" 
                formControlName="name"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter category name"
                [class.border-red-500]="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched">
              <div *ngIf="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched" 
                   class="text-red-500 text-sm mt-1">
                Category name is required
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea 
                formControlName="description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter category description (optional)"></textarea>
            </div>

            <!-- Active Status -->
            <div>
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  formControlName="isActive"
                  id="isActive"
                  class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded">
                <label for="isActive" class="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Active categories will be available for selection in resources and requirements
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 mt-6">
            <button 
              type="button"
              (click)="onClose()"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button 
              type="submit"
              [disabled]="categoryForm.invalid || isSubmitting"
              class="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              <span *ngIf="isSubmitting">Adding...</span>
              <span *ngIf="!isSubmitting">Add Category</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class AddCategoryModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() categoryAdded = new EventEmitter<Category>();

  categoryForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    this.isSubmitting = true;
    const formData = this.categoryForm.value;

    this.adminService.addCategory(formData).subscribe({
      next: (response: ApiResponse<Category>) => {
        if (response.success) {
          this.categoryAdded.emit(response.data);
          this.onClose();
        } else {
          console.error('Failed to add category:', response.message);
        }
      },
      error: (error) => {
        console.error('Error adding category:', error);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
} 