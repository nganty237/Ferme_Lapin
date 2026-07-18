import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';

interface SevrageEnCours {
  porteeId: string;
  femelleId: string;
  lapereaux: number;
  cages: number;
  joursRestants: number;
}

@Component({
  selector: 'app-occupation-cages-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, MatIconModule],
  template: `
    <div class="page-container">
      <app-page-header
        title="Occupation des Cages"
        subtitle="Suivi de la capacité d'engraissement en temps réel">
      </app-page-header>

      <!-- Alerte de Saturation -->
      @if (kpis() && kpis()!.occupationCages.pourcentage > 90) {
        <div class="mb-6 p-4 rounded-xl border flex items-start gap-3 bg-red-50 border-red-200 text-red-800">
          <mat-icon class="text-red-600">error</mat-icon>
          <div>
            <h4 class="font-bold text-sm">Alerte : Saturation Critique</h4>
            <p class="text-xs mt-1">L'occupation des cages dépasse 90% ({{ kpis()!.occupationCages.pourcentage }}%). Risque de surpopulation. Veuillez planifier des ventes ou libérer des cages.</p>
          </div>
        </div>
      } @else if (kpis() && kpis()!.occupationCages.pourcentage >= 80) {
        <div class="mb-6 p-4 rounded-xl border flex items-start gap-3 bg-amber-50 border-amber-200 text-amber-800">
          <mat-icon class="text-amber-600">warning</mat-icon>
          <div>
            <h4 class="font-bold text-sm">Alerte : Occupation Élevée</h4>
            <p class="text-xs mt-1">L'occupation approche du seuil critique ({{ kpis()!.occupationCages.pourcentage }}%). Surveillez le stock disponible pour la commercialisation.</p>
          </div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8" *ngIf="kpis()">
        <!-- Graphique Barre Horizontale -->
        <div class="panel lg:col-span-2 flex flex-col justify-between">
          <div>
            <p class="panel__title">
              <mat-icon>grid_view</mat-icon>
              Occupation Cages Engraissement
            </p>
            <div class="my-6">
              <div class="flex justify-between items-end mb-2">
                <span class="text-2xl font-bold text-slate-800">
                  {{ kpis()!.occupationCages.occupees }} <span class="text-sm font-normal text-slate-500">/ {{ kpis()!.occupationCages.totales }} lapins</span>
                </span>
                <span class="text-lg font-bold" [ngClass]="getProgressTextColor(kpis()!.occupationCages.pourcentage)">
                  {{ kpis()!.occupationCages.pourcentage }}%
                </span>
              </div>
              
              <!-- Barre de progression personnalisée -->
              <div class="w-full h-8 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
                <div class="h-full rounded-full transition-all duration-500 ease-out"
                     [style.width.%]="kpis()!.occupationCages.pourcentage"
                     [ngClass]="getProgressBarClass(kpis()!.occupationCages.pourcentage)">
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex gap-6 border-t pt-4 border-slate-100 text-xs text-slate-500">
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Normal (&lt; 80%)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Élevé (80% - 90%)</span>
            </div>
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Critique (&gt; 90%)</span>
            </div>
          </div>
        </div>

        <!-- Légende/Infos -->
        <div class="panel flex flex-col justify-between">
          <div>
            <p class="panel__title">
              <mat-icon>info</mat-icon>
              Métriques de Capacité
            </p>
            <div class="flex flex-col gap-4 my-4">
              <div class="flex justify-between items-center py-2 border-b border-slate-50">
                <span class="text-slate-500 text-sm">Cages Totales</span>
                <span class="font-bold text-slate-800">{{ config()?.nombreCagesTotal || 144 }}</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-slate-50">
                <span class="text-slate-500 text-sm">Densité cible / cage</span>
                <span class="font-bold text-slate-800">{{ config()?.densiteParCage || 3 }} lapins</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-slate-500 text-sm">Capacité maximale</span>
                <span class="font-bold text-slate-800">{{ (config()?.nombreCagesTotal || 144) * (config()?.densiteParCage || 3) }} lapins</span>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 leading-normal">La capacité est calculée à partir des paramètres du système. La densité recommandée assure le bien-être animal et une croissance optimale.</p>
        </div>
      </div>

      <!-- Tableau Sevrages en cours -->
      <div class="panel">
        <p class="panel__title">
          <mat-icon>hourglass_bottom</mat-icon>
          Portées en Cours d'Engraissement (Détails)
        </p>

        <div class="overflow-x-auto mt-4" style="max-height: 400px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Portée ID</th>
                <th>Femelle</th>
                <th>Lapereaux</th>
                <th>Cages Estimées</th>
                <th>Jours Restants</th>
              </tr>
            </thead>
            <tbody>
              @if (sevragesEnCours().length === 0) {
                <tr>
                  <td colspan="5" class="text-center py-8 text-slate-400">
                    Aucune portée en cours d'engraissement actuellement.
                  </td>
                </tr>
              } @else {
                <tr *ngFor="let sev of sevragesEnCours()">
                  <td class="font-semibold text-slate-700">#{{ sev.porteeId }}</td>
                  <td>{{ sev.femelleId }}</td>
                  <td>
                    <span class="badge badge--info">{{ sev.lapereaux }} lapins</span>
                  </td>
                  <td>{{ sev.cages }}</td>
                  <td>
                    <span class="font-mono font-medium" [ngClass]="sev.joursRestants <= 0 ? 'text-emerald-600 font-bold' : 'text-slate-600'">
                      {{ sev.joursRestants <= 0 ? 'Prêt pour vente' : sev.joursRestants + ' jours' }}
                    </span>
                  </td>
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
export class OccupationCagesComponent {
  private calcService = inject(CalculationService);

  kpis = toSignal(this.calcService.kpis$);
  config = toSignal(this.calcService.config$);

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
      const cagesEstimées = Math.ceil((sev.sevres || 0) / (config.densiteParCage || 3));

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
