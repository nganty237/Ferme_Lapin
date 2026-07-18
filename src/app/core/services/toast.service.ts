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

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, message, duration };

    this.toasts.update(current => {
      // Keep only up to 3 visible toasts (stack max 3)
      const updated = [...current, newToast];
      if (updated.length > 3) {
        // Remove oldest toast
        return updated.slice(updated.length - 3);
      }
      return updated;
    });

    // Auto-dismiss timeout
    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 4000): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 4000): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  dismiss(id: string): void {
    // Start fade out animation
    this.toasts.update(current =>
      current.map(t => t.id === id ? { ...t, fadingOut: true } : t)
    );

    // Wait 300ms for animation to complete before removing from list
    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    }, 300);
  }
}
