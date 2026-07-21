import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  toggle = output<void>();

  toggleCollapse() {
    this.toggle.emit();
  }
}