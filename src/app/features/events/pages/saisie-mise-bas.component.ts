import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService, NotificationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-mise-bas',
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule
  ],
  templateUrl: './saisie-mise-bas.component.html',
  styleUrl: './saisie-mise-bas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisieMiseBasComponent {
  private fb = inject(FormBuilder);
  private calcService = inject(CalculationService);
  private bandeService = inject(BandeService);
  private notifier = inject(NotificationService);

  bandes = toSignal(this.bandeService.bandes$);
  saillies = toSignal(this.calcService.saillies$);
  misesBas = toSignal(this.calcService.misesBas$);
  palpations = toSignal(this.calcService.palpations$);
  reproducteurs = toSignal(this.calcService.reproducteurs$);

  form: FormGroup;
  get miseBasForm(): FormGroup { return this.form; }

  selectedBandeId = signal<string>('bande-a');
  bandeSelectionnee = this.selectedBandeId;
  bandesDisponibles = computed(() => this.bandes() || []);
  selectedBande = computed(() => (this.bandes() || []).find(b => b.id === this.selectedBandeId()));
  isSubmitting = signal<boolean>(false);

  /**
   * Statut et indicateurs détaillés de mise-bas pour chaque bande
   */
  bandesAvecStatut = computed(() => {
    const allBandes = this.bandes() || [];
    const allRepros = this.reproducteurs() || [];

    return allBandes.map(b => {
      const femellesBande = allRepros.filter(r => r.sexe === 'F' && r.bandeId === b.id && r.etat !== 'Morte' && r.etat !== 'Réformée');
      const totalFemelles = femellesBande.length || 11;
      const estEnPhaseAttente = b.phase === 'Gestation';

      let statutLabel = '';
      if (estEnPhaseAttente) {
        statutLabel = `Phase ${b.phase} — ${totalFemelles} lapines prêtes`;
      } else {
        statutLabel = `Phase ${b.phase} (${totalFemelles} lapines)`;
      }

      return {
        ...b,
        totalFemelles,
        statutLabel,
        estEligible: estEnPhaseAttente
      };
    });
  });

  /**
   * Filtrage et préparation des femelles en gestation de la bande sélectionnée pour la mise-bas
   */
  sailliesEligibles = computed(() => {
    const bandeId = this.selectedBandeId() as any;
    if (!bandeId) return [];

    const allSaillies = this.saillies() || [];
    const repros = this.reproducteurs() || [];

    const femellesBande = repros.filter(r => r.sexe === 'F' && r.bandeId === bandeId && (r.etat === 'En gestation' || r.etat === 'Au repos'));
    const staticSaillies = this.bandeService.getCalendrierSaillie(bandeId, new Date());

    let listForBande = allSaillies.filter(s => s.bandeId === bandeId);

    if (listForBande.length < femellesBande.length && staticSaillies.length > 0) {
      staticSaillies.forEach(st => {
        if (!listForBande.some(s => s.femelleId === st.femelleId)) {
          listForBande.push(st);
        }
      });
    }

    if (listForBande.length === 0 && staticSaillies.length > 0) {
      listForBande = staticSaillies;
    }

    return listForBande.filter(s => {
      const repro = repros.find(r => r.id === s.femelleId);
      if (repro && (repro.etat === 'Morte' || repro.etat === 'Réformée')) return false;
      return true;
    });
  });

  constructor() {
    this.form = this.fb.group({
      bandeId: ['bande-a', Validators.required],
      bande: ['bande-a'],
      dateMiseBas: [new Date(), Validators.required],
      portees: this.fb.array([])
    });

    // Auto-détection et pré-sélection prioritaire de la bande en phase Gestation / Saillie / Allaitement
    effect(() => {
      const allBandes = this.bandes() || [];
      if (allBandes.length > 0) {
        const candidate = allBandes.find(b => b.phase === 'Gestation' || b.phase === 'Saillie' || b.phase === 'Allaitement');
        if (candidate && this.selectedBandeId() !== candidate.id) {
          this.selectedBandeId.set(candidate.id);
          this.form.patchValue({ bandeId: candidate.id, bande: candidate.id });
        }
      }
    }, { allowSignalWrites: true });

    // Synchronisation réactive auto des portées
    effect(() => {
      const eligibles = this.sailliesEligibles();
      this.updatePorteesForm(eligibles);
    });
  }

  get porteesArray(): FormArray {
    return this.form.get('portees') as FormArray;
  }

  get porteesFormArray(): FormArray {
    return this.porteesArray;
  }

  get femellesFormArray(): FormArray {
    return this.porteesArray;
  }

  sessionsGestation = computed(() => this.porteesArray.controls);

  getFemelleName(femelleId: string): string {
    return this.getNombreFemellesName(femelleId);
  }

  onBandeChange(bandeId: string): void {
    this.selectedBandeId.set(bandeId);
    this.form.patchValue({ bandeId, bande: bandeId });
  }

  private lastEligiblesHash = '';

  private updatePorteesForm(eligibles: any[]): void {
    const hash = eligibles.map(e => `${e.id}_${e.femelleId}`).join(',');
    if (this.lastEligiblesHash === hash && this.porteesArray.length === eligibles.length) {
      return;
    }
    this.lastEligiblesHash = hash;

    const allMB = this.misesBas() || [];

    this.porteesArray.clear();
    eligibles.forEach(s => {
      const existingMB = allMB.find(mb => mb.saillieId === s.id || mb.femelleId === s.femelleId);
      const vivantsVal = existingMB ? existingMB.vivants : 7;
      const mortsNesVal = existingMB ? existingMB.mortsNes : 0;
      const obsVal = (existingMB as any)?.observations || '';

      const group = this.fb.group({
        saillieId: [s.id],
        femelleId: [s.femelleId],
        dateSaillie: [s.dateSaillie],
        vivants: [vivantsVal, [Validators.required, Validators.min(0)]],
        mortsNes: [mortsNesVal, [Validators.required, Validators.min(0)]],
        observations: [obsVal]
      });
      this.porteesArray.push(group);
    });
  }

  getNombreFemellesName(femelleId: string): string {
    const repros = this.reproducteurs() || [];
    const f = repros.find(r => r.id === femelleId);
    return f ? `${f.nom} (${f.id})` : femelleId;
  }

  onSubmit(): void {
    if (this.form.invalid || this.porteesArray.length === 0) {
      this.notifier.error('Veuillez vérifier les informations du formulaire.');
      return;
    }
    this.isSubmitting.set(true);

    try {
      const val = this.form.value;
      const arrayValues = this.porteesArray.value;
      const rawDate = val.dateMiseBas;
      const dateIso = typeof rawDate === 'string' ? rawDate : new Date(rawDate).toISOString().substring(0, 10);

      const misesBasAEnregistrer = arrayValues.map((p: any) => {
        const vivants = Number(p.vivants) || 0;
        const mortsNes = Number(p.mortsNes) || 0;
        const total = vivants + mortsNes;
        const viabilite = total > 0 ? Math.round((vivants / total) * 100) : 0;
        const bande = (this.bandes() || []).find(b => b.id === val.bandeId);
        const saillie = (this.saillies() || []).find(s => s.id === p.saillieId);

        return {
          id: `mb_${Date.now()}_${p.femelleId}`,
          saillieId: p.saillieId,
          femelleId: p.femelleId,
          dateMiseBas: dateIso,
          vivants,
          mortsNes,
          nes: vivants + mortsNes,
          cycleId: saillie?.cycleId ?? `cycle-${val.bandeId}-${bande?.numeroCycle || 1}`,
          bandeId: val.bandeId,
          viabiliteCalculee: viabilite,
          observations: p.observations || ''
        };
      });

      this.bandeService.confirmerMiseBas(val.bandeId, misesBasAEnregistrer);
      this.notifier.success(`${misesBasAEnregistrer.length} mise(s)-bas enregistrée(s) avec succès pour la ${val.bandeId}. La bande est maintenant en Allaitement.`);
      this.onReset();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.form.reset({ bandeId: 'bande-a', dateMiseBas: todayStr });
    this.selectedBandeId.set('bande-a');
  }
}