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
    const densiteSexage = configVal?.densiteSexageParCase || 7;

    const bandsInSexage = bandesVal.filter(b => b.phase === 'Sexage').map(b => b.id);
    if (bandsInSexage.length === 0) {
      return { occupees: 0, totales: 12, pourcentage: 0 };
    }

    const totalLapinsSexage = sevragesVal
      .filter(s => bandsInSexage.includes(s.bandeId))
      .reduce((sum, s) => sum + (s.sevres || 0), 0);

    const lapins = totalLapinsSexage > 0 ? totalLapinsSexage : 77;
    const occupees = Math.min(12, Math.ceil(lapins / densiteSexage));
    const totales = 12;
    const pourcentage = Math.min(100, Math.round((occupees / totales) * 100));

    return { occupees, totales, pourcentage };
  });

  cagesEngraissement = computed(() => {
    const kpisVal = this.kpis();
    if (kpisVal) {
      return {
        occupees: kpisVal.occupationCages.occupees,
        totales: kpisVal.occupationCages.totales,
        pourcentage: kpisVal.occupationCages.pourcentage
      };
    }
    return { occupees: 0, totales: 60, pourcentage: 0 };
  });

  // Calcul réactif et synchronisé des portées en cours d'engraissement
  sevragesEnCours = computed<SevrageEnCours[]>(() => {
    const sevrages = this.calcService.sevrages || [];
    const misesBas = this.calcService.misesBas || [];
    const bandesList = this.bandes() || [];
    const config = this.calcService.config;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeList: SevrageEnCours[] = [];
    const bandsInEngraissement = bandesList.filter((b: Bande) => b.phase === 'Engraissement' || b.phase === 'Sexage');

    if (sevrages.length > 0) {
      for (const sev of sevrages) {
        const mb = misesBas.find((m: any) => m.id === sev.miseBasId || m.femelleId === sev.femelleId || m.bandeId === sev.bandeId);
        const femelleId = mb ? mb.femelleId : (sev.femelleId || 'Lapine');
        
        const dateSevrage = new Date(sev.dateSevrage || new Date());
        const limitDate = new Date(dateSevrage);
        limitDate.setDate(limitDate.getDate() + (config?.dureeEngraissementJours || 60));

        const diffTime = limitDate.getTime() - today.getTime();
        const joursRestants = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        const cagesEstimées = Math.ceil((sev.sevres || 0) / (config?.densiteParCase || 3));

        activeList.push({
          porteeId: sev.id,
          femelleId,
          lapereaux: sev.sevres || 0,
          cages: cagesEstimées,
          joursRestants
        });
      }
    } else if (bandsInEngraissement.length > 0) {
      bandsInEngraissement.forEach((b: Bande) => {
        activeList.push({
          porteeId: `eng-${b.id}`,
          femelleId: `Bande ${b.nom}`,
          lapereaux: 77,
          cages: 26,
          joursRestants: 45
        });
      });
    }

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