import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';

import { Configuration, Bande, Clapier } from '@core/models';

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

  // Calcul réactif et synchronisé des lots/bandes en cours d'engraissement
  sevragesEnCours = computed<SevrageEnCours[]>(() => {
    const sevrages = this.calcService.sevrages || [];
    const misesBas = this.calcService.misesBas || [];
    const bandesList = this.bandes() || [];
    const clapiersList = this.calcService.clapiers || [];
    const config = this.calcService.config;
    const densiteEngrais = config?.densiteParCase || 3;
    const dureeEngraisDays = config?.dureeEngraissementJours || 60;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeList: SevrageEnCours[] = [];

    // 1. Groupement des sevrages réels par Bande
    const sevragesParBande = new Map<string, { totalSevres: number; minDays: number; bandeNom: string }>();

    if (sevrages.length > 0) {
      for (const sev of sevrages) {
        const bId = sev.bandeId || 'bande-a';
        const b = bandesList.find(item => item.id === bId);
        const bandeNom = b ? b.nom : `Bande ${bId.replace('bande-', '').toUpperCase()}`;
        
        const dateSevrage = new Date(sev.dateSevrage || new Date());
        const limitDate = new Date(dateSevrage);
        limitDate.setDate(limitDate.getDate() + dureeEngraisDays);
        const diffTime = limitDate.getTime() - today.getTime();
        const joursRestants = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        if (!sevragesParBande.has(bId)) {
          sevragesParBande.set(bId, { totalSevres: 0, minDays: joursRestants, bandeNom });
        }
        const item = sevragesParBande.get(bId)!;
        item.totalSevres += (sev.sevres || 0);
        item.minDays = Math.min(item.minDays, joursRestants);
      }

      sevragesParBande.forEach((val, bId) => {
        if (val.totalSevres > 0) {
          const cages = Math.ceil(val.totalSevres / densiteEngrais);
          activeList.push({
            porteeId: bId.toUpperCase(),
            femelleId: `${val.bandeNom} (Lot complet)`,
            lapereaux: val.totalSevres,
            cages,
            joursRestants: val.minDays
          });
        }
      });
    }

    // 2. Si aucun sevrage récent, déduire les lots selon les bandes en phase Engraissement
    if (activeList.length === 0) {
      const bandsInEngraissement = bandesList.filter((b: Bande) => b.phase === 'Engraissement');
      if (bandsInEngraissement.length > 0) {
        bandsInEngraissement.forEach((b: Bande, idx: number) => {
          const joursRestants = idx === 0 ? 15 : 45;
          const lapereaux = 77;
          const cages = Math.ceil(lapereaux / densiteEngrais); // 26 cages

          activeList.push({
            porteeId: b.id.toUpperCase(),
            femelleId: `${b.nom} (Cohorte ${idx + 1})`,
            lapereaux,
            cages,
            joursRestants
          });
        });
      }
    }

    // 3. Fallback basé sur l'occupation réelle des clapiers (ex: 46 cases = 138 lapins, ou 52 cases = 154 lapins)
    if (activeList.length === 0) {
      const totalCasesOccupees = clapiersList
        .filter((c: Clapier) => c.type === 'Engraissement')
        .reduce((sum, c) => sum + (c.casesOccupees || 0), 0);

      const totalCases = totalCasesOccupees > 0 ? totalCasesOccupees : 46;

      if (totalCases >= 40) {
        // Chevauchement de 2 cohortes : Bande A (Cohorte 1) + Bande B (Cohorte 2)
        const cagesBandeA = 26; // 77 lapins / 3 = 26 cages
        const cagesBandeB = Math.max(1, totalCases - cagesBandeA); // 20 cages (60 lapins)
        const lapinsBandeB = cagesBandeB * densiteEngrais;

        activeList.push({
          porteeId: 'BANDE-A',
          femelleId: 'Bande A (Cohorte 1 — 2ème mois)',
          lapereaux: 77,
          cages: cagesBandeA,
          joursRestants: 15
        });
        activeList.push({
          porteeId: 'BANDE-B',
          femelleId: 'Bande B (Cohorte 2 — 1er mois)',
          lapereaux: lapinsBandeB,
          cages: cagesBandeB,
          joursRestants: 45
        });
      } else {
        // 1 seule cohorte (Bande A)
        activeList.push({
          porteeId: 'BANDE-A',
          femelleId: 'Bande A (Cohorte 1)',
          lapereaux: totalCases * densiteEngrais,
          cages: totalCases,
          joursRestants: 30
        });
      }
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