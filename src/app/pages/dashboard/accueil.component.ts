import { Component, inject, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '../../core/services/calculation.service';
import { NotificationService } from '../../core/services/notification.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AlertCardComponent } from '../../shared/components/alert-card/alert-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-accueil-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MetricCardComponent,
    PageHeaderComponent,
    AlertCardComponent,
    EmptyStateComponent,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <app-page-header
          title="Tableau de bord"
          subtitle="Vue d'ensemble de la performance de l'élevage">
        </app-page-header>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8" *ngIf="kpis()">
        <app-metric-card
          label="Taux de fécondité"
          [value]="kpis()!.tauxFecondite + '%'"
          hint="Objectif: supérieur à 80%"
          icon="favorite"
          iconBg="var(--color-primary-alpha)" iconColor="var(--color-primary)">
        </app-metric-card>

        <app-metric-card
          label="Productivité / femelle"
          [value]="kpis()!.productiviteParFemelleAn + ' / an'"
          hint="Lapereaux nés par femelle active par an"
          icon="trending_up"
          iconBg="var(--color-primary-alpha)" iconColor="var(--color-primary)">
        </app-metric-card>

        <app-metric-card
          label="Survie allaitement"
          [value]="kpis()!.tauxSurvieAllaitement + '%'"
          hint="Pertes entre naissance et sevrage"
          icon="child_friendly"
          iconBg="var(--color-success-bg)" iconColor="var(--color-success)">
        </app-metric-card>

        <app-metric-card
          label="Occupation cages"
          [value]="kpis()!.occupationCages.pourcentage + '%'"
          hint="Cages d'engraissement occupées"
          icon="grid_view"
          iconBg="var(--color-warning-bg)" iconColor="var(--color-warning)">
        </app-metric-card>

        <app-metric-card
          label="Marge Brute"
          [value]="(kpis()!.margeBruteTotale | number:'1.0-0') + ' F'"
          hint="Revenus - coûts de production"
          icon="attach_money"
          iconBg="var(--color-info-bg)" iconColor="var(--color-info)">
        </app-metric-card>
      </div>

      <!-- Alerts + Charts (Maintenant affichés en premier) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Alerts -->
        <div>
          <div class="section-title">
            <mat-icon>notifications_none</mat-icon>
            Alertes de l'élevage
          </div>

          <div *ngIf="!notifications() || notifications()!.length === 0">
            <app-empty-state icon="check_circle_outline" message="Aucune alerte, l'élevage est stable."></app-empty-state>
          </div>

          <div class="flex flex-col gap-3" style="max-height:480px; overflow-y:auto;" *ngIf="notifications()">
            <app-alert-card
              *ngFor="let alert of notifications()"
              [type]="alert.type === 'CRITIQUE' ? 'danger' : alert.type === 'WARNING' ? 'warning' : 'info'"
              [message]="alert.message"
              [tag]="alert.type">
            </app-alert-card>
          </div>
        </div>

        <!-- Charts -->
        <div class="lg:col-span-2">
          <div class="section-title">
            <mat-icon>insert_chart_outlined</mat-icon>
            Suivi graphique
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="panel">
              <p class="panel__title">
                <mat-icon>timeline</mat-icon>
                Naissance et sevrage récents
              </p>
              <div style="position:relative; height:220px;">
                <canvas #lineChartCanvas></canvas>
              </div>
            </div>

            <div class="panel">
              <p class="panel__title">
                <mat-icon>bar_chart</mat-icon>
                Ventes par mois
              </p>
              <div style="position:relative; height:220px;">
                <canvas #barChartCanvas></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Cages & Décision (Maintenant affichée après les graphiques) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" *ngIf="kpis() && config()">
        <!-- Cages Reproductrices et Engraissement -->
        <div class="panel lg:col-span-2">
          <p class="panel__title">
            <mat-icon>grid_view</mat-icon> État Cages (Temps Réel)
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <!-- Repro -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-2">Cages Reproductrices</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-extrabold text-slate-800">{{ config()!.nombreCagesReproductrices }}</span>
                <span class="text-slate-500">cages réservées (100% occupées)</span>
              </div>
              <p class="text-xs text-slate-500 mt-2">
                Chaque femelle reproductrice occupe une cage individuelle pour la mise-bas et l'allaitement.
              </p>
            </div>
            <!-- Engraissement -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-2">Cages d'engraissement</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-extrabold text-slate-800">{{ kpis()!.occupationCages.occupees }} / {{ kpis()!.occupationCages.totales }}</span>
                <span class="text-slate-500">cages occupées ({{ kpis()!.occupationCages.pourcentage }}%)</span>
              </div>
              <!-- Prochaines libérations -->
              <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200 text-center text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block">Libérées J0-30</span>
                  <strong class="text-slate-700">{{ kpis()!.prochainesLiberations.j30 }} cages</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block">Libérées J30-60</span>
                  <strong class="text-slate-700">{{ kpis()!.prochainesLiberations.j60 }} cages</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-400 uppercase font-bold block">Libérées J60+</span>
                  <strong class="text-slate-700">{{ kpis()!.prochainesLiberations.j90 }} cages</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Décision & Alertes de Capacité -->
        <div class="panel" [ngClass]="kpis()!.occupationCages.pourcentage > 80 ? 'border-red-100 bg-red-50/10' : 'border-emerald-100 bg-emerald-50/10'">
          <p class="panel__title" [ngClass]="kpis()!.occupationCages.pourcentage > 80 ? 'text-red-800' : 'text-emerald-800'">
            <mat-icon>{{ kpis()!.occupationCages.pourcentage > 80 ? 'warning' : 'assistant' }}</mat-icon> Aide à la Décision
          </p>
          <div class="mt-4 flex flex-col gap-4">
            <div>
              <span class="text-[11px] uppercase tracking-wider text-slate-500 block">Prochaine libération de cages</span>
              <strong class="text-sm text-slate-800" *ngIf="kpis()!.prochaineVenteDate; else noVente">
                Dans {{ kpis()!.delaiLiberationCagesJours }} jours (le {{ kpis()!.prochaineVenteDate | date:'dd/MM/yyyy' }})
              </strong>
              <ng-template #noVente>
                <strong class="text-sm text-slate-800 text-slate-500">Aucune vente planifiée à court terme.</strong>
              </ng-template>
            </div>
            
            <div class="p-3.5 rounded-xl border text-xs leading-normal" [ngClass]="kpis()!.occupationCages.pourcentage > 80 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'">
              <span class="font-bold block mb-1">Recommandation :</span>
              <span>
                @if (kpis()!.occupationCages.pourcentage > 80) {
                  ⚠️ Engraissement saturé à {{ kpis()!.occupationCages.pourcentage }}%. <strong>Ne planifiez pas de nouvelles saillies</strong> pour éviter de manquer de cages au sevrage.
                } @else {
                  ✅ Espace suffisant. <strong>Vous pouvez saillir les femelles de la prochaine bande</strong> (cages disponibles : {{ kpis()!.occupationCages.totales - kpis()!.occupationCages.occupees }}).
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class AccueilComponent implements AfterViewInit {
  private calcService = inject(CalculationService);
  private notifService = inject(NotificationService);

  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;

  private lineChart?: Chart;
  private barChart?: Chart;

  kpis = toSignal(this.calcService.kpis$);
  config = toSignal(this.calcService.config$);
  notifications = toSignal(this.notifService.notifications$);

  ngAfterViewInit(): void {
    setTimeout(() => this.renderCharts(), 100);
  }

  renderCharts(): void {
    if (typeof window === 'undefined' || !this.lineChartCanvas) return;
    if (this.lineChart) this.lineChart.destroy();
    if (this.barChart) this.barChart.destroy();

    const misesBas = this.calcService.misesBas;
    const sevrages = this.calcService.sevrages;
    const ventes = this.calcService.ventes;
    
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--color-primary').trim() || '#15803d';
    const primaryAlpha = rootStyles.getPropertyValue('--color-primary-alpha').trim() || 'rgba(21, 128, 61, 0.1)';
    const infoColor = rootStyles.getPropertyValue('--color-info').trim() || '#3b82f6';
    const infoAlpha = 'rgba(59, 130, 246, 0.1)';
    const borderColor = rootStyles.getPropertyValue('--color-border').trim() || '#e8eaed';

    // Tri et agrégation pour le graphique des naissances/sevrages
    const labels = misesBas.slice(-6).map(mb => {
      try {
        return new Date(mb.dateMiseBas).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      } catch {
        return String(mb.dateMiseBas);
      }
    });

    // Gradients pour les courbes
    const ctxLine = this.lineChartCanvas.nativeElement.getContext('2d');
    let infoGradient: any = infoAlpha;
    let primaryGradient: any = primaryAlpha;
    if (ctxLine) {
      const g1 = ctxLine.createLinearGradient(0, 0, 0, 200);
      g1.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
      g1.addColorStop(1, 'rgba(59, 130, 246, 0)');
      infoGradient = g1;

      const g2 = ctxLine.createLinearGradient(0, 0, 0, 200);
      g2.addColorStop(0, 'rgba(21, 128, 61, 0.18)');
      g2.addColorStop(1, 'rgba(21, 128, 61, 0)');
      primaryGradient = g2;
    }

    this.lineChart = new Chart(this.lineChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Nés vivants',
            data: misesBas.slice(-6).map(mb => mb.vivants || 0),
            borderColor: infoColor,
            backgroundColor: infoGradient,
            fill: true,
            tension: 0.4, // Courbes plus fluides et douces
            borderWidth: 2.5,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointBackgroundColor: infoColor
          },
          {
            label: 'Sevrés',
            data: sevrages.slice(-6).map(s => s.sevres || 0),
            borderColor: primaryColor,
            backgroundColor: primaryGradient,
            fill: true,
            tension: 0.4, // Courbes plus fluides et douces
            borderWidth: 2.5,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointBackgroundColor: primaryColor
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11, family: 'Inter' }, padding: 16 } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { 
            beginAtZero: true, 
            grid: { color: borderColor, borderDash: [5, 5] } as any, // Lignes de repère en pointillés
            ticks: { font: { size: 10 } } 
          }
        }
      }
    });

    // Agrégation chronologique des ventes par mois
    const ventesTriees = [...ventes].sort((a, b) => new Date(a.dateVente).getTime() - new Date(b.dateVente).getTime());
    const ventesParMois: Record<string, number> = {};
    for (const v of ventesTriees) {
      if (v.dateVente) {
        try {
          const dateVal = new Date(v.dateVente);
          const monthStr = dateVal.toLocaleDateString('fr-FR', { month: 'short' });
          const capitalizedMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).replace('.', '');
          ventesParMois[capitalizedMonth] = (ventesParMois[capitalizedMonth] || 0) + (v.vendus || 0);
        } catch {
          // fallback
        }
      }
    }
    const moisLabels = Object.keys(ventesParMois);
    const ventesData = Object.values(ventesParMois);

    // Gradient vertical pour les barres de ventes
    const ctxBar = this.barChartCanvas.nativeElement.getContext('2d');
    let barGradient: any = primaryColor;
    if (ctxBar) {
      const g = ctxBar.createLinearGradient(0, 0, 0, 200);
      g.addColorStop(0, '#22c55e'); // Vert clair au sommet
      g.addColorStop(1, '#166534'); // Vert forêt à la base
      barGradient = g;
    }

    this.barChart = new Chart(this.barChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: moisLabels.length > 0 ? moisLabels : ['Aucune vente'],
        datasets: [
          {
            label: 'Lapins vendus',
            data: ventesData.length > 0 ? ventesData : [0],
            backgroundColor: barGradient,
            borderRadius: 6,
            maxBarThickness: 28 // Barres moins imposantes, plus pro
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11, family: 'Inter' }, padding: 16 } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { 
            beginAtZero: true, 
            grid: { color: borderColor, borderDash: [5, 5] } as any, 
            ticks: { font: { size: 10 } } 
          }
        }
      }
    });
  }
}
