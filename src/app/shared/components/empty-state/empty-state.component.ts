import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <mat-icon class="text-5xl text-slate-300 mb-3" style="font-size:48px;width:48px;height:48px;">{{ icon() }}</mat-icon>
      <p class="text-sm font-medium text-slate-400">{{ message() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  icon = input<string>('inbox');
  message = input<string>('Aucune donnée disponible');
}