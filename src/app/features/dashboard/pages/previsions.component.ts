import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';

interface PrevisionItem {
  id: string;
  date: Date;
  details: string;
  cle: string; // ex: femelle ID, nombre de lapereaux
}

@Component({
  selector: 'app-previsions-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, MatIconModule],
  template: `
    <div class="page-container">
      <app-page-header
        title="Prévisions de l'Élevage"
        subtitle="Chronologie des futurs événements biologiques et commerciaux">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Colonne 1: Mises-bas (🔴) -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-[520px]">
          <div class="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
              <mat-icon>favorite</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Prochaines Mises-bas</h3>
              <p class="text-[11px] text-rose-600 font-medium">Naissances attendues (Gestation)</p>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
            @if (upcomingMisesBas().length === 0) {
              <div class="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <mat-icon style="font-size:32px; width:32px; height:32px; margin-bottom:8px;">check_circle_outline</mat-icon>
                <p class="text-xs">Aucune mise-bas prévue dans l'immédiat.</p>
              </div>
            } @else {
              <div *ngFor="let item of upcomingMisesBas()" class="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <span class="text-xs font-bold text-slate-700 block">{{ item.cle }}</span>
                  <span class="text-[11px] text-slate-500">{{ item.details }}</span>
                </div>
                <span class="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full whitespace-nowrap">{{ formatDate(item.date) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Colonne 2: Sevrages (🟡) -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-[520px]">
          <div class="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
              <mat-icon>child_friendly</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Prochains Sevrages</h3>
              <p class="text-[11px] text-amber-600 font-medium">Séparation & passage en cage</p>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
            @if (upcomingSevrages().length === 0) {
              <div class="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <mat-icon style="font-size:32px; width:32px; height:32px; margin-bottom:8px;">check_circle_outline</mat-icon>
                <p class="text-xs">Aucun sevrage prévu dans l'immédiat.</p>
              </div>
            } @else {
              <div *ngFor="let item of upcomingSevrages()" class="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <span class="text-xs font-bold text-slate-700 block">{{ item.cle }}</span>
                  <span class="text-[11px] text-slate-500">{{ item.details }}</span>
                </div>
                <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full whitespace-nowrap">{{ formatDate(item.date) }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Colonne 3: Ventes (🟢) -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-[520px]">
          <div class="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
              <mat-icon>point_of_sale</mat-icon>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Prochaines Ventes</h3>
              <p class="text-[11px] text-emerald-600 font-medium">Sorties d'engraissement</p>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
            @if (upcomingVentes().length === 0) {
              <div class="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <mat-icon style="font-size:32px; width:32px; height:32px; margin-bottom:8px;">check_circle_outline</mat-icon>
                <p class="text-xs">Aucune vente programmée dans l'immédiat.</p>
              </div>
            } @else {
              <div *ngFor="let item of upcomingVentes()" class="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <span class="text-xs font-bold text-slate-700 block">{{ item.cle }}</span>
                  <span class="text-[11px] text-slate-500">{{ item.details }}</span>
                </div>
                <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">{{ formatDate(item.date) }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    ::-webkit-scrollbar { width: 4px; }
  `]
})
export class PrevisionsComponent {
  private calcService = inject(CalculationService);

  saillies = toSignal(this.calcService.saillies$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);
  config = toSignal(this.calcService.config$);

  // Today marker
  private getTodayZero(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // 1. Prochaines Mises-bas (🔴)
  upcomingMisesBas = computed<PrevisionItem[]>(() => {
    const list = this.calcService.saillies;
    const mbList = this.calcService.misesBas;
    const c = this.calcService.config;
    const today = this.getTodayZero();

    const result: PrevisionItem[] = [];

    for (const saillie of list) {
      // Check if kindling already happened
      const isDone = mbList.some((m: any) => m.saillieId === saillie.id);
      if (isDone) continue;

      let datePrevue = saillie.dateMiseBasPrevue ? new Date(saillie.dateMiseBasPrevue) : null;
      if (!datePrevue && saillie.dateSaillie) {
        datePrevue = new Date(saillie.dateSaillie);
        datePrevue.setDate(datePrevue.getDate() + (c.dureeGestationJours || 31));
      }

      if (datePrevue && datePrevue >= today) {
        result.push({
          id: saillie.id,
          date: datePrevue,
          cle: `Femelle: ${saillie.femelleId || 'Inconnue'}`,
          details: `Saillie du ${this.formatSourceDate(saillie.dateSaillie)} avec le mâle ${saillie.maleId || '?'}`
        });
      }
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  });

  // 2. Prochains Sevrages (🟡)
  upcomingSevrages = computed<PrevisionItem[]>(() => {
    const list = this.calcService.misesBas;
    const sevList = this.calcService.sevrages;
    const c = this.calcService.config;
    const today = this.getTodayZero();

    const result: PrevisionItem[] = [];

    for (const mb of list) {
      // Check if weaning already happened
      const isDone = sevList.some((s: any) => s.miseBasId === mb.id);
      if (isDone) continue;

      const datePrevue = new Date(mb.dateMiseBas);
      datePrevue.setDate(datePrevue.getDate() + (c.dureeAllaitementJours || 31));

      if (datePrevue >= today) {
        result.push({
          id: mb.id,
          date: datePrevue,
          cle: `Portée: ${mb.vivants || 0} nés vivants`,
          details: `Femelle ${mb.femelleId || 'Inconnue'} - Nés le ${this.formatSourceDate(mb.dateMiseBas)}`
        });
      }
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  });

  // 3. Prochaines Ventes (🟢)
  upcomingVentes = computed<PrevisionItem[]>(() => {
    const list = this.calcService.sevrages;
    const c = this.calcService.config;
    const today = this.getTodayZero();

    const result: PrevisionItem[] = [];

    for (const sev of list) {
      const datePrevue = new Date(sev.dateSevrage);
      // Weaning to sale duration
      datePrevue.setDate(datePrevue.getDate() + (c.dureeEngraissementJours || 120));

      if (datePrevue >= today) {
        result.push({
          id: sev.id,
          date: datePrevue,
          cle: `Lot : ${sev.sevres || 0} lapereaux`,
          details: `Sevrés le ${this.formatSourceDate(sev.dateSevrage)} - Cages estimées: ${Math.ceil(sev.sevres / (c.densiteParCage || 3))}`
        });
      }
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  });

  // Format date helper: "dd MMM" (ex: "15 Août")
  formatDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  private formatSourceDate(dateStr: any): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    } catch {
      return String(dateStr);
    }
  }
}
