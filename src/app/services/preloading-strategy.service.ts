import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (route.data && route.data['preload']) {
      // Delay preloading by 2 seconds to avoid blocking initial load
      return timer(2000).pipe(
        mergeMap(() => {
          console.log('🔄 Preloading:', route.path);
          return load();
        })
      );
    }
    return of(null);
  }
} 