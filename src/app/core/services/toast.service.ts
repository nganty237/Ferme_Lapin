import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  fadingOut?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  
  /**
   * Affiche un toast.
   * Logique : ajoute le toast, limite la pile visible et planifie sa fermeture.
   */
  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };

    this.toasts.update(current => {
      const updated = [...current, newToast];
      if (updated.length > 3) {
        return updated.slice(updated.length - 3);
      }
      return updated;
    });

    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  
  /**
   * Affiche un toast de succes.
   * Logique : delegue l affichage au service de toast.
   */
  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  
  /**
   * Affiche un toast d erreur.
   * Logique : delegue l affichage au service de toast.
   */
  error(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  
  /**
   * Affiche un toast d avertissement.
   * Logique : delegue l affichage au service de toast.
   */
  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  
  /**
   * Affiche un toast d information.
   * Logique : delegue l affichage au service de toast.
   */
  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  
  /**
   * Supprime un element affiche.
   * Logique : retire la notification ou le toast correspondant a l id.
   */
  dismiss(id: string): void {
    this.toasts.update(current =>
      current.map(t => t.id === id ? { ...t, fadingOut: true } : t)
    );

    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    }, 300);
  }
}
