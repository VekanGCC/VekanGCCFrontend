import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { VendorManagementService } from '../../../services/vendor-management.service';

@Component({
  selector: 'app-add-skill-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-skill-modal.component.html',
  styleUrls: ['./add-skill-modal.component.css']
})
export class AddSkillModalComponent {
  @Output() close = new EventEmitter<void>();

  skillForm: FormGroup;

  skillCategories = [
    'Programming Languages',
    'Frameworks & Libraries',
    'Databases',
    'Cloud Platforms',
    'DevOps & Tools',
    'Mobile Development',
    'Web Development',
    'Data Science & Analytics',
    'Cybersecurity',
    'Project Management',
    'Other'
  ];

  proficiencyLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private vendorManagementService: VendorManagementService
  ) {
    this.skillForm = this.fb.group({
      skillName: ['', Validators.required],
      category: ['', Validators.required],
      proficiencyLevel: ['intermediate', Validators.required],
      description: ['']
    });
  }

  onSubmit(): void {
    if (this.skillForm.valid) {
      const user = this.authService.currentUser;
      if (!user) return;

      const formValue = this.skillForm.value;

      this.vendorManagementService.addVendorSkill({
        ...formValue,
        vendorId: user._id,
        status: 'pending' as const,
        submittedBy: `${user.firstName} ${user.lastName}`
      });

      this.close.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}