import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

interface FemelleRow {
  id: string;
  nom: string;
  bandeId: string;
  portees: number;
  tailleMoyenne: number;
  survie: number;
  cages: number;
  etat: string;
}

@Component({
  selector: 'app-liste-femelles',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, MatIconModule, MatButtonModule, MatSelectModule],
  template: `
    <div class="page-container">
      <app-page-header
        title="Femelles Reproductrices"
        subtitle="Liste et performance des lapines de l'élevage">
      </app-page-header>

      <!-- Filtres -->
      <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div class="flex flex-wrap gap-4 items-end">
          <div>
            <label class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Bande</label>
            <select class="form-select" [(ngModel)]="filtreBande" (ngModelChange)="onFilterChange()">
              <option value="">Toutes les bandes</option>
              <option value="b1">Bande A</option>
              <option value="b2">Bande B</option>
              <option value="b3">Bande C</option>
            </select>
          </div>
          <div>
            <label class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">État</label>
            <select class="form-select" [(ngModel)]="filtreEtat" (ngModelChange)="onFilterChange()">
              <option value="">Tous les états</option>
              <option value="Actif">Actif</option>
              <option value="En gestation">En gestation</option>
              <option value="En allaitement">En allaitement</option>
              <option value="Au repos">Au repos</option>
              <option value="Réformé">Réformé</option>
              <option value="Mort">Décédé</option>
            </select>
          </div>
          <div class="ml-auto text-sm text-slate-500">
            {{ filteredFemelles().length }} femelle(s) trouvée(s)
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
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left cursor-pointer select-none" (click)="sortBy('bandeId')">
                  Bande <mat-icon *ngIf="sortCol === 'bandeId'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center cursor-pointer select-none" (click)="sortBy('portees')">
                  Portées <mat-icon *ngIf="sortCol === 'portees'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center cursor-pointer select-none" (click)="sortBy('tailleMoyenne')">
                  Taille moy. <mat-icon *ngIf="sortCol === 'tailleMoyenne'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center cursor-pointer select-none" (click)="sortBy('survie')">
                  Survie % <mat-icon *ngIf="sortCol === 'survie'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-center cursor-pointer select-none" (click)="sortBy('cages')">
                  Cages occupées <mat-icon *ngIf="sortCol === 'cages'" style="font-size:14px;width:14px;height:14px;vertical-align:middle;">{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </th>
                <th class="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider bg-slate-50/50 border-b border-slate-200 text-left">État</th>
              </tr>
            </thead>
            <tbody>
              @if (filteredFemelles().length === 0) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td colspan="8" class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle text-center py-8 text-slate-400">Aucune femelle trouvée avec ces filtres.</td>
                </tr>
              } @else {
                <tr *ngFor="let f of filteredFemelles()" class="cursor-pointer hover:bg-slate-50/50 transition-colors" (click)="goToDetail(f.id)">
                  <td class="px-4 py-3 border-b border-slate-100 align-middle font-mono font-semibold text-slate-700">{{ f.id }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle font-semibold">{{ f.nom }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle">{{ f.bandeId || '—' }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle text-center">{{ f.portees }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle text-center">{{ f.tailleMoyenne }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle text-center">
                    <span [class]="getSurvieClass(f.survie)">{{ f.survie }}%</span>
                  </td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle text-center font-mono font-semibold">{{ f.cages }}</td>
                  <td class="px-4 py-3 text-slate-800 border-b border-slate-100 align-middle">
                    <span [class]="getEtatClass(f.etat)">{{ f.etat }}</span>
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
export class ListeFemellesComponent {
  private calcService = inject(CalculationService);
  private router = inject(Router);

  reproducteurs = toSignal(this.calcService.reproducteurs$);
  saillies = toSignal(this.calcService.saillies$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);

  filtreBande = '';
  filtreEtat = '';
  sortCol = 'id';
  sortDir: 'asc' | 'desc' = 'asc';

  // Version signal pour forcer le recalcul lors de changement de filtres
  private filterTrigger = signal(0);

  onFilterChange(): void {
    this.filterTrigger.update(v => v + 1);
  }

  filteredFemelles = computed<FemelleRow[]>(() => {
    this.filterTrigger(); // trigger réactif
    const repros = (this.reproducteurs() || []).filter(r => r.sexe === 'F');
    const sailliesList = this.saillies() || [];
    const mbList = this.misesBas() || [];
    const sevList = this.sevrages() || [];

    let rows: FemelleRow[] = repros.map(f => {
      // Calcul des stats pour chaque femelle
      const femellesMb = mbList.filter((m: any) => m.femelleId === f.id);
      const portees = femellesMb.length;
      const totalVivants = femellesMb.reduce((sum: number, m: any) => sum + (m.vivants || 0), 0);
      const tailleMoyenne = portees > 0 ? Math.round(totalVivants / portees) : 0;

      // Survie : sevrés / nés vivants
      let totalSevres = 0;
      let cages = 0;
      const config = this.calcService.config;
      const density = config.densiteParCage || 3;
      const totalVendus = this.calcService.ventes.reduce((sum: number, v: any) => sum + (v.vendus || 0), 0);

      // FIFO check helper for this specific list
      const isWeaningSold = (weaning: any): boolean => {
        const sortedSevrages = [...sevList].sort((a, b) => new Date(a.dateSevrage).getTime() - new Date(b.dateSevrage).getTime());
        const idx = sortedSevrages.findIndex(item => item.id === weaning.id);
        if (idx === -1) return false;
        let cumulativeSevres = 0;
        for (let i = 0; i <= idx; i++) {
          cumulativeSevres += sortedSevrages[i].sevres || 0;
        }
        return totalVendus >= cumulativeSevres;
      };

      for (const mb of femellesMb) {
        const sev = sevList.find((s: any) => s.miseBasId === mb.id);
        if (sev) {
          totalSevres += sev.sevres || 0;
          if (!isWeaningSold(sev)) {
            cages += Math.ceil((sev.sevres || 0) / density);
          }
        }
      }
      const survie = totalVivants > 0 ? Math.round((totalSevres / totalVivants) * 100) : 0;

      return {
        id: f.id,
        nom: f.nom || f.id,
        bandeId: f.bandeId || '',
        portees,
        tailleMoyenne,
        survie,
        cages,
        etat: f.etat || 'Actif'
      };
    });

    // Appliquer les filtres
    if (this.filtreBande) {
      rows = rows.filter(r => r.bandeId === this.filtreBande);
    }
    if (this.filtreEtat) {
      rows = rows.filter(r => r.etat === this.filtreEtat);
    }

    // Tri
    const col = this.sortCol as keyof FemelleRow;
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
      case 'En gestation': return `${base} bg-purple-100 text-purple-800`;
      case 'En allaitement': return `${base} bg-blue-100 text-blue-800`;
      case 'Réformé': return `${base} bg-amber-100 text-amber-800`;
      case 'Mort': return `${base} bg-red-100 text-red-800`;
      default: return `${base} bg-slate-100 text-slate-700`;
    }
  }

  getSurvieClass(survie: number): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    if (survie >= 90) return `${base} bg-emerald-100 text-emerald-800`;
    if (survie >= 75) return `${base} bg-amber-100 text-amber-800`;
    return `${base} bg-red-100 text-red-800`;
  }
}
