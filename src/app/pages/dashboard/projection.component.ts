import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '../../core/services/calculation.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface ProjectionWeek {
  semaine: number;
  dateDebut: Date;
  phaseBandeA: string;
  phaseBandeB: string;
  phaseBandeC: string;
  cagesOccupees: number;
  totales: number;
  pourcentage: number;
  status: 'OK' | 'Limite' | 'Surcharge';
}

@Component({
  selector: 'app-projection',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, MatIconModule, MatButtonModule],
  template: `
    <div class="page-container">
      <app-page-header
        title="Projection à 3 Mois"
        subtitle="Simulation prévisionnelle de l'occupation des cages engraissement semaine par semaine">
      </app-page-header>

      <!-- Alerte goulot d'étranglement détecté -->
      <div class="panel border-amber-100 bg-amber-50/15 mb-6" *ngIf="goulotSemaine()">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <mat-icon>warning</mat-icon>
          </div>
          <div>
            <h4 class="font-bold text-amber-800 text-sm">Goulot de saturation identifié !</h4>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              Une saturation ou tension critique de l'engraissement est prévue à la <strong>Semaine {{ goulotSemaine() }}</strong> (projection à {{ goulotCages() }} / {{ totalesCages() }} cages).
              Il est recommandé de décaler certaines saillies ou d'augmenter la capacité physique de vos cages.
            </p>
          </div>
        </div>
      </div>

      <!-- Tableau des projections -->
      <div class="panel">
        <p class="panel__title">
          <mat-icon>timeline</mat-icon> Simulation Chronologique (12 Semaines)
        </p>

        <div class="overflow-x-auto mt-4">
          <table class="data-table">
            <thead>
              <tr>
                <th>Semaine</th>
                <th>Période</th>
                <th class="text-center">Bande A</th>
                <th class="text-center">Bande B</th>
                <th class="text-center">Bande C</th>
                <th class="text-center">Cages d'engraissement</th>
                <th class="text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of projections()" class="hover:bg-slate-50 transition-colors">
                <td class="font-bold text-slate-700">Semaine {{ w.semaine }}</td>
                <td class="text-xs text-slate-500 font-mono">{{ formatDate(w.dateDebut) }}</td>
                <td class="text-center">
                  <span class="badge" [ngClass]="getPhaseClass(w.phaseBandeA)">{{ w.phaseBandeA }}</span>
                </td>
                <td class="text-center">
                  <span class="badge" [ngClass]="getPhaseClass(w.phaseBandeB)">{{ w.phaseBandeB }}</span>
                </td>
                <td class="text-center">
                  <span class="badge" [ngClass]="getPhaseClass(w.phaseBandeC)">{{ w.phaseBandeC }}</span>
                </td>
                <td class="text-center font-mono">
                  <div class="flex items-center justify-center gap-2">
                    <strong class="text-slate-800">{{ w.cagesOccupees }}</strong>
                    <span class="text-slate-400">/ {{ w.totales }}</span>
                    <span class="text-xs text-slate-500 font-normal">({{ w.pourcentage }}%)</span>
                  </div>
                </td>
                <td class="text-center">
                  <span class="badge" [ngClass]="getStatusClass(w.status)">{{ w.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .badge--success { background: #ecfdf5; color: #059669; }
    .badge--warning { background: #fffbeb; color: #d97706; }
    .badge--danger { background: #fef2f2; color: #dc2626; }
    .badge--neutral { background: #f1f5f9; color: #475569; }
    .badge--gestation { background: #fdf4ff; color: #a855f7; }
    .badge--allaitement { background: #eff6ff; color: #3b82f6; }
    .badge--engraissement { background: #fff7ed; color: #ea580c; }
  `]
})
export class ProjectionComponent {
  private calcService = inject(CalculationService);

  saillies = toSignal(this.calcService.saillies$);
  config = toSignal(this.calcService.config$);

  projections = computed<ProjectionWeek[]>(() => {
    const list: ProjectionWeek[] = [];
    const configVal = this.config();
    if (!configVal) return [];

    const totalEngraissement = configVal.nombreCagesTotal - configVal.nombreCagesReproductrices;
    const density = configVal.densiteParCage || 3;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mock/Simulated base dates for Bande A (b1), Bande B (b2), Bande C (b3)
    // We assume current states and estimate cycles
    for (let s = 0; s <= 12; s++) {
      const dateDebut = new Date(today);
      dateDebut.setDate(dateDebut.getDate() + s * 7);

      // Determine phases for Bande A, B, C dynamically
      const phaseA = this.getSimulatedPhase('b1', s);
      const phaseB = this.getSimulatedPhase('b2', s);
      const phaseC = this.getSimulatedPhase('b3', s);

      // Calculate projected cages
      let cagesOccupees = 0;
      if (phaseA === 'Engraissement') cagesOccupees += 36; // 36 cages standard occupation
      if (phaseB === 'Engraissement') cagesOccupees += 30;
      if (phaseC === 'Engraissement') cagesOccupees += 27;

      // Base minimum background occupancy (e.g. legacy weaning or partial sales)
      if (cagesOccupees === 0) cagesOccupees = 15; 
      else cagesOccupees += 15;

      cagesOccupees = Math.min(cagesOccupees, totalEngraissement);

      const pourcentage = totalEngraissement > 0 ? Math.round((cagesOccupees / totalEngraissement) * 100) : 0;
      
      let status: 'OK' | 'Limite' | 'Surcharge' = 'OK';
      if (pourcentage > 95) status = 'Surcharge';
      else if (pourcentage > 80) status = 'Limite';

      list.push({
        semaine: s,
        dateDebut,
        phaseBandeA: phaseA,
        phaseBandeB: phaseB,
        phaseBandeC: phaseC,
        cagesOccupees,
        totales: totalEngraissement,
        pourcentage,
        status
      });
    }
    return list;
  });

  goulotSemaine = computed(() => {
    const list = this.projections();
    const item = list.find(w => w.status === 'Limite' || w.status === 'Surcharge');
    return item ? item.semaine : null;
  });

  goulotCages = computed(() => {
    const list = this.projections();
    const item = list.find(w => w.status === 'Limite' || w.status === 'Surcharge');
    return item ? item.cagesOccupees : null;
  });

  totalesCages = computed(() => {
    const configVal = this.config();
    return configVal ? configVal.nombreCagesTotal - configVal.nombreCagesReproductrices : 144;
  });

  private getSimulatedPhase(bandeId: string, week: number): string {
    // Simple cycle offsets to simulate bands scheduling
    let offset = 0;
    if (bandeId === 'b2') offset = 4;
    if (bandeId === 'b3') offset = 8;

    const cycleWeek = (week + offset) % 12;

    if (cycleWeek < 4) return 'Gestation';
    if (cycleWeek < 8) return 'Allaitement';
    return 'Engraissement';
  }

  getPhaseClass(phase: string): string {
    switch (phase) {
      case 'Gestation': return 'badge--gestation';
      case 'Allaitement': return 'badge--allaitement';
      case 'Engraissement': return 'badge--engraissement';
      default: return 'badge--neutral';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'OK': return 'badge--success';
      case 'Limite': return 'badge--warning';
      case 'Surcharge': return 'badge--danger';
      default: return 'badge--neutral';
    }
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' - ' +
      new Date(d.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
  }
}
