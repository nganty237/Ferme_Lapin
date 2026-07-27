import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-metric-card',
  imports: [MatIconModule],
  host: {
    'class': 'block h-full'
  },
  template: `
    <div class="h-full flex flex-col justify-between p-5 bg-white border border-slate-200/80 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      <div class="flex justify-between items-start gap-3">
        <div>
          <p class="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">{{ label() }}</p>
          <p class="text-2xl font-bold text-slate-800 tracking-tight">{{ value() }}</p>
        </div>
        <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" [style.background]="iconBg()" [style.color]="iconColor()">
          <mat-icon style="font-size: 20px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">{{ icon() }}</mat-icon>
        </div>
      </div>
      @if (hint()) {
        <p class="text-[11px] text-slate-600 mt-1.5">{{ hint() }}</p>
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCardComponent {
  label = input<string>('');
  value = input<string>('');
  hint = input<string>('');
  icon = input<string>('bar_chart');
  iconBg = input<string>('#f0fdf4');
  iconColor = input<string>('#166534');
}