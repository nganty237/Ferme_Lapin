import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alert-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="p-3.5 rounded-xl flex items-start gap-3 border text-[13px] transition-all duration-150"
         [ngClass]="{
           'bg-red-50/50 border-red-200 text-red-800': type === 'danger',
           'bg-amber-50/50 border-amber-200 text-amber-700': type === 'warning',
           'bg-emerald-50/50 border-emerald-100 text-emerald-800': type === 'info'
         }">
      <mat-icon class="text-lg w-5.5 h-5.5 shrink-0 mt-0.5"
                [ngClass]="{
                  'text-red-600': type === 'danger',
                  'text-amber-600': type === 'warning',
                  'text-emerald-600': type === 'info'
                }">
        {{ iconName }}
      </mat-icon>
      <div>
        <div class="font-medium leading-relaxed text-slate-800">{{ message }}</div>
        <div *ngIf="tag" class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">{{ tag }}</div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
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