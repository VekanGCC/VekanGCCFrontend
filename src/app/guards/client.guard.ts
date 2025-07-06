import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';

export const ClientGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('Client Guard: Checking client access');
  
  return authService.initialized$.pipe(
    map((initialized) => {
      console.log('Client Guard: Initialized:', initialized);
      
      if (!initialized) {
        console.log('Client Guard: Still initializing, waiting...');
        return false; // Still initializing, don't redirect yet
      }
      
      const user = authService.getCurrentUser();
      console.log('Client Guard: Current user:', user);
      const isAuthenticated = authService.isAuthenticated();
      const isClient = user?.userType === 'client';
      console.log('Client Guard: Is authenticated:', isAuthenticated, 'Is client:', isClient);
      
      if (user && isAuthenticated && isClient) {
        return true;
      }
      
      console.log('Client Guard: Not authorized, redirecting to home');
      router.navigate(['/']);
      return false;
    })
  );
}; 