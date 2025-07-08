import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AdminSkill } from '../../../models/admin.model';

@Component({
  selector: 'app-add-admin-skill-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 class="text-2xl font-bold text-gray-900">Add New Skill</h2>
          <button (click)="onCancel()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <img src="assets/icons/lucide/lucide/x.svg" alt="x" class="w-6 h-6" />
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="skillForm" (ngSubmit)="onSubmit()" class="p-6 space-y-6">
          <!-- Skill Name -->
          <div class="space-y-2">
            <label for="name" class="block text-sm font-semibold text-gray-700">Skill Name</label>
            <input 
              type="text" 
              id="name" 
              formControlName="name"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter skill name"
            >
            <div *ngIf="skillForm.get('name')?.invalid && skillForm.get('name')?.touched" 
                 class="text-sm text-red-500 flex items-center mt-1">
              <img src="assets/icons/lucide/lucide/info.svg" alt="alert-circle" class="w-4 h-4 mr-1" />
              Skill name is required
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-2">
            <label for="description" class="block text-sm font-semibold text-gray-700">Description</label>
            <textarea 
              id="description" 
              formControlName="description"
              rows="4"
              maxlength="500"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="Enter skill description (max 500 characters)"
            ></textarea>
            <div class="flex justify-between items-center mt-1">
              <div *ngIf="skillForm.get('description')?.invalid && skillForm.get('description')?.touched" 
                   class="text-sm text-red-500 flex items-center">
                <img src="assets/icons/lucide/lucide/info.svg" alt="alert-circle" class="w-4 h-4 mr-1" />
                <span *ngIf="skillForm.get('description')?.errors?.['required']">Description is required</span>
                <span *ngIf="skillForm.get('description')?.errors?.['maxlength']">Description cannot exceed 500 characters</span>
              </div>
              <div class="text-sm text-gray-500">
                {{(skillForm.get('description')?.value?.length || 0)}}/500
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" 
               class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-600">
            <img src="assets/icons/lucide/lucide/info.svg" alt="alert-circle" class="w-5 h-5 mr-2" />
            {{errorMessage}}
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              (click)="onCancel()"
              class="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              [disabled]="!skillForm.valid || isLoading"
              class="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
            >
              <img *ngIf="isLoading" src="assets/icons/lucide/lucide/loader.svg" alt="loader-2" class="w-4 h-4 animate-spin mr-2" />
              <img *ngIf="!isLoading" src="assets/icons/lucide/lucide/check.svg" alt="check" class="w-4 h-4 mr-2" />
              Add Skill
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AddAdminSkillModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() skillAdded = new EventEmitter<AdminSkill>();

  skillForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.skillForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.skillForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const skillData = this.skillForm.value;
      
      this.adminService.addAdminSkill(skillData)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.success) {
              this.skillAdded.emit(response.data);
              this.onCancel();
            } else {
              this.errorMessage = response.message || 'Failed to add skill';
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.error?.message || 'An error occurred while adding the skill';
          }
        });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}