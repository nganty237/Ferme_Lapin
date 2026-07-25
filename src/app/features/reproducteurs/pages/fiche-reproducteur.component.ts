import { ChangeDetectionStrategy, Component, inject, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, ReferentielService } from '@core/services';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StatsReproducteurComponent } from './components/stats-reproducteur.component';
import { ActionsReproducteurComponent } from './components/actions-reproducteur.component';
import { HistoriqueSailliesComponent } from './components/historique-saillies.component';

/**
 * Composant Orchestrateur de la Fiche Reproducteur.
 * Délègue l'affichage aux sous-composants : StatsReproducteurComponent, ActionsReproducteurComponent, HistoriqueSailliesComponent.
 */
@Component({
  selector: 'app-fiche-reproducteur',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    StatsReproducteurComponent,
    ActionsReproducteurComponent,
    HistoriqueSailliesComponent
  ],
  templateUrl: './fiche-reproducteur.component.html',
  styleUrl: './fiche-reproducteur.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FicheReproducteurComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private calcService = inject(CalculationService);
  private destroyRef = inject(DestroyRef);

  reproducteurId = signal<string>('');

  reproducteurs = toSignal(this.calcService.reproducteurs$);
  bandes = toSignal(this.calcService.bandes$);
  saillies = toSignal(this.calcService.saillies$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);
  deces = toSignal(this.calcService.deces$);

  isEditing = false;
  editNom = '';
  editNotes = '';
  showDeleteConfirm = false;

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.reproducteurId.set(id);
        }
      });
  }

  reproducteur = computed(() => {
    const id = this.reproducteurId();
    const list = this.reproducteurs() || [];
    return list.find(r => r.id === id);
  });

  bandName = computed(() => {
    const r = this.reproducteur();
    if (!r) return '';
    const bandeId = 'bandeId' in r ? (r as any).bandeId : '';
    if (!bandeId) return '';
    const bList = this.bandes() || [];
    const band = bList.find((b: any) => b.id === bandeId);
    return band ? band.nom : bandeId;
  });

  breederDeces = computed(() => {
    const r = this.reproducteur();
    if (!r) return null;
    const allDeces = this.deces() || [];
    return allDeces.find((d: any) => d.reproducteurId === r.id);
  });

  femaleSaillies = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return [];
    const allSaillies = this.saillies() || [];
    const allRepros = this.reproducteurs() || [];
    return allSaillies
      .filter((s: any) => s.femelleId === r.id)
      .map((s: any) => {
        const male = allRepros.find((m: any) => m.id === s.maleId);
        return {
          ...s,
          maleName: male ? male.nom : s.maleId
        };
      })
      .sort((a: any, b: any) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime());
  });

  femalePortees = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return [];
    const allMisesBas = this.misesBas() || [];
    const allSevrages = this.sevrages() || [];
    return allMisesBas
      .filter((mb: any) => mb.femelleId === r.id)
      .map((mb: any) => {
        const sevrage = allSevrages.find((s: any) => s.miseBasId === mb.id);
        return {
          ...mb,
          sevrageDate: sevrage ? sevrage.dateSevrage : null,
          sevrageSevres: sevrage ? sevrage.sevres : null,
          sevrageCages: sevrage ? sevrage.cagesOccupees : null
        };
      })
      .sort((a: any, b: any) => new Date(b.dateMiseBas).getTime() - new Date(a.dateMiseBas).getTime());
  });

  private referentielService = inject(ReferentielService);

  assignedFemales = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'M') return [];
    const allRepros = this.reproducteurs() || [];
    return allRepros.filter((f: any) => f.sexe === 'F' && (
      f.maleResponsableId === r.id || 
      this.referentielService.getMaleResponsable(f.id) === r.id
    ));
  });

  maleSaillies = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'M') return [];
    const allSaillies = this.saillies() || [];
    const allRepros = this.reproducteurs() || [];
    const allMisesBas = this.misesBas() || [];
    const rIdLower = r.id.toLowerCase();

    return allSaillies
      .filter((s: any) => s.maleId && s.maleId.toLowerCase() === rIdLower)
      .map((s: any) => {
        const female = allRepros.find((f: any) => f.id.toLowerCase() === (s.femelleId || '').toLowerCase());
        const hasMiseBas = allMisesBas.some((mb: any) => mb.saillieId === s.id);
        const reussieStatus = s.reussie !== undefined ? s.reussie : (hasMiseBas ? true : null);

        return {
          ...s,
          femaleName: female ? female.nom : s.femelleId,
          reussie: reussieStatus
        };
      })
      .sort((a: any, b: any) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime());
  });

  femaleKpis = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return null;

    const sailliesList = this.femaleSaillies();
    const porteesList = this.femalePortees();

    const totalSaillies = sailliesList.length;
    const sailliesReussies = sailliesList.filter((s: any) => s.reussie).length;
    const tauxReussiteSaillies = totalSaillies > 0 ? Math.round((sailliesReussies / totalSaillies) * 100) : 0;

    const totalPortees = porteesList.length;
    const totalVivants = porteesList.reduce((sum: number, mb: any) => sum + (mb.vivants || 0), 0);
    const tailleMoyennePortee = totalPortees > 0 ? Math.round((totalVivants / totalPortees) * 10) / 10 : 0;

    const totalSevres = porteesList.reduce((sum: number, mb: any) => sum + (mb.sevrageSevres || 0), 0);
    const totalVivantsPourSevrage = porteesList.filter((mb: any) => mb.sevrageSevres !== null).reduce((sum: number, mb: any) => sum + (mb.vivants || 0), 0);
    const tauxSurvieSevrage = totalVivantsPourSevrage > 0 ? Math.round((totalSevres / totalVivantsPourSevrage) * 100) : 0;

    return {
      totalSaillies,
      tauxReussiteSaillies,
      totalPortees,
      tailleMoyennePortee,
      tauxSurvieSevrage
    };
  });

  maleKpis = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'M') return null;

    const sailliesList = this.maleSaillies();
    const totalSaillies = sailliesList.length;
    const allMisesBas = this.misesBas() || [];
    const saillieIds = new Set(sailliesList.map((s: any) => s.id));
    const porteesProduites = allMisesBas.filter((mb: any) => saillieIds.has(mb.saillieId)).length;

    const sailliesReussies = sailliesList.filter((s: any) => s.reussie === true || saillieIds.has(s.id)).length;
    const tauxFertilite = totalSaillies > 0 ? Math.round((sailliesReussies / totalSaillies) * 100) : 0;

    return {
      totalSaillies,
      sailliesReussies,
      tauxFertilite,
      porteesProduites
    };
  });

  goBack(): void {
    const r = this.reproducteur();
    if (r) {
      if (r.sexe === 'F') {
        this.router.navigate(['/reproducteurs/femelles']);
      } else {
        this.router.navigate(['/reproducteurs/males']);
      }
    } else {
      this.location.back();
    }
  }

  getEtatClass(etat: string): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    switch (etat) {
      case 'Actif': return `${base} bg-emerald-100 text-emerald-800`;
      case 'En gestation': return `${base} bg-purple-100 text-purple-800`;
      case 'En allaitement': return `${base} bg-blue-100 text-blue-800`;
      case 'Au repos': return `${base} bg-slate-100 text-slate-700`;
      case 'Réformé':
      case 'Réformée': return `${base} bg-amber-100 text-amber-800`;
      case 'Mort': return `${base} bg-red-100 text-red-800`;
      default: return `${base} bg-slate-100 text-slate-700`;
    }
  }

  startEdit(): void {
    const r = this.reproducteur();
    if (r) {
      this.editNom = r.nom || '';
      this.editNotes = r.notes || '';
      this.isEditing = true;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  saveEdit(): void {
    const r = this.reproducteur();
    if (r) {
      const updated = {
        ...r,
        nom: this.editNom,
        notes: this.editNotes
      };
      this.calcService.updateReproducteur(updated);
      this.isEditing = false;
    }
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  performDelete(): void {
    const r = this.reproducteur();
    if (r) {
      if (r.sexe === 'F') {
        this.calcService.updateReproducteur({ ...r, etat: 'Réformée' });
      } else {
        this.calcService.updateReproducteur({ ...r, etat: 'Réformé' });
      }
      this.showDeleteConfirm = false;
      this.goBack();
    }
  }
}