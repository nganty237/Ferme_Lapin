import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="kpi-card">
      <div class="flex justify-between items-start">
        <div>
          <p class="kpi-card__label">{{ label }}</p>
          <p class="kpi-card__value">{{ value }}</p>
          <p *ngIf="hint" class="kpi-card__hint">{{ hint }}</p>
        </div>
        <div class="kpi-card__icon" [style.background]="iconBg" [style.color]="iconColor">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
      </div>
    </div>
  `
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() hint = '';
  @Input() icon = 'bar_chart';
  @Input() iconBg = '#f0fdf4';
  @Input() iconColor = '#166534';
}
