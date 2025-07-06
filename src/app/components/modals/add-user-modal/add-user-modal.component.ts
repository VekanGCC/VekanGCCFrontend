import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../services/auth.service';
import { VendorService } from '../../../services/vendor.service';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-add-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-user-modal.component.html',
  styleUrls: ['./add-user-modal.component.css']
})
export class AddUserModalComponent {
  @Input() userType: 'vendor' | 'client' = 'vendor';
  @Output() close = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<any>();

  userForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Role options based on user type
  roleOptions: { value: string; label: string; description: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private vendorService: VendorService,
    private clientService: ClientService
  ) {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      organizationRole: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.updateRoleOptions();
  }

  // Update role options when userType changes
  ngOnChanges(): void {
    this.updateRoleOptions();
  }

  private updateRoleOptions(): void {
    if (this.userType === 'client') {
      this.roleOptions = [
        { 
          value: 'client_employee', 
          label: 'Employee', 
          description: 'Can view requirements and resources, manage applications' 
        },
        { 
          value: 'client_account', 
          label: 'Account Manager', 
          description: 'Can manage SOWs, POs, and invoices. No access to requirements/resources' 
        }
      ];
    } else {
      this.roleOptions = [
        { 
          value: 'vendor_employee', 
          label: 'Employee', 
          description: 'Can view requirements and manage resources, applications' 
        },
        { 
          value: 'vendor_account', 
          label: 'Account Manager', 
          description: 'Can manage POs and invoices. No access to requirements/resources' 
        }
      ];
    }

    // Set default role
    if (this.userForm) {
      this.userForm.patchValue({
        organizationRole: this.roleOptions[0]?.value || ''
      });
    }
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      group.get('confirmPassword')?.setErrors(null);
      return null;
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Remove confirmPassword before sending to API
      const { confirmPassword, ...employeeData } = this.userForm.value;

      // Use appropriate service based on userType
      if (this.userType === 'client') {
        this.clientService.addOrganizationUser(employeeData).subscribe({
          next: (response: any) => {
            this.loading = false;
            this.successMessage = response.message || 'Employee added successfully!';
            this.userAdded.emit(response.data);
            
            // Reset form
            this.userForm.reset();
            this.userForm.markAsUntouched();
            this.userForm.markAsPristine();
            
            // Close modal after 2 seconds
            setTimeout(() => {
              this.close.emit();
            }, 2000);
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = error.error?.message || 'Error adding employee';
          }
        });
      } else {
        this.vendorService.addEmployee(employeeData).subscribe({
          next: (response: any) => {
            this.loading = false;
            this.successMessage = response.message || 'Employee added successfully!';
            this.userAdded.emit(response.data);
            
            // Reset form
            this.userForm.reset();
            this.userForm.markAsUntouched();
            this.userForm.markAsPristine();
            
            // Close modal after 2 seconds
            setTimeout(() => {
              this.close.emit();
            }, 2000);
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = error.error?.message || 'Error adding employee';
          }
        });
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }

  // Helper method for template
  getRoleDescription(): string {
    const selectedRole = this.userForm.get('organizationRole')?.value;
    const role = this.roleOptions.find(r => r.value === selectedRole);
    return role?.description || 'Select a role to see description';
  }
}