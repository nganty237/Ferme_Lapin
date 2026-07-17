import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alert-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="alert-item"
         [class.alert-item--danger]="type === 'danger'"
         [class.alert-item--warning]="type === 'warning'"
         [class.alert-item--info]="type === 'info'">
      <mat-icon>{{ iconName }}</mat-icon>
      <div>
        <div class="alert-item__text">{{ message }}</div>
        <div *ngIf="tag" class="alert-item__tag">{{ tag }}</div>
      </div>
    </div>
  `
})
export class AlertCardComponent {
  @Input() type: 'danger' | 'warning' | 'info' = 'info';
  @Input() message = '';
  @Input() tag = '';

  get iconName(): string {
    switch (this.type) {
      case 'danger': return 'error_outline';
      case 'warning': return 'warning_amber';
      default: return 'info_outline';
    }
  }
}
