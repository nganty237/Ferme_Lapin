import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewChild, inject, effect } from '@angular/core';
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
  bandes = toSignal(this.calcService.bandes$);

  constructor() {
    effect(() => {
      // Redessine les graphiques à chaque mise à jour ou chargement asynchrone des KPIs
      const kpisVal = this.kpis();
      if (kpisVal) {
        this.scheduleChartRender();
      }
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

    // Groupement des naissances et sevrages par mois pour le graphique linéaire
    const labels: string[] = [];
    const today = new Date();
    const mapMoisNes = new Map<string, number>();
    const mapMoisSevres = new Map<string, number>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      const capitalized = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).replace('.', '');
      labels.push(capitalized);
      mapMoisNes.set(capitalized, 0);
      mapMoisSevres.set(capitalized, 0);
    }

    misesBas.forEach(mb => {
      if (mb.dateMiseBas) {
        try {
          const d = new Date(mb.dateMiseBas);
          const monthStr = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
          const key = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).replace('.', '');
          if (mapMoisNes.has(key)) {
            mapMoisNes.set(key, mapMoisNes.get(key)! + (mb.vivants || 0));
          }
        } catch {}
      }
    });

    sevrages.forEach(s => {
      if (s.dateSevrage) {
        try {
          const d = new Date(s.dateSevrage);
          const monthStr = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
          const key = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).replace('.', '');
          if (mapMoisSevres.has(key)) {
            mapMoisSevres.set(key, mapMoisSevres.get(key)! + (s.sevres || 0));
          }
        } catch {}
      }
    });

    const dataNes = labels.map(label => mapMoisNes.get(label) || 0);
    const dataSevres = labels.map(label => mapMoisSevres.get(label) || 0);

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
            data: dataNes,
            borderColor: infoColor,
            backgroundColor: infoGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointBackgroundColor: infoColor
          },
          {
            label: 'Sevrés',
            data: dataSevres,
            borderColor: primaryColor,
            backgroundColor: primaryGradient,
            fill: true,
            tension: 0.4,
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
            grid: { color: borderColor, borderDash: [5, 5] } as any,
            ticks: { font: { size: 10 } } 
          }
        }
      }
    });

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
        }
      }
    }
    const moisLabels = Object.keys(ventesParMois);
    const ventesData = Object.values(ventesParMois);

    const ctxBar = this.barChartCanvas.nativeElement.getContext('2d');
    let barGradient: any = primaryColor;
    if (ctxBar) {
      const g = ctxBar.createLinearGradient(0, 0, 0, 200);
      g.addColorStop(0, '#22c55e');
      g.addColorStop(1, '#166534');
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
            maxBarThickness: 28
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

  getPhaseClass(phase: string): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide';
    switch (phase) {
      case 'Repos': return `${base} bg-emerald-100 text-emerald-800`;
      case 'Saillie': return `${base} bg-purple-100 text-purple-800`;
      case 'Allaitement': return `${base} bg-blue-100 text-blue-800`;
      case 'Sexage': return `${base} bg-amber-100 text-amber-800`;
      case 'Engraissement': return `${base} bg-orange-100 text-orange-800`;
      default: return `${base} bg-slate-100 text-slate-700`;
    }
  }
}
