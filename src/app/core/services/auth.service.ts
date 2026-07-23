import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  
  // Signal réactif représentant l'état d'authentification de l'utilisateur
  readonly isAuthenticatedSignal = signal<boolean>(this.checkToken());

  private checkToken(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return !!localStorage.getItem('raissa_auth_token');
    }
    return false;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === '12345678@2.0A') {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('raissa_auth_token', 'session-active-token');
      }
      this.isAuthenticatedSignal.set(true);
      return true;
    }
    return false;
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('raissa_auth_token');
    }
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }
}
