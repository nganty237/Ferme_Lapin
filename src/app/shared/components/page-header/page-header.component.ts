import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="mb-7">
      <h1 class="text-2xl font-bold text-slate-800 mb-1">{{ title }}</h1>
      <p class="text-sm text-slate-500 m-0">{{ subtitle }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}