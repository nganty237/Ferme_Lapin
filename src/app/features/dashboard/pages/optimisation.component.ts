import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
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

  nbFemelles = computed(() => {
    const list = this.reproducteurs() || [];
    return list.filter(r => r.sexe === 'F' && r.etat !== 'Mort' && r.etat !== 'Réformé').length;
  });

  nbMales = computed(() => {
    const list = this.reproducteurs() || [];
    return list.filter(r => r.sexe === 'M' && r.etat !== 'Mort' && r.etat !== 'Réformé').length;
  });

  femalesPerMale = computed(() => {
    const f = this.nbFemelles();
    const m = this.nbMales();
    return m > 0 ? f / m : 0;
  });

  capacityFemelles = computed(() => {
    return this.nbFemelles() * 8; // 8 vivants par portée
  });

  capacityEngraissement = computed(() => {
    const configVal = this.config();
    return configVal ? configVal.nombreCagesTotal - configVal.nombreCagesReproductrices : 75;
  });

  capacityTheorique = computed(() => {
    const cages = this.capacityEngraissement();
    const configVal = this.config();
    const density = configVal ? configVal.densiteParCage : 3;
    return cages * density;
  });
}