import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { Configuration, MiseBas, Sevrage } from '@core/models';
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
  bandes = toSignal(this.calcService.bandes$);
  cyclesBande = toSignal(this.calcService.cyclesBande$);
  clapiers = toSignal(this.calcService.clapiers$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);

  projections = computed<ProjectionWeek[]>(() => {
    const list: ProjectionWeek[] = [];
    const configVal = this.config();
    if (!configVal) return [];

    // Fix P0-4 : capacité d'engraissement dérivée des clapiers physiques type Engraissement
    // (5 clapiers × 12 cases = 60), pas du nombreCagesTotal - femelles (=75) qui surestime.
    const clapiers = this.clapiers() || [];
    const totalEngraissement = clapiers
      .filter(c => c.type === 'Engraissement')
      .reduce((sum, c) => sum + (c.nombreCases || 0), 0) || (configVal.nombreCagesTotal - configVal.nombreFemelles);
    const density = configVal.densiteParCase || 3;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fix P0 #6 : phases réelles dérivées de CycleBande.dateDebutSaillie + durées config.
    const bandes = this.bandes() || [];
    const cycles = this.cyclesBande() || [];
    const cycleA = cycles.find(c => c.bandeId === 'bande-a');
    const cycleB = cycles.find(c => c.bandeId === 'bande-b');
    const cycleC = cycles.find(c => c.bandeId === 'bande-c');
    const fallbackA = bandes.find(b => b.id === 'bande-a')?.phase ?? 'Repos';
    const fallbackB = bandes.find(b => b.id === 'bande-b')?.phase ?? 'Repos';
    const fallbackC = bandes.find(b => b.id === 'bande-c')?.phase ?? 'Repos';

    for (let s = 0; s <= 12; s++) {
      const dateDebut = new Date(today);
      dateDebut.setDate(dateDebut.getDate() + s * 7);

      const phaseA = this.getPhaseAtWeek(cycleA, s, configVal, fallbackA);
      const phaseB = this.getPhaseAtWeek(cycleB, s, configVal, fallbackB);
      const phaseC = this.getPhaseAtWeek(cycleC, s, configVal, fallbackC);

      // Cages d'engraissement : approach dérivé du nombre de lapereaux sevrs cumulés
      // et non-divisés par bandes encore vendues. Borné à la capacité totale.
      let cagesOccupees = 0;
      const mb = this.misesBas() || [];
      const sev = this.sevrages() || [];
      if (phaseA === 'Engraissement') cagesOccupees += this.cagesEngraissementBande(configVal, mb, sev);
      if (phaseB === 'Engraissement') cagesOccupees += this.cagesEngraissementBande(configVal, mb, sev);
      if (phaseC === 'Engraissement') cagesOccupees += this.cagesEngraissementBande(configVal, mb, sev);

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
    return configVal ? configVal.nombreCagesTotal - configVal.nombreFemelles : 75;
  });

  /**
   * Fix P0 #6 : calcule la phase d'une bande à une semaine future donnée en déroulant
   * les durées du cycle depuis `CycleBande.dateDebutSaillie`. Retourne le fallback
   * (phase courante de la bande) si le cycle n'est pas trouvable.
   */
  private getPhaseAtWeek(
    cycle: { dateDebutSaillie?: string } | undefined,
    week: number,
    configVal: Configuration,
    fallback: string
  ): string {
    if (!cycle?.dateDebutSaillie) return fallback;
    const start = new Date(cycle.dateDebutSaillie);
    const target = new Date();
    target.setDate(target.getDate() + week * 7);
    const days = Math.max(0, Math.round((target.getTime() - start.getTime()) / 86400000));
    const gest = configVal.dureeGestationJours;
    const all = configVal.dureeAllaitementMaxJours || 35;
    const sex = configVal.dureeSexageJours;
    const eng = configVal.dureeEngraissementJours;
    if (days < gest) return 'Saillie';
    if (days < gest + all) return 'Allaitement';
    if (days < gest + all + sex) return 'Sexage';
    if (days < gest + all + sex + eng) return 'Engraissement';
    return 'Repos';
  }

  /**
   * Cages d'engraissement estimées pour une bande en engraissement,
   * basées sur la taille de portée moyenne et la densité par case.
   * Fix P0-6 : le taux de survie au sevrage (0.8 codé dur) est remplacé par
   * le taux réel observé (Σ sevrages.sevres / Σ misesBas.vivants sur portées sevrées),
   * avec fallback 0.8 si aucune donnée n'est encore disponible.
   */
  private cagesEngraissementBande(
    configVal: Configuration,
    misesBas: MiseBas[],
    sevrages: Sevrage[]
  ): number {
    const femellesParBande = configVal.nombreFemellesParBande || 11;
    const portee = configVal.taillePorteeMoyenne || 7;
    const densite = configVal.densiteParCase || 3;
    const sevragesValides = sevrages.filter(s => s.sevres != null && s.miseBasId);
    const totalSevres = sevragesValides.reduce((sum, s) => sum + (s.sevres || 0), 0);
    const mbIds = new Set(sevragesValides.map(s => s.miseBasId));
    const totalVivantsPourSevrage = misesBas
      .filter(mb => mbIds.has(mb.id))
      .reduce((sum, mb) => sum + (mb.vivants || 0), 0);
    const tauxSurvie = totalVivantsPourSevrage > 0
      ? Math.min(1, totalSevres / totalVivantsPourSevrage)
      : 0.8;
    const sevrés = Math.round(femellesParBande * portee * tauxSurvie);
    return Math.ceil(sevrés / densite);
  }

  getPhaseClass(phase: string): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    switch (phase) {
      case 'Saillie': return `${base} bg-pink-100 text-pink-800`;
      case 'Gestation': return `${base} bg-purple-100 text-purple-800`;
      case 'Allaitement': return `${base} bg-blue-100 text-blue-800`;
      case 'Sexage': return `${base} bg-teal-100 text-teal-800`;
      case 'Engraissement': return `${base} bg-orange-100 text-orange-800`;
      case 'Repos': return `${base} bg-slate-100 text-slate-700`;
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