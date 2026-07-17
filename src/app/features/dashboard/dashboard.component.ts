import { Component, inject, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmService } from '../../core/services/farm.service';
import { KpiService } from '../../core/services/kpi.service';
import { AlertEngineService } from '../../core/services/alert-engine.service';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AlertCardComponent } from '../../shared/components/alert-card/alert-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
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
          subtitle="Vue d'ensemble de la performance de l'elevage">
        </app-page-header>
        <button mat-stroked-button (click)="resetDemoData()" style="font-size:13px; color:var(--color-text-muted);">
          <mat-icon style="font-size:16px;width:16px;height:16px;margin-right:4px;">refresh</mat-icon>
          Reinitialiser
        </button>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <app-metric-card
          label="Taux de fertilite"
          [value]="fertilityRate() + '%'"
          hint="Objectif: superieur a 80%"
          icon="monitor_heart"
          iconBg="var(--color-primary-alpha)" iconColor="var(--color-primary)">
        </app-metric-card>

        <app-metric-card
          label="Prolificite"
          [value]="prolificacy() + ' nes/portee'"
          hint="Lapereaux nes vivants par mise bas"
          icon="groups"
          iconBg="var(--color-info-bg)" iconColor="var(--color-info)">
        </app-metric-card>

        <app-metric-card
          label="Mortalite pre-sevrage"
          [value]="mortalityRate() + '%'"
          hint="Pertes entre naissance et sevrage"
          icon="trending_down"
          iconBg="var(--color-warning-bg)" iconColor="var(--color-warning)">
        </app-metric-card>

        <app-metric-card
          label="GMQ moyen"
          [value]="avgDailyGain() + ' g/j'"
          hint="Gain moyen quotidien en engraissement"
          icon="speed"
          iconBg="#faf5ff" iconColor="#7e22ce">
        </app-metric-card>

        <app-metric-card
          label="Chiffre d'affaires"
          [value]="formattedRevenue()"
          hint="Montant total des ventes"
          icon="account_balance_wallet"
          iconBg="var(--color-primary-alpha)" iconColor="var(--color-primary)">
        </app-metric-card>
      </div>

      <!-- Alerts + Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Alerts -->
        <div>
          <div class="section-title">
            <mat-icon>notifications_none</mat-icon>
            Alertes de l'elevage
          </div>

          <div *ngIf="alerts().length === 0">
            <app-empty-state icon="check_circle_outline" message="Aucune alerte, l'elevage est stable."></app-empty-state>
          </div>

          <div class="flex flex-col gap-3" style="max-height:480px; overflow-y:auto;">
            <app-alert-card
              *ngFor="let alert of alerts()"
              [type]="alert.type"
              [message]="alert.message"
              [tag]="alert.category">
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
                Naissance et sevrage par bande
              </p>
              <div style="position:relative; height:220px;">
                <canvas #lineChartCanvas></canvas>
              </div>
            </div>

            <div class="panel">
              <p class="panel__title">
                <mat-icon>bar_chart</mat-icon>
                Commandes et livraisons par client
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
export class DashboardComponent implements AfterViewInit {
  private farmService = inject(FarmService);
  private kpiService = inject(KpiService);
  private alertEngine = inject(AlertEngineService);

  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;

  private lineChart?: Chart;
  private barChart?: Chart;

  fertilityRate = computed(() => this.kpiService.calculateFertilityRate(this.farmService.reproductions()));
  prolificacy = computed(() => this.kpiService.calculateProlificacy(this.farmService.reproductions()));
  mortalityRate = computed(() => this.kpiService.calculatePreWeaningMortality(this.farmService.reproductions()));
  avgDailyGain = computed(() => this.kpiService.calculateAvgDailyGain(this.farmService.fattenings(), this.farmService.weanings()));
  revenue = computed(() => this.kpiService.calculateRevenue(this.farmService.sales()));
  formattedRevenue = computed(() => {
    const r = this.revenue();
    if (r >= 1_000_000) return (r / 1_000_000).toFixed(1) + ' M FCFA';
    if (r >= 1_000) return (r / 1_000).toFixed(0) + ' k FCFA';
    return r + ' FCFA';
  });

  alerts = computed(() => this.alertEngine.alerts());

  resetDemoData(): void {
    if (confirm('Reinitialiser toutes les donnees de demonstration ?')) {
      this.farmService.resetSeedData();
      setTimeout(() => this.renderCharts(), 100);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderCharts(), 100);
  }

  renderCharts(): void {
    if (typeof window === 'undefined' || !this.lineChartCanvas) return;
    if (this.lineChart) this.lineChart.destroy();
    if (this.barChart) this.barChart.destroy();

    const reproductions = this.farmService.reproductions();
    const weanings = this.farmService.weanings();
    const sales = this.farmService.sales();
    
    // Get root styles for colors
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--color-primary').trim() || '#15803d';
    const primaryAlpha = rootStyles.getPropertyValue('--color-primary-alpha').trim() || 'rgba(21, 128, 61, 0.1)';
    const infoColor = rootStyles.getPropertyValue('--color-info').trim() || '#3b82f6';
    const infoAlpha = 'rgba(59, 130, 246, 0.1)';
    const borderColor = rootStyles.getPropertyValue('--color-border').trim() || '#e8eaed';

    const labels = reproductions.map(r => {
      const band = this.farmService.bands().find(b => b.id === r.bandId);
      return band ? band.name.split(' - ')[0] : r.dateBreeding;
    });

    this.lineChart = new Chart(this.lineChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Nes vivants',
            data: reproductions.map(r => r.nbBornAlive || 0),
            borderColor: infoColor,
            backgroundColor: infoAlpha,
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 3
          },
          {
            label: 'Sevres',
            data: reproductions.map(r => {
              const w = weanings.find(w => w.reproductionId === r.id);
              return w ? w.nbWeaned : 0;
            }),
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

    const clients = Array.from(new Set(sales.map(s => s.customer)));
    this.barChart = new Chart(this.barChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: clients,
        datasets: [
          {
            label: 'Commandes',
            data: clients.map(c => sales.filter(s => s.customer === c).reduce((sum, s) => sum + s.nbRequested, 0)),
            backgroundColor: '#cbd5e1',
            borderRadius: 4
          },
          {
            label: 'Livres',
            data: clients.map(c => sales.filter(s => s.customer === c).reduce((sum, s) => sum + s.nbDelivered, 0)),
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
