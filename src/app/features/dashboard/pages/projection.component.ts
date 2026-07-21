import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
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
    imports: [PageHeaderComponent, MatIconModule, MatButtonModule],
  templateUrl: './projection.component.html',
  styleUrl: './projection.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
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
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    switch (phase) {
      case 'Gestation': return `${base} bg-purple-100 text-purple-800`;
      case 'Allaitement': return `${base} bg-blue-100 text-blue-800`;
      case 'Engraissement': return `${base} bg-orange-100 text-orange-800`;
      default: return `${base} bg-slate-100 text-slate-700`;
    }
  }

  getStatusClass(status: string): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    switch (status) {
      case 'OK': return `${base} bg-emerald-100 text-emerald-800`;
      case 'Limite': return `${base} bg-amber-100 text-amber-800`;
      case 'Surcharge': return `${base} bg-red-100 text-red-800`;
      default: return `${base} bg-slate-100 text-slate-700`;
    }
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' - ' +
      new Date(d.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
  }
}