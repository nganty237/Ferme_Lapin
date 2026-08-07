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
  nbEnAllaitement: number;
  statutLabel: string;
  estEligiblePalpation: boolean;
  estEnAllaitement: boolean;
  toutPalpe: boolean;
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
  uniquementAPalper = signal<boolean>(true); // Activé par défaut pour cibler directement la bande éligible
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
      
      const nbEnAllaitement = femellesBande.filter(f => f.etat === 'En allaitement').length;
      const nbGestantes = femellesBande.filter(f => f.etat === 'En gestation').length;
      const nbAuRepos = femellesBande.filter(f => f.etat === 'Au repos').length;

      const palpationsBande = allPalpations.filter(p => p.bandeId === b.id);

      // Une bande est en allaitement/post-gestation si sa phase est Allaitement ou si au moins la moitié des femelles sont en allaitement
      const estEnAllaitement = b.phase === 'Allaitement' || (femellesBande.length > 0 && nbEnAllaitement >= Math.ceil(femellesBande.length / 2));

      const sailliesBande = allSaillies.filter(s => s.bandeId === b.id);
      const pendings = sailliesBande.filter(s => !allPalpations.some(p => p.saillieId === s.id || p.femelleId === s.femelleId));
      const nbPalpationsAttente = pendings.length;

      // Palpation déjà complètement effectuée si toutes les lapines sont en gestation/allaitement ou palpations enregistrées
      const toutPalpe = totalFemelles > 0 && (
        (palpationsBande.length >= totalFemelles && nbGestantes > 0) ||
        estEnAllaitement
      );

      const estEnPhaseSaillieOuGestation = b.phase === 'Saillie' || b.phase === 'Gestation';
      const estEnRepos = b.phase === 'Repos' || b.phase === 'Sexage' || b.phase === 'Engraissement';

      // Une bande au repos n'est PAS éligible à la palpation car les saillies n'ont pas encore eu lieu.
      // Seule une bande en phase Saillie ou Gestation (ou ayant des saillies actives en attente) est éligible.
      const estEligiblePalpation = !estEnAllaitement && !toutPalpe && !estEnRepos && (estEnPhaseSaillieOuGestation || nbPalpationsAttente > 0);

      let statutLabel = '';
      if (estEnAllaitement) {
        statutLabel = `En allaitement (${totalFemelles} lapines) — Mises-bas effectuées`;
      } else if (toutPalpe) {
        statutLabel = `Palpation terminée (${nbGestantes}/${totalFemelles} Gestantes)`;
      } else if (estEnPhaseSaillieOuGestation || estEligiblePalpation) {
        statutLabel = `${totalFemelles} femelles — À palper (Phase ${b.phase})`;
      } else {
        statutLabel = `Au repos (${totalFemelles} lapines) — Non saillies`;
      }

      return {
        id: b.id,
        nom: b.nom,
        phase: b.phase,
        totalFemelles,
        nbPalpationsAttente,
        nbGestantes,
        nbAuRepos,
        nbEnAllaitement,
        statutLabel,
        estEligiblePalpation,
        estEnAllaitement,
        toutPalpe
      };
    });
  });

  private findCandidateBande(statusList: BandeStatutPalpation[]): BandeStatutPalpation | undefined {
    if (!statusList || statusList.length === 0) return undefined;

    // 1. Chercher d'abord une bande explicitement éligible à la palpation
    const eligible = statusList.find(b => b.estEligiblePalpation);
    if (eligible) return eligible;

    // 2. Si la bande A (ou autre) est en Allaitement / Palpée, déterminer la SUIVANTE dans la rotation (A -> B -> C -> A)
    const order = ['bande-a', 'bande-b', 'bande-c'];
    const lastActiveIndex = statusList.findIndex(b => b.estEnAllaitement || b.toutPalpe || b.phase === 'Allaitement');
    if (lastActiveIndex !== -1) {
      const nextId = order[(lastActiveIndex + 1) % order.length];
      const nextBande = statusList.find(b => b.id === nextId);
      if (nextBande) return nextBande;
    }

    // 3. Fallback: Première bande non en allaitement
    const nonAllaitement = statusList.find(b => !b.estEnAllaitement);
    return nonAllaitement || statusList[0];
  }

  prochaineBandeAPalper = computed(() => {
    const list = this.bandesAvecStatut();
    const candidate = this.findCandidateBande(list);
    if (candidate && candidate.id !== this.selectedBandeId()) {
      return candidate;
    }
    return null;
  });

  bandesDisponibles = computed(() => {
    const list = this.bandesAvecStatut();
    if (this.uniquementAPalper()) {
      return list.filter(b => b.estEligiblePalpation);
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

    const selectedStatut = this.selectedBandeStatut();
    if (!selectedStatut?.estEligiblePalpation) {
      return [];
    }

    const allSaillies   = this.saillies()      || [];
    const allPalpations = this.palpations()    || [];
    const repros        = this.reproducteurs() || [];

    // ── 1. Femelles actives de la bande ────────────────────────────────────
    const femellesBande = repros.filter(r =>
      r.sexe === 'F' &&
      r.bandeId === selectedBande &&
      r.etat !== 'Morte' &&
      r.etat !== 'Réformée' &&
      r.etat !== 'En allaitement'
    );
    if (femellesBande.length === 0) return [];

    // ── 2. Saillies de la bande — triées du plus récent au plus ancien ──────
    const sailliesBande = [...allSaillies.filter(s => s.bandeId === selectedBande)]
      .sort((a, b) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime());

    // ── 3. Déduplication : une seule entrée par femelle (la plus récente) ───
    const seenFemelles = new Set<string>();
    const sailliesDeduped: typeof sailliesBande = [];
    for (const s of sailliesBande) {
      if (!seenFemelles.has(s.femelleId)) {
        seenFemelles.add(s.femelleId);
        sailliesDeduped.push(s);
      }
    }

    // ── 4. Compléter avec le calendrier statique pour les femelles absentes ─
    const staticSaillies = this.bandeService.getCalendrierSaillie(selectedBande, new Date());
    for (const st of staticSaillies) {
      if (!seenFemelles.has(st.femelleId)) {
        seenFemelles.add(st.femelleId);
        sailliesDeduped.push(st);
      }
    }

    // ── 5. Filtrage final ────────────────────────────────────────────────────
    return sailliesDeduped.filter(s => {
      const repro = repros.find(r => r.id === s.femelleId);
      // Exclure les femelles inactives
      if (!repro || repro.etat === 'Morte' || repro.etat === 'Réformée' || repro.etat === 'En allaitement') return false;

      // Exclure si une palpation existe POUR CETTE SAILLIE (par id)
      // OU si une palpation a été enregistrée APRÈS la date de saillie (évite la pollution inter-cycles)
      const dejaPalpee = allPalpations.some(p =>
        p.bandeId === selectedBande && (
          p.saillieId === s.id ||
          (p.femelleId === s.femelleId &&
           new Date(p.datePalpation) >= new Date(s.dateSaillie))
        )
      );
      return !dejaPalpee;
    });
  });

  constructor() {
    this.form = this.fb.group({
      bandeId: ['bande-a', Validators.required],
      bande: ['bande-a'],
      datePalpation: [new Date(), Validators.required],
      palpationsArray: this.fb.array([])
    });

    // Auto-détection et pré-sélection intelligente de la bande suivante à palper au chargement initial
    let initialized = false;
    effect(() => {
      const statusList = this.bandesAvecStatut();
      if (!initialized && statusList.length > 0) {
        initialized = true;
        const candidate = this.findCandidateBande(statusList);
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
    const nextVal = !this.uniquementAPalper();
    this.uniquementAPalper.set(nextVal);
    const avail = this.bandesDisponibles();
    if (nextVal && avail.length > 0 && !avail.some(b => b.id === this.selectedBandeId())) {
      this.onBandeChange(avail[0].id);
    }
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


