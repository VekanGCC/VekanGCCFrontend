import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Auth Guard: Checking authentication');
    
  return authService.initialized$.pipe(
    map((initialized) => {
      console.log('Auth Guard: Initialized:', initialized);
      
      if (!initialized) {
        console.log('Auth Guard: Still initializing, waiting...');
        return false; // Still initializing, don't redirect yet
      }
      
      const user = authService.getCurrentUser();
      console.log('Auth Guard: Current user:', user);
      const isAuthenticated = authService.isAuthenticated();
      console.log('Auth Guard: Is authenticated:', isAuthenticated);
      
      if (user && isAuthenticated) {
        // Check if user is approved only if registration is complete
        if (user.isRegistrationComplete) {
          if (user.approvalStatus === 'pending') {
            console.log('Auth Guard: User approval pending, redirecting to login');
            authService.clearAuthState();
            router.navigate(['/login'], { 
              queryParams: { 
                error: 'Your account is pending approval. Please contact the administrator.' 
              } 
            });
            return false;
          }
          
          if (user.approvalStatus === 'rejected') {
            console.log('Auth Guard: User approval rejected, redirecting to login');
            authService.clearAuthState();
            router.navigate(['/login'], { 
              queryParams: { 
                error: 'Your account has been rejected. Please contact the administrator for more information.' 
              } 
            });
            return false;
          }
        } else {
          console.log('Auth Guard: Registration incomplete, allowing access to complete registration');
        }
        
        console.log('Auth Guard: Access granted');
        return true;
      }
      
      console.log('Auth Guard: Access denied, redirecting to login');
      router.navigate(['/login']);
      return false;
    })
  );
};