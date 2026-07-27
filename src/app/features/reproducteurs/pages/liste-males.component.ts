import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService, ReferentielService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { isMale, Bande } from '@core/models';

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
  imports: [FormsModule, PageHeaderComponent, MatIconModule, MatButtonModule],
  templateUrl: './liste-males.component.html',
  styleUrl: './liste-males.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListeMalesComponent {
  private calcService = inject(CalculationService);
  private bandeService = inject(BandeService);
  private referentielService = inject(ReferentielService);
  private router = inject(Router);

  reproducteurs = toSignal(this.calcService.reproducteurs$);
  sailliesList = toSignal(this.calcService.saillies$);
  misesBasList = toSignal(this.calcService.misesBas$);
  bandesList = toSignal(this.bandeService.bandes$);

  filtreEtat = '';
  sortCol = 'id';
  sortDir: 'asc' | 'desc' = 'asc';

  private filterTrigger = signal(0);

  onFilterChange(): void {
    this.filterTrigger.update(v => v + 1);
  }

  filteredMales = computed<MaleRow[]>(() => {
    this.filterTrigger();
    const repros = (this.reproducteurs() || []).filter(isMale);
    const saillies = this.sailliesList() || [];
    const misesBas = this.misesBasList() || [];
    const bandes = this.bandesList() || [];

    let rows: MaleRow[] = repros.map(m => {
      const explicitSaillies = saillies.filter((s: any) => s.maleId === m.id);

      // Synchronisation du nombre de saillies selon les bandes actives (Gestation / Saillie)
      const refBandes = this.referentielService.getReferentielBandes();
      const activeBandes = bandes.filter((b: Bande) => b.phase === 'Saillie' || b.phase === 'Gestation');

      let syncSailliesCount = 0;
      activeBandes.forEach((b: Bande) => {
        const refB = refBandes.find(rb => rb.id === b.id);
        if (refB) {
          const maleGroup = refB.groupesParMale.find(g => g.maleId === m.id);
          if (maleGroup) {
            syncSailliesCount += maleGroup.femellesIds.length;
          }
        }
      });

      const totalSaillies = Math.max(explicitSaillies.length, syncSailliesCount);

      const saillieIds = new Set(explicitSaillies.map((s: any) => s.id));
      const porteesProduites = misesBas.filter((mb: any) => saillieIds.has(mb.saillieId) || mb.maleId === m.id).length;

      return {
        id: m.id,
        nom: m.nom || m.id,
        bandeId: 'Toutes (A, B, C)',
        saillies: totalSaillies,
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
      case 'Au repos': return `${base} bg-slate-100 text-slate-700`;
      case 'Réformé':
      case 'Réformée': return `${base} bg-amber-100 text-amber-800`;
      case 'Mort': return `${base} bg-red-100 text-red-800`;
      default: return `${base} bg-slate-100 text-slate-700`;
    }
  }
}