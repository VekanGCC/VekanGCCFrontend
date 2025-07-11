import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  resetLink = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { email } = this.forgotPasswordForm.value;

      this.authService.forgotPassword(email).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = response.message || 'Password reset link generated successfully!';
            this.resetLink = response.resetLink || '';
            // Clear the form
            this.forgotPasswordForm.reset();
          } else {
            this.errorMessage = response.message || 'An error occurred while sending the reset email.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Forgot password error:', error);
          
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 404) {
            this.errorMessage = 'No account found with this email address.';
          } else if (error.status === 500) {
            this.errorMessage = 'Unable to send reset email. Please try again later.';
          } else {
            this.errorMessage = 'An unexpected error occurred. Please try again.';
          }
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required.`;
      }
      if (field.errors?.['email']) {
        return 'Please enter a valid email address.';
      }
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  copyResetLink(): void {
    if (this.resetLink) {
      navigator.clipboard.writeText(this.resetLink).then(() => {
        // You could add a toast notification here if you have one
        console.log('Reset link copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy reset link:', err);
      });
    }
  }
} 