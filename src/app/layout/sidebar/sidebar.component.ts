import { Component, EventEmitter, Input, Output } from '@angular/core';
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
      <div class="sidebar-brand flex items-center h-16 w-full shrink-0" [style.padding]="collapsed ? '0 12px' : '0 20px'">
        <div class="flex items-center w-full" [ngClass]="collapsed ? 'justify-center' : 'gap-3'">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/10">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px;">agriculture</mat-icon>
          </div>
          @if (!collapsed) {
            <div>
              <h1 class="text-sm font-semibold text-white tracking-tight leading-tight">Saveurs du Lapin</h1>
              <p class="text-[10px] text-white/50 uppercase tracking-wider font-semibold mt-0.5">Gestion de l'élevage</p>
            </div>
          }
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex flex-col py-4 overflow-y-auto flex-1">

        <!-- Section: Dashboards -->
        @if (!collapsed) {
          <span class="nav-section-label">Tableaux de bord</span>
        }
        <a routerLink="/dashboard/accueil" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>space_dashboard</mat-icon>
          @if (!collapsed) { <span>Accueil</span> }
        </a>
        <a routerLink="/dashboard/occupation-cages" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>grid_view</mat-icon>
          @if (!collapsed) { <span>Occupation cages</span> }
        </a>
        <a routerLink="/dashboard/previsions" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>event_note</mat-icon>
          @if (!collapsed) { <span>Prévisions</span> }
        </a>
        <a routerLink="/dashboard/projection" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>timeline</mat-icon>
          @if (!collapsed) { <span>Projection 3 mois</span> }
        </a>
        <a routerLink="/dashboard/optimisation" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>trending_up</mat-icon>
          @if (!collapsed) { <span>Goulots & ROI</span> }
        </a>
        <a routerLink="/dashboard/rentabilite" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>attach_money</mat-icon>
          @if (!collapsed) { <span>Rentabilité</span> }
        </a>

        <!-- Section: Élevage -->
        @if (!collapsed) {
          <span class="nav-section-label mt-4">Élevage</span>
        } @else {
          <div class="my-2"></div>
        }
        <a routerLink="/reproducteurs/femelles" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>female</mat-icon>
          @if (!collapsed) { <span>Femelles</span> }
        </a>
        <a routerLink="/reproducteurs/males" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>male</mat-icon>
          @if (!collapsed) { <span>Mâles</span> }
        </a>

        <!-- Section: Événements -->
        @if (!collapsed) {
          <span class="nav-section-label mt-4">Événements</span>
        } @else {
          <div class="my-2"></div>
        }
        <a routerLink="/saillies" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>favorite</mat-icon>
          @if (!collapsed) { <span>Saillies</span> }
        </a>
        <a routerLink="/mises-bas" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>child_friendly</mat-icon>
          @if (!collapsed) { <span>Mises-bas</span> }
        </a>
        <a routerLink="/sevrages" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>no_food</mat-icon>
          @if (!collapsed) { <span>Sevrages</span> }
        </a>
        <a routerLink="/ventes" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>point_of_sale</mat-icon>
          @if (!collapsed) { <span>Ventes</span> }
        </a>
        <a routerLink="/deces" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>report</mat-icon>
          @if (!collapsed) { <span>Décès</span> }
        </a>

        <!-- Section: Système -->
        @if (!collapsed) {
          <span class="nav-section-label mt-4">Système</span>
        } @else {
          <div class="my-2"></div>
        }
        <a routerLink="/parametres" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>tune</mat-icon>
          @if (!collapsed) { <span>Paramètres</span> }
        </a>
      </nav>

      <!-- Collapse Toggle -->
      <div class="p-4 flex justify-center">
        <button mat-button (click)="toggleCollapse()" 
                class="hover:bg-white/5 flex items-center rounded-lg transition-all duration-200" 
                style="color: #ffffff !important;"
                [style.width]="collapsed ? '40px' : '100%'"
                [style.padding]="collapsed ? '8px 0' : '8px 12px'"
                [style.justify-content]="collapsed ? 'center' : 'flex-start'" 
                [style.gap.px]="collapsed ? 0 : 8">
          <mat-icon class="m-0" style="color: #ffffff !important;">{{ collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left' }}</mat-icon>
          @if (!collapsed) { <span class="text-xs font-medium">Réduire</span> }
        </button>
      </div>

      <!-- Footer -->
      <div class="p-3 text-center bg-black/10">
        @if (!collapsed) {
          <span class="text-[9px] text-white/30 font-medium tracking-wide uppercase">PROJET ACADÉMIQUE © 2026</span>
        } @else {
          <mat-icon style="color:rgba(255,255,255,0.3); font-size:16px; width:16px; height:16px; display:inline-flex; align-items:center; justify-content:center;">school</mat-icon>
        }
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
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  toggleCollapse() {
    this.toggle.emit();
  }
}
