import { ChangeDetectionStrategy, Component, inject, computed, signal, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalculationService, NotificationService, BandeService, ReferentielService } from '@core/services';
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

  femellesActives = computed(() => {
    return (this.reproducteurs() || []).filter(isFemelle).filter(r => r.etat !== 'Morte' && r.etat !== 'Réformée');
  });

  malesActifs = computed(() => {
    return (this.reproducteurs() || []).filter(r => r.sexe === 'M' && r.etat === 'Actif');
  });

  isSubmitting = signal<boolean>(false);
  dateActuelle = signal<Date>(new Date());
  selectedFemelleMaleResponsable = signal<string>('');

  formIndividuelle: FormGroup;

  get saillieIndivForm(): FormGroup { return this.formIndividuelle; }

  previsions = computed(() => {
    const val = this.formIndividuelle?.value;
    const rawDate = val?.dateSaillie || val?.date;
    if (!rawDate) return null;

    const dateSaillie = new Date(rawDate);
    if (isNaN(dateSaillie.getTime())) return null;

    // Fix P0 #7 : durées issues de la configuration (au lieu de +15/+31/+31 hardcodés).
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

  constructor() {
    const todayStr = new Date().toISOString().substring(0, 10);

    this.formIndividuelle = this.fb.group({
      femelleId: ['', Validators.required],
      maleId: [{ value: '', disabled: true }, Validators.required],
      dateSaillie: [todayStr, Validators.required],
      date: [todayStr],
      notes: [''],
      observations: ['']
    });

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

  onSubmitIndividuelle(): void {
    this.onSubmitIndiv();
  }

  onSubmitIndiv(): void {
    if (this.formIndividuelle.invalid && !this.formIndividuelle.get('maleId')?.value) {
      this.notifier.error('Veuillez remplir correctement la femelle.');
      return;
    }
    this.isSubmitting.set(true);

    try {
      const { femelleId, dateSaillie, date } = this.formIndividuelle.value;
      const maleId = this.formIndividuelle.get('maleId')?.value || this.referentielService.getMaleResponsable(femelleId);
      const actualDate = dateSaillie || date;
      const dSaillie = new Date(actualDate);

      const dPalpation = new Date(dSaillie);
      dPalpation.setDate(dPalpation.getDate() + 15);

      const dMiseBas = new Date(dSaillie);
      dMiseBas.setDate(dMiseBas.getDate() + 31);

      const female = (this.reproducteurs() || []).find(r => r.id === femelleId);
      const bId = (female && isFemelle(female)) ? female.bandeId : 'bande-a';

      this.calcService.addSaillie({
        id: `sal_${Date.now()}_${femelleId}`,
        cycleId: `cycle-${bId}-1`,
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