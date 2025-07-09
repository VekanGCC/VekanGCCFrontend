import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User } from '../models/user.model';
import { tap, finalize, map } from 'rxjs/operators';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  data: T;
}

interface UsersResponse {
  success: boolean;
  data: User[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private initializedSubject = new BehaviorSubject<boolean>(false);

  // Expose observables
  public user$ = this.currentUserSubject.asObservable();
  public currentUser$ = this.user$; // Alias for backward compatibility
  public loading$ = this.loadingSubject.asObservable();
  public initialized$ = this.initializedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    console.log('Auth Service: Constructor called');
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    console.log('Auth Service: Initializing auth state');
    
    const token = sessionStorage.getItem('authToken');
    const userData = sessionStorage.getItem('user');

    console.log('Auth Service: Found token:', !!token, 'Found user data:', !!userData);

    if (token && userData) {
      try {
        console.log('Auth Service: Verifying token...');
        const response = await firstValueFrom(this.apiService.verifyToken(token));
        console.log('Auth Service: Token verification response:', response);
        
        if (response.success) {
          console.log('Auth Service: Token verified successfully');
          const user = JSON.parse(userData);
          this.currentUserSubject.next(user);
        } else {
          console.log('Auth Service: Token verification failed');
          this.clearAuthState();
        }
      } catch (error) {
        console.error('Auth Service: Error verifying token:', error);
        
        // Don't clear auth state for connection errors - user might be offline
        if (error instanceof Error && error.message.includes('Server is not available')) {
          console.log('Auth Service: Server unavailable, keeping cached auth state');
          // Keep the cached user data but mark as potentially stale
          const user = JSON.parse(userData);
          this.currentUserSubject.next(user);
        } else {
          this.clearAuthState();
        }
      }
    } else {
      console.log('Auth Service: No token or user data found');
      this.clearAuthState();
    }
    
    // Mark initialization as complete
    this.initializedSubject.next(true);
  }

  clearAuthState(): void {
    console.log('Auth Service: Clearing auth state');
    
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  login(email: string, password: string): Observable<ApiResponse<any>> {
    console.log('Auth Service: Login attempt for:', email);
    
    this.loadingSubject.next(true);
    
    return this.apiService.login({ email, password }).pipe(
      tap(response => {
        console.log('Auth Service: Login response:', response);
        if (response.success) {
          const { token, data } = response;
          
          // Check approval status only if registration is complete
          if (data.isRegistrationComplete) {
            if (data.approvalStatus === 'pending') {
              console.log('Auth Service: Login blocked - user approval pending');
              throw new Error('Your account is pending approval. Please contact the administrator.');
            }
            
            if (data.approvalStatus === 'rejected') {
              console.log('Auth Service: Login blocked - user approval rejected');
              throw new Error('Your account has been rejected. Please contact the administrator for more information.');
            }
            
            if (data.approvalStatus !== 'approved') {
              const statusMessage = data.approvalStatus || 'unknown';
              throw new Error(`Your account status is '${statusMessage}'. Only approved accounts can login.`);
            }
          } else {
            console.log('Auth Service: Registration incomplete, allowing login to complete registration');
          }
          
          console.log('Auth Service: Storing token and user data');
          sessionStorage.setItem('authToken', token);
          sessionStorage.setItem('user', JSON.stringify(data));
          this.currentUserSubject.next(data);
        }
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  async logout(): Promise<void> {
    console.log('Auth Service: Logout initiated');
    try {
      await firstValueFrom(this.apiService.logout());
    } catch (error) {
      console.error('Auth Service: Logout error:', error);
    } finally {
      this.clearAuthState();
      this.router.navigate(['/login']);
    }
  }

  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('authToken');
    const user = this.currentUserSubject.value;
    const isAuth = !!token && !!user;
    console.log('Auth Service: Checking authentication:', { token: !!token, user: !!user, isAuth });
        return isAuth;
  }

  getCurrentUser(): User | null {
    const user = this.currentUserSubject.value;
    console.log('Auth Service: Getting current user:', user);
    return user;
  }

  getUserType(): string | null {
    const userType = this.currentUserSubject.value?.userType || null;
    console.log('Auth Service: Getting user type:', userType);
    return userType;
  }

  // Alias for backward compatibility
  get currentUser(): User | null {
    return this.getCurrentUser();
  }

  // Get users (for admin)
  getUsers(): Observable<User[]> {
    return this.apiService.get<UsersResponse>('/users').pipe(
      map(response => response.success ? response.data : [])
    );
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.userType === role;
  }

  isUserApproved(): boolean {
    const user = this.currentUserSubject.value;
    return user?.approvalStatus === 'approved';
  }

  getUserApprovalStatus(): string | null {
    const user = this.currentUserSubject.value;
    return user?.approvalStatus || null;
  }

  // Forgot password functionality
  forgotPassword(email: string): Observable<ApiResponse<any>> {
    console.log('Auth Service: Forgot password request for:', email);
    
    this.loadingSubject.next(true);
    
    return this.apiService.post<ApiResponse<any>>('/auth/forgot-password', { email }).pipe(
      tap(response => {
        console.log('Auth Service: Forgot password response:', response);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  resetPassword(resetToken: string, password: string): Observable<ApiResponse<any>> {
    console.log('Auth Service: Reset password request with token');
    
    this.loadingSubject.next(true);
    
    return this.apiService.put<ApiResponse<any>>(`/auth/reset-password/${resetToken}`, { password }).pipe(
      tap(response => {
        console.log('Auth Service: Reset password response:', response);
        if (response.success) {
          // If reset is successful and returns tokens, store them
          const { token, data } = response;
          if (token && data) {
            console.log('Auth Service: Storing new token and user data after password reset');
            sessionStorage.setItem('authToken', token);
            sessionStorage.setItem('user', JSON.stringify(data));
            this.currentUserSubject.next(data);
          }
        }
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }
}