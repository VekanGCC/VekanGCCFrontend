import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  private serverAvailableSubject = new BehaviorSubject<boolean>(true);
  private lastServerCheck = 0;
  private readonly SERVER_CHECK_INTERVAL = environment.connectionSettings.serverCheckInterval;

  public isOnline$ = this.isOnlineSubject.asObservable();
  public serverAvailable$ = this.serverAvailableSubject.asObservable();

  constructor() {
    this.initializeConnectionMonitoring();
  }

  private initializeConnectionMonitoring(): void {
    // Only enable monitoring if configured
    if (!environment.connectionSettings.enableOfflineDetection) {
      return;
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Connection: Browser is online');
      this.isOnlineSubject.next(true);
    });

    window.addEventListener('offline', () => {
      console.log('📴 Connection: Browser is offline');
      this.isOnlineSubject.next(false);
      this.serverAvailableSubject.next(false);
    });

    // Initial check
    this.isOnlineSubject.next(navigator.onLine);
  }

  public isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  public isServerAvailable(): boolean {
    return this.serverAvailableSubject.value;
  }

  public markServerUnavailable(): void {
    console.log('🚫 Connection: Marking server as unavailable');
    this.serverAvailableSubject.next(false);
    this.lastServerCheck = Date.now();
  }

  public markServerAvailable(): void {
    console.log('✅ Connection: Marking server as available');
    this.serverAvailableSubject.next(true);
    this.lastServerCheck = Date.now();
  }

  public shouldAttemptRequest(): boolean {
    // If excessive request prevention is disabled, always attempt
    if (!environment.connectionSettings.preventExcessiveRequests) {
      return true;
    }

    const now = Date.now();
    const timeSinceLastCheck = now - this.lastServerCheck;
    
    // If server was recently marked unavailable, don't retry too frequently
    if (!this.serverAvailableSubject.value && timeSinceLastCheck < this.SERVER_CHECK_INTERVAL) {
      console.log('🚫 Connection: Skipping request - server recently unavailable');
      return false;
    }
    
    // If browser is offline, don't attempt requests
    if (!this.isOnline()) {
      console.log('🚫 Connection: Skipping request - browser offline');
      return false;
    }
    
    return true;
  }

  public canRetryRequest(): boolean {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastServerCheck;
    
    // Allow retry if enough time has passed since last failure
    return timeSinceLastCheck >= this.SERVER_CHECK_INTERVAL;
  }
} 