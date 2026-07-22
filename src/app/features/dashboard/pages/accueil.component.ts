import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, NotificationService } from '@core/services';
import { MetricCardComponent, PageHeaderComponent, AlertCardComponent, EmptyStateComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type { Chart } from 'chart.js';

@Component({
  selector: 'app-accueil-dashboard',
    imports: [
    DatePipe,
    DecimalPipe,
    MetricCardComponent,
    PageHeaderComponent,
    AlertCardComponent,
    EmptyStateComponent,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccueilComponent {
  private calcService = inject(CalculationService);
  private notifService = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;

  private lineChart?: Chart;
  private barChart?: Chart;

  kpis = toSignal(this.calcService.kpis$);
  config = toSignal(this.calcService.config$);
  notifications = toSignal(this.notifService.notifications$);

  constructor() {
    afterNextRender(() => {
      this.scheduleChartRender();
    });
  }

  private scheduleChartRender(): void {
    if (typeof window === 'undefined') return;

    const render = () => {
      void this.renderCharts();
    };

    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(render, { timeout: 1800 });
      this.destroyRef.onDestroy(() => window.cancelIdleCallback(handle));
      return;
    }

    const timeout = globalThis.setTimeout(render, 1200);
    this.destroyRef.onDestroy(() => globalThis.clearTimeout(timeout));
  }

  async renderCharts(): Promise<void> {
    if (typeof window === 'undefined' || !this.lineChartCanvas) return;
    if (this.lineChart) this.lineChart.destroy();
    if (this.barChart) this.barChart.destroy();

    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

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
          legend: { position: 'bottom', labels: { font: { size: 11, family: 'system-ui' }, padding: 16 } }
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
          legend: { position: 'bottom', labels: { font: { size: 11, family: 'system-ui' }, padding: 16 } }
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
