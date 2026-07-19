import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule],
  template: `
    <div class="sidebar-inner flex flex-col h-full" [class.collapsed]="collapsed">
      <!-- Brand -->
      <div class="sidebar-brand flex items-center h-16 w-full shrink-0 px-5 max-lg:px-3" [class.!px-3]="collapsed" [class.!px-5]="collapsed === false">
        <div class="flex items-center w-full gap-3 max-lg:justify-center" [class.!justify-center]="collapsed" [class.!gap-3]="collapsed === false">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/10">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">agriculture</mat-icon>
          </div>
          <div class="max-lg:hidden" [class.!hidden]="collapsed">
            <h1 class="text-sm font-semibold text-white tracking-tight leading-tight">Saveurs du Lapin</h1>
            <p class="text-[10px] text-white/50 uppercase tracking-wider font-semibold mt-0.5">Gestion de l'élevage</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex flex-col py-4 overflow-y-auto flex-1">

        <!-- Section: Dashboards -->
        <span class="nav-section-label max-lg:hidden" [class.!hidden]="collapsed">Tableaux de bord</span>
        <a routerLink="/dashboard/accueil" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Accueil">
          <mat-icon>space_dashboard</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Accueil</span>
        </a>
        <a routerLink="/dashboard/occupation-cages" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Occupation cages">
          <mat-icon>grid_view</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Occupation cages</span>
        </a>
        <a routerLink="/dashboard/previsions" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Prévisions">
          <mat-icon>event_note</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Prévisions</span>
        </a>
        <a routerLink="/dashboard/projection" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Projection 3 mois">
          <mat-icon>timeline</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Projection 3 mois</span>
        </a>
        <a routerLink="/dashboard/optimisation" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Goulots et ROI">
          <mat-icon>trending_up</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Goulots & ROI</span>
        </a>
        <a routerLink="/dashboard/rentabilite" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Rentabilité">
          <mat-icon>attach_money</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Rentabilité</span>
        </a>

        <!-- Section: Élevage -->
        <span class="nav-section-label mt-4 max-lg:hidden" [class.!hidden]="collapsed">Élevage</span>
        <div class="my-2 lg:hidden" [class.!block]="collapsed"></div>
        <a routerLink="/reproducteurs/femelles" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Femelles reproductrices">
          <mat-icon>female</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Femelles</span>
        </a>
        <a routerLink="/reproducteurs/males" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Mâles reproducteurs">
          <mat-icon>male</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Mâles</span>
        </a>

        <!-- Section: Événements -->
        <span class="nav-section-label mt-4 max-lg:hidden" [class.!hidden]="collapsed">Événements</span>
        <div class="my-2 lg:hidden" [class.!block]="collapsed"></div>
        <a routerLink="/saillies" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Saillies">
          <mat-icon>favorite</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Saillies</span>
        </a>
        <a routerLink="/mises-bas" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Mises-bas">
          <mat-icon>child_friendly</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Mises-bas</span>
        </a>
        <a routerLink="/sevrages" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Sevrages">
          <mat-icon>no_food</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Sevrages</span>
        </a>
        <a routerLink="/ventes" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Ventes">
          <mat-icon>point_of_sale</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Ventes</span>
        </a>
        <a routerLink="/deces" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Décès">
          <mat-icon>report</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Décès</span>
        </a>

        <!-- Section: Système -->
        <span class="nav-section-label mt-4 max-lg:hidden" [class.!hidden]="collapsed">Système</span>
        <div class="my-2 lg:hidden" [class.!block]="collapsed"></div>
        <a routerLink="/parametres" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed" aria-label="Paramètres">
          <mat-icon>tune</mat-icon>
          <span class="max-lg:hidden" [class.!hidden]="collapsed">Paramètres</span>
        </a>
      </nav>

      <!-- Collapse Toggle -->
      <div class="p-4 flex justify-center w-full">
        <button mat-button (click)="toggleCollapse()" aria-label="Réduire le menu"
                class="hover:bg-white/5 flex items-center rounded-lg transition-all duration-200 w-full max-lg:w-10 px-3 max-lg:px-0 py-2 max-lg:justify-center justify-start gap-2 max-lg:gap-0" 
                style="color: #ffffff !important;"
                [class.!w-10]="collapsed"
                [class.!w-full]="collapsed === false"
                [class.!px-0]="collapsed"
                [class.!px-3]="collapsed === false"
                [class.!justify-center]="collapsed"
                [class.!justify-start]="collapsed === false"
                [class.!gap-0]="collapsed"
                [class.!gap-2]="collapsed === false">
          <mat-icon class="m-0" style="color: #ffffff !important;">{{ collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left' }}</mat-icon>
          <span class="text-xs font-medium max-lg:hidden" [class.!hidden]="collapsed">Réduire</span>
        </button>
      </div>

      <!-- Footer -->
      <div class="p-3 text-center bg-black/10 flex items-center justify-center">
        <span class="text-[9px] text-white/30 font-medium tracking-wide uppercase max-lg:hidden" [class.!hidden]="collapsed">PROJET ACADÉMIQUE © 2026</span>
        <mat-icon class="hidden max-lg:inline-flex" [class.!inline-flex]="collapsed" [class.!hidden]="collapsed === false" style="color:rgba(255,255,255,0.3); font-size:16px; width:16px; height:16px; align-items:center; justify-content:center;">school</mat-icon>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .sidebar-inner {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .collapsed-link {
      justify-content: center !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      width: 48px;
      height: 48px;
      margin: 4px auto !important;
    }
    .collapsed-link mat-icon {
      margin: 0 !important;
    }
    .nav-section-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.35);
      padding: 8px 24px 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  toggleCollapse() {
    this.toggle.emit();
  }
}