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
    const found = list.find(r => r.id === id);
    if (!found) return undefined;

    if (found.sexe === 'F') {
      const bandeId = this.referentielService.getBandeDeFemelle(found.id);
      const bandeObj = (this.bandes() || []).find((b: any) => b.id === bandeId);
      let realEtat = found.etat || 'Au repos';
      if (bandeObj && bandeObj.phase === 'Repos') {
        realEtat = 'Au repos';
      }
      return { ...found, etat: realEtat as any };
    }
    return found;
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

  private referentielService = inject(ReferentielService);

  assignedMale = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return null;
    const allRepros = this.reproducteurs() || [];
    const maleId = (r as any).maleResponsableId || this.referentielService.getMaleResponsable(r.id);
    if (!maleId) return null;
    const maleObj = allRepros.find((m: any) => (m.id || '').toLowerCase() === maleId.toLowerCase());
    return maleObj ? { id: maleObj.id, nom: maleObj.nom || maleObj.id } : { id: maleId, nom: maleId };
  });

  femaleSaillies = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return [];
    const allSaillies = this.saillies() || [];
    const allRepros = this.reproducteurs() || [];
    const rIdLower = (r.id || '').toLowerCase();

    return allSaillies
      .filter((s: any) => s.femelleId && s.femelleId.toLowerCase() === rIdLower)
      .map((s: any) => {
        const male = allRepros.find((m: any) => (m.id || '').toLowerCase() === (s.maleId || '').toLowerCase());
        return {
          ...s,
          maleName: male ? (male.nom || male.id) : s.maleId
        };
      })
      .sort((a: any, b: any) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime());
  });

  femalePortees = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return [];
    const allMisesBas = this.misesBas() || [];
    const allSevrages = this.sevrages() || [];
    const rIdLower = (r.id || '').toLowerCase();

    return allMisesBas
      .filter((mb: any) => mb.femelleId && mb.femelleId.toLowerCase() === rIdLower)
      .map((mb: any) => {
        const sevrage = allSevrages.find((s: any) => s.miseBasId === mb.id || (s.femelleId && s.femelleId.toLowerCase() === rIdLower && s.cycleId === mb.cycleId));
        const vivants = mb.vivants !== undefined ? mb.vivants : (mb.nombreLapereaux !== undefined ? mb.nombreLapereaux : (mb.nes || 0));
        const mortsNes = mb.mortsNes !== undefined ? mb.mortsNes : 0;
        const total = vivants + mortsNes;
        const viabiliteCalculee = mb.viabiliteCalculee !== undefined ? mb.viabiliteCalculee : (total > 0 ? Math.round((vivants / total) * 100) : 100);

        return {
          ...mb,
          vivants,
          mortsNes,
          viabiliteCalculee,
          sevrageDate: sevrage ? sevrage.dateSevrage : null,
          sevrageSevres: sevrage ? (sevrage.sevres !== undefined ? sevrage.sevres : (sevrage as any).nombreLapereaux) : null,
          sevrageCages: sevrage ? sevrage.cagesOccupees : null
        };
      })
      .sort((a: any, b: any) => new Date(b.dateMiseBas).getTime() - new Date(a.dateMiseBas).getTime());
  });

  femaleKpis = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return null;

    const sailliesList = this.femaleSaillies();
    const porteesList = this.femalePortees();

    const totalSaillies = sailliesList.length;
    const sailliesReussies = Math.max(sailliesList.filter((s: any) => s.reussie).length, porteesList.length);
    const tauxReussiteSaillies = totalSaillies > 0 ? Math.round((sailliesReussies / totalSaillies) * 100) : (porteesList.length > 0 ? 100 : 0);

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

  gestationActiveInfo = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F' || r.etat !== 'En gestation') return null;
    const saillies = this.femaleSaillies();
    const assigned = this.assignedMale();
    const latestSaillie = saillies.length > 0 ? saillies[0] : null;
    
    const maleId = latestSaillie?.maleId || assigned?.id || 'M01';
    const maleName = latestSaillie?.maleName || assigned?.nom || maleId;
    const dateSaillie = latestSaillie?.dateSaillie;
    const dateMiseBasPrevue = latestSaillie?.dateMiseBasPrevue;
    
    let joursRestants: number | null = null;
    if (dateMiseBasPrevue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateMiseBasPrevue);
      target.setHours(0, 0, 0, 0);
      joursRestants = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 3600 * 24)));
    }

    return {
      maleId,
      maleName,
      dateSaillie,
      dateMiseBasPrevue,
      joursRestants
    };
  });

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
    const allBandes = this.bandes() || [];
    const rIdLower = (r.id || '').toLowerCase();

    const explicitList = allSaillies
      .filter((s: any) => s.maleId && s.maleId.toLowerCase() === rIdLower)
      .map((s: any) => {
        const female = allRepros.find((f: any) => (f.id || '').toLowerCase() === (s.femelleId || '').toLowerCase());
        const hasMiseBas = allMisesBas.some((mb: any) => mb.saillieId === s.id || (mb.femaleId && mb.femaleId.toLowerCase() === (s.femelleId || '').toLowerCase()));
        const reussieStatus = s.reussie !== undefined ? s.reussie : (hasMiseBas ? true : null);

        return {
          ...s,
          femaleName: female ? (female.nom || female.id) : s.femelleId,
          reussie: reussieStatus
        };
      });

    if (explicitList.length > 0) {
      return explicitList.sort((a: any, b: any) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime());
    }

    // Synchronisation dynamique si les saillies explicites ne sont pas encore enregistrées en base
    const fallbackList: any[] = [];
    const refBandes = this.referentielService.getReferentielBandes();
    const activeBandes = allBandes.filter((b: any) => b.phase === 'Saillie' || b.phase === 'Gestation');

    activeBandes.forEach((b: any) => {
      const refB = refBandes.find(rb => rb.id === b.id);
      if (refB) {
        const maleGroup = refB.groupesParMale.find(g => (g.maleId || '').toLowerCase() === rIdLower);
        if (maleGroup && maleGroup.femellesIds) {
          maleGroup.femellesIds.forEach((fId: string) => {
            const female = allRepros.find((f: any) => (f.id || '').toLowerCase() === fId.toLowerCase());
            const dateSaillieStr = b.dateDemarragePhase || new Date().toISOString().slice(0, 10);
            const dateSaillieVal = new Date(dateSaillieStr);
            const dateMBVal = new Date(dateSaillieVal);
            dateMBVal.setDate(dateMBVal.getDate() + 31);

            fallbackList.push({
              id: `sync-sal-${b.id}-${fId}`,
              bandeId: b.id,
              maleId: r.id,
              femelleId: fId,
              femaleName: female ? (female.nom || female.id) : fId,
              dateSaillie: dateSaillieStr,
              dateMiseBasPrevue: dateMBVal.toISOString().slice(0, 10),
              reussie: null // En attente
            });
          });
        }
      }
    });

    return fallbackList.sort((a: any, b: any) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime());
  });

  maleKpis = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'M') return null;

    const explicitSaillies = this.maleSaillies();
    
    // Synchronisation du nombre de saillies selon les bandes actives (Gestation / Saillie)
    const refBandes = this.referentielService.getReferentielBandes();
    const activeBandes = (this.bandes() || []).filter((b: any) => b.phase === 'Saillie' || b.phase === 'Gestation');

    let syncSailliesCount = 0;
    activeBandes.forEach((b: any) => {
      const refB = refBandes.find(rb => rb.id === b.id);
      if (refB) {
        const maleGroup = refB.groupesParMale.find(g => g.maleId === r.id);
        if (maleGroup) {
          syncSailliesCount += maleGroup.femellesIds.length;
        }
      }
    });

    const totalSaillies = Math.max(explicitSaillies.length, syncSailliesCount);
    const allMisesBas = this.misesBas() || [];
    const saillieIds = new Set(explicitSaillies.map((s: any) => s.id));
    const porteesProduites = allMisesBas.filter((mb: any) => saillieIds.has(mb.saillieId) || mb.maleId === r.id).length;

    const sailliesReussies = Math.min(totalSaillies, Math.max(explicitSaillies.filter((s: any) => s.reussie === true).length, porteesProduites));
    const tauxFertilite = totalSaillies > 0 ? Math.round((sailliesReussies / totalSaillies) * 100) : 100;

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
        this.calcService.updateReproducteur({ ...r, etat: 'Réformé' as any });
      }

      this.showDeleteConfirm = false;
      this.goBack();
    }
  }
}