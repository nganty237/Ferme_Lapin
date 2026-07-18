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
    <div class="sidebar-inner" [class.collapsed]="collapsed">
      <!-- Brand -->
      <div class="sidebar-brand" [style.padding]="collapsed ? '0 12px' : '0 20px'" style="height: 64px; box-sizing: border-box; display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); width: 100%; flex-shrink: 0;">
        <div class="flex items-center w-full" [ngClass]="collapsed ? 'justify-center' : 'gap-3'">
          <div style="width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;">
            <mat-icon style="color:var(--color-primary-contrast);font-size:20px;width:20px;height:20px;">pets</mat-icon>
          </div>
          @if (!collapsed) {
            <div>
              <h1 style="font-size: 17px; font-weight: 700; color: var(--color-primary-contrast); margin: 0; line-height: 1.3;">Saveurs du Lapin</h1>
              <p style="font-size: 11px; color: rgba(255,255,255,0.6); margin: 4px 0 0; text-transform: uppercase; letter-spacing: 0.05em;">Gestion de l'elevage</p>
            </div>
          }
        </div>
      </div>

      <!-- Navigation -->
      <nav style="padding:16px 0; display: flex; flex-direction: column; overflow-y: auto;">

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
          <span class="nav-section-label" style="margin-top:16px;">Élevage</span>
        } @else {
          <div style="margin:8px 24px; border-top:1px solid rgba(255,255,255,0.1);"></div>
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
          <span class="nav-section-label" style="margin-top:16px;">Événements</span>
        } @else {
          <div style="margin:8px 24px; border-top:1px solid rgba(255,255,255,0.1);"></div>
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
          <span class="nav-section-label" style="margin-top:16px;">Système</span>
        } @else {
          <div style="margin:8px 24px; border-top:1px solid rgba(255,255,255,0.1);"></div>
        }
        <a routerLink="/parametres" routerLinkActive="active" class="nav-link" [class.collapsed-link]="collapsed">
          <mat-icon>tune</mat-icon>
          @if (!collapsed) { <span>Paramètres</span> }
        </a>
      </nav>
      
      <!-- Spacer -->
      <div style="flex:1;"></div>

      <!-- Collapse Toggle -->
      <div style="padding:16px; border-bottom: none; display: flex; justify-content: center;">
        <button mat-button (click)="toggleCollapse()" 
                style="color:rgba(255,255,255,0.7); display:flex; align-items:center; border-radius: 8px; height: auto; min-width: 40px; transition: all 0.3s ease;" 
                [style.width]="collapsed ? '48px' : '100%'"
                [style.padding]="collapsed ? '12px 0' : '12px'"
                [style.justify-content]="collapsed ? 'center' : 'flex-start'" 
                [style.gap.px]="collapsed ? 0 : 8">
          <mat-icon style="margin: 0;">{{ collapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left' }}</mat-icon>
          @if (!collapsed) { <span style="font-weight: 500;">Réduire</span> }
        </button>
      </div>

      <!-- Footer -->
      <div style="padding:16px; text-align:center;">
        @if (!collapsed) {
          <span style="font-size:11px; color:rgba(255,255,255,0.4);">Projet academique 2026</span>
        } @else {
          <mat-icon style="color:rgba(255,255,255,0.4); font-size:16px;">school</mat-icon>
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
      padding: 8px 28px 4px;
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
