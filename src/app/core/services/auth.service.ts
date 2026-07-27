import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  
  // Signal réactif représentant l'état d'authentification de l'utilisateur
  readonly isAuthenticatedSignal = signal<boolean>(false);
  readonly currentUserSignal = signal<User | null>(null);

  private isInitialized = false;
  private resolveInitialized!: (value: boolean) => void;
  private readonly initPromise = new Promise<boolean>((resolve) => {
    this.resolveInitialized = resolve;
  });

  constructor() {
    // Écouteur en temps réel de l'état d'authentification Firebase
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUserSignal.set(user);
        this.isAuthenticatedSignal.set(true);
      } else {
        this.currentUserSignal.set(null);
        this.isAuthenticatedSignal.set(false);
      }

      if (!this.isInitialized) {
        this.isInitialized = true;
        this.resolveInitialized(true);
      }
    });
  }

  async ensureInitialized(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initPromise;
    }
    return this.isAuthenticatedSignal();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (credential.user) {
        this.currentUserSignal.set(credential.user);
        this.isAuthenticatedSignal.set(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AuthService] Erreur de connexion Firebase:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUserSignal.set(null);
      this.isAuthenticatedSignal.set(false);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('[AuthService] Erreur de déconnexion Firebase:', error);
    }
  }
}

