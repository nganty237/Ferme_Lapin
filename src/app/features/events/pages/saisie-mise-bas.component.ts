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
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-mise-bas',
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    ReactiveFormsModule,
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
  reproducteurs = toSignal(this.calcService.reproducteurs$);

  form: FormGroup;
  get miseBasForm(): FormGroup { return this.form; }

  selectedBandeId = signal<string>('bande-a');
  bandeSelectionnee = this.selectedBandeId;
  bandesDisponibles = computed(() => this.bandes() || []);
  isSubmitting = signal<boolean>(false);

  sailliesEligibles = computed(() => {
    const bandeId = this.selectedBandeId();
    const allSaillies = this.saillies() || [];
    const allMB = this.misesBas() || [];

    return allSaillies.filter(s => {
      const dejaMB = allMB.some(mb => mb.saillieId === s.id);
      return !dejaMB;
    });
  });

  constructor() {
    this.form = this.fb.group({
      bandeId: ['bande-a', Validators.required],
      bande: ['bande-a'],
      dateMiseBas: [new Date(), Validators.required],
      portees: this.fb.array([])
    });

    this.initPorteesForBande('bande-a');
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
    this.initPorteesForBande(bandeId);
  }

  private initPorteesForBande(bandeId: string): void {
    this.porteesArray.clear();
    const eligibles = this.sailliesEligibles();

    eligibles.forEach(s => {
      const group = this.fb.group({
        saillieId: [s.id],
        femelleId: [s.femelleId],
        dateSaillie: [s.dateSaillie],
        vivants: [6, [Validators.required, Validators.min(0)]],
        mortsNes: [0, [Validators.required, Validators.min(0)]]
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

      const misesBasAEnregistrer = arrayValues.map((p: any) => {
        const vivants = Number(p.vivants) || 0;
        const mortsNes = Number(p.mortsNes) || 0;
        const total = vivants + mortsNes;
        const viabilite = total > 0 ? Math.round((vivants / total) * 100) : 0;

        return {
          id: `mb_${Date.now()}_${p.femelleId}`,
          saillieId: p.saillieId,
          femelleId: p.femelleId,
          dateMiseBas: val.dateMiseBas,
          vivants,
          mortsNes,
          viabiliteCalculee: viabilite
        };
      });

      this.bandeService.confirmerMiseBas(val.bandeId, misesBasAEnregistrer);
      this.notifier.success(`${misesBasAEnregistrer.length} mise(s)-bas enregistrée(s) avec succès pour la ${val.bandeId}.`);
      this.initPorteesForBande(val.bandeId);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onReset(): void {
    this.form.reset({ bandeId: 'bande-a', dateMiseBas: new Date() });
    this.initPorteesForBande('bande-a');
  }
}