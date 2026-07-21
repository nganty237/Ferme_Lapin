import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, NotificationService, BandeService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-saillie',
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
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
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  bandes = toSignal(this.bandeService.bandes$);
  reproducteurs = toSignal(this.calcService.reproducteurs$);
  
  bandesDisponibles = computed(() => {
    return this.bandes() || [];
  });

  femellesActives = computed(() => {
    return (this.reproducteurs() || []).filter(r => r.sexe === 'F' && r.etat !== 'Mort' && r.etat !== 'Réformé');
  });

  malesActifs = computed(() => {
    return (this.reproducteurs() || []).filter(r => r.sexe === 'M' && r.etat === 'Actif');
  });

  modeSaisie = signal<'bande' | 'individuelle'>('bande');
  isSubmitting = signal<boolean>(false);
  dateActuelle = signal<Date>(new Date());

  formBande: FormGroup;
  formIndividuelle: FormGroup;

  get saillieForm(): FormGroup { return this.formBande; }
  get saillieIndivForm(): FormGroup { return this.formIndividuelle; }
  get calendrierPreview() { return this.sessionsSaillieBande; }

  previsions = computed(() => {
    const val = this.modeSaisie() === 'bande' ? this.formBande?.value : this.formIndividuelle?.value;
    if (!val || !val.dateSaillie) return null;

    const dateSaillie = new Date(val.dateSaillie);
    const datePalpation = new Date(dateSaillie);
    datePalpation.setDate(datePalpation.getDate() + 15);

    const dateMiseBas = new Date(dateSaillie);
    dateMiseBas.setDate(dateMiseBas.getDate() + 31);

    const dateSevrage = new Date(dateMiseBas);
    dateSevrage.setDate(dateSevrage.getDate() + 31);

    return {
      datePalpation,
      dateMiseBas,
      dateSevrage
    };
  });

  sessionsSaillieBande = computed(() => {
    const bandeId = this.formBande?.get('bandeId')?.value || this.formBande?.get('bande')?.value;
    const dateSaillie = this.formBande?.get('dateSaillie')?.value || this.formBande?.get('date')?.value;
    if (!bandeId || !dateSaillie) return [];
    return this.bandeService.getCalendrierSaillie(bandeId, new Date(dateSaillie));
  });

  constructor() {
    this.formBande = this.fb.group({
      bandeId: ['bande-a', Validators.required],
      bande: ['bande-a'],
      dateSaillie: [new Date(), Validators.required],
      date: [new Date()],
      notes: [''],
      observations: ['']
    });

    this.formIndividuelle = this.fb.group({
      femelleId: ['', Validators.required],
      maleId: ['', Validators.required],
      dateSaillie: [new Date(), Validators.required],
      date: [new Date()],
      notes: [''],
      observations: ['']
    });
  }

  onSubmitBande(): void {
    if (this.formBande.invalid) {
      this.notifier.error('Veuillez remplir correctement les champs.');
      return;
    }
    this.isSubmitting.set(true);

    try {
      const { bandeId, dateSaillie } = this.formBande.value;
      const actualBande = bandeId || this.formBande.value.bande;
      const actualDate = dateSaillie || this.formBande.value.date;
      this.bandeService.demarrerSaillie(actualBande, new Date(actualDate));

      const sessions = this.sessionsSaillieBande();
      sessions.forEach(sess => {
        this.calcService.addSaillie({
          id: sess.id,
          femelleId: sess.femelleId,
          maleId: sess.maleId,
          dateSaillie: sess.dateSaillie,
          dateMiseBasPrevue: new Date(new Date(sess.dateSaillie).getTime() + 31 * 86400000).toISOString()
        });
      });

      this.notifier.success(`Session de saillie lancée pour la ${actualBande} avec ${sessions.length} saillies planifiées.`);
      this.onReset();
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onSubmitIndividuelle(): void {
    this.onSubmitIndiv();
  }

  onSubmitIndiv(): void {
    if (this.formIndividuelle.invalid) {
      this.notifier.error('Veuillez remplir correctement les champs.');
      return;
    }
    this.isSubmitting.set(true);

    try {
      const { femelleId, maleId, dateSaillie, date } = this.formIndividuelle.value;
      const actualDate = dateSaillie || date;
      const mbPrevue = new Date(actualDate);
      mbPrevue.setDate(mbPrevue.getDate() + 31);

      this.calcService.addSaillie({
        id: `sal_${Date.now()}_${femelleId}`,
        femelleId,
        maleId,
        dateSaillie: new Date(actualDate).toISOString(),
        dateMiseBasPrevue: mbPrevue.toISOString()
      });

      this.notifier.success('Saillie individuelle enregistrée avec succès.');
      this.formIndividuelle.reset({ dateSaillie: new Date(), date: new Date() });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    this.formBande.reset({ bandeId: 'bande-a', bande: 'bande-a', dateSaillie: new Date(), date: new Date(), notes: '' });
  }
}