import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
    
  return authService.initialized$.pipe(
    map((initialized) => {
      if (!initialized) {
        return false; // Still initializing, don't redirect yet
      }
      
      const user = authService.getCurrentUser();
      const isAuthenticated = authService.isAuthenticated();
      
      if (user && isAuthenticated) {
        // Check if user is approved only if registration is complete
        if (user.isRegistrationComplete) {
          if (user.approvalStatus === 'pending') {
            authService.clearAuthState();
            router.navigate(['/login'], { 
              queryParams: { 
                error: 'Your account is pending approval. Please contact the administrator.' 
              } 
            });
            return false;
          }
          
          if (user.approvalStatus === 'rejected') {
            authService.clearAuthState();
            router.navigate(['/login'], { 
              queryParams: { 
                error: 'Your account has been rejected. Please contact the administrator for more information.' 
              } 
            });
            return false;
          }
        }
        
        return true;
      }
      
      router.navigate(['/login']);
      return false;
    })
  );
};