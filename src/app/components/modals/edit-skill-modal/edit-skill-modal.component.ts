import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Skill, SkillCategory } from '../../../models/skill.model';

@Component({
  selector: 'app-edit-skill-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;">
      <div style="position: relative; top: 50px; margin: 0 auto; width: 500px; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0; color: #333;">Edit Skill: {{skill?.name}}</h3>
        
        <form [formGroup]="skillForm" (ngSubmit)="onSubmit()">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Skill Name:</label>
            <input 
              type="text" 
              formControlName="name" 
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
              placeholder="Enter skill name">
            <div *ngIf="skillForm.get('name')?.invalid && skillForm.get('name')?.touched" style="color: red; font-size: 12px; margin-top: 5px;">
              Skill name is required and must be at least 2 characters
            </div>
          </div>



          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
            <textarea 
              formControlName="description" 
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 80px;"
              placeholder="Enter skill description (max 500 characters)"
              maxlength="500"></textarea>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
              <div *ngIf="skillForm.get('description')?.invalid && skillForm.get('description')?.touched" style="color: red; font-size: 12px;">
                <span *ngIf="skillForm.get('description')?.errors?.['required']">Description is required</span>
                <span *ngIf="skillForm.get('description')?.errors?.['maxlength']">Description cannot exceed 500 characters</span>
              </div>
              <div style="color: #666; font-size: 12px; text-align: right;">
                {{(skillForm.get('description')?.value?.length || 0)}}/500
              </div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input 
                type="checkbox" 
                formControlName="isActive" 
                style="margin-right: 8px;">
              Active
            </label>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button 
              type="button" 
              (click)="onCancel()" 
              style="padding: 10px 20px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 4px; cursor: pointer;">
              Cancel
            </button>
            <button 
              type="submit" 
              [disabled]="skillForm.invalid || isLoading"
              style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              {{isLoading ? 'Saving...' : 'Save'}}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class EditSkillModalComponent implements OnInit {
  @Input() skill: Skill | null = null;
  @Input() isLoading = false;
  @Output() save = new EventEmitter<Partial<Skill>>();
  @Output() cancel = new EventEmitter<void>();

  skillForm: FormGroup;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef) {
    this.skillForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    if (this.skill) {
      this.skillForm.patchValue({
        name: this.skill.name,
        description: this.skill.description,
        isActive: this.skill.isActive
      });
    }
    
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.skillForm.valid) {
      this.save.emit(this.skillForm.value);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.skillForm.controls).forEach(key => {
        const control = this.skillForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
} 