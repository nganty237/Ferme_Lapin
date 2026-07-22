import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, ToastType } from '@core/services/toast.service';

@Component({
  selector: 'app-toast-container',
    imports: [MatIconModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
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