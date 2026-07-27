import { ChangeDetectionStrategy, Component, inject, computed, signal, DestroyRef, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalculationService, NotificationService, BandeService, ReferentielService, BandeLifecycleService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { provideNativeDateAdapter } from '@angular/material/core';
import { BandeId, isFemelle, Configuration } from '@core/models';

@Component({
  selector: 'app-saisie-saillie',
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatButtonToggleModule
  ],
  templateUrl: './saisie-saillie.component.html',
  styleUrl: './saisie-saillie.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisieSaillieComponent {
  private calcService = inject(CalculationService);
  private bandeService = inject(BandeService);
  private referentielService = inject(ReferentielService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  bandes = toSignal(this.bandeService.bandes$);
  reproducteurs = toSignal(this.calcService.reproducteurs$);
  config = toSignal(this.calcService.config$);
  
  bandesDisponibles = computed(() => {
    return this.bandes() || [];
  });

  bandeEnGestationActive = computed(() => {
    const list = this.bandes() || [];
    return list.find(b => b.phase === 'Gestation' || b.phase === 'Saillie');
  });

  validationSaillieBande = computed(() => {
    const bId = this.selectedBandeId();
    const allBandes = this.bandes() || [];
    const currentBande = allBandes.find(b => b.id === bId);
    const gestatingBande = this.bandeEnGestationActive();

    if (!currentBande) {
      return { autorise: false, raison: 'Aucune bande sélectionnée.' };
    }

    // Règle 1 : La bande sélectionnée ne doit pas déjà être en gestation/saillie
    if (currentBande.phase === 'Gestation' || currentBande.phase === 'Saillie') {
      return {
        autorise: false,
        raison: `La ${currentBande.nom} est déjà actuellement en phase ${currentBande.phase}. Impossible de la saillir à nouveau tant que les mises-bas n'ont pas eu lieu.`
      };
    }

    // Règle 2 : Aucune autre bande ne doit être en gestation (exclusivité du cycle 3-bandes)
    if (gestatingBande && gestatingBande.id !== bId) {
      return {
        autorise: false,
        raison: `Saillie bloquée : la ${gestatingBande.nom} est actuellement en cours de Gestation/Saillie. Dans la rotation cunicole à 3 bandes, une seule bande peut être en gestation à la fois.`
      };
    }

    return { autorise: true, raison: '' };
  });

  bandesAvecValidation = computed(() => {
    const list = this.bandes() || [];
    const gestatingBande = this.bandeEnGestationActive();

    return list.map(b => {
      const estEnGestation = b.phase === 'Gestation' || b.phase === 'Saillie';
      const conflitAutreBande = gestatingBande && gestatingBande.id !== b.id;
      const bloque = estEnGestation || conflitAutreBande;

      let motifBloquant = '';
      if (estEnGestation) {
        motifBloquant = `Déjà en ${b.phase}`;
      } else if (conflitAutreBande) {
        motifBloquant = `Indisponible (${gestatingBande.nom} en Gestation)`;
      }

      return {
        ...b,
        bloque,
        motifBloquant
      };
    });
  });

  femellesActives = computed(() => {
    return (this.reproducteurs() || []).filter(isFemelle).filter(r => r.etat !== 'Morte' && r.etat !== 'Réformée');
  });

  selectedFemelleId = signal<string>('');

  femellesAvecValidation = computed(() => {
    const repros = (this.reproducteurs() || []).filter(isFemelle).filter(r => r.etat !== 'Morte' && r.etat !== 'Réformée');
    const allBandes = this.bandes() || [];
    const gestatingBande = this.bandeEnGestationActive();

    return repros.map(f => {
      const bId = f.bandeId || 'bande-a';
      const targetBande = allBandes.find(b => b.id === bId);
      const estEnGestation = targetBande && (targetBande.phase === 'Gestation' || targetBande.phase === 'Saillie');
      const conflitAutreBande = gestatingBande && gestatingBande.id !== bId;
      const bloque = estEnGestation || conflitAutreBande;

      let motifBloquant = '';
      if (estEnGestation) {
        motifBloquant = `Sa bande (${targetBande?.nom}) est en ${targetBande?.phase}`;
      } else if (conflitAutreBande) {
        motifBloquant = `Indisponible (${gestatingBande.nom} en Gestation)`;
      }

      return {
        ...f,
        bloque,
        motifBloquant
      };
    });
  });

  validationSaillieIndividuelle = computed(() => {
    const fId = this.selectedFemelleId();
    if (!fId) return { autorise: true, raison: '' };

    const female = (this.reproducteurs() || []).find(r => r.id === fId);
    if (!female) return { autorise: true, raison: '' };

    const allBandes = this.bandes() || [];
    const bId = ('bandeId' in female) ? (female as any).bandeId : 'bande-a';
    const targetBande = allBandes.find(b => b.id === bId);
    const gestatingBande = this.bandeEnGestationActive();

    if (targetBande && (targetBande.phase === 'Gestation' || targetBande.phase === 'Saillie')) {
      return {
        autorise: false,
        raison: `Impossible de saillir la femelle ${female.id} : sa bande (${targetBande.nom}) est déjà actuellement en phase ${targetBande.phase}.`
      };
    }

    if (gestatingBande && gestatingBande.id !== bId) {
      return {
        autorise: false,
        raison: `Saillie bloquée : la ${gestatingBande.nom} est actuellement en cours de Gestation/Saillie. Dans la rotation cunicole à 3 bandes, aucune lapine de la ${targetBande?.nom || bId} ne peut être saillie tant que la gestation en cours n'est pas terminée.`
      };
    }

    return { autorise: true, raison: '' };
  });

  malesActifs = computed(() => {
    return (this.reproducteurs() || []).filter(r => r.sexe === 'M' && r.etat === 'Actif');
  });

  isSubmitting = signal<boolean>(false);
  dateActuelle = signal<Date>(new Date());
  selectedFemelleMaleResponsable = signal<string>('');

  // Mode de saisie : 'bande' (1-Clic par bande) ou 'individuel'
  modeSaisie = signal<'bande' | 'individuel'>('bande');
  selectedBandeId = signal<BandeId>('bande-b');
  dateSaillieBande = signal<string>(new Date().toISOString().substring(0, 10));

  planSaillieBande = computed(() => {
    const bId = this.selectedBandeId();
    if (!bId) return [];
    const refBandes = this.referentielService.getReferentielBandes();
    const refB = refBandes.find(b => b.id === bId);
    if (!refB) return [];

    const result: { maleId: string; femelleId: string; femelleNom: string }[] = [];
    const repros = this.reproducteurs() || [];

    refB.groupesParMale.forEach(grp => {
      grp.femellesIds.forEach(fId => {
        const repro = repros.find(r => r.id === fId);
        if (!repro || (repro.etat !== 'Morte' && repro.etat !== 'Réformée')) {
          result.push({
            maleId: grp.maleId,
            femelleId: fId,
            femelleNom: repro ? repro.nom : fId
          });
        }
      });
    });

    return result;
  });

  formIndividuelle: FormGroup;

  get saillieIndivForm(): FormGroup { return this.formIndividuelle; }

  previsions = computed(() => {
    const isBandeMode = this.modeSaisie() === 'bande';
    const rawDate = isBandeMode ? this.dateSaillieBande() : (this.formIndividuelle?.value?.dateSaillie || this.formIndividuelle?.value?.date);
    if (!rawDate) return null;

    const dateSaillie = new Date(rawDate);
    if (isNaN(dateSaillie.getTime())) return null;

    const cfg = this.config();
    const palp = cfg?.jourPalpation ?? 15;
    const gest = cfg?.dureeGestationJours ?? 31;
    const all = cfg?.dureeAllaitementMaxJours ?? 35;

    const datePalpation = new Date(dateSaillie);
    datePalpation.setDate(datePalpation.getDate() + palp);

    const dateMiseBas = new Date(dateSaillie);
    dateMiseBas.setDate(dateMiseBas.getDate() + gest);

    const dateSevrage = new Date(dateMiseBas);
    dateSevrage.setDate(dateSevrage.getDate() + all);

    return {
      dateSaillie,
      datePalpation,
      dateMiseBas,
      dateSevrage
    };
  });

  private lifecycleService = inject(BandeLifecycleService);

  constructor() {
    const todayStr = new Date().toISOString().substring(0, 10);

    this.formIndividuelle = this.fb.group({
      bandeId: ['bande-b', Validators.required],
      femelleId: ['', Validators.required],
      maleId: ['', Validators.required],
      dateSaillie: [todayStr, Validators.required],
      date: [todayStr],
      moment: ['Matin', Validators.required]
    });

    // Détection réactive intelligente de la prochaine bande déverrouillée et prête dans la rotation cunicole
    effect(() => {
      const allBandes = this.bandes() || [];
      if (allBandes.length > 0) {
        const prochaine = this.lifecycleService.getProchaineBandeASaillir(allBandes);
        if (prochaine && this.selectedBandeId() !== prochaine.id) {
          this.selectedBandeId.set(prochaine.id);
          this.formIndividuelle.patchValue({ bandeId: prochaine.id });
        }
      }
    }, { allowSignalWrites: true });

    this.formIndividuelle.get('femelleId')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(femelleId => {
        if (femelleId) {
          const maleId = this.referentielService.getMaleResponsable(femelleId);
          this.formIndividuelle.get('maleId')?.setValue(maleId);
          this.selectedFemelleMaleResponsable.set(maleId);
        } else {
          this.formIndividuelle.get('maleId')?.setValue('');
          this.selectedFemelleMaleResponsable.set('');
        }
      });
  }

  onLancerSaillieBande(): void {
    const val = this.validationSaillieBande();
    if (!val.autorise) {
      this.notifier.error(val.raison);
      return;
    }

    const bId = this.selectedBandeId();
    if (!bId) {
      this.notifier.error('Veuillez sélectionner une bande.');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const dateDebut = new Date(this.dateSaillieBande());
      const nbFemelles = this.planSaillieBande().length;
      this.bandeService.demarrerCycle(bId, dateDebut);
      this.notifier.success(`Saillie globale enregistrée en 1 clic pour la ${bId.toUpperCase()} (${nbFemelles} lapines saillies avec leurs mâles responsables !).`);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onSubmitIndividuelle(): void {
    this.onSubmitIndiv();
  }

  onSubmitIndiv(): void {
    if (this.formIndividuelle.invalid && !this.formIndividuelle.get('maleId')?.value) {
      this.notifier.error('Veuillez remplir correctement la femelle.');
      return;
    }

    const { femelleId } = this.formIndividuelle.value;
    const female = (this.reproducteurs() || []).find(r => r.id === femelleId);
    const bId = (female && isFemelle(female)) ? female.bandeId : 'bande-a';
    const targetBande = (this.bandes() || []).find(b => b.id === bId);
    const gestatingBande = this.bandeEnGestationActive();

    if (targetBande && (targetBande.phase === 'Gestation' || targetBande.phase === 'Saillie')) {
      this.notifier.error(`Impossible de saillir ${femelleId} : la ${targetBande.nom} est déjà en phase Gestation/Saillie.`);
      return;
    }

    if (gestatingBande && gestatingBande.id !== bId) {
      this.notifier.error(`Saillie bloquée : la ${gestatingBande.nom} est actuellement en cours de Gestation. Dans la rotation cunicole à 3 bandes, une seule bande peut être en gestation à la fois.`);
      return;
    }

    this.isSubmitting.set(true);

    try {
      const { femelleId, dateSaillie, date } = this.formIndividuelle.value;
      const maleId = this.formIndividuelle.get('maleId')?.value || this.referentielService.getMaleResponsable(femelleId);
      const actualDate = dateSaillie || date;
      const dSaillie = new Date(actualDate);

      const dPalpation = new Date(dSaillie);
      const jourPalpation = this.config()?.jourPalpation || 15;
      dPalpation.setDate(dPalpation.getDate() + jourPalpation);

      const dMiseBas = new Date(dSaillie);
      const dureeGestation = this.config()?.dureeGestationJours || 31;
      dMiseBas.setDate(dMiseBas.getDate() + dureeGestation);

      const female = (this.reproducteurs() || []).find(r => r.id === femelleId);
      const bId = (female && isFemelle(female)) ? female.bandeId : 'bande-a';
      const bande = (this.bandes() || []).find(b => b.id === bId);

      this.calcService.addSaillie({
        id: `sal_${Date.now()}_${femelleId}`,
        cycleId: `cycle-${bId}-${bande?.numeroCycle || 1}`,
        bandeId: bId,
        femelleId,
        maleId,
        dateSaillie: dSaillie.toISOString(),
        jourSaillie: 1,
        moment: 'Matin',
        datePalpationPrevue: dPalpation.toISOString(),
        dateMiseBasPrevue: dMiseBas.toISOString()
      });

      this.notifier.success(`Saillie individuelle enregistrée avec succès (Femelle ${femelleId} x Mâle ${maleId}).`);
      const todayStr = new Date().toISOString().substring(0, 10);
      this.formIndividuelle.reset({ dateSaillie: todayStr, date: todayStr });
      this.selectedFemelleMaleResponsable.set('');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.formIndividuelle.reset({ dateSaillie: todayStr, date: todayStr, notes: '', observations: '' });
    this.selectedFemelleMaleResponsable.set('');
  }
}