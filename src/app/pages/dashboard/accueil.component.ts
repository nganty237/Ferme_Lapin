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
          [value]="kpis()!.productiviteParFemelle + ' / mois'"
          hint="Lapereaux nés par femelle active"
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
          label="Portées en cours"
          [value]="kpis()!.nombrePorteesEnCours.toString()"
          hint="Portées en engraissement"
          icon="pets"
          iconBg="var(--color-info-bg)" iconColor="var(--color-info)">
        </app-metric-card>
      </div>

      <!-- Alerts + Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

    this.lineChart = new Chart(this.lineChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Nés vivants',
            data: misesBas.slice(-6).map(mb => mb.vivants || 0),
            borderColor: infoColor,
            backgroundColor: infoAlpha,
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: 'Sevrés',
            data: sevrages.slice(-6).map(s => s.sevres || 0),
            borderColor: primaryColor,
            backgroundColor: primaryAlpha,
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
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
          y: { beginAtZero: true, grid: { color: borderColor }, ticks: { font: { size: 10 } } }
        }
      }
    });

    // Agrégation des ventes pour le graphique en barres
    const clients = Array.from(new Set(ventes.map(v => v.client || 'Marché Local')));
    this.barChart = new Chart(this.barChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: clients,
        datasets: [
          {
            label: 'Lapins vendus',
            data: clients.map(c => ventes.filter(v => (v.client || 'Marché Local') === c).reduce((sum, v) => sum + (v.vendus || 0), 0)),
            backgroundColor: primaryColor,
            borderRadius: 4
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
          y: { beginAtZero: true, grid: { color: borderColor }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}
