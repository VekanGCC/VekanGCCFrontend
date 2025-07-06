import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Check for error messages in query parameters
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.errorMessage = params['error'];
      }
    });

    // Check if user is already logged in
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.navigateBasedOnRole(currentUser);
    }

    // Clear error message when user starts typing
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    });
  }

  getFieldError(field: string): string {
    const control = this.loginForm.get(field);
    if (!this.submitted && !control?.touched) {
      return '';
    }
    if (control?.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
    if (field === 'email' && control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field === 'password' && control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.loginForm.value;
      console.log('LoginComponent: Attempting login for:', email);
      
      const response = await firstValueFrom(this.authService.login(email, password));
      console.log('LoginComponent: Login response:', response);

      if (response.success) {
        console.log('LoginComponent: Login successful, checking user status');
        const user = this.authService.getCurrentUser();
        console.log('LoginComponent: Current user after login:', user);
        
        if (user) {
          this.navigateBasedOnRole(user);
        } else {
          console.error('LoginComponent: User data not found after successful login');
          this.errorMessage = 'Login successful but user data not found';
        }
      } else {
        console.error('LoginComponent: Login failed:', response.message);
        this.errorMessage = response.message || 'Login failed';
      }
    } catch (error: any) {
      console.error('LoginComponent: Login error:', error);
      
      // Handle specific approval status errors
      if (error.message && error.message.includes('pending approval')) {
        this.errorMessage = 'Your account is pending approval. Please contact the administrator.';
      } else if (error.message && error.message.includes('rejected')) {
        this.errorMessage = 'Your account has been rejected. Please contact the administrator for more information.';
      } else {
        this.errorMessage = error.error?.message || error.message || 'An error occurred during login';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private navigateBasedOnRole(user: any): void {
    console.log('LoginComponent: Navigating based on user type:', user.userType);
    
    switch (user.userType) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'vendor':
        this.router.navigate(['/vendor']);
        break;
      case 'client':
        this.router.navigate(['/client']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }
}