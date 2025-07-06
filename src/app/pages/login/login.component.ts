import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Subscribe to loading state
    this.authService.loading$.subscribe((isLoading: boolean) => {
      this.isLoading = isLoading;
    });
  }

  onSubmit() {
    console.log('Login form submitted:', this.loginForm.value);
    
    if (this.loginForm.valid) {
      console.log('Form is valid, attempting login...');
      
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Login response received:', response);
          const userType = this.authService.getUserType();
          console.log('User type:', userType);
          
          // Navigate based on user type
          if (userType === 'client') {
            this.router.navigate(['/client-dashboard']);
          } else if (userType === 'vendor') {
            this.router.navigate(['/vendor-dashboard']);
          } else if (userType === 'admin') {
            this.router.navigate(['/admin-dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          console.error('Login error details:', {
            status: error.status,
            message: error.error?.message || 'Unknown error',
            error: error
          });
          this.errorMessage = error.error?.message || 'An error occurred during login';
        }
      });
    } else {
      console.log('Form is invalid:', this.loginForm.errors);
    }
  }
} 