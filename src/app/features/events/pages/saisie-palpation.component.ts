import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService, NotificationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-palpation',
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
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
  bandesDisponibles = computed(() => this.bandes() || []);
  isSubmitting = signal<boolean>(false);

  sailliesAPalper = computed(() => {
    const allSaillies = this.saillies() || [];
    const allPalpations = this.palpations() || [];

    return allSaillies.filter(s => {
      const hasPalpation = allPalpations.some(p => p.saillieId === s.id);
      return !hasPalpation;
    });
  });

  constructor() {
    this.form = this.fb.group({
      bandeId: ['bande-a', Validators.required],
      bande: ['bande-a'],
      datePalpation: [new Date(), Validators.required],
      palpationsArray: this.fb.array([])
    });

    this.initPalpationsForBande('bande-a');
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
    this.initPalpationsForBande(bandeId);
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

      arrayValues.forEach((p: any) => {
        this.bandeService.enregistrerPalpation({
          id: `palp_${Date.now()}_${p.femelleId}`,
          saillieId: p.saillieId,
          femelleId: p.femelleId,
          datePalpation: val.datePalpation,
          resultat: p.resultat,
          observations: p.observations
        });
      });

      this.notifier.success(`${arrayValues.length} palpation(s) enregistrée(s) avec succès.`);
      this.initPalpationsForBande(val.bandeId);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    this.form.reset({
      bandeId: 'bande-a',
      datePalpation: new Date()
    });
    this.initPalpationsForBande('bande-a');
  }
}
