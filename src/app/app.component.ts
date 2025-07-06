import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';
import { OfflineIndicatorComponent } from './components/offline-indicator/offline-indicator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, OfflineIndicatorComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    console.log('App Component: Constructor called');
  }

  ngOnInit() {
    console.log('App Component: Initializing');
    
    
    // Subscribe to user changes
    this.authService.user$.subscribe(user => {
      console.log('App Component: User state changed:', user);
      console.log('App Component: Current URL:', this.router.url);
      
      if (user && this.authService.isAuthenticated()) {
        console.log('App Component: User is authenticated, userType:', user.userType);
        // Only redirect if on public routes
        const publicRoutes = ['/', '/login', '/signup'];
        if (publicRoutes.includes(this.router.url)) {
          console.log('App Component: On public route, navigating based on role');
          this.navigateBasedOnRole(user);
        } else {
          console.log('App Component: On protected route, no navigation needed');
        }
      } else {
        console.log('App Component: No user logged in or not authenticated');
        // Only navigate to login if trying to access protected routes
        const publicRoutes = ['/', '/login', '/signup'];
        const protectedRoutes = ['/admin', '/vendor', '/client', '/profile'];
        if (protectedRoutes.includes(this.router.url)) {
          console.log('App Component: On protected route, redirecting to login');
          this.router.navigate(['/login']);
        } else {
          console.log('App Component: On public route, no navigation needed');
        }
      }
    });
  }

  private navigateBasedOnRole(user: User): void {
    console.log('App Component: Navigating based on userType:', user.userType);
    
    // Add error handling for navigation
    try {
      switch (user.userType) {
        case 'admin':
          console.log('App Component: Navigating to admin dashboard');
          this.router.navigate(['/admin']).catch(err => {
            console.error('App Component: Navigation error to admin:', err);
          });
          break;
        case 'vendor':
          console.log('App Component: Navigating to vendor dashboard');
          this.router.navigate(['/vendor']).catch(err => {
            console.error('App Component: Navigation error to vendor:', err);
          });
          break;
        case 'client':
          console.log('App Component: Navigating to client dashboard');
          this.router.navigate(['/client']).catch(err => {
            console.error('App Component: Navigation error to client:', err);
          });
          break;
        default:
          console.log('App Component: Unknown user type, navigating to home');
          this.router.navigate(['/']).catch(err => {
            console.error('App Component: Navigation error to home:', err);
          });
      }
    } catch (error) {
      console.error('App Component: Error during navigation:', error);
    }
  }
}