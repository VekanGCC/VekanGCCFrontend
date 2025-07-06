import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ApiService } from '../../../services/api.service';
import { AdminSkill } from '../../../models/admin.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-vendor-skill-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-vendor-skill-modal.component.html',
  styleUrls: ['./add-vendor-skill-modal.component.css']
})
export class AddVendorSkillModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() skillAdded = new EventEmitter<any>();

  skillForm: FormGroup;
  availableSkills: AdminSkill[] = [];
  loadingSkills = false;
  submitting = false;
  private subscription = new Subscription();

  proficiencyLevels = [
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.skillForm = this.fb.group({
      skill: ['', Validators.required],
      description: ['', Validators.required],
      yearsOfExperience: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      proficiencyLevel: ['advanced', Validators.required]
    });
  }

  ngOnInit(): void {
    // Load skills when component initializes
    this.loadAvailableSkills();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Load skills when modal opens
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      console.log('🔧 AddVendorSkillModal: Modal opened, loading skills');
      this.loadAvailableSkills();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private loadAvailableSkills(): void {
    console.log('🔧 AddVendorSkillModal: Loading available skills...');
    this.loadingSkills = true;
    this.subscription.add(
      this.apiService.getActiveSkills().subscribe({
        next: (response) => {
          console.log('🔧 AddVendorSkillModal: Skills API response:', response);
          if (response.success && response.data) {
            this.availableSkills = response.data;
            console.log('🔧 AddVendorSkillModal: Loaded available skills:', this.availableSkills);
          } else {
            console.warn('🔧 AddVendorSkillModal: No skills data in response');
            this.availableSkills = [];
          }
          this.loadingSkills = false;
        },
        error: (error) => {
          console.error('🔧 AddVendorSkillModal: Error loading skills:', error);
          this.availableSkills = [];
          this.loadingSkills = false;
        }
      })
    );
  }

  onSubmit(): void {
    if (this.skillForm.valid) {
      this.submitting = true;
      const skillData = { ...this.skillForm.value };
      // Map proficiencyLevel to proficiency for backend compatibility
      skillData.proficiency = skillData.proficiencyLevel;
      delete skillData.proficiencyLevel;
      
      console.log('🔧 AddVendorSkillModal: Submitting skill data:', skillData);
      
      this.subscription.add(
        this.apiService.createVendorSkill(skillData).subscribe({
          next: (response: any) => {
            if (response.success) {
              console.log('🔧 AddVendorSkillModal: Skill created successfully:', response.data);
              this.skillAdded.emit(response.data);
              this.closeModal.emit();
              this.skillForm.reset({ proficiencyLevel: 'advanced' });
            } else {
              console.error('🔧 AddVendorSkillModal: Error creating skill:', response.message);
            }
            this.submitting = false;
          },
          error: (error: any) => {
            console.error('🔧 AddVendorSkillModal: Error creating skill:', error);
            this.submitting = false;
          }
        })
      );
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.skillForm.controls).forEach(key => {
      const control = this.skillForm.get(key);
      control?.markAsTouched();
    });
  }

  onClose(): void {
    this.closeModal.emit();
    this.skillForm.reset({ proficiencyLevel: 'advanced' });
  }

  getErrorMessage(controlName: string): string {
    const control = this.skillForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} is required`;
      }
      if (control.errors['min']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at least ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `${controlName.charAt(0).toUpperCase() + controlName.slice(1)} must be at most ${control.errors['max'].max}`;
      }
    }
    return '';
  }
} 