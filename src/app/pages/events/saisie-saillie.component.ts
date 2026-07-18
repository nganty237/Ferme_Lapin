import { Component, inject, computed, signal } from '@angular/core';
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
  selector: 'app-saisie-saillie',
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
        title="Saisie de Saillie"
        subtitle="Enregistrer un accouplement pour lancer un nouveau cycle de gestation">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulaire de saisie -->
        <div class="panel lg:col-span-2">
          <p class="panel__title">
            <mat-icon>favorite</mat-icon> Informations de l'accouplement
          </p>
          
          <form [formGroup]="saillieForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Bande -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Bande</mat-label>
                <mat-select formControlName="bande" placeholder="Sélectionner la bande">
                  <mat-option value="b1">Bande A</mat-option>
                  <mat-option value="b2">Bande B</mat-option>
                  <mat-option value="b3">Bande C</mat-option>
                </mat-select>
                <mat-error *ngIf="saillieForm.get('bande')?.hasError('required')">La bande est obligatoire.</mat-error>
              </mat-form-field>

              <!-- Date de la saillie -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Date de la saillie</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" placeholder="JJ/MM/AAAA">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="saillieForm.get('date')?.hasError('required')">La date est obligatoire.</mat-error>
                <mat-error *ngIf="saillieForm.get('date')?.hasError('futureDate')">La date ne peut pas être dans le futur.</mat-error>
              </mat-form-field>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Femelle -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Femelle</mat-label>
                <mat-select formControlName="femelle" placeholder="Sélectionner la lapine">
                  <mat-option *ngFor="let f of filteredFemelles()" [value]="f.id">
                    {{ f.nom }} ({{ f.id }}) — {{ f.etat }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="saillieForm.get('femelle')?.hasError('required')">La femelle est obligatoire.</mat-error>
                <mat-error *ngIf="saillieForm.get('femelle')?.hasError('pregnant')">Cette femelle est déjà gestante.</mat-error>
              </mat-form-field>

              <!-- Mâle -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Mâle</mat-label>
                <mat-select formControlName="male" placeholder="Sélectionner le reproducteur">
                  <mat-option *ngFor="let m of males()" [value]="m.id">
                    {{ m.nom }} ({{ m.id }})
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="saillieForm.get('male')?.hasError('required')">Le mâle est obligatoire.</mat-error>
              </mat-form-field>
            </div>

            <!-- Observations -->
            <mat-form-field appearance="outline" floatLabel="always" class="w-full">
              <mat-label>Observations (Optionnel)</mat-label>
              <textarea matInput formControlName="observations" rows="3" placeholder="Notes additionnelles..."></textarea>
            </mat-form-field>

            <!-- Boutons actions -->
            <div class="flex justify-end gap-3 mt-2">
              <button mat-stroked-button type="button" (click)="onReset()" style="border-radius: 8px; height: 42px;">
                Annuler
              </button>
              <button mat-flat-button color="primary" type="submit" [disabled]="saillieForm.invalid" style="border-radius: 8px; height: 42px; padding: 0 24px;">
                <mat-icon style="font-size:18px;width:18px;height:18px;margin-right:4px;">check</mat-icon>
                Enregistrer la Saillie
              </button>
            </div>
          </form>
        </div>

        <!-- Section de calcul et prévisions -->
        <div class="panel">
          <p class="panel__title">
            <mat-icon>query_builder</mat-icon>
            Dates Prévisionnelles du Cycle
          </p>

          <div class="mt-4 flex flex-col gap-4">
            @if (previsions()) {
              <div class="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                  <mat-icon>child_friendly</mat-icon>
                </div>
                <div>
                  <span class="text-[11px] uppercase tracking-wider text-rose-700 font-bold block">Mise-bas prévue</span>
                  <span class="text-sm font-bold text-slate-800">{{ formatDate(previsions()!.miseBas) }}</span>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <mat-icon>no_food</mat-icon>
                </div>
                <div>
                  <span class="text-[11px] uppercase tracking-wider text-amber-700 font-bold block">Sevrage prévu</span>
                  <span class="text-sm font-bold text-slate-800">{{ formatDate(previsions()!.sevrage) }}</span>
                </div>
              </div>

              <div class="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <mat-icon>point_of_sale</mat-icon>
                </div>
                <div>
                  <span class="text-[11px] uppercase tracking-wider text-emerald-700 font-bold block">Vente prévue</span>
                  <span class="text-sm font-bold text-slate-800">{{ formatDate(previsions()!.vente) }}</span>
                </div>
              </div>

              <!-- Simulation de capacité réactive -->
              <div class="p-3 border rounded-xl" [ngClass]="simulationSaillie()?.hasMargin ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'" *ngIf="simulationSaillie()">
                <span class="text-[11px] uppercase tracking-wider font-bold block" [ngClass]="simulationSaillie()?.hasMargin ? 'text-emerald-700' : 'text-red-700'">Alerte de Capacité Cages</span>
                <p class="text-xs text-slate-600 mt-1">
                  Cages engraissement après sevrage : <strong>{{ simulationSaillie()?.futureOccupees }}/{{ simulationSaillie()?.totalEngraissement }}</strong> ({{ simulationSaillie()?.futurePct }}%).
                </p>
                <div class="flex items-center gap-1.5 mt-2 text-xs font-bold" [ngClass]="simulationSaillie()?.hasMargin ? 'text-emerald-700' : 'text-red-700'">
                  <mat-icon style="font-size:16px;width:16px;height:16px;">{{ simulationSaillie()?.hasMargin ? 'check_circle' : 'warning' }}</mat-icon>
                  <span>{{ simulationSaillie()?.hasMargin ? '✅ Marge disponible (Saillie autorisée)' : '❌ Risque de saturation' }}</span>
                </div>
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center text-center p-8 text-slate-400 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                <mat-icon style="font-size:32px; width:32px; height:32px; margin-bottom:8px;">date_range</mat-icon>
                <p class="text-xs">Sélectionnez une date pour estimer les étapes biologiques.</p>
              </div>
            }
          </div>

          <div class="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-normal">
            <h5 class="font-bold text-slate-700 mb-1">À propos du cycle cunicole :</h5>
            <ul class="list-disc pl-4 flex flex-col gap-1">
              <li>Gestation standard : 31 jours.</li>
              <li>Allaitement jusqu'au sevrage : 31 jours additionnels (total 62j).</li>
              <li>Engraissement post-sevrage : 120 jours jusqu'à commercialisation (total 182j).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class SaisieSaillieComponent {
  private calcService = inject(CalculationService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  reproducteurs = toSignal(this.calcService.reproducteurs$);
  kpis = toSignal(this.calcService.kpis$);
  config = toSignal(this.calcService.config$);

  simulationSaillie = computed(() => {
    const kpiVal = this.kpis();
    const configVal = this.config();
    if (!kpiVal || !configVal) return null;

    const currentOccupees = kpiVal.occupationCages.occupees;
    const totalEngraissement = configVal.nombreCagesTotal - configVal.nombreCagesReproductrices;

    // Simulation: 1 femelle saillie = 8 lapereaux attendus = 3 cages d'engraissement requises
    const expectedCages = 3;
    const futureOccupees = currentOccupees + expectedCages;
    const futurePct = totalEngraissement > 0 ? Math.round((futureOccupees / totalEngraissement) * 100) : 0;
    const hasMargin = futurePct <= 95;

    return {
      expectedCages,
      futureOccupees,
      totalEngraissement,
      futurePct,
      hasMargin
    };
  });

  // Formulaire réactif
  saillieForm: FormGroup = this.fb.group({
    bande: ['', [Validators.required]],
    femelle: [{ value: '', disabled: true }, [Validators.required, this.femelleValidator.bind(this)]],
    male: ['', [Validators.required]],
    date: [new Date(), [Validators.required, this.dateValidator.bind(this)]],
    observations: ['']
  });

  // Signal pour la date sélectionnée afin de piloter les prévisions
  private dateSelectionnee = signal<Date | null>(new Date());

  constructor() {
    // Écouter les changements de date pour mettre à jour les prévisions
    this.saillieForm.get('date')?.valueChanges.subscribe(val => {
      this.dateSelectionnee.set(val ? new Date(val) : null);
    });

    // Quand la bande change, on vide le choix de la femelle et gère l'état d'activation
    this.saillieForm.get('bande')?.valueChanges.subscribe(bande => {
      const femelleCtrl = this.saillieForm.get('femelle');
      if (femelleCtrl) {
        femelleCtrl.setValue('');
        if (bande) {
          femelleCtrl.enable();
        } else {
          femelleCtrl.disable();
        }
      }
    });
  }

  // Filtrage des femelles par bande sélectionnée
  filteredFemelles = computed(() => {
    const list = this.reproducteurs() || [];
    const selectedBande = this.saillieForm.get('bande')?.value;
    if (!selectedBande) return [];
    return list.filter(r => r.sexe === 'F' && r.bandeId === selectedBande && r.etat !== 'Mort' && r.etat !== 'Réformé');
  });

  // Liste des mâles actifs
  males = computed(() => {
    const list = this.reproducteurs() || [];
    return list.filter(r => r.sexe === 'M' && r.etat !== 'Mort' && r.etat !== 'Réformé');
  });

  // Calcul dynamique des prévisions
  previsions = computed(() => {
    const dVal = this.dateSelectionnee();
    if (!dVal || isNaN(dVal.getTime())) return null;

    const mb = new Date(dVal);
    mb.setDate(mb.getDate() + 31);

    const sev = new Date(dVal);
    sev.setDate(sev.getDate() + 62);

    const ven = new Date(dVal);
    ven.setDate(ven.getDate() + 182);

    return {
      miseBas: mb,
      sevrage: sev,
      vente: ven
    };
  });

  // Validator custom: date <= aujourd'hui
  private dateValidator(control: FormControl) {
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

  // Validator custom: femelle pas gestante
  private femelleValidator(control: FormControl) {
    const femelleId = control.value;
    if (!femelleId) return null;
    const list = this.reproducteurs() || [];
    const femelle = list.find(r => r.id === femelleId);
    if (femelle && femelle.etat === 'En gestation') {
      return { pregnant: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.saillieForm.valid) {
      const formValue = this.saillieForm.value;
      this.calcService.addSaillie({
        bandeId: formValue.bande,
        femelleId: formValue.femelle,
        maleId: formValue.male,
        dateSaillie: formValue.date,
        notes: formValue.observations
      });

      this.notifier.success('Saillie enregistrée. La lapine passe en gestation.');
      this.onReset();
    }
  }

  onReset(): void {
    this.saillieForm.reset({
      bande: '',
      femelle: '',
      male: '',
      date: new Date(),
      observations: ''
    });
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
