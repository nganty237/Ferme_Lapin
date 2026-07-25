import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-optimisation',
  imports: [DecimalPipe, PageHeaderComponent, MatIconModule, MatButtonModule],
  templateUrl: './optimisation.component.html',
  styleUrl: './optimisation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimisationComponent {
  private calcService = inject(CalculationService);

  kpis = toSignal(this.calcService.kpis$);
  config = toSignal(this.calcService.config$);
  reproducteurs = toSignal(this.calcService.reproducteurs$);
  clapiers = toSignal(this.calcService.clapiers$);

  // --- Femelles / Mâles actifs (dynamiques) ---
  nbFemelles = computed(() => {
    // Priorité aux données réactives kpis, fallback reproducteurs
    const fromKpis = this.kpis()?.cagesReproducteurs?.nbFemellesActives;
    if (fromKpis !== undefined) return fromKpis;
    const list = this.reproducteurs() || [];
    return list.filter(r => r.sexe === 'F' && r.etat !== 'Morte' && r.etat !== 'Réformée').length;
  });

  nbMales = computed(() => {
    const fromKpis = this.kpis()?.cagesReproducteurs?.nbMalesActifs;
    if (fromKpis !== undefined) return fromKpis;
    const list = this.reproducteurs() || [];
    return list.filter(r => r.sexe === 'M' && r.etat !== 'Mort' && r.etat !== 'Réformé').length;
  });

  femalesPerMale = computed(() => {
    const f = this.nbFemelles();
    const m = this.nbMales();
    return m > 0 ? f / m : 0;
  });

  // % utilisation mâles : 1 mâle pour 11 femelles recommandé
  maleUtilisationPct = computed(() => {
    const ratio = this.femalesPerMale();
    return Math.min(100, Math.round((ratio / 11) * 100));
  });

  capacityFemelles = computed(() => {
    return this.nbFemelles() * 8;
  });

  // ✔ CORRIGÉ : 5 clapiers Engraissement × 12 cases = 60 cages (architecture fixe)
  capacityEngraissement = computed(() => {
    const clapiers = this.clapiers() || [];
    const engraisClapiers = clapiers.filter(c => c.type === 'Engraissement');
    // Si les clapiers sont chargés depuis le store, on utilise leur total réel
    if (engraisClapiers.length > 0) {
      return engraisClapiers.reduce((sum, c) => sum + (c.nombreCases || 12), 0);
    }
    // Fallback physique : 5 clapiers × 12 cases = 60
    return 60;
  });

  // Cases occupées en engraissement (depuis kpis$)
  cagesOccupeesEngraissement = computed(() => {
    return this.kpis()?.occupationCages?.occupees ?? 52;
  });

  // Taux d'occupation engraissement
  tauxOccupationEngraissement = computed(() => {
    const occupees = this.cagesOccupeesEngraissement();
    const totales = this.capacityEngraissement();
    return totales > 0 ? Math.round((occupees / totales) * 100) : 0;
  });

  // Répartition reproducteurs
  cagesReproducteursOccupees = computed(() => this.kpis()?.cagesReproducteurs?.occupees ?? 36);
  cagesReproducteursTotales = computed(() => this.kpis()?.cagesReproducteurs?.totales ?? 36);
  cagesReproducteursPct = computed(() => this.kpis()?.cagesReproducteurs?.pourcentage ?? 100);

  capacityTheorique = computed(() => {
    return this.kpis()?.capaciteTheorique || 267;
  });
}