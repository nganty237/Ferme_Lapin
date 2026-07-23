import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface RentabiliteRow {
  id: string;
  femelleId: string;
  vivants: number;
  cages: number;
  revenu: number;
  coutAliment: number;
  marge: number;
}

@Component({
  selector: 'app-rentabilite',
    imports: [DecimalPipe, PageHeaderComponent, MatIconModule, MatButtonModule],
  templateUrl: './rentabilite.component.html',
  styleUrl: './rentabilite.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RentabiliteComponent {
  private calcService = inject(CalculationService);

  kpis = toSignal(this.calcService.kpis$);
  config = toSignal(this.calcService.config$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);
  ventes = toSignal(this.calcService.ventes$);

  rows = computed<RentabiliteRow[]>(() => {
    const mbList = this.misesBas() || [];
    const sevList = this.sevrages() || [];
    const configVal = this.config();
    if (!configVal) return [];

    const density = configVal.densiteParCase || 3;
    const prixAliment = configVal.prixAlimentKg || 350;
    const defaultPrice = configVal.prixVenteDefaut || 3000;
    const duration = configVal.dureeEngraissementJours || 60;
    const consumptionKg = duration * 0.1; // ~100g / day / rabbit

    return sevList.map((s: any, idx: number) => {
      const mb = mbList.find((m: any) => m.id === s.miseBasId);
      const femelleId = mb ? mb.femelleId : 'Inconnue';
      const vivants = mb ? mb.vivants : s.sevres;

      const cages = Math.ceil(s.sevres / density);
      
      // Calculate revenue: we assume 100% of this batch is eventually sold at defaultPrice
      // Or if there are actual sales, we can allocate. To keep it simple and clean:
      const revenu = s.sevres * defaultPrice;
      const coutAliment = s.sevres * prixAliment * consumptionKg;
      const marge = Math.max(0, revenu - coutAliment);

      return {
        id: s.id.replace('sev-', '').replace('sev_', '').substring(0, 5) || `P00${idx + 1}`,
        femelleId,
        vivants,
        cages,
        revenu,
        coutAliment,
        marge
      };
    });
  });
}