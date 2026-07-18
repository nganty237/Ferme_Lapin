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
  selector: 'app-saisie-mise-bas',
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
        title="Saisie de Mise-bas"
        subtitle="Enregistrer une naissance pour suivre la prolificité et la viabilité des lapereaux">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulaire de saisie -->
        <div class="panel lg:col-span-2">
          <p class="panel__title">
            <mat-icon>child_friendly</mat-icon> Détails de la mise-bas
          </p>

          <form [formGroup]="miseBasForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Femelle en gestation -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Femelle en gestation</mat-label>
                <mat-select formControlName="femelle" placeholder="Sélectionner la lapine">
                  <mat-option *ngFor="let f of gestatingFemelles()" [value]="f.id">
                    {{ f.nom }} ({{ f.id }})
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="miseBasForm.get('femelle')?.hasError('required')">La femelle est obligatoire.</mat-error>
              </mat-form-field>

              <!-- Date de mise-bas -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Date de la mise-bas</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" placeholder="JJ/MM/AAAA">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="miseBasForm.get('date')?.hasError('required')">La date est obligatoire.</mat-error>
                <mat-error *ngIf="miseBasForm.get('date')?.hasError('futureDate')">La date ne peut pas être dans le futur.</mat-error>
                <mat-error *ngIf="miseBasForm.get('date')?.hasError('beforeSaillie')">La date ne peut pas être antérieure à la saillie ({{ formatSourceDate(activeSaillie()?.dateSaillie) }}).</mat-error>
              </mat-form-field>
            </div>

            <!-- Infos Saillie liée -->
            <div *ngIf="activeSaillie()" class="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <mat-icon style="font-size:16px;width:16px;height:16px;color:var(--color-primary);">info</mat-icon>
              <span>Saillie d'origine enregistrée le <strong>{{ formatSourceDate(activeSaillie()!.dateSaillie) }}</strong> avec le mâle <strong>{{ activeSaillie()!.maleId }}</strong>.</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nés -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Total nés</mat-label>
                <input matInput type="number" formControlName="nes" placeholder="Ex: 8">
                <mat-error *ngIf="miseBasForm.get('nes')?.hasError('required')">Le nombre total de nés est obligatoire.</mat-error>
                <mat-error *ngIf="miseBasForm.get('nes')?.hasError('min')">Le nombre de nés doit être supérieur à 0.</mat-error>
              </mat-form-field>

              <!-- Vivants -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Nés vivants</mat-label>
                <input matInput type="number" formControlName="vivants" placeholder="Ex: 8">
                <mat-error *ngIf="miseBasForm.get('vivants')?.hasError('required')">Le nombre de nés vivants est obligatoire.</mat-error>
                <mat-error *ngIf="miseBasForm.get('vivants')?.hasError('min')">Le nombre de vivants doit être supérieur à 0.</mat-error>
                <mat-error *ngIf="miseBasForm.get('vivants')?.hasError('tooManyVivants')">Le nombre de vivants ne peut pas dépasser le total nés.</mat-error>
              </mat-form-field>
            </div>

            <!-- Observations -->
            <mat-form-field appearance="outline" floatLabel="always" class="w-full">
              <mat-label>Observations (Optionnel)</mat-label>
              <textarea matInput formControlName="observations" rows="3" placeholder="Notes de mise-bas..."></textarea>
            </mat-form-field>

            <!-- Boutons actions -->
            <div class="flex justify-end gap-3 mt-2">
              <button mat-stroked-button type="button" (click)="onReset()" style="border-radius: 8px; height: 42px;">
                Annuler
              </button>
              <button mat-flat-button color="primary" type="submit" [disabled]="miseBasForm.invalid" style="border-radius: 8px; height: 42px; padding: 0 24px;">
                <mat-icon style="font-size:18px;width:18px;height:18px;margin-right:4px;">check</mat-icon>
                Enregistrer la Mise-bas
              </button>
            </div>
          </form>
        </div>

        <!-- Section de calcul et prévisions -->
        <div class="panel">
          <p class="panel__title">
            <mat-icon>calculate</mat-icon>
            Calculs automatiques
          </p>

          <div class="mt-4 flex flex-col gap-4">
            <!-- Viabilité -->
            <div class="p-3 rounded-xl border flex items-center gap-3"
                 [ngClass]="getViabiliteBgClass(viabilite())">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                   [ngClass]="getViabiliteIconBgClass(viabilite())">
                <mat-icon>favorite</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider font-bold block"
                      [ngClass]="getViabiliteTextClass(viabilite())">Viabilité</span>
                <span class="text-sm font-bold text-slate-800">{{ viabilite() !== null ? viabilite() + '%' : '—' }}</span>
              </div>
            </div>

            <!-- Cages requises -->
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <mat-icon>grid_view</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">Cages requises</span>
                <span class="text-sm font-bold text-slate-800">{{ cagesRequises() !== null ? cagesRequises() + ' cages' : '—' }}</span>
              </div>
            </div>

            <!-- Sevrage prévu -->
            <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <mat-icon>no_food</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider text-amber-700 font-bold block">Sevrage prévu</span>
                <span class="text-sm font-bold text-slate-800">{{ sevragePrevu() ? formatDate(sevragePrevu()!) : '—' }}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-normal">
            <h5 class="font-bold text-slate-700 mb-1">Règles de calcul :</h5>
            <ul class="list-disc pl-4 flex flex-col gap-1">
              <li><strong>Viabilité</strong> : (vivants / nés) × 100. Vert si &gt;95%, Orange si 85-95%, Rouge si &lt;85%.</li>
              <li><strong>Cages requises</strong> : Nb de vivants divisé par la densité cible de la configuration (3 par cage), arrondi au supérieur.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class SaisieMiseBasComponent {
  private calcService = inject(CalculationService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  reproducteurs = toSignal(this.calcService.reproducteurs$);
  saillies = toSignal(this.calcService.saillies$);
  misesBas = toSignal(this.calcService.misesBas$);

  // Formulaire réactif
  miseBasForm: FormGroup = this.fb.group({
    femelle: ['', [Validators.required]],
    date: [new Date(), [Validators.required, this.dateMiseBasValidator.bind(this)]],
    nes: [8, [Validators.required, Validators.min(1)]],
    vivants: [8, [Validators.required, Validators.min(1), this.vivantsValidator.bind(this)]],
    observations: ['']
  });

  // Signaux pour suivre les inputs et recalculer réactivement
  private dateSelectionnee = signal<Date | null>(new Date());
  private nesSelectionne = signal<number>(8);
  private vivantsSelectionne = signal<number>(8);

  constructor() {
    // Écouter les changements pour les calculs auto
    this.saillieFormChanges();
  }

  private saillieFormChanges(): void {
    this.miseBasForm.get('date')?.valueChanges.subscribe(val => {
      this.dateSelectionnee.set(val ? new Date(val) : null);
    });
    this.miseBasForm.get('nes')?.valueChanges.subscribe(val => {
      this.nesSelectionne.set(Number(val) || 0);
      this.miseBasForm.get('vivants')?.updateValueAndValidity();
    });
    this.miseBasForm.get('vivants')?.valueChanges.subscribe(val => {
      this.vivantsSelectionne.set(Number(val) || 0);
    });
    this.miseBasForm.get('femelle')?.valueChanges.subscribe(() => {
      this.miseBasForm.get('date')?.updateValueAndValidity();
    });
  }

  // Filtrage des femelles qui sont actuellement "En gestation"
  gestatingFemelles = computed(() => {
    const list = this.reproducteurs() || [];
    return list.filter(r => r.sexe === 'F' && r.etat === 'En gestation');
  });

  // Saillie associée à la femelle sélectionnée
  activeSaillie = computed(() => {
    const list = this.saillies() || [];
    const mbList = this.misesBas() || [];
    const selectedFemelle = this.miseBasForm.get('femelle')?.value;
    if (!selectedFemelle) return null;

    // Récupérer la dernière saillie de cette femelle qui n'a pas encore de mise-bas liée
    return list
      .filter(s => s.femelleId === selectedFemelle && !mbList.some((m: any) => m.saillieId === s.id))
      .sort((a, b) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime())[0] || null;
  });

  // Calculs autos réactifs
  viabilite = computed(() => {
    const nes = this.nesSelectionne();
    const vivants = this.vivantsSelectionne();
    if (nes <= 0) return null;
    return Math.min(100, Math.round((vivants / nes) * 100));
  });

  cagesRequises = computed(() => {
    const vivants = this.vivantsSelectionne();
    if (vivants <= 0) return null;
    const config = this.calcService.config;
    return Math.ceil(vivants / (config.densiteParCage || 3));
  });

  sevragePrevu = computed(() => {
    const dVal = this.dateSelectionnee();
    if (!dVal || isNaN(dVal.getTime())) return null;
    const config = this.calcService.config;
    const d = new Date(dVal);
    d.setDate(d.getDate() + (config.dureeAllaitementJours || 31));
    return d;
  });

  // Validators personnalisés
  private dateMiseBasValidator(control: FormControl) {
    const val = control.value;
    if (!val) return null;
    const dateVal = new Date(val);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateVal > today) {
      return { futureDate: true };
    }

    const saillie = this.activeSaillie();
    if (saillie) {
      const saillieDate = new Date(saillie.dateSaillie);
      if (dateVal < saillieDate) {
        return { beforeSaillie: true };
      }
    }
    return null;
  }

  private vivantsValidator(control: FormControl) {
    const vivants = Number(control.value);
    const nes = Number(this.miseBasForm?.get('nes')?.value);
    if (vivants > nes) {
      return { tooManyVivants: true };
    }
    return null;
  }

  // Styles de la viabilité en fonction de la valeur
  getViabiliteBgClass(val: number | null): string {
    if (val === null) return 'bg-slate-50 border-slate-100 text-slate-800';
    if (val > 95) return 'bg-emerald-50 border-emerald-100 text-emerald-800';
    if (val >= 85) return 'bg-amber-50 border-amber-100 text-amber-800';
    return 'bg-red-50 border-red-100 text-red-800';
  }

  getViabiliteIconBgClass(val: number | null): string {
    if (val === null) return 'bg-slate-100 text-slate-600';
    if (val > 95) return 'bg-emerald-100 text-emerald-600';
    if (val >= 85) return 'bg-amber-100 text-amber-600';
    return 'bg-red-100 text-red-600';
  }

  getViabiliteTextClass(val: number | null): string {
    if (val === null) return 'text-slate-500';
    if (val > 95) return 'text-emerald-700';
    if (val >= 85) return 'text-amber-700';
    return 'text-red-700';
  }

  onSubmit(): void {
    if (this.miseBasForm.valid) {
      const formValue = this.miseBasForm.value;
      const saillie = this.activeSaillie();

      this.calcService.addMiseBas({
        saillieId: saillie?.id || '',
        femelleId: formValue.femelle,
        dateMiseBas: formValue.date,
        nes: formValue.nes,
        vivants: formValue.vivants,
        notes: formValue.observations
      });

      const viab = this.viabilite();
      let toastMsg = `Mise-bas enregistrée avec succès. Viabilité : ${viab}%.`;
      if (viab !== null && viab > 95) {
        this.notifier.success(toastMsg);
      } else if (viab !== null && viab >= 85) {
        this.notifier.success(toastMsg); // will use warning styles eventually
      } else {
        this.notifier.error(toastMsg);
      }

      this.onReset();
    }
  }

  onReset(): void {
    this.miseBasForm.reset({
      femelle: '',
      date: new Date(),
      nes: 8,
      vivants: 8,
      observations: ''
    });
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatSourceDate(dateStr: any): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  }
}
