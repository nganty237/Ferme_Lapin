import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <mat-icon class="text-5xl text-slate-300 mb-3" style="font-size:48px;width:48px;height:48px;">{{ icon }}</mat-icon>
      <p class="text-sm font-medium text-slate-400">{{ message }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() message = 'Aucune donnée disponible';
}