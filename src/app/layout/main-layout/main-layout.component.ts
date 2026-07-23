import { ChangeDetectionStrategy, afterNextRender, Component, HostListener, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent, UserMenuComponent } from '@shared/components';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    SidebarComponent,
    ToastContainerComponent,
    UserMenuComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);

  constructor() {
    afterNextRender(() => {
      this.checkScreenSize();
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  private checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.sidebarCollapsed.set(window.innerWidth < 1024);
    }
  }
}
