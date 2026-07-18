import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '../../core/services/calculation.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-optimisation',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, MatIconModule, MatButtonModule],
  template: `
    <div class="page-container">
      <app-page-header
        title="Goulots & Optimisation"
        subtitle="Identifier les limites physiques de l'élevage et calculer le retour sur investissement (ROI)">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" *ngIf="kpis() && config()">
        <!-- Panel 1: Diagnostic Goulot Principal -->
        <div class="panel lg:col-span-2">
          <p class="panel__title">
            <mat-icon class="text-amber-500">grid_view</mat-icon> Diagnostic de Capacité
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <!-- Capacité Reproductrices -->
            <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Femelles Repro</span>
                <strong class="text-xl font-bold text-slate-700 block mt-1">{{ nbFemelles() }} femelles</strong>
                <span class="text-[11px] text-slate-500 block mt-1">Capacité: {{ capacityFemelles() }} lapereaux / mois</span>
              </div>
              <span class="badge badge--success mt-4 self-start">SATURÉE (100%)</span>
            </div>

            <!-- Capacité Mâles -->
            <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Mâles actifs</span>
                <strong class="text-xl font-bold text-slate-700 block mt-1">{{ nbMales() }} mâles</strong>
                <span class="text-[11px] text-slate-500 block mt-1">Rapport: {{ femalesPerMale() | number:'1.0-1' }} femelles/mâle</span>
              </div>
              <span class="badge badge--neutral mt-4 self-start">Marge OK (75% utilisé)</span>
            </div>

            <!-- Capacité Cages Engraissement -->
            <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-between">
              <div>
                <span class="text-[10px] text-slate-400 font-bold uppercase block">Cages Engraissement</span>
                <strong class="text-xl font-bold text-slate-700 block mt-1">{{ capacityEngraissement() }} cages</strong>
                <span class="text-[11px] text-slate-500 block mt-1">Capacité max: {{ capacityTheorique() }} lapereaux</span>
              </div>
              <span class="badge badge--warning mt-4 self-start">Utilisation: {{ kpis()!.tauxUtilisationCages }}%</span>
            </div>
          </div>

          <!-- Goulot désigné -->
          <div class="p-4 rounded-xl border border-rose-100 bg-rose-50/10 mt-6 flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <mat-icon>lock</mat-icon>
            </div>
            <div>
              <h4 class="font-bold text-rose-800 text-sm">Goulot d'étranglement principal : {{ kpis()!.goulotPrincipal }}</h4>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">
                Le principal facteur limitant votre capacité de production globale est <strong>{{ kpis()!.goulotPrincipal === 'Cages engraissement' ? 'l\\'espace en engraissement' : 'le nombre de lapines reproductrices' }}</strong>.
                Pour augmenter vos revenus sans saturer la ferme, des investissements ciblés sont préconisés.
              </p>
            </div>
          </div>
        </div>

        <!-- Panel 2: ROI & Simulations d'extension -->
        <div class="panel">
          <p class="panel__title">
            <mat-icon class="text-emerald-600">show_chart</mat-icon> ROI : Ajouter 50 Cages
          </p>

          <div class="mt-4 flex flex-col gap-4">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span class="text-xs text-slate-500">Investissement estimé</span>
              <strong class="text-sm text-slate-800">{{ kpis()!.roiAjouterCages.investissement | number:'1.0-0' }} FCFA</strong>
            </div>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span class="text-xs text-slate-500">Capacité de vente ajoutée</span>
              <strong class="text-sm text-slate-800">+150 lapins / cycle</strong>
            </div>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span class="text-xs text-slate-500">Revenu net mensuel supplémentaire</span>
              <strong class="text-sm text-emerald-600">+{{ kpis()!.roiAjouterCages.revenuNetMensuel | number:'1.0-0' }} FCFA/mois</strong>
            </div>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span class="text-xs text-slate-500">Temps de retour (Payback)</span>
              <strong class="text-sm text-slate-800">{{ kpis()!.roiAjouterCages.paybackMonths }} mois</strong>
            </div>

            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center text-emerald-800">
              <span class="text-xs font-bold">ROI Annuel estimé</span>
              <strong class="text-lg font-extrabold">{{ kpis()!.roiAjouterCages.roiAnnuelPourcent }}% / an</strong>
            </div>
          </div>

          <div class="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-normal">
            <h5 class="font-bold text-slate-700 mb-1">Méthodologie de calcul :</h5>
            <ul class="list-disc pl-4 flex flex-col gap-1">
              <li>Marge par lapin = Prix unitaire standard ({{ config()!.prixVenteDefaut | number:'1.0-0' }} FCFA) - Coût de production ({{ kpis()!.coutProductionParLapin | number:'1.0-0' }} FCFA).</li>
              <li>Extension basée sur 50 cages d'engraissement à 40 000 FCFA/unité.</li>
            </ul>
          </div>
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
  `]
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
    return configVal ? configVal.nombreCagesTotal - configVal.nombreCagesReproductrices : 144;
  });

  capacityTheorique = computed(() => {
    const cages = this.capacityEngraissement();
    const configVal = this.config();
    const density = configVal ? configVal.densiteParCage : 3;
    return cages * density;
  });
}
