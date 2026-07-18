import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts()" 
           class="toast-item" 
           [class.fade-out]="toast.fadingOut" 
           [ngClass]="getToastClass(toast.type)">
        <mat-icon class="toast-icon" [ngClass]="getIconClass(toast.type)">
          {{ getToastIcon(toast.type) }}
        </mat-icon>
        <div class="toast-message">
          {{ toast.message }}
        </div>
        <button class="toast-close" (click)="dismiss(toast.id)">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 99999;
      pointer-events: none;
      max-width: 380px;
      width: calc(100% - 48px);
    }

    @media (max-width: 640px) {
      .toast-container {
        right: 50%;
        transform: translateX(50%);
        top: 16px;
        align-items: center;
      }
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 16px -6px rgba(0, 0, 0, 0.04);
      border: 1px solid var(--color-border, #e8eaed);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: toastFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes toastFadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .toast-item.fade-out {
      opacity: 0;
      transform: translateY(-10px) scale(0.9) !important;
    }

    .toast-success {
      border-left: 4px solid var(--color-success, #16a34a);
    }
    .toast-warning {
      border-left: 4px solid var(--color-warning, #f59e0b);
    }
    .toast-error {
      border-left: 4px solid var(--color-danger, #ef4444);
    }
    .toast-info {
      border-left: 4px solid var(--color-info, #3b82f6);
    }

    .toast-icon {
      flex-shrink: 0;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .icon-success { color: var(--color-success, #16a34a); }
    .icon-warning { color: var(--color-warning, #f59e0b); }
    .icon-error { color: var(--color-danger, #ef4444); }
    .icon-info { color: var(--color-info, #3b82f6); }

    .toast-message {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-main, #1e293b);
      line-height: 1.45;
      padding-top: 1px;
    }

    .toast-close {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--color-text-light, #94a3b8);
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      border-radius: 6px;
      margin-top: -2px;
    }
    .toast-close:hover {
      color: var(--color-text-main, #1e293b);
      background: var(--color-border-light, #f1f5f9);
    }
    .toast-close .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClass(type: ToastType): string {
    return `toast-${type}`;
  }

  getIconClass(type: ToastType): string {
    return `icon-${type}`;
  }

  getToastIcon(type: ToastType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
    }
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
