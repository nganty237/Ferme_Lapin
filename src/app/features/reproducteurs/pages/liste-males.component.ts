import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

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