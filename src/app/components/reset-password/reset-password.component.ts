import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  resetToken: string = '';
  isTokenValid = false;
  isTokenChecked = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get the reset token from the URL
    this.route.params.subscribe(params => {
      this.resetToken = params['token'];
      if (this.resetToken) {
        this.validateResetToken();
      } else {
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
        this.isTokenChecked = true;
      }
    });
  }

  private validateResetToken(): void {
    // For now, we'll assume the token is valid if it exists
    // In a real implementation, you might want to validate the token with the backend
    this.isTokenValid = true;
    this.isTokenChecked = true;
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: any } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.isTokenValid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { password } = this.resetPasswordForm.value;

      this.authService.resetPassword(this.resetToken, password).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.successMessage = 'Password reset successfully! You will be redirected to login in a few seconds.';
            // Clear the form
            this.resetPasswordForm.reset();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          } else {
            this.errorMessage = response.message || 'An error occurred while resetting your password.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Reset password error:', error);
          
          if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.status === 400) {
            this.errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
          } else if (error.status === 500) {
            this.errorMessage = 'Unable to reset password. Please try again later.';
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
    const field = this.resetPasswordForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return `${fieldName === 'confirmPassword' ? 'Confirm password' : 'Password'} is required.`;
      }
      if (field.errors?.['minlength']) {
        return 'Password must be at least 6 characters long.';
      }
    }
    return '';
  }

  getFormError(): string {
    if (this.resetPasswordForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match.';
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
} 