import { Component, inject, signal, computed } from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FarmService } from '../../core/services/farm.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Suivi de production"
        subtitle="Enregistrez les evenements biologiques de chaque bande active"
      >
      </app-page-header>

      <!-- Band Selector -->
      <div class="panel mb-6" style="max-width:480px;">
        <p class="panel__title">
          <mat-icon>filter_list</mat-icon>
          Selectionner une bande
        </p>
        <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
          <mat-label>Bande active</mat-label>
          <mat-select [value]="selectedBandId()" (selectionChange)="onBandSelect($event.value)">
            @for (band of activeBands(); track band) {
              <mat-option [value]="band.id"> {{ band.name }} — {{ band.status }} </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (selectedBand(); as band) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Form -->
          <div>
            <!-- Saillie -->
            @if (band.status === 'reproduction') {
              <div class="panel">
                <p class="panel__title">
                  <mat-icon>favorite_border</mat-icon> Enregistrer la saillie
                </p>
                <form
                  [formGroup]="saillieForm"
                  (ngSubmit)="submitSaillie(band.id)"
                  class="flex flex-col gap-4"
                >
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Date de la saillie</mat-label>
                    <input matInput type="date" formControlName="dateBreeding" />
                  </mat-form-field>
                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    [disabled]="saillieForm.invalid"
                    style="width:100%; border-radius:8px; height:42px;"
                  >
                    Valider
                  </button>
                </form>
              </div>
            }
            <!-- Mise bas -->
            @if (band.status === 'gestation') {
              <div class="panel">
                <p class="panel__title">
                  <mat-icon>child_friendly</mat-icon> Enregistrer la mise bas
                </p>
                <form
                  [formGroup]="miseBasForm"
                  (ngSubmit)="submitMiseBas(band.id)"
                  class="flex flex-col gap-4"
                >
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Date reelle de mise bas</mat-label>
                    <input matInput type="date" formControlName="actualKindling" />
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Nes vivants</mat-label>
                    <input matInput type="number" formControlName="nbBornAlive" />
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Morts avant sevrage (estime)</mat-label>
                    <input matInput type="number" formControlName="nbDeadBeforeWeaning" />
                  </mat-form-field>
                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    [disabled]="miseBasForm.invalid"
                    style="width:100%; border-radius:8px; height:42px;"
                  >
                    Valider
                  </button>
                </form>
              </div>
            }
            <!-- Sevrage -->
            @if (band.status === 'sevrage') {
              <div class="panel">
                <p class="panel__title"><mat-icon>content_cut</mat-icon> Enregistrer le sevrage</p>
                <form
                  [formGroup]="sevrageForm"
                  (ngSubmit)="submitSevrage(band.id)"
                  class="flex flex-col gap-4"
                >
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Date du sevrage</mat-label>
                    <input matInput type="date" formControlName="dateWeaning" />
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Lapereaux sevres</mat-label>
                    <input matInput type="number" formControlName="nbWeaned" />
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Poids moyen au sevrage (kg)</mat-label>
                    <input
                      matInput
                      type="number"
                      step="0.01"
                      formControlName="avgWeightAtWeaning"
                    />
                  </mat-form-field>
                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    [disabled]="sevrageForm.invalid"
                    style="width:100%; border-radius:8px; height:42px;"
                  >
                    Valider
                  </button>
                </form>
              </div>
            }
            <!-- Engraissement -->
            @if (band.status === 'engraissement') {
              <div class="panel">
                <p class="panel__title">
                  <mat-icon>storefront</mat-icon> Finaliser l'engraissement
                </p>
                <form
                  [formGroup]="engraissementForm"
                  (ngSubmit)="submitEngraissement(band.id)"
                  class="flex flex-col gap-4"
                >
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Morts en engraissement</mat-label>
                    <input matInput type="number" formControlName="nbDeadDuringFattening" />
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Lapins vendus</mat-label>
                    <input matInput type="number" formControlName="nbSold" />
                  </mat-form-field>
                  <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                    <mat-label>Poids moyen a la vente (kg)</mat-label>
                    <input matInput type="number" step="0.01" formControlName="avgWeight" />
                  </mat-form-field>
                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    [disabled]="engraissementForm.invalid"
                    style="width:100%; border-radius:8px; height:42px;"
                  >
                    Terminer et archiver
                  </button>
                </form>
              </div>
            }
          </div>
          <!-- History -->
          <div class="lg:col-span-2">
            <div class="panel">
              <p class="panel__title"><mat-icon>history</mat-icon> Historique de la bande</p>
              <table class="data-table">
                <tbody>
                  <tr>
                    <td style="font-weight:600; width:200px;">Date de saillie</td>
                    <td>{{ currentReproduction()?.dateBreeding || 'Non enregistree' }}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;">Mise bas prevue</td>
                    <td>{{ currentReproduction()?.dateExpectedKindling || '—' }}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;">Mise bas reelle</td>
                    <td>{{ currentReproduction()?.actualKindling || 'En attente' }}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;">Nes vivants</td>
                    <td>{{ currentReproduction()?.nbBornAlive ?? '—' }}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;">Lapereaux sevres</td>
                    <td>{{ currentWeaning()?.nbWeaned ?? '—' }}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;">Poids moyen au sevrage</td>
                    <td>
                      {{
                        currentWeaning()?.avgWeightAtWeaning
                          ? currentWeaning()?.avgWeightAtWeaning + ' kg'
                          : '—'
                      }}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-weight:600;">Vente attendue le</td>
                    <td>{{ currentFattening()?.dateExpectedSale || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ProductionComponent {
  private farmService = inject(FarmService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  activeBands = computed(() => this.farmService.bands().filter((b) => b.status !== 'archived'));
  selectedBandId = signal<string>('');
  selectedBand = computed(() =>
    this.farmService.bands().find((b) => b.id === this.selectedBandId()),
  );
  currentReproduction = computed(() =>
    this.farmService.reproductions().find((r) => r.bandId === this.selectedBandId()),
  );
  currentWeaning = computed(() => {
    const repro = this.currentReproduction();
    return repro ? this.farmService.weanings().find((w) => w.reproductionId === repro.id) : null;
  });
  currentFattening = computed(() => {
    const weaning = this.currentWeaning();
    return weaning ? this.farmService.fattenings().find((f) => f.weaningId === weaning.id) : null;
  });

  saillieForm: FormGroup = this.fb.group({
    dateBreeding: [new Date().toISOString().split('T')[0], [Validators.required]],
  });
  miseBasForm: FormGroup = this.fb.group({
    actualKindling: [new Date().toISOString().split('T')[0], [Validators.required]],
    nbBornAlive: [80, [Validators.required, Validators.min(0)]],
    nbDeadBeforeWeaning: [5, [Validators.required, Validators.min(0)]],
  });
  sevrageForm: FormGroup = this.fb.group({
    dateWeaning: [new Date().toISOString().split('T')[0], [Validators.required]],
    nbWeaned: [75, [Validators.required, Validators.min(0)]],
    avgWeightAtWeaning: [0.7, [Validators.required, Validators.min(0.1)]],
  });
  engraissementForm: FormGroup = this.fb.group({
    nbDeadDuringFattening: [2, [Validators.required, Validators.min(0)]],
    nbSold: [73, [Validators.required, Validators.min(0)]],
    avgWeight: [2.3, [Validators.required, Validators.min(0.5)]],
  });

  onBandSelect(bandId: string): void {
    this.selectedBandId.set(bandId);
  }

  submitSaillie(bandId: string): void {
    if (this.saillieForm.valid) {
      this.farmService.addReproduction({
        bandId,
        dateBreeding: this.saillieForm.value.dateBreeding,
      });
      this.notifier.success('Saillie enregistree. Le lot passe en gestation.');
    }
  }

  submitMiseBas(bandId: string): void {
    if (this.miseBasForm.valid) {
      const repro = this.currentReproduction();
      if (repro) {
        this.farmService.updateReproduction({
          ...repro,
          actualKindling: this.miseBasForm.value.actualKindling,
          nbBornAlive: Number(this.miseBasForm.value.nbBornAlive),
          nbDeadBeforeWeaning: Number(this.miseBasForm.value.nbDeadBeforeWeaning),
        });
        this.notifier.success('Mise bas enregistree.');
      }
    }
  }

  submitSevrage(bandId: string): void {
    if (this.sevrageForm.valid) {
      const repro = this.currentReproduction();
      if (repro) {
        this.farmService.addWeaning({
          reproductionId: repro.id,
          dateWeaning: this.sevrageForm.value.dateWeaning,
          nbWeaned: Number(this.sevrageForm.value.nbWeaned),
          avgWeightAtWeaning: Number(this.sevrageForm.value.avgWeightAtWeaning),
        });
        this.notifier.success('Sevrage enregistre. Le lot passe en engraissement.');
      }
    }
  }

  submitEngraissement(bandId: string): void {
    if (this.engraissementForm.valid) {
      const fattening = this.currentFattening();
      if (fattening) {
        this.farmService.updateFattening({
          ...fattening,
          nbDeadDuringFattening: Number(this.engraissementForm.value.nbDeadDuringFattening),
          nbSold: Number(this.engraissementForm.value.nbSold),
          avgWeight: Number(this.engraissementForm.value.avgWeight),
        });
        const revenue =
          Number(this.engraissementForm.value.nbSold) *
          Number(this.engraissementForm.value.avgWeight) *
          2800;
        this.farmService.addSale({
          fatteningId: fattening.id,
          dateOrder: new Date().toISOString().split('T')[0],
          customer: 'Centragel',
          nbRequested: Number(this.engraissementForm.value.nbSold),
          nbDelivered: Number(this.engraissementForm.value.nbSold),
          pricePerKg: 2800,
          totalAmount: revenue,
        });
        this.notifier.success('Lot archive et ventes enregistrees.');
        this.selectedBandId.set('');
      }
    }
  }
}

