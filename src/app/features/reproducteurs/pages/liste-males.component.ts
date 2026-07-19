import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface MaleRow {
  id: string;
  nom: string;
  bandeId: string;
  saillies: number;
  porteesProduites: number;
  etat: string;
}

@Component({
  selector: 'app-liste-males',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, MatIconModule, MatButtonModule],
  template: `
    <div class="page-container">
      <app-page-header
        title="Mâles Reproducteurs"
        subtitle="Liste et performance des mâles de l'élevage">
      </app-page-header>

      <!-- Filtres -->
      <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div class="flex flex-wrap gap-4 items-end">
          <div>
            <label class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">État</label>
            <select class="form-select" [(ngModel)]="filtreEtat" (ngModelChange)="onFilterChange()">
              <option value="">Tous les états</option>
              <option value="Actif">Actif</option>
              <option value="Réformé">Réformé</option>
              <option value="Mort">Décédé</option>
            </select>
          </div>
          <div class="ml-auto text-sm text-slate-500">
            {{ filteredMales().length }} mâle(s) trouvé(s)
          </div>
        </div>
      </div>

      <!-- Tableau -->
      <div class="bg-white border border-slate-200 rounded-xl p-6">
        <div class="overflow-x-auto" style="max-height: 520px;">
          <table class="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left cursor-pointer select-none" (click)="sortBy('id')">
                  ID <mat-icon *ngIf="sortCol === 'id'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left cursor-pointer select-none" (click)="sortBy('nom')">
                  Nom <mat-icon *ngIf="sortCol === 'nom'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center cursor-pointer select-none" (click)="sortBy('saillies')">
                  Saillies <mat-icon *ngIf="sortCol === 'saillies'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center cursor-pointer select-none" (click)="sortBy('porteesProduites')">
                  Portées produites <mat-icon *ngIf="sortCol === 'porteesProduites'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">État</th>
              </tr>
            </thead>
            <tbody>
              @if (filteredMales().length === 0) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td colspan="5" class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle text-center py-8 text-slate-400">Aucun mâle trouvé avec ces filtres.</td>
                </tr>
              } @else {
                <tr *ngFor="let m of filteredMales()" class="cursor-pointer hover:bg-slate-50/50 transition-colors" (click)="goToDetail(m.id)">
                  <td class="px-4 py-3 border-b border-slate-100 align-middle font-mono font-semibold text-slate-700">{{ m.id }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle font-semibold">{{ m.nom }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle text-center">{{ m.saillies }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle text-center">{{ m.porteesProduites }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle">
                    <span [class]="getEtatClass(m.etat)">{{ m.etat }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .form-select {
      padding: 8px 12px;
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 8px;
      font-size: 13px;
      background: white;
      min-width: 160px;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-select:focus { border-color: var(--color-primary); }
  `]
})
export class ListeMalesComponent {
  private calcService = inject(CalculationService);
  private router = inject(Router);

  reproducteurs = toSignal(this.calcService.reproducteurs$);
  sailliesList = toSignal(this.calcService.saillies$);
  misesBasList = toSignal(this.calcService.misesBas$);

  filtreEtat = '';
  sortCol = 'id';
  sortDir: 'asc' | 'desc' = 'asc';

  private filterTrigger = signal(0);

  onFilterChange(): void {
    this.filterTrigger.update(v => v + 1);
  }

  filteredMales = computed<MaleRow[]>(() => {
    this.filterTrigger();
    const repros = (this.reproducteurs() || []).filter(r => r.sexe === 'M');
    const saillies = this.sailliesList() || [];
    const misesBas = this.misesBasList() || [];

    let rows: MaleRow[] = repros.map(m => {
      const maleSaillies = saillies.filter((s: any) => s.maleId === m.id);
      const saillieIds = new Set(maleSaillies.map((s: any) => s.id));
      const porteesProduites = misesBas.filter((mb: any) => saillieIds.has(mb.saillieId)).length;

      return {
        id: m.id,
        nom: m.nom || m.id,
        bandeId: m.bandeId || '',
        saillies: maleSaillies.length,
        porteesProduites,
        etat: m.etat || 'Actif'
      };
    });

    if (this.filtreEtat) {
      rows = rows.filter(r => r.etat === this.filtreEtat);
    }

    const col = this.sortCol as keyof MaleRow;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });

    return rows;
  });

  sortBy(col: string): void {
    if (this.sortCol === col) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortCol = col;
      this.sortDir = 'asc';
    }
    this.filterTrigger.update(v => v + 1);
  }

  goToDetail(id: string): void {
    this.router.navigate(['/reproducteurs', id]);
  }

  getEtatClass(etat: string): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    switch (etat) {
      case 'Actif': return `${base} bg-emerald-100 text-emerald-800`;
      case 'Mort': return `${base} bg-red-100 text-red-800`;
      default: return `${base} bg-amber-100 text-amber-800`; // Réformé
    }
  }
}
