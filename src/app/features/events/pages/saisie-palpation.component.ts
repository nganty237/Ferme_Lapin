import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService, NotificationService } from '@core/services';
import { BandeId } from '@core/models';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { provideNativeDateAdapter } from '@angular/material/core';

export interface BandeStatutPalpation {
  id: string;
  nom: string;
  phase: string;
  totalFemelles: number;
  nbPalpationsAttente: number;
  nbGestantes: number;
  nbAuRepos: number;
  statutLabel: string;
  estEligiblePalpation: boolean;
}

@Component({
  selector: 'app-saisie-palpation',
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
    MatDatepickerModule,
    MatRadioModule
  ],
  templateUrl: './saisie-palpation.component.html',
  styleUrl: './saisie-palpation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisiePalpationComponent {
  private fb = inject(FormBuilder);
  private calcService = inject(CalculationService);
  private bandeService = inject(BandeService);
  private notifier = inject(NotificationService);

  bandes = toSignal(this.bandeService.bandes$);
  saillies = toSignal(this.calcService.saillies$);
  palpations = toSignal(this.calcService.palpations$);
  reproducteurs = toSignal(this.calcService.reproducteurs$);

  form: FormGroup;
  get palpationForm(): FormGroup { return this.form; }

  selectedBandeId = signal<string>('bande-a');
  bandeSelectionnee = this.selectedBandeId;
  uniquementAPalper = signal<boolean>(true); // Activé par défaut pour cibler directement la bande en gestation
  isSubmitting = signal<boolean>(false);

  /**
   * Statut et indicateurs détaillés de palpation pour chaque bande
   */
  bandesAvecStatut = computed<BandeStatutPalpation[]>(() => {
    const allBandes = this.bandes() || [];
    const allSaillies = this.saillies() || [];
    const allPalpations = this.palpations() || [];
    const allRepros = this.reproducteurs() || [];

    return allBandes.map(b => {
      const femellesBande = allRepros.filter(r => r.sexe === 'F' && r.bandeId === b.id && r.etat !== 'Morte' && r.etat !== 'Réformée');
      const totalFemelles = femellesBande.length || 11;
      
      const sailliesBande = allSaillies.filter(s => s.bandeId === b.id);
      const pendings = sailliesBande.filter(s => !allPalpations.some(p => p.saillieId === s.id));
      const nbPalpationsAttente = pendings.length;
      
      const nbGestantes = femellesBande.filter(f => f.etat === 'En gestation').length;
      const nbAuRepos = femellesBande.filter(f => f.etat === 'Au repos').length;

      const estEnPhaseGestation = b.phase === 'Gestation' || b.phase === 'Saillie';
      const estEligiblePalpation = estEnPhaseGestation || nbPalpationsAttente > 0;

      let statutLabel = '';
      if (estEnPhaseGestation) {
        statutLabel = `${totalFemelles} femelles (Phase ${b.phase})`;
      } else {
        statutLabel = `Au repos (${totalFemelles} lapines)`;
      }

      return {
        id: b.id,
        nom: b.nom,
        phase: b.phase,
        totalFemelles,
        nbPalpationsAttente,
        nbGestantes,
        nbAuRepos,
        statutLabel,
        estEligiblePalpation
      };
    });
  });

  bandesDisponibles = computed(() => {
    const list = this.bandesAvecStatut();
    if (this.uniquementAPalper()) {
      const filtered = list.filter(b => b.estEligiblePalpation);
      return filtered.length > 0 ? filtered : list;
    }
    return list;
  });

  selectedBandeStatut = computed(() => {
    const id = this.selectedBandeId();
    return this.bandesAvecStatut().find(b => b.id === id);
  });

  sailliesAPalper = computed(() => {
    const selectedBande = this.selectedBandeId() as BandeId;
    if (!selectedBande) return [];

    const allSaillies = this.saillies() || [];
    const repros = this.reproducteurs() || [];

    const femellesBande = repros.filter(r => r.sexe === 'F' && r.bandeId === selectedBande && r.etat !== 'Morte' && r.etat !== 'Réformée');
    const staticSaillies = this.bandeService.getCalendrierSaillie(selectedBande, new Date());

    let listForBande = allSaillies.filter(s => s.bandeId === selectedBande);

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
      datePalpation: [new Date(), Validators.required],
      palpationsArray: this.fb.array([])
    });

    // Auto-détection et pré-sélection prioritaire au chargement initial uniquement
    let initialized = false;
    effect(() => {
      const statusList = this.bandesAvecStatut();
      if (!initialized && statusList.length > 0) {
        initialized = true;
        const candidate = statusList.find(b => b.phase === 'Gestation' || b.phase === 'Saillie' || b.estEligiblePalpation);
        if (candidate) {
          this.selectedBandeId.set(candidate.id);
          this.form.patchValue({ bandeId: candidate.id, bande: candidate.id });
        }
      }
    }, { allowSignalWrites: true });

    // Reconstruction réactive des champs de palpation dès que les saillies éligibles changent
    effect(() => {
      const saillies = this.sailliesAPalper();
      const allPalpations = this.palpations() || [];
      this.palpationsArray.clear();
      saillies.forEach(s => {
        const existingPalp = allPalpations.find(p => p.saillieId === s.id || p.femelleId === s.femelleId);
        const res = existingPalp ? existingPalp.resultat : 'Positive';
        const obs = existingPalp ? (existingPalp.observations || '') : '';

        const group = this.fb.group({
          saillieId: [s.id],
          femelleId: [s.femelleId],
          dateSaillie: [s.dateSaillie],
          resultat: [res, Validators.required],
          observations: [obs]
        });
        this.palpationsArray.push(group);
      });
    });
  }

  get palpationsArray(): FormArray {
    return this.form.get('palpationsArray') as FormArray;
  }

  get femellesFormArray(): FormArray {
    return this.palpationsArray;
  }

  sessionsBande = computed(() => this.palpationsArray.controls);

  onBandeChange(bandeId: string): void {
    this.selectedBandeId.set(bandeId);
    this.form.patchValue({ bandeId, bande: bandeId });
    this.initPalpationsForBande(bandeId);
  }

  toggleFiltreSeulementAPalper(): void {
    this.uniquementAPalper.update(v => !v);
  }

  private initPalpationsForBande(bandeId: string): void {
    this.palpationsArray.clear();
    const eligibles = this.sailliesAPalper();

    eligibles.forEach(s => {
      const group = this.fb.group({
        saillieId: [s.id],
        femelleId: [s.femelleId],
        dateSaillie: [s.dateSaillie],
        resultat: ['Positive', Validators.required],
        observations: ['']
      });
      this.palpationsArray.push(group);
    });
  }

  getFemelleName(femelleId: string): string {
    const repros = this.reproducteurs() || [];
    const f = repros.find(r => r.id === femelleId);
    return f ? `${f.nom} (${f.id})` : femelleId;
  }

  onSubmit(): void {
    if (this.form.invalid || this.palpationsArray.length === 0) {
      this.notifier.error('Veuillez vérifier le formulaire.');
      return;
    }
    this.isSubmitting.set(true);

    try {
      const val = this.form.value;
      const arrayValues = this.palpationsArray.value;
      const rawDate = val.datePalpation;
      const dateIso = typeof rawDate === 'string' ? rawDate : new Date(rawDate).toISOString().substring(0, 10);

      arrayValues.forEach((p: any) => {
        const bande = (this.bandes() || []).find(b => b.id === val.bandeId);
        this.bandeService.enregistrerPalpation({
          id: `palp_${Date.now()}_${p.femelleId}`,
          saillieId: p.saillieId,
          cycleId: `cycle-${val.bandeId}-${bande?.numeroCycle || 1}`,
          femelleId: p.femelleId,
          bandeId: val.bandeId,
          datePalpation: dateIso,
          resultat: p.resultat,
          observations: p.observations
        });

        if (p.resultat === 'Negative') {
          const dateReSaillie = new Date(dateIso);
          dateReSaillie.setDate(dateReSaillie.getDate() + 2);
          this.bandeService.replanifierSaillieFemelle(p.femelleId, val.bandeId as BandeId, dateReSaillie);
        }
      });

      // Passation explicite de la bande en phase Gestation
      this.bandeService.changerPhase(val.bandeId, 'Gestation');

      this.notifier.success(`${arrayValues.length} palpation(s) enregistrée(s). La ${val.bandeId.toUpperCase()} est maintenant en phase Gestation.`);
      this.initPalpationsForBande(val.bandeId);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    const defaultId = this.bandesDisponibles()[0]?.id || 'bande-a';
    this.form.reset({
      bandeId: defaultId,
      datePalpation: new Date()
    });
    this.selectedBandeId.set(defaultId);
    this.initPalpationsForBande(defaultId);
  }
}

