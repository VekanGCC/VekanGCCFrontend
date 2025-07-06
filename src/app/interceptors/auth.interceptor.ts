import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const AuthInterceptor: HttpInterceptorFn = (
  request: any,
  next: any
): Observable<any> => {
  const router = inject(Router);
  let isRedirecting = false;

  // Skip all handling for logout requests
  if (request.url.includes('/auth/logout')) {
    return next(request);
  }

  // Get the auth token from sessionStorage
  const authToken = sessionStorage.getItem('authToken');
  
  // Skip adding token for login and public endpoints
  if (request.url.includes('/auth/login') || 
      request.url.includes('/assets/') || 
      !authToken) {
    return next(request);
  }

  // Clone the request and add the authorization header
  const authReq = request.clone({
    headers: request.headers.set('Authorization', `Bearer ${authToken}`)
  });

  // Handle the request and catch any authentication errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isRedirecting) {
        // If we get a 401 Unauthorized response, the token is invalid or expired
        console.log('🔒 Auth token expired or invalid, redirecting to login');
        isRedirecting = true;
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        
        // Only redirect if we're not already on the login page
        if (!router.url.includes('/login')) {
          router.navigate(['/login']).then(() => {
            isRedirecting = false;
          });
        } else {
          isRedirecting = false;
        }
      }
      return throwError(() => error);
    })
  );
};