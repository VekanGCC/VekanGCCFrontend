import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const VendorGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Vendor Guard: Checking vendor access');
  
  return authService.initialized$.pipe(
    map((initialized) => {
      console.log('Vendor Guard: Initialized:', initialized);
      
      if (!initialized) {
        console.log('Vendor Guard: Still initializing, waiting...');
        return false; // Still initializing, don't redirect yet
      }
      
      const user = authService.getCurrentUser();
      console.log('Vendor Guard: Current user:', user);
      const isAuthenticated = authService.isAuthenticated();
      const isVendor = user?.userType === 'vendor';
      console.log('Vendor Guard: Is authenticated:', isAuthenticated, 'Is vendor:', isVendor);
      
      if (user && isAuthenticated && isVendor) {
        // Check if registration is complete
        if (!user.isRegistrationComplete) {
          console.log('Vendor Guard: Registration incomplete, redirecting to signup');
          router.navigate(['/signup'], { 
            queryParams: { 
              type: 'vendor',
              step: user.registrationStep + 1 
            } 
          });
          return false;
        }
        
        return true;
      }
      
      console.log('Vendor Guard: Not authorized, redirecting to home');
      router.navigate(['/']);
      return false;
    })
  );
}; 