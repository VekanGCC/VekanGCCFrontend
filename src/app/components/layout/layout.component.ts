import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  currentUser$ = this.authService.user$;
  showUserMenu = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  goToProfile(): void {
    this.showUserMenu = false;
    
    // Get current user to determine which dashboard to navigate to
    const user = this.authService.getCurrentUser();
    if (user) {
      switch (user.userType) {
        case 'admin':
          this.router.navigate(['/admin'], { fragment: 'profile' });
          break;
        case 'vendor':
          this.router.navigate(['/vendor'], { fragment: 'profile' });
          break;
        case 'client':
          this.router.navigate(['/client'], { fragment: 'profile' });
          break;
        default:
          this.router.navigate(['/']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.showUserMenu = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 