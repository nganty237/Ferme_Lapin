import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Reproducteur } from '@core/models';

@Component({
  selector: 'app-historique-saillies',
  imports: [DatePipe, RouterLink, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- FEMELLE : Historique Saillies -->
      @if (reproducteur()?.sexe === 'F') {
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h2 class="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <mat-icon style="color: #ec4899;">favorite</mat-icon>
            Historique des Saillies
          </h2>

          <div class="overflow-x-auto">
            <table class="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">Date</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">Mâle Partenaire</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">Date M.B. Prévue</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center">Statut / Résultat</th>
                </tr>
              </thead>
              <tbody>
                @if (femaleSaillies().length === 0) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td colspan="4" class="px-4 py-6 text-slate-400 border-b border-slate-100 text-center">Aucune saillie enregistrée.</td>
                  </tr>
                } @else {
                  @for (s of femaleSaillies(); track s.id) {
                    <tr class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-4 py-3 border-b border-slate-100 font-semibold text-slate-700">{{ s.dateSaillie | date:'dd/MM/yyyy' }}</td>
                      <td class="px-4 py-3 text-slate-800 border-b border-slate-100">
                        <a [routerLink]="['/reproducteurs', s.maleId]" class="font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1">
                          <mat-icon style="font-size:14px;width:14px;height:14px;">link</mat-icon>
                          {{ s.maleName || s.maleId }}
                        </a>
                      </td>
                      <td class="px-4 py-3 border-b border-slate-100 font-mono text-slate-500">{{ s.dateMiseBasPrevue | date:'dd/MM/yyyy' }}</td>
                      <td class="px-4 py-3 border-b border-slate-100 text-center">
                        <span [class]="getSaillieResultClass(s.reussie)">
                          {{ s.reussie === true ? 'Réussie' : s.reussie === false ? 'Échouée' : 'En attente' }}
                        </span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- FEMELLE : Historique Portées -->
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h2 class="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <mat-icon style="color: #a855f7;">child_care</mat-icon>
            Historique des Portées &amp; Sevrages
          </h2>

          <div class="overflow-x-auto">
            <table class="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">Date M.B.</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center">Nés Vivants</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center">Mort-nés</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center">Viabilité</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">Sevrage (Date)</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center">Sevrés</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center">Survie Sevrage</th>
                </tr>
              </thead>
              <tbody>
                @if (femalePortees().length === 0) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td colspan="7" class="px-4 py-6 text-slate-400 border-b border-slate-100 text-center">Aucune portée enregistrée.</td>
                  </tr>
                } @else {
                  @for (p of femalePortees(); track p.id) {
                    <tr class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-4 py-3 border-b border-slate-100 font-semibold text-slate-700">{{ p.dateMiseBas | date:'dd/MM/yyyy' }}</td>
                      <td class="px-4 py-3 border-b border-slate-100 text-center font-mono">{{ p.vivants }}</td>
                      <td class="px-4 py-3 border-b border-slate-100 text-center font-mono text-slate-400">{{ p.mortsNes }}</td>
                      <td class="px-4 py-3 border-b border-slate-100 text-center">
                        <span [class]="getPercentBadgeClass(p.viabiliteCalculee)">
                          {{ p.viabiliteCalculee }}%
                        </span>
                      </td>
                      <td class="px-4 py-3 border-b border-slate-100">
                        @if (p.sevrageDate) {
                          <span class="text-slate-600">{{ p.sevrageDate | date:'dd/MM/yyyy' }}</span>
                        } @else {
                          <span class="text-slate-400 italic">En cours</span>
                        }
                      </td>
                      <td class="px-4 py-3 border-b border-slate-100 text-center font-mono text-slate-700">
                        {{ p.sevrageSevres !== null ? p.sevrageSevres : '—' }}
                      </td>
                      <td class="px-4 py-3 border-b border-slate-100 text-center">
                        @if (p.sevrageSevres !== null) {
                          <span [class]="getPercentBadgeClass(round((p.sevrageSevres / p.vivants) * 100))">
                            {{ round((p.sevrageSevres / p.vivants) * 100) }}%
                          </span>
                        } @else {
                          <span class="text-slate-400">—</span>
                        }
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MÂLE : Historique Couvertures -->
      @if (reproducteur()?.sexe === 'M') {
        <div class="bg-white border border-slate-200 rounded-xl p-6">
          <h2 class="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <mat-icon style="color: #3b82f6;">favorite</mat-icon>
            Historique des Couvertures
          </h2>

          <div class="overflow-x-auto">
            <table class="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">Date</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">Femelle Partenaire</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">Date M.B. Prévue</th>
                  <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center">Statut / Résultat</th>
                </tr>
              </thead>
              <tbody>
                @if (maleSaillies().length === 0) {
                  <tr class="hover:bg-slate-50/50 transition-colors">
                    <td colspan="4" class="px-4 py-6 text-slate-400 border-b border-slate-100 text-center">Aucune couverture enregistrée.</td>
                  </tr>
                } @else {
                  @for (s of maleSaillies(); track s.id) {
                    <tr class="hover:bg-slate-50/50 transition-colors">
                      <td class="px-4 py-3 border-b border-slate-100 font-semibold text-slate-700">{{ s.dateSaillie | date:'dd/MM/yyyy' }}</td>
                      <td class="px-4 py-3 text-slate-800 border-b border-slate-100">
                        <a [routerLink]="['/reproducteurs', s.femelleId]" class="font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1">
                          <mat-icon style="font-size:14px;width:14px;height:14px;">link</mat-icon>
                          {{ s.femaleName || s.femelleId }}
                        </a>
                      </td>
                      <td class="px-4 py-3 border-b border-slate-100 font-mono text-slate-500">{{ s.dateMiseBasPrevue | date:'dd/MM/yyyy' }}</td>
                      <td class="px-4 py-3 border-b border-slate-100 text-center">
                        <span [class]="getSaillieResultClass(s.reussie)">
                          {{ s.reussie === true ? 'Réussie' : s.reussie === false ? 'Échouée' : 'En attente' }}
                        </span>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoriqueSailliesComponent {
  reproducteur = input<Reproducteur | undefined>();
  femaleSaillies = input<any[]>([]);
  femalePortees = input<any[]>([]);
  maleSaillies = input<any[]>([]);

  getSaillieResultClass(reussie: boolean | null): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    if (reussie === true) return `${base} bg-emerald-100 text-emerald-800`;
    if (reussie === false) return `${base} bg-red-100 text-red-800`;
    return `${base} bg-amber-100 text-amber-800`;
  }

  getPercentBadgeClass(pct: number): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    if (pct >= 90) return `${base} bg-emerald-100 text-emerald-800`;
    if (pct >= 75) return `${base} bg-amber-100 text-amber-800`;
    return `${base} bg-red-100 text-red-800`;
  }

  round(val: number): number {
    return Math.round(val);
  }
}
