import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';
import { OfflineIndicatorComponent } from './components/offline-indicator/offline-indicator.component';
import './shared/responsive-styles.css';

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
  }

  ngOnInit() {
    // Subscribe to user changes
    this.authService.user$.subscribe(user => {
      if (user && this.authService.isAuthenticated()) {
        // Only redirect if on public routes
        const publicRoutes = ['/', '/login', '/signup'];
        if (publicRoutes.includes(this.router.url)) {
          this.navigateBasedOnRole(user);
        }
      } else {
        // Only navigate to login if trying to access protected routes
        const publicRoutes = ['/', '/login', '/signup'];
        const protectedRoutes = ['/admin', '/vendor', '/client', '/profile'];
        if (protectedRoutes.includes(this.router.url)) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  private navigateBasedOnRole(user: User): void {
    // Add error handling for navigation
    try {
      switch (user.userType) {
        case 'admin':
          this.router.navigate(['/admin']).catch(err => {
            // Handle navigation error silently
          });
          break;
        case 'vendor':
          this.router.navigate(['/vendor']).catch(err => {
            // Handle navigation error silently
          });
          break;
        case 'client':
          this.router.navigate(['/client']).catch(err => {
            // Handle navigation error silently
          });
          break;
        default:
          this.router.navigate(['/']).catch(err => {
            // Handle navigation error silently
          });
      }
    } catch (error) {
      // Handle error silently
    }
  }
}