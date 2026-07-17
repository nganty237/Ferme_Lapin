import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FarmService } from '../../core/services/farm.service';
import { NotificationService } from '../../core/services/notification.service';
import { Band } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bandes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Gestion des bandes"
        subtitle="Suivez le cycle de production de chaque lot depuis la saillie jusqu'a la vente"
      >
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Form -->
        <div>
          <div class="panel">
            <p class="panel__title">
              <mat-icon>add_circle_outline</mat-icon>
              Creer une bande
            </p>
            <form [formGroup]="bandForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Nom du lot</mat-label>
                <input matInput formControlName="name" placeholder="Bande G - Aout 2026" />
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Date de creation</mat-label>
                <input matInput type="date" formControlName="dateCreated" />
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Nombre de femelles</mat-label>
                <input matInput type="number" formControlName="nbFemales" />
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Notes</mat-label>
                <textarea matInput formControlName="notes" rows="2"></textarea>
              </mat-form-field>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="bandForm.invalid"
                style="width:100%; border-radius:8px; height:42px;"
              >
                Enregistrer
              </button>
            </form>
          </div>
        </div>

        <!-- Band List with Timeline -->
        <div class="lg:col-span-2">
          <div class="section-title">
            <mat-icon>view_timeline</mat-icon>
            Cycle biologique des bandes
          </div>

          @if (bands().length === 0) {
            <app-empty-state
              icon="layers"
              message="Aucune bande creee. Ajoutez-en une pour commencer le suivi."
            ></app-empty-state>
          }

          <div class="flex flex-col gap-4">
            @for (band of bands(); track band) {
              <div class="panel">
                <!-- Band Header -->
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h3 style="font-size:15px; font-weight:650; color:#1e293b; margin:0 0 2px;">
                      {{ band.name }}
                    </h3>
                    <p style="font-size:12px; color:#94a3b8; margin:0;">
                      Creee le {{ band.dateCreated }} — {{ band.nbFemales }} femelles
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="badge"
                      [ngClass]="{
                        'badge--neutral': band.status === 'archived',
                        'badge--info':
                          band.status === 'reproduction' || band.status === 'gestation',
                        'badge--warning': band.status === 'sevrage',
                        'badge--success': band.status === 'engraissement',
                      }"
                      >{{ band.status }}</span
                    >
                    <button
                      mat-icon-button
                      (click)="deleteBand(band.id)"
                      style="width:32px;height:32px;"
                    >
                      <mat-icon style="font-size:18px;width:18px;height:18px;color:#94a3b8;"
                        >delete_outline</mat-icon
                      >
                    </button>
                  </div>
                </div>
                <!-- Timeline -->
                <div style="padding:8px 0;">
                  <div class="flex items-center justify-between relative">
                    <div
                      style="position:absolute;left:16px;right:16px;top:16px;height:2px;background:#e2e8f0;z-index:0;"
                    ></div>
                    @for (step of timelineSteps; track step) {
                      <div class="timeline-step">
                        <div
                          class="timeline-dot"
                          [class.timeline-dot--done]="isStepDone(band, step.key)"
                          [class.timeline-dot--active]="isStepActive(band, step.key)"
                          [class.timeline-dot--pending]="
                            !isStepDone(band, step.key) && !isStepActive(band, step.key)
                          "
                        >
                          <mat-icon style="font-size:14px;width:14px;height:14px;">{{
                            step.icon
                          }}</mat-icon>
                        </div>
                        <span class="timeline-label">{{ step.label }}</span>
                        <span class="timeline-date">{{ getStepDate(band, step.key) }}</span>
                      </div>
                    }
                  </div>
                </div>
                <!-- Notes -->
                @if (band.notes) {
                  <p
                    style="font-size:12px; color:#64748b; margin:12px 0 0; padding:8px 12px; background:#f8fafc; border-radius:6px; border-left:3px solid #e2e8f0; font-style:italic;"
                  >
                    {{ band.notes }}
                  </p>
                }
              </div>
            }
          </div>
        </div>
      </div>
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
export class BandesComponent {
  private farmService = inject(FarmService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);

  bands = this.farmService.bands;

  timelineSteps = [
    { key: 'saillie', label: 'Saillie', icon: 'favorite_border' },
    { key: 'gestation', label: 'Gestation', icon: 'schedule' },
    { key: 'mise_bas', label: 'Mise bas', icon: 'child_friendly' },
    { key: 'sevrage', label: 'Sevrage', icon: 'content_cut' },
    { key: 'engraissement', label: 'Engraissement', icon: 'trending_up' },
    { key: 'vente', label: 'Vente', icon: 'storefront' },
  ];

  bandForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    dateCreated: [new Date().toISOString().split('T')[0], [Validators.required]],
    nbFemales: [15, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  onSubmit(): void {
    if (this.bandForm.valid) {
      this.farmService.addBand({
        name: this.bandForm.value.name,
        dateCreated: this.bandForm.value.dateCreated,
        nbFemales: Number(this.bandForm.value.nbFemales),
        status: 'reproduction',
        notes: this.bandForm.value.notes,
      });
      this.notifier.success('Bande creee avec succes.');
      this.bandForm.reset({ dateCreated: new Date().toISOString().split('T')[0], nbFemales: 15 });
    }
  }

  deleteBand(id: string): void {
    if (confirm('Supprimer cette bande et tous ses evenements ?')) {
      this.farmService.deleteBand(id);
      this.notifier.success('Bande supprimee.');
    }
  }

  isStepDone(band: Band, step: string): boolean {
    const stages = ['reproduction', 'gestation', 'sevrage', 'engraissement', 'archived'];
    const idx = stages.indexOf(band.status);
    const stepMap: Record<string, number> = {
      saillie: 0,
      gestation: 1,
      mise_bas: 2,
      sevrage: 3,
      engraissement: 3,
      vente: 4,
    };
    return idx > (stepMap[step] ?? 99);
  }

  isStepActive(band: Band, step: string): boolean {
    const map: Record<string, string> = {
      saillie: 'reproduction',
      gestation: 'gestation',
      mise_bas: 'sevrage',
      sevrage: 'engraissement',
      engraissement: 'engraissement',
      vente: 'archived',
    };
    return band.status === map[step];
  }

  getStepDate(band: Band, step: string): string {
    const repro = this.farmService.reproductions().find((r) => r.bandId === band.id);
    if (!repro) return '';
    if (step === 'saillie') return repro.dateBreeding;
    if (step === 'gestation') return repro.dateBreeding;
    if (step === 'mise_bas') return repro.actualKindling || repro.dateExpectedKindling;
    const weaning = this.farmService.weanings().find((w) => w.reproductionId === repro.id);
    if (step === 'sevrage') return weaning?.dateWeaning || '';
    if (weaning) {
      const fattening = this.farmService.fattenings().find((f) => f.weaningId === weaning.id);
      if (step === 'engraissement') return weaning.dateWeaning;
      if (step === 'vente' && fattening) return fattening.dateExpectedSale;
    }
    return '';
  }
}

