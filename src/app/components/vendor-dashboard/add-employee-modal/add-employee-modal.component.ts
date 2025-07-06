import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VendorService } from '../../../services/vendor.service';

@Component({
  selector: 'app-add-employee-modal',
  templateUrl: './add-employee-modal.component.html',
  styleUrls: ['./add-employee-modal.component.scss']
})
export class AddEmployeeModalComponent {
  @Output() employeeAdded = new EventEmitter<any>();
  @Output() modalClosed = new EventEmitter<void>();

  addEmployeeForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService
  ) {
    this.addEmployeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.addEmployeeForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const employeeData = this.addEmployeeForm.value;

      this.vendorService.addEmployee(employeeData).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response.message;
          this.employeeAdded.emit(response.data);
          
          // Reset form
          this.addEmployeeForm.reset();
          
          // Close modal after 2 seconds
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Error adding employee';
        }
      });
    }
  }

  closeModal() {
    this.modalClosed.emit();
  }
} 