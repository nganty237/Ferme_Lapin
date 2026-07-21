import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  imports: [MatIconModule],
  template: `
    <div class="mb-7">
      <h1 class="text-2xl font-bold text-slate-800 mb-1">{{ title() }}</h1>
      <p class="text-sm text-slate-500 m-0">{{ subtitle() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  title = input<string>('');
  subtitle = input<string>('');
}