import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  host: {
    'class': 'block h-full'
  },
  template: `
    <div class="h-full flex flex-col justify-between p-5 bg-white border border-slate-200/80 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <div class="flex justify-between items-start gap-3">
        <div>
          <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{{ label }}</p>
          <p class="text-2xl font-bold text-slate-800 tracking-tight">{{ value }}</p>
        </div>
        <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" [style.background]="iconBg" [style.color]="iconColor">
          <mat-icon style="font-size: 20px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">{{ icon }}</mat-icon>
        </div>
      </div>
      <p *ngIf="hint" class="text-[11px] text-slate-400 mt-1.5">{{ hint }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() hint = '';
  @Input() icon = 'bar_chart';
  @Input() iconBg = '#f0fdf4';
  @Input() iconColor = '#166534';
}