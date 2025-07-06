import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ComponentLoadState {
  isLoading: boolean;
  component: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComponentLoaderService {
  private loadingStateSubject = new BehaviorSubject<ComponentLoadState>({
    isLoading: false,
    component: ''
  });

  public loadingState$ = this.loadingStateSubject.asObservable();

  private componentCache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();

  async loadComponent(componentName: string, loader: () => Promise<any>): Promise<any> {
    // Return cached component if available
    if (this.componentCache.has(componentName)) {
      return this.componentCache.get(componentName);
    }

    // Return existing loading promise if component is already being loaded
    if (this.loadingPromises.has(componentName)) {
      return this.loadingPromises.get(componentName);
    }

    // Set loading state
    this.loadingStateSubject.next({
      isLoading: true,
      component: componentName
    });

    try {
      // Create loading promise
      const loadingPromise = loader();
      this.loadingPromises.set(componentName, loadingPromise);

      // Wait for component to load
      const component = await loadingPromise;
      
      // Cache the component
      this.componentCache.set(componentName, component);
      
      // Clear loading state
      this.loadingStateSubject.next({
        isLoading: false,
        component: componentName
      });

      // Clean up loading promise
      this.loadingPromises.delete(componentName);

      return component;

    } catch (error) {
      // Set error state
      this.loadingStateSubject.next({
        isLoading: false,
        component: componentName,
        error: error instanceof Error ? error.message : 'Failed to load component'
      });

      // Clean up loading promise
      this.loadingPromises.delete(componentName);

      throw error;
    }
  }

  isComponentCached(componentName: string): boolean {
    return this.componentCache.has(componentName);
  }

  isComponentLoading(componentName: string): boolean {
    return this.loadingPromises.has(componentName);
  }

  clearCache(): void {
    this.componentCache.clear();
    this.loadingPromises.clear();
  }

  getCacheSize(): number {
    return this.componentCache.size;
  }

  getCachedComponents(): string[] {
    return Array.from(this.componentCache.keys());
  }
} 