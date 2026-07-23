import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';

import { Configuration, Bande } from '@core/models';

interface SevrageEnCours {
  porteeId: string;
  femelleId: string;
  lapereaux: number;
  cages: number;
  joursRestants: number;
}

@Component({
  selector: 'app-occupation-cages-dashboard',
    imports: [PageHeaderComponent, MatIconModule],
  templateUrl: './occupation-cages.component.html',
  styleUrl: './occupation-cages.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OccupationCagesComponent {
  private calcService = inject(CalculationService);

  kpis = toSignal(this.calcService.kpis$);
  config = toSignal(this.calcService.config$);
  bandes = toSignal(this.calcService.bandes$);

  cagesSexage = computed(() => {
    const configVal = this.config();
    const bandesVal = this.bandes() || [];
    const sevragesVal = this.calcService.sevrages || [];
    const densite = configVal?.densiteParCase || 3;

    const bandsInSexage = bandesVal.filter(b => b.phase === 'Sexage').map(b => b.id);
    if (bandsInSexage.length === 0) return { occupees: 0, totales: 72, pourcentage: 0 };

    const totalLapinsSexage = sevragesVal
      .filter(s => bandsInSexage.includes(s.bandeId))
      .reduce((sum, s) => sum + (s.sevres || 0), 0);

    const lapins = totalLapinsSexage || (bandsInSexage.length * 66);
    const occupees = Math.ceil(lapins / densite);
    const totales = configVal ? configVal.nombreCagesTotal - configVal.nombreFemelles - configVal.nombreMales : 72;
    const pourcentage = Math.min(100, Math.round((occupees / totales) * 100));

    return { occupees, totales, pourcentage };
  });

  cagesEngraissement = computed(() => {
    const configVal = this.config();
    const kpisVal = this.kpis();
    const bandesVal = this.bandes() || [];
    const sevragesVal = this.calcService.sevrages || [];
    const ventesVal = this.calcService.ventes || [];
    const densite = configVal?.densiteParCase || 3;

    const bandsInEngraissement = bandesVal.filter(b => b.phase === 'Engraissement').map(b => b.id);
    
    if (bandsInEngraissement.length === 0) {
      return { 
        occupees: kpisVal?.occupationCages.occupees || 0, 
        totales: kpisVal?.occupationCages.totales || 72, 
        pourcentage: kpisVal?.occupationCages.pourcentage || 0 
      };
    }

    const totalLapinsEngraissement = sevragesVal
      .filter(s => bandsInEngraissement.includes(s.bandeId))
      .reduce((sum, s) => {
        const sold = ventesVal.filter(v => v.bandeId === s.bandeId).reduce((vSum, v) => vSum + (v.vendus || 0), 0);
        return sum + Math.max(0, (s.sevres || 0) - sold);
      }, 0);

    const lapins = totalLapinsEngraissement || (bandsInEngraissement.length * 66);
    const occupees = Math.ceil(lapins / densite);
    const totales = configVal ? configVal.nombreCagesTotal - configVal.nombreFemelles - configVal.nombreMales : 72;
    const pourcentage = Math.min(100, Math.round((occupees / totales) * 100));

    return { occupees, totales, pourcentage };
  });

  // Computes active weaning batches under fattening
  sevragesEnCours = computed<SevrageEnCours[]>(() => {
    const sevrages = this.calcService.sevrages;
    const misesBas = this.calcService.misesBas;
    const config = this.calcService.config;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeList: SevrageEnCours[] = [];

    for (const sev of sevrages) {
      // Find associated kindling event to extract the female ID
      const mb = misesBas.find((m: any) => m.id === sev.miseBasId);
      if (!mb) continue;

      const dateSevrage = new Date(sev.dateSevrage);
      const limitDate = new Date(dateSevrage);
      limitDate.setDate(limitDate.getDate() + (config.dureeEngraissementJours || 120));

      const diffTime = limitDate.getTime() - today.getTime();
      const joursRestants = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // Estimate cages based on current rabbit count / target density
      const cagesEstimées = Math.ceil((sev.sevres || 0) / (config.densiteParCase || 3));

      // Consider it in fattening if it's not yet completed or sold out
      // (simplification : date de fin d'engraissement non dépassée de plus de 15 jours)
      const isStillFattening = diffTime > -15 * 24 * 60 * 60 * 1000;

      if (isStillFattening) {
        activeList.push({
          porteeId: sev.id,
          femelleId: mb.femelleId || 'Inconnue',
          lapereaux: sev.sevres || 0,
          cages: cagesEstimées,
          joursRestants
        });
      }
    }

    // Sort by remaining days (closest to sale first)
    return activeList.sort((a, b) => a.joursRestants - b.joursRestants);
  });

  getProgressBarClass(pourcentage: number): string {
    if (pourcentage > 90) return 'bg-gradient-to-r from-rose-500 to-red-600';
    if (pourcentage >= 80) return 'bg-gradient-to-r from-amber-400 to-orange-500';
    return 'bg-gradient-to-r from-emerald-400 to-green-500';
  }

  getProgressTextColor(pourcentage: number): string {
    if (pourcentage > 90) return 'text-red-600';
    if (pourcentage >= 80) return 'text-orange-500';
    return 'text-green-600';
  }
}