import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, MatIconModule, MatButtonModule],
  template: `
    <div class="page-container">
      <app-page-header
        title="Rentabilité par Portée"
        subtitle="Suivi de la marge financière générée par chaque mise-bas et engraissement">
      </app-page-header>

      <!-- Résumé économique global -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" *ngIf="kpis()">
        <!-- Marge Brute Totale -->
        <div class="panel border-emerald-100 bg-emerald-50/10 flex items-center justify-between p-5 hover:shadow-md transition-shadow">
          <div>
            <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Marge Brute Totale</span>
            <strong class="text-2xl font-bold text-emerald-800 block mt-1">{{ kpis()!.margeBruteTotale | number:'1.0-0' }} FCFA</strong>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <mat-icon style="font-size: 26px; width: 26px; height: 26px;">trending_up</mat-icon>
          </div>
        </div>

        <!-- Revenu Moyen / Portée -->
        <div class="panel border-slate-100 flex items-center justify-between p-5 hover:shadow-md transition-shadow">
          <div>
            <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Revenu Moyen / Portée</span>
            <strong class="text-2xl font-bold text-slate-700 block mt-1">{{ kpis()!.revenuMoyenPortee | number:'1.0-0' }} FCFA</strong>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <mat-icon style="font-size: 26px; width: 26px; height: 26px;">monetization_on</mat-icon>
          </div>
        </div>

        <!-- Rentabilité / Femelle / An -->
        <div class="panel border-slate-100 flex items-center justify-between p-5 hover:shadow-md transition-shadow">
          <div>
            <span class="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Rentabilité / Femelle / An</span>
            <strong class="text-2xl font-bold text-slate-700 block mt-1">{{ kpis()!.rentabiliteFemelleAn | number:'1.0-0' }} FCFA</strong>
          </div>
          <div class="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100">
            <mat-icon style="font-size: 26px; width: 26px; height: 26px;">female</mat-icon>
          </div>
        </div>
      </div>

      <!-- Tableau détaillé -->
      <div class="panel">
        <p class="panel__title">
          <mat-icon class="text-emerald-600">attach_money</mat-icon> Liste des Portées & Marges
        </p>

        <div class="overflow-x-auto mt-4">
          <table class="data-table">
            <thead>
              <tr>
                <th>Portée</th>
                <th class="text-center">Femelle Mère</th>
                <th class="text-center">Lapereaux Vivants</th>
                <th class="text-center">Cages d'engraissement</th>
                <th class="text-right">Revenu Brut</th>
                <th class="text-right">Coût Alimentaire</th>
                <th class="text-right">Marge Nette</th>
              </tr>
            </thead>
            <tbody>
              @if (rows().length === 0) {
                <tr>
                  <td colspan="7" class="text-center py-8 text-slate-400">Aucune donnée économique disponible. Enregistrez des sevrages et ventes.</td>
                </tr>
              } @else {
                <tr *ngFor="let r of rows()" class="hover:bg-slate-50 transition-colors">
                  <td class="font-bold text-slate-700">Portée #{{ r.id }}</td>
                  <td class="text-center font-mono font-semibold">{{ r.femelleId }}</td>
                  <td class="text-center">{{ r.vivants }}</td>
                  <td class="text-center font-mono">{{ r.cages }}</td>
                  <td class="text-right font-mono text-slate-700 font-semibold">{{ r.revenu | number:'1.0-0' }} FCFA</td>
                  <td class="text-right font-mono text-slate-500">{{ r.coutAliment | number:'1.0-0' }} FCFA</td>
                  <td class="text-right font-mono text-emerald-700 font-bold">{{ r.marge | number:'1.0-0' }} FCFA</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
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

    const density = configVal.densiteParCage || 3;
    const prixAliment = configVal.prixAlimentKg || 350;
    const defaultPrice = configVal.prixVenteDefaut || 3000;

    return sevList.map((s: any, idx: number) => {
      const mb = mbList.find((m: any) => m.id === s.miseBasId);
      const femelleId = mb ? mb.femelleId : 'Inconnue';
      const vivants = mb ? mb.vivants : s.sevres;

      const cages = Math.ceil(s.sevres / density);
      
      // Calculate revenue: we assume 100% of this batch is eventually sold at defaultPrice
      // Or if there are actual sales, we can allocate. To keep it simple and clean:
      const revenu = s.sevres * defaultPrice;
      const coutAliment = s.sevres * prixAliment * 5; // 5kg per rabbit
      const marge = Math.max(0, revenu - coutAliment);

      return {
        id: s.id.replace('sev_', '').substring(0, 4) || `P00${idx + 1}`,
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
