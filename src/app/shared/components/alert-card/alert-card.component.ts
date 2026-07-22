import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alert-card',
  imports: [MatIconModule],
  template: `
    <div class="p-3.5 rounded-xl flex items-start gap-3 border text-[13px] transition-all duration-150"
         [class.bg-red-50\/50]="type() === 'danger'"
         [class.border-red-200]="type() === 'danger'"
         [class.text-red-800]="type() === 'danger'"
         [class.bg-amber-50\/50]="type() === 'warning'"
         [class.border-amber-200]="type() === 'warning'"
         [class.text-amber-700]="type() === 'warning'"
         [class.bg-emerald-50\/50]="type() === 'info'"
         [class.border-emerald-100]="type() === 'info'"
         [class.text-emerald-800]="type() === 'info'">
      <mat-icon class="text-lg w-5.5 h-5.5 shrink-0 mt-0.5"
                [class.text-red-600]="type() === 'danger'"
                [class.text-amber-600]="type() === 'warning'"
                [class.text-emerald-600]="type() === 'info'">
        {{ iconName }}
      </mat-icon>
      <div>
        <div class="font-medium leading-relaxed text-slate-800">{{ message() }}</div>
        @if (tag()) {
          <div class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">{{ tag() }}</div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertCardComponent {
  type = input<'danger' | 'warning' | 'info'>('info');
  message = input<string>('');
  tag = input<string>('');

  get iconName(): string {
    switch (this.type()) {
      case 'danger': return 'error_outline';
      case 'warning': return 'warning_amber';
      default: return 'info_outline';
    }
  }
}