import { ChangeDetectionStrategy, Component, inject, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, NotificationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-vente',
  providers: [provideNativeDateAdapter()],
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  templateUrl: './saisie-vente.component.html',
  styleUrl: './saisie-vente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisieVenteComponent {
  private calcService = inject(CalculationService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  config = toSignal(this.calcService.config$);
  kpis = toSignal(this.calcService.kpis$);
  ventes = toSignal(this.calcService.ventes$);

  formVente: FormGroup;
  get venteForm(): FormGroup { return this.formVente; }

  prixVenteDefaut = computed(() => this.config()?.prixVenteDefaut || 3000);
  coutProductionParLapin = computed(() => this.kpis()?.coutProductionParLapin || 2100);

  nbVendusInput = signal<number>(0);
  prixUnitaireInput = signal<number>(3000);

  totalRevenu = computed(() => {
    return (this.nbVendusInput() || 0) * (this.prixUnitaireInput() || 0);
  });

  margeEstimee = computed(() => {
    const revenu = this.totalRevenu();
    const coutTotal = (this.nbVendusInput() || 0) * this.coutProductionParLapin();
    return Math.max(0, revenu - coutTotal);
  });

  cagesLiberees = computed(() => {
    return Math.ceil((this.nbVendusInput() || 0) / 3);
  });

  recentVentes = computed(() => {
    const list = this.ventes() || [];
    return [...list].reverse().slice(0, 5);
  });

  constructor() {
    this.formVente = this.fb.group({
      date: [new Date(), Validators.required],
      vendus: [10, [Validators.required, Validators.min(1)]],
      prixUnitaire: [3000, [Validators.required, Validators.min(0)]],
      client: [''],
      observations: ['']
    });

    this.nbVendusInput.set(10);
    this.prixUnitaireInput.set(3000);

    this.formVente.get('vendus')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.nbVendusInput.set(Number(v) || 0));

    this.formVente.get('prixUnitaire')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.prixUnitaireInput.set(Number(p) || 0));
  }

  onSubmit(): void {
    if (this.formVente.invalid) {
      this.notifier.error('Veuillez remplir correctement les champs du formulaire.');
      return;
    }

    const formValue = this.formVente.value;
    const vendus = Number(formValue.vendus);
    const prixUnitaire = Number(formValue.prixUnitaire);
    const prixTotal = vendus * prixUnitaire;

    this.calcService.addVente({
      id: `vnt_${Date.now()}`,
      dateVente: formValue.date,
      vendus,
      prixTotal,
      client: formValue.client || 'Client direct',
      notes: formValue.observations
    });

    this.notifier.success(`Vente de ${vendus} lapins enregistrée (${prixTotal} FCFA).`);
    this.onReset();
  }

  onReset(): void {
    this.formVente.reset({
      date: new Date(),
      vendus: 10,
      prixUnitaire: this.prixVenteDefaut(),
      client: '',
      observations: ''
    });
  }
}