import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConnectionService } from '../../services/connection.service';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showOfflineIndicator" 
         class="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 px-4 text-sm font-medium">
      <div class="flex items-center justify-center space-x-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span>{{ offlineMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  showOfflineIndicator = false;
  offlineMessage = '';
  private subscriptions: Subscription[] = [];

  constructor(private connectionService: ConnectionService) {}

  ngOnInit(): void {
    // Subscribe to online/offline status
    this.subscriptions.push(
      this.connectionService.isOnline$.subscribe(isOnline => {
        this.updateOfflineStatus();
      })
    );

    // Subscribe to server availability
    this.subscriptions.push(
      this.connectionService.serverAvailable$.subscribe(serverAvailable => {
        this.updateOfflineStatus();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateOfflineStatus(): void {
    const isOnline = this.connectionService.isOnline();
    const serverAvailable = this.connectionService.isServerAvailable();

    if (!isOnline) {
      this.showOfflineIndicator = true;
      this.offlineMessage = 'You are currently offline. Please check your internet connection.';
    } else if (!serverAvailable) {
      this.showOfflineIndicator = true;
      this.offlineMessage = 'Server is currently unavailable. Please try again later.';
    } else {
      this.showOfflineIndicator = false;
      this.offlineMessage = '';
    }
  }
} 