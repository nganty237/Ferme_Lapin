import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FarmService } from '../../core/services/farm.service';
import { StorageService } from '../../core/services/storage.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    PageHeaderComponent,
    MatButtonModule, MatInputModule, MatIconModule
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Parametres"
        subtitle="Configuration des durees biologiques et gestion de la base de donnees locale">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Settings -->
        <div class="panel">
          <p class="panel__title"><mat-icon>tune</mat-icon> Durees biologiques</p>
          <form [formGroup]="settingsForm" (ngSubmit)="saveSettings()" class="flex flex-col gap-4">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Duree de gestation (jours)</mat-label>
              <input matInput type="number" formControlName="gestationDays">
              <mat-hint>Standard : 31 jours</mat-hint>
            </mat-form-field>
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Duree d'allaitement avant sevrage (jours)</mat-label>
              <input matInput type="number" formControlName="weaningDays">
              <mat-hint>Standard : 11 jours apres la mise bas</mat-hint>
            </mat-form-field>
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Duree d'engraissement (jours)</mat-label>
              <input matInput type="number" formControlName="fatteningDays">
              <mat-hint>Standard : 28 jours</mat-hint>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="settingsForm.invalid"
              style="width:100%; border-radius:8px; height:42px;">Enregistrer</button>
          </form>
        </div>

        <!-- Database -->
        <div>
          <div class="panel">
            <p class="panel__title"><mat-icon>storage</mat-icon> Base de donnees</p>
            <p style="font-size:13px; color:#64748b; margin:0 0 20px; line-height:1.5;">
              Les donnees sont stockees localement dans votre navigateur. Elles ne sont accessibles que depuis cet appareil.
            </p>
            <div class="flex flex-col gap-3">
              <button mat-stroked-button (click)="resetDatabase()" style="width:100%; border-radius:8px; height:42px;">
                <mat-icon style="font-size:16px;width:16px;height:16px;margin-right:6px;">refresh</mat-icon>
                Reinitialiser avec les donnees de demonstration
              </button>
              <button mat-flat-button color="warn" (click)="clearDatabase()" style="width:100%; border-radius:8px; height:42px;">
                <mat-icon style="font-size:16px;width:16px;height:16px;margin-right:6px;">delete_outline</mat-icon>
                Vider toutes les donnees
              </button>
            </div>
          </div>

          <div style="margin-top:16px; padding:14px 18px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; display:flex; gap:10px; align-items:flex-start;">
            <mat-icon style="font-size:16px;width:16px;height:16px;color:#d97706;margin-top:2px;">warning_amber</mat-icon>
            <p style="font-size:12px; color:#92400e; margin:0; line-height:1.5;">
              Vider les donnees supprime definitivement toutes les bandes, reproductions et ventes. Exportez un CSV depuis la page Rapports avant de continuer.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ParametresComponent {
  private farmService = inject(FarmService);
  private storageService = inject(StorageService);
  private fb = inject(FormBuilder);
  private notifier = inject(NotificationService);

  settingsForm: FormGroup;

  constructor() {
    const s = this.storageService.getSettings();
    this.settingsForm = this.fb.group({
      gestationDays: [s.gestationDays, [Validators.required, Validators.min(25), Validators.max(35)]],
      weaningDays: [s.weaningDays, [Validators.required, Validators.min(7), Validators.max(30)]],
      fatteningDays: [s.fatteningDays, [Validators.required, Validators.min(15), Validators.max(60)]]
    });
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.storageService.saveSettings(this.settingsForm.value);
      this.notifier.success('Parametres enregistres.');
    }
  }

  resetDatabase(): void {
    if (confirm('Reinitialiser avec les donnees de demonstration ?')) {
      this.farmService.resetSeedData();
      this.notifier.success('Donnees reinitialisees.');
    }
  }

  clearDatabase(): void {
    if (confirm('Supprimer definitivement toutes les donnees ?')) {
      this.storageService.clearAll();
      this.farmService.loadAllData();
      this.notifier.success('Donnees effacees.');
    }
  }
}
