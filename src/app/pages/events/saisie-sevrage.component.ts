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
  selector: 'app-saisie-sevrage',
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
        title="Saisie de Sevrage"
        subtitle="Transférer les lapereaux vers les cages d'engraissement">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Formulaire de saisie -->
        <div class="panel lg:col-span-2">
          <p class="panel__title">
            <mat-icon>no_food</mat-icon> Détails du sevrage
          </p>

          <form [formGroup]="sevrageForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Portée en allaitement -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Portée en allaitement</mat-label>
                <mat-select formControlName="miseBasId" placeholder="Sélectionner la portée">
                  <mat-option *ngFor="let mb of activeMisesBas()" [value]="mb.id">
                    Femelle {{ mb.femelleId }} — Nés vivants: {{ mb.vivants }} (du {{ formatSourceDate(mb.dateMiseBas) }})
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="sevrageForm.get('miseBasId')?.hasError('required')">La portée est obligatoire.</mat-error>
              </mat-form-field>

              <!-- Date de sevrage -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Date de sevrage</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" placeholder="JJ/MM/AAAA">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="sevrageForm.get('date')?.hasError('required')">La date est obligatoire.</mat-error>
                <mat-error *ngIf="sevrageForm.get('date')?.hasError('futureDate')">La date ne peut pas être dans le futur.</mat-error>
                <mat-error *ngIf="sevrageForm.get('date')?.hasError('beforeMiseBas')">La date ne peut pas être antérieure à la mise-bas.</mat-error>
              </mat-form-field>
            </div>

            <!-- Infos Mise-bas liée -->
            <div *ngIf="activeMiseBas()" class="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <mat-icon style="font-size:16px;width:16px;height:16px;color:var(--color-primary);">info</mat-icon>
              <span>Mise-bas du <strong>{{ formatSourceDate(activeMiseBas()!.dateMiseBas) }}</strong> ({{ activeMiseBas()!.vivants }} vivants).</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Sevrés -->
              <mat-form-field appearance="outline" floatLabel="always" class="w-full">
                <mat-label>Nombre sevrés</mat-label>
                <input matInput type="number" formControlName="sevres" placeholder="Ex: 7">
                <mat-error *ngIf="sevrageForm.get('sevres')?.hasError('required')">Le nombre de sevrés est obligatoire.</mat-error>
                <mat-error *ngIf="sevrageForm.get('sevres')?.hasError('min')">Le nombre de sevrés doit être supérieur à 0.</mat-error>
                <mat-error *ngIf="sevrageForm.get('sevres')?.hasError('tooManySevres')">Le nombre de sevrés ne peut pas dépasser le nombre de vivants.</mat-error>
              </mat-form-field>
            </div>

            <!-- Observations -->
            <mat-form-field appearance="outline" floatLabel="always" class="w-full">
              <mat-label>Observations (Optionnel)</mat-label>
              <textarea matInput formControlName="observations" rows="3" placeholder="Notes de sevrage..."></textarea>
            </mat-form-field>

            <!-- Boutons actions -->
            <div class="flex justify-end gap-3 mt-2">
              <button mat-stroked-button type="button" (click)="onReset()" style="border-radius: 8px; height: 42px;">
                Annuler
              </button>
              <button mat-flat-button color="primary" type="submit" [disabled]="sevrageForm.invalid" style="border-radius: 8px; height: 42px; padding: 0 24px;">
                <mat-icon style="font-size:18px;width:18px;height:18px;margin-right:4px;">check</mat-icon>
                Enregistrer le Sevrage
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
            <!-- Survie allaitement -->
            <div class="p-3 rounded-xl border flex items-center gap-3"
                 [ngClass]="getSurvieBgClass(survieAllaitement())">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                   [ngClass]="getSurvieIconBgClass(survieAllaitement())">
                <mat-icon>child_care</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider font-bold block"
                      [ngClass]="getSurvieTextClass(survieAllaitement())">Survie Allaitement</span>
                <span class="text-sm font-bold text-slate-800">{{ survieAllaitement() !== null ? survieAllaitement() + '%' : '—' }}</span>
              </div>
            </div>

            <!-- Cages d'engraissement occupées -->
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <mat-icon>grid_view</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">Cages occupées</span>
                <span class="text-sm font-bold text-slate-800">{{ cagesOccupees() !== null ? cagesOccupees() + ' cages' : '—' }}</span>
              </div>
            </div>

            <!-- Date vente prévue -->
            <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <mat-icon>point_of_sale</mat-icon>
              </div>
              <div>
                <span class="text-[11px] uppercase tracking-wider text-emerald-700 font-bold block">Vente prévue</span>
                <span class="text-sm font-bold text-slate-800">{{ ventePrevue() ? formatDate(ventePrevue()!) : '—' }}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-normal">
            <h5 class="font-bold text-slate-700 mb-1">Détails :</h5>
            <ul class="list-disc pl-4 flex flex-col gap-1">
              <li><strong>Survie allaitement</strong> : (sevrés / nés vivants) × 100. Vert si &gt;90%, Rouge si &lt;90%.</li>
              <li><strong>Vente prévue</strong> : Date sevrage + 120 jours d'engraissement.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class SaisieSevrageComponent {
  private calcService = inject(CalculationService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);

  sevrageForm!: FormGroup;

  private dateSelectionnee = signal<Date | null>(new Date());
  private sevresSelectionne = signal<number>(7);

  constructor() {
    this.sevrageForm = this.fb.group({
      miseBasId: ['', [Validators.required]],
      date: [new Date(), [Validators.required, this.dateSevrageValidator.bind(this)]],
      sevres: [7, [Validators.required, Validators.min(1), this.sevresValidator.bind(this)]],
      observations: ['']
    });

    this.sevrageForm.get('date')?.valueChanges.subscribe(val => {
      this.dateSelectionnee.set(val ? new Date(val) : null);
    });
    this.sevrageForm.get('sevres')?.valueChanges.subscribe(val => {
      this.sevresSelectionne.set(Number(val) || 0);
    });
    this.sevrageForm.get('miseBasId')?.valueChanges.subscribe(() => {
      this.sevrageForm.get('date')?.updateValueAndValidity();
      this.sevrageForm.get('sevres')?.updateValueAndValidity();
    });
  }

  activeMisesBas = computed(() => {
    const list = this.misesBas() || [];
    const sevList = this.sevrages() || [];
    const weanedIds = sevList.map((s: any) => s.miseBasId);
    return list.filter(mb => !weanedIds.includes(mb.id));
  });

  activeMiseBas = computed(() => {
    const list = this.activeMisesBas();
    if (!this.sevrageForm) return null;
    const selectedId = this.sevrageForm.get('miseBasId')?.value;
    return list.find(mb => mb.id === selectedId) || null;
  });

  survieAllaitement = computed(() => {
    const mb = this.activeMiseBas();
    const sevres = this.sevresSelectionne();
    if (!mb || mb.vivants <= 0) return null;
    return Math.min(100, Math.round((sevres / mb.vivants) * 100));
  });

  cagesOccupees = computed(() => {
    const sevres = this.sevresSelectionne();
    if (sevres <= 0) return null;
    const config = this.calcService.config;
    return Math.ceil(sevres / (config.densiteParCage || 3));
  });

  ventePrevue = computed(() => {
    const dVal = this.dateSelectionnee();
    if (!dVal || isNaN(dVal.getTime())) return null;
    const d = new Date(dVal);
    d.setDate(d.getDate() + 120);
    return d;
  });

  private dateSevrageValidator(control: FormControl) {
    const val = control.value;
    if (!val) return null;
    const dateVal = new Date(val);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateVal > today) {
      return { futureDate: true };
    }

    if (!this.sevrageForm) return null;
    const mb = this.activeMiseBas();
    if (mb) {
      const mbDate = new Date(mb.dateMiseBas);
      if (dateVal < mbDate) {
        return { beforeMiseBas: true };
      }
    }
    return null;
  }

  private sevresValidator(control: FormControl) {
    const sevres = Number(control.value);
    if (!this.sevrageForm) return null;
    const mb = this.activeMiseBas();
    if (mb && sevres > mb.vivants) {
      return { tooManySevres: true };
    }
    return null;
  }

  getSurvieBgClass(val: number | null): string {
    if (val === null) return 'bg-slate-50 border-slate-100 text-slate-800';
    if (val >= 90) return 'bg-emerald-50 border-emerald-100 text-emerald-800';
    return 'bg-red-50 border-red-100 text-red-800';
  }

  getSurvieIconBgClass(val: number | null): string {
    if (val === null) return 'bg-slate-100 text-slate-600';
    if (val >= 90) return 'bg-emerald-100 text-emerald-600';
    return 'bg-red-100 text-red-600';
  }

  getSurvieTextClass(val: number | null): string {
    if (val === null) return 'text-slate-500';
    if (val >= 90) return 'text-emerald-700';
    return 'text-red-700';
  }

  onSubmit(): void {
    if (this.sevrageForm.valid) {
      const formValue = this.sevrageForm.value;
      this.calcService.addSevrage({
        miseBasId: formValue.miseBasId,
        dateSevrage: formValue.date,
        sevres: formValue.sevres,
        observations: formValue.observations
      });

      this.notifier.success('Sevrage enregistré avec succès. Lapereaux transférés en engraissement.');
      this.onReset();
    }
  }

  onReset(): void {
    this.sevrageForm.reset({
      miseBasId: '',
      date: new Date(),
      sevres: 7,
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
