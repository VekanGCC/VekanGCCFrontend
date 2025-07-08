import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-edit-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="onCancel()">
      <div class="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" (click)="$event.stopPropagation()">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Edit Category</h3>
            <button
              (click)="onCancel()"
              class="text-gray-400 hover:text-gray-600">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                formControlName="name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category name">
              <div *ngIf="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched" class="text-red-500 text-sm mt-1">
                Name is required and must be at least 2 characters
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                formControlName="description"
                rows="3"
                maxlength="500"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter category description (optional, max 500 characters)"></textarea>
              <div class="flex justify-between items-center mt-1">
                <div *ngIf="categoryForm.get('description')?.invalid && categoryForm.get('description')?.touched" class="text-red-500 text-sm">
                  <span *ngIf="categoryForm.get('description')?.errors?.['maxlength']">Description cannot exceed 500 characters</span>
                </div>
                <div class="text-gray-500 text-sm text-right">
                  {{(categoryForm.get('description')?.value?.length || 0)}}/500
                </div>
              </div>
            </div>
            
            <div class="flex items-center">
              <input
                type="checkbox"
                formControlName="isActive"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
              <label class="ml-2 block text-sm text-gray-700">Active</label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                (click)="onCancel()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="categoryForm.invalid || isLoading"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {{isLoading ? 'Updating...' : 'Update Category'}}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class EditCategoryModalComponent implements OnInit {
  @Input() category: Category | null = null;
  @Input() isLoading = false;
  @Output() save = new EventEmitter<Partial<Category>>();
  @Output() cancel = new EventEmitter<void>();

  categoryForm: FormGroup;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    if (this.category) {
      this.categoryForm.patchValue({
        name: this.category.name,
        description: this.category.description,
        isActive: this.category.isActive
      });
    }
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.categoryForm.valid) {
      this.save.emit(this.categoryForm.value);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 