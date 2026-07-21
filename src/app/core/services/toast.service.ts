import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  fadingOut?: boolean;
}

/**
 * Service de gestion des notifications Toast temporaires de l'application.
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);

  /**
   * Affiche une notification toast temporaire.
   * @param message Contenu textuel du toast.
   * @param type Catégorie de notification.
   * @param duration Durée de présence à l'écran en ms.
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
   * Affiche un toast de succès.
   */
  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Affiche un toast d'erreur.
   */
  error(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Affiche un toast d'avertissement.
   */
  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Affiche un toast d'information.
   */
  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Ferme et retire un toast actif par son identifiant.
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
