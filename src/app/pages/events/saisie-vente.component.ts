import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
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
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Saisie de Vente"
        subtitle="Enregistrer une vente pour libérer des cages d'engraissement et calculer la rentabilité">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulaire de saisie -->
        <div class="panel lg:col-span-2">
          <p class="panel__title">
            <mat-icon>point_of_sale</mat-icon> Informations de vente
          </p>

          <form [formGroup]="venteForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nombre de lapins vendus -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Lapins vendus</mat-label>
                <input matInput type="number" formControlName="vendus" placeholder="Ex: 10">
                <mat-error *ngIf="venteForm.get('vendus')?.hasError('required')">Le nombre de lapins vendus est obligatoire.</mat-error>
                <mat-error *ngIf="venteForm.get('vendus')?.hasError('min')">Le nombre de lapins vendus doit être supérieur à 0.</mat-error>
              </mat-form-field>

              <!-- Date de vente -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Date de vente</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" placeholder="JJ/MM/AAAA">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="venteForm.get('date')?.hasError('required')">La date est obligatoire.</mat-error>
                <mat-error *ngIf="venteForm.get('date')?.hasError('futureDate')">La date ne peut pas être dans le futur.</mat-error>
              </mat-form-field>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Prix de vente unitaire -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Prix unitaire (FCFA / lapin)</mat-label>
                <input matInput type="number" formControlName="prixUnitaire" placeholder="Ex: 3000">
                <mat-error *ngIf="venteForm.get('prixUnitaire')?.hasError('required')">Le prix unitaire est obligatoire.</mat-error>
                <mat-error *ngIf="venteForm.get('prixUnitaire')?.hasError('min')">Le prix unitaire doit être positif.</mat-error>
              </mat-form-field>

              <!-- Client -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Client</mat-label>
                <mat-select formControlName="client" placeholder="Sélectionner le client">
                  <mat-option value="Centragel">Centragel</mat-option>
                  <mat-option value="Marché Local">Marché Local</mat-option>
                  <mat-option value="Autre">Autre</mat-option>
                </mat-select>
                <mat-error *ngIf="venteForm.get('client')?.hasError('required')">Le client est obligatoire.</mat-error>
              </mat-form-field>
            </div>

            <!-- Observations -->
            <mat-form-field appearance="outline" floatLabel="always" class="w-full">
              <mat-label>Observations (Optionnel)</mat-label>
              <textarea matInput formControlName="observations" rows="3" placeholder="Notes de vente..."></textarea>
            </mat-form-field>

            <!-- Boutons actions -->
            <div class="flex justify-end gap-3 mt-2">
              <button mat-stroked-button type="button" (click)="onReset()" style="border-radius: 8px; height: 42px;">
                Annuler
              </button>
              <button mat-flat-button color="primary" type="submit" [disabled]="venteForm.invalid" style="border-radius: 8px; height: 42px; padding: 0 24px;">
                <mat-icon style="font-size:18px;width:18px;height:18px;margin-right:4px;">check</mat-icon>
                Enregistrer la Vente
              </button>
            </div>
          </form>
        </div>

        <!-- Section de calcul et prévisions -->
        <div class="panel">
          <p class="panel__title">
            <mat-icon>calculate</mat-icon>
            Calculs de rentabilité & Cages
          </p>

          <div class="mt-4 flex flex-col gap-4">
            <!-- Revenu total calculé -->
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <mat-icon>attach_money</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">Revenu Total</span>
                <span class="text-sm font-bold text-slate-800">{{ totalRevenu() | number:'1.0-0' }} FCFA</span>
              </div>
            </div>

            <!-- Cages libérées -->
            <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <mat-icon>lock_open</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider text-emerald-700 font-bold block">Cages libérées</span>
                <span class="text-sm font-bold text-slate-800">{{ cagesLiberees() }} cages</span>
              </div>
            </div>

            <!-- Marge brute estimée -->
            <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider text-emerald-700 font-bold block">Marge brute estimée</span>
                <span class="text-sm font-bold text-emerald-800">{{ margeEstimee() | number:'1.0-0' }} FCFA</span>
              </div>
            </div>
          </div>

          <div class="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-normal">
            <h5 class="font-bold text-slate-700 mb-1">Détails :</h5>
            <ul class="list-disc pl-4 flex flex-col gap-1">
              <li><strong>Cages libérées</strong> : Lapins vendus divisés par la densité cible (3), libérés immédiatement.</li>
              <li><strong>Marge brute</strong> : Revenu total moins coût de production estimé ({{ coutProductionParLapin() | number:'1.0-0' }} FCFA par lapin).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class SaisieVenteComponent {
  private calcService = inject(CalculationService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  config = toSignal(this.calcService.config$);
  kpis = toSignal(this.calcService.kpis$);

  venteForm: FormGroup = this.fb.group({
    date: [new Date(), [Validators.required, this.dateVenteValidator.bind(this)]],
    vendus: [10, [Validators.required, Validators.min(1)]],
    prixUnitaire: [3000, [Validators.required, Validators.min(0)]],
    client: ['Centragel', [Validators.required]],
    observations: ['']
  });

  private vendusSelectionne = signal<number>(10);
  private prixUnitaireSelectionne = signal<number>(3000);

  constructor() {
    // Écouter la config pour le prix par défaut
    const currentConfig = this.calcService.config;
    if (currentConfig && currentConfig.prixVenteDefaut) {
      this.venteForm.get('prixUnitaire')?.setValue(currentConfig.prixVenteDefaut);
      this.prixUnitaireSelectionne.set(currentConfig.prixVenteDefaut);
    }

    this.venteForm.get('vendus')?.valueChanges.subscribe(val => {
      this.vendusSelectionne.set(Number(val) || 0);
    });
    this.venteForm.get('prixUnitaire')?.valueChanges.subscribe(val => {
      this.prixUnitaireSelectionne.set(Number(val) || 0);
    });
  }

  totalRevenu = computed(() => {
    return this.vendusSelectionne() * this.prixUnitaireSelectionne();
  });

  cagesLiberees = computed(() => {
    const configVal = this.config();
    const density = configVal?.densiteParCage || 3;
    return Math.ceil(this.vendusSelectionne() / density);
  });

  coutProductionParLapin = computed(() => {
    const kpiVal = this.kpis();
    return kpiVal ? kpiVal.coutProductionParLapin : 2250; // default standard cost
  });

  margeEstimee = computed(() => {
    const revenue = this.totalRevenu();
    const costs = this.vendusSelectionne() * this.coutProductionParLapin();
    return Math.max(0, revenue - costs);
  });

  private dateVenteValidator(control: FormControl) {
    const val = control.value;
    if (!val) return null;
    const dateVal = new Date(val);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateVal > today) {
      return { futureDate: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.venteForm.valid) {
      const formValue = this.venteForm.value;
      const total = formValue.vendus * formValue.prixUnitaire;

      this.calcService.addVente({
        dateVente: formValue.date,
        vendus: formValue.vendus,
        prixKg: 0,
        prixTotal: total,
        client: formValue.client,
        notes: formValue.observations
      });

      this.notifier.success(`Vente enregistrée : ${formValue.vendus} lapins vendus pour un total de ${total} FCFA. Cages d'engraissement libérées.`);
      this.onReset();
    }
  }

  onReset(): void {
    const currentConfig = this.calcService.config;
    const defaultPrice = currentConfig ? currentConfig.prixVenteDefaut : 3000;
    this.venteForm.reset({
      date: new Date(),
      vendus: 10,
      prixUnitaire: defaultPrice,
      client: 'Centragel',
      observations: ''
    });
    this.vendusSelectionne.set(10);
    this.prixUnitaireSelectionne.set(defaultPrice);
  }
}
