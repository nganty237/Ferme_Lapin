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
  bandes = toSignal(this.calcService.bandes$);

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
    const allBandes = this.bandes() || [];

    let rows: FemelleRow[] = repros.map(f => {
      const femellesMb = mbList.filter((m: any) => m.femelleId === f.id);
      const portees = femellesMb.length;
      const totalVivants = femellesMb.reduce((sum: number, m: any) => sum + (m.vivants || 0), 0);
      const tailleMoyenne = portees > 0 ? Math.round((totalVivants / portees) * 10) / 10 : 0;

      const config = this.calcService.config;
      const density = config.densiteParCase || 3;

      // P0-9 : ne vendre une portée que sur les sevrages de LA MÊME femelle.
      const femelleSevList = sevList
        .filter((s: any) => femellesMb.some(mb => mb.id === s.miseBasId))
        .sort((a, b) => new Date(a.dateSevrage).getTime() - new Date(b.dateSevrage).getTime());
      // Ventes attribuées à cette femelle (par bandeId femelle si dispo).
      const ventesFemelle = (this.calcService.ventes || []).filter((v: any) =>
        v.bandeId === (f.bandeId || 'bande-a')
      );
      const totalVendusFemelle = ventesFemelle.reduce((sum: number, v: any) => sum + (v.vendus || 0), 0);

      const isWeaningSold = (weaning: any): boolean => {
        const idx = femelleSevList.findIndex(item => item.id === weaning.id);
        if (idx === -1) return false;
        let cumulative = 0;
        for (let i = 0; i <= idx; i++) cumulative += femelleSevList[i].sevres || 0;
        return totalVendusFemelle >= cumulative;
      };

      // P0-8 : survie harmonisée sur portées sevrées uniquement (cohérent avec fiche-reproducteur).
      let totalSevres = 0;
      let porteesSevrees = 0;
      let cages = 0;
      for (const mb of femellesMb) {
        const sev = sevList.find((s: any) => s.miseBasId === mb.id);
        if (sev) {
          totalSevres += sev.sevres || 0;
          porteesSevrees++;
          if (!isWeaningSold(sev)) {
            cages += Math.ceil((sev.sevres || 0) / density);
          }
        }
      }
      const totalVivantsSevres = femellesMb
        .filter(mb => sevList.some(s => s.miseBasId === mb.id))
        .reduce((sum, m) => sum + (m.vivants || 0), 0);
      const survie = totalVivantsSevres > 0 ? Math.round((totalSevres / totalVivantsSevres) * 100) : 0;

      // IMPORTANT: on ignore f.bandeId et f.maleResponsableId (données potentiellement corrompues en LocalStorage)
      // On se base UNIQUEMENT sur le référentiel officiel pour garantir la structure correcte des bandes
      const maleResponsableId = this.referentielService.getMaleResponsable(f.id);
      const bandeId = this.referentielService.getBandeDeFemelle(f.id);
      const bandeLabel = bandeId === 'bande-a' ? 'Bande A' : bandeId === 'bande-b' ? 'Bande B' : 'Bande C';

      const bandeObj = allBandes.find((b: any) => b.id === bandeId);
      // Les états terminaux (Morte, Réformée) sont toujours prioritaires sur la phase de la bande
      let realEtat = f.etat || 'Au repos';
      if (realEtat !== 'Morte' && realEtat !== 'Réformée') {
        if (bandeObj) {
          switch (bandeObj.phase) {
            case 'Saillie':
            case 'Gestation':
              realEtat = 'En gestation';
              break;
            case 'Allaitement':
              realEtat = 'En allaitement';
              break;
            case 'Repos':
            case 'Sexage':
            case 'Engraissement':
              realEtat = 'Au repos';
              break;
          }
        }
      }

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
        etat: realEtat
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