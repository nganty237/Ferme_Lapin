import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '../../core/services/calculation.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-deces',
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
        title="Déclaration de Décès"
        subtitle="Enregistrer le décès d'un reproducteur pour maintenir le statut du troupeau à jour">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulaire de saisie -->
        <div class="panel lg:col-span-2">
          <p class="panel__title">
            <mat-icon class="text-red-600">report</mat-icon> Signaler un Décès
          </p>

          <form [formGroup]="decesForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Reproducteur -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Reproducteur concerné</mat-label>
                <mat-select formControlName="reproducteurId" placeholder="Sélectionner le lapin">
                  <mat-option *ngFor="let r of activeReproducteurs()" [value]="r.id">
                    {{ r.nom }} ({{ r.id }}) — {{ r.sexe === 'F' ? 'Femelle' : 'Mâle' }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="decesForm.get('reproducteurId')?.hasError('required')">Le reproducteur est obligatoire.</mat-error>
              </mat-form-field>

              <!-- Date de décès -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Date du décès</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" placeholder="JJ/MM/AAAA">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="decesForm.get('date')?.hasError('required')">La date est obligatoire.</mat-error>
                <mat-error *ngIf="decesForm.get('date')?.hasError('futureDate')">La date ne peut pas être dans le futur.</mat-error>
              </mat-form-field>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Cause du décès -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Cause du décès</mat-label>
                <mat-select formControlName="cause" placeholder="Sélectionner la cause">
                  <mat-option value="Maladie">Maladie / Infection</mat-option>
                  <mat-option value="Accident">Accident / Traumatisme</mat-option>
                  <mat-option value="Stérilité / Réforme">Sélection pour Réforme / Vieillesse</mat-option>
                  <mat-option value="Inconnue">Cause Inconnue</mat-option>
                </mat-select>
                <mat-error *ngIf="decesForm.get('cause')?.hasError('required')">La cause est obligatoire.</mat-error>
              </mat-form-field>
            </div>

            <!-- Observations -->
            <mat-form-field appearance="outline" floatLabel="always" class="w-full">
              <mat-label>Observations / Symptômes (Optionnel)</mat-label>
              <textarea matInput formControlName="observations" rows="3" placeholder="Symptômes constatés, remarques..."></textarea>
            </mat-form-field>

            <!-- Boutons actions -->
            <div class="flex justify-end gap-3 mt-2">
              <button mat-stroked-button type="button" (click)="onReset()" style="border-radius: 8px; height: 42px;">
                Annuler
              </button>
              <button mat-flat-button color="warn" type="submit" [disabled]="decesForm.invalid" style="border-radius: 8px; height: 42px; padding: 0 24px;">
                <mat-icon style="font-size:18px;width:18px;height:18px;margin-right:4px;">check</mat-icon>
                Signaler le Décès
              </button>
            </div>
          </form>
        </div>

        <!-- Informations de sécurité -->
        <div class="panel border-red-50">
          <p class="panel__title text-red-700">
            <mat-icon class="text-red-600">warning</mat-icon>
            Règles Sanitaires
          </p>

          <p class="text-xs text-slate-500 leading-relaxed mb-4">
            Tout décès de reproducteur impacte directement le plan de saillie et le taux de rotation des bandes.
          </p>

          <div class="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800">
            <h5 class="font-bold mb-1">Actions recommandées :</h5>
            <ul class="list-disc pl-4 flex flex-col gap-1 text-[11px] leading-normal">
              <li>Isoler les cages adjacentes si suspicion de maladie contagieuse.</li>
              <li>Désinfecter la cage immédiatement.</li>
              <li>Ajuster la planification des futures saillies dans les paramètres.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class SaisieDecesComponent {
  private calcService = inject(CalculationService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  reproducteurs = toSignal(this.calcService.reproducteurs$);

  decesForm: FormGroup = this.fb.group({
    reproducteurId: ['', [Validators.required]],
    date: [new Date(), [Validators.required, this.dateDecesValidator.bind(this)]],
    cause: ['', [Validators.required]],
    observations: ['']
  });

  constructor() {}

  activeReproducteurs = computed(() => {
    const list = this.reproducteurs() || [];
    // Lister seulement les reproducteurs vivants (différents de Mort et Réformé)
    return list.filter(r => r.etat !== 'Mort' && r.etat !== 'Réformé');
  });

  private dateDecesValidator(control: FormControl) {
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
    if (this.decesForm.valid) {
      const formValue = this.decesForm.value;
      const list = this.reproducteurs() || [];
      const rep = list.find(r => r.id === formValue.reproducteurId);

      this.calcService.addDeces({
        reproducteurId: formValue.reproducteurId,
        dateDeces: formValue.date,
        cause: formValue.cause,
        observations: formValue.observations
      });

      this.notifier.error(`Décès enregistré : ${rep ? rep.nom : formValue.reproducteurId}. Son état est passé à 'Mort'.`);
      this.onReset();
    }
  }

  onReset(): void {
    this.decesForm.reset({
      reproducteurId: '',
      date: new Date(),
      cause: '',
      observations: ''
    });
  }
}
