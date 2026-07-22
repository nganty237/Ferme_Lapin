import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, ReferentielService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { isFemelle } from '@core/models';

interface FemelleRow {
  id: string;
  nom: string;
  bandeId: string;
  bandeLabel: string;
  maleResponsableId: string;
  portees: number;
  tailleMoyenne: number;
  survie: number;
  cages: number;
  etat: string;
}

@Component({
  selector: 'app-liste-femelles',
  imports: [FormsModule, PageHeaderComponent, MatIconModule, MatButtonModule, MatSelectModule],
  templateUrl: './liste-femelles.component.html',
  styleUrl: './liste-femelles.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListeFemellesComponent {
  private calcService = inject(CalculationService);
  private referentielService = inject(ReferentielService);
  private router = inject(Router);

  reproducteurs = toSignal(this.calcService.reproducteurs$);
  saillies = toSignal(this.calcService.saillies$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);

  filtreBande = '';
  filtreEtat = '';
  sortCol = 'id';
  sortDir: 'asc' | 'desc' = 'asc';

  private filterTrigger = signal(0);

  onFilterChange(): void {
    this.filterTrigger.update(v => v + 1);
  }

  filteredFemelles = computed<FemelleRow[]>(() => {
    this.filterTrigger();
    const repros = (this.reproducteurs() || []).filter(isFemelle);
    const mbList = this.misesBas() || [];
    const sevList = this.sevrages() || [];

    let rows: FemelleRow[] = repros.map(f => {
      const femellesMb = mbList.filter((m: any) => m.femelleId === f.id);
      const portees = femellesMb.length;
      const totalVivants = femellesMb.reduce((sum: number, m: any) => sum + (m.vivants || 0), 0);
      const tailleMoyenne = portees > 0 ? Math.round(totalVivants / portees) : 0;

      let totalSevres = 0;
      let cages = 0;
      const config = this.calcService.config;
      const density = config.densiteParCase || 3;
      const totalVendus = this.calcService.ventes.reduce((sum: number, v: any) => sum + (v.vendus || 0), 0);

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

      const maleResponsableId = f.maleResponsableId || this.referentielService.getMaleResponsable(f.id);
      const bandeId = f.bandeId || 'bande-a';
      const bandeLabel = bandeId === 'bande-a' ? 'Bande A' : bandeId === 'bande-b' ? 'Bande B' : 'Bande C';

      return {
        id: f.id,
        nom: f.nom || f.id,
        bandeId,
        bandeLabel,
        maleResponsableId,
        portees,
        tailleMoyenne,
        survie,
        cages,
        etat: f.etat || 'Au repos'
      };
    });

    if (this.filtreBande) {
      rows = rows.filter(r => r.bandeId === this.filtreBande);
    }
    if (this.filtreEtat) {
      rows = rows.filter(r => r.etat === this.filtreEtat);
    }

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
      case 'Au repos': return `${base} bg-emerald-100 text-emerald-800`;
      case 'En gestation': return `${base} bg-purple-100 text-purple-800`;
      case 'En allaitement': return `${base} bg-blue-100 text-blue-800`;
      case 'Réformée': return `${base} bg-amber-100 text-amber-800`;
      case 'Morte': return `${base} bg-red-100 text-red-800`;
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