import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
import { CalculationService } from '../../core/services/calculation.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Paramètres & Sauvegardes"
        subtitle="Configuration technique de l'élevage et gestion des bases de données locales">
      </app-page-header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Colonne Gauche : Configuration technique -->
        <div class="space-y-6">
          <!-- Formulaire configuration -->
          <div class="panel">
            <h2 class="panel__title">
              <mat-icon>settings</mat-icon>
              Configuration Technique
            </h2>
            
            <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="space-y-4">
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Nombre total de cages</label>
                  <input type="number" class="form-input w-full font-mono" formControlName="nombreCagesTotal" />
                  <span class="field-hint">Capacité maximale de la ferme</span>
                  @if (configForm.get('nombreCagesTotal')?.touched && configForm.get('nombreCagesTotal')?.invalid) {
                    <span class="field-error">Requis (min. 1)</span>
                  }
                </div>

                <div>
                  <label class="form-label">Cages repro. réservées</label>
                  <input type="number" class="form-input w-full font-mono" formControlName="nombreCagesReproductrices" />
                  <span class="field-hint">Cages allouées aux reproducteurs</span>
                  @if (configForm.get('nombreCagesReproductrices')?.touched && configForm.get('nombreCagesReproductrices')?.invalid) {
                    <span class="field-error">Requis (min. 0)</span>
                  }
                </div>
              </div>

              <div>
                <label class="form-label">Densité en engraissement (lapins/cage)</label>
                <input type="number" class="form-input w-full font-mono" formControlName="densiteParCage" />
                <span class="field-hint">Nombre de lapereaux par cage d'engraissement</span>
                @if (configForm.get('densiteParCage')?.touched && configForm.get('densiteParCage')?.invalid) {
                  <span class="field-error">Requis (min. 1)</span>
                }
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Prix aliment (CFA / Kg)</label>
                  <input type="number" class="form-input w-full font-mono" formControlName="prixAlimentKg" />
                  <span class="field-hint">Utilisé pour estimer les coûts alimentaires</span>
                  @if (configForm.get('prixAlimentKg')?.touched && configForm.get('prixAlimentKg')?.invalid) {
                    <span class="field-error">Requis (min. 0)</span>
                  }
                </div>

                <div>
                  <label class="form-label">Prix de vente standard (CFA / lapin)</label>
                  <input type="number" class="form-input w-full font-mono" formControlName="prixVenteDefaut" />
                  <span class="field-hint">Prix par défaut des ventes directes</span>
                  @if (configForm.get('prixVenteDefaut')?.touched && configForm.get('prixVenteDefaut')?.invalid) {
                    <span class="field-error">Requis (min. 0)</span>
                  }
                </div>
              </div>

              <div class="flex flex-col sm:flex-row gap-3 mt-4">
                <button type="button" class="btn btn-outline justify-center" (click)="resetForm()" style="height: 42px;">
                  Annuler
                </button>
                <button type="submit" class="btn btn-primary justify-center flex-1" [disabled]="configForm.invalid" style="height: 42px;">
                  <mat-icon style="font-size:18px;width:18px;height:18px;">save</mat-icon>
                  Enregistrer les paramètres
                </button>
              </div>
            </form>
          </div>

          <!-- Durées physiologiques (lecture seule) -->
          <div class="panel">
            <h2 class="panel__title">
              <mat-icon>hourglass_empty</mat-icon>
              Durées Cycles Biologiques
            </h2>
            
            <div class="space-y-4">
              <div class="grid grid-cols-3 gap-4">
                <div class="readonly-box">
                  <span class="readonly-box__val">31</span>
                  <span class="readonly-box__lbl">Gestation (Jours)</span>
                </div>
                <div class="readonly-box">
                  <span class="readonly-box__val">31</span>
                  <span class="readonly-box__lbl">Allaitement (Jours)</span>
                </div>
                <div class="readonly-box">
                  <span class="readonly-box__val">120</span>
                  <span class="readonly-box__lbl">Engraissement (Jours)</span>
                </div>
              </div>

              <!-- Message de rappel lecture seule -->
              <div class="alert-banner warning-banner">
                <mat-icon class="banner-icon">info</mat-icon>
                <div class="banner-content">
                  <p class="banner-text">
                    Les durées biologiques et physiologiques de gestation, d'allaitement et d'engraissement sont fixes 
                    conformément aux standards physiologiques du lapin de chair et ne sont pas modifiables.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Colonne Droite : Import/Export et Reset -->
        <div class="space-y-6">
          
          <!-- Sauvegarde et Transfert -->
          <div class="panel">
            <h2 class="panel__title">
              <mat-icon>backup</mat-icon>
              Sauvegarde et Restauration
            </h2>
            
            <p class="text-sm text-slate-500 mb-6 leading-relaxed">
              Téléchargez une sauvegarde de vos données locales sous format JSON ou importez un fichier de sauvegarde existant.
              Toutes les données de la ferme (reproducteurs, portées, ventes, cages) sont incluses.
            </p>

            <div class="space-y-3">
              <button class="btn btn-outline w-full justify-center" (click)="exportData()">
                <mat-icon style="font-size:18px;width:18px;height:18px;">cloud_download</mat-icon>
                Exporter la base de données (JSON)
              </button>

              <label class="btn btn-outline w-full justify-center cursor-pointer">
                <mat-icon style="font-size:18px;width:18px;height:18px;">cloud_upload</mat-icon>
                Importer une sauvegarde (JSON)
                <input type="file" accept=".json" class="hidden" (change)="onFileSelected($event)" />
              </label>
            </div>
          </div>

          <!-- Réinitialisation et Danger -->
          <div class="panel border-red-100">
            <h2 class="panel__title text-red-700">
              <mat-icon class="text-red-600">warning</mat-icon>
              Zone de Danger
            </h2>

            <p class="text-sm text-slate-500 mb-6 leading-relaxed">
              Ces actions modifient en profondeur ou effacent complètement votre base de données locale du navigateur.
            </p>

            <div class="space-y-3">
              <button class="btn btn-outline border-slate-200 w-full justify-center" (click)="resetDatabase()">
                <mat-icon style="font-size:18px;width:18px;height:18px;">history</mat-icon>
                Réinitialiser avec les données de démonstration
              </button>

              <button class="btn btn-danger w-full justify-center" (click)="clearDatabase()">
                <mat-icon style="font-size:18px;width:18px;height:18px;">delete_forever</mat-icon>
                Vider toutes les données locales
              </button>
            </div>

            <!-- Warning Alert Box -->
            <div class="alert-banner danger-banner mt-4">
              <mat-icon class="banner-icon">error_outline</mat-icon>
              <div class="banner-content">
                <p class="banner-text">
                  Vider les données supprime définitivement toutes les fiches, bandes, reproductions, saillies, mises-bas et ventes. 
                  Prenez soin d'exporter une sauvegarde JSON avant d'effectuer cette opération.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .form-label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--color-text-muted);
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }

    .form-input {
      padding: 10px 12px;
      border: 1px solid var(--color-border, #e8eaed);
      border-radius: 8px;
      font-size: 13.5px;
      background: white;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      color: var(--color-text-main);
    }
    .form-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-alpha);
    }

    .field-hint {
      display: block;
      font-size: 11px;
      color: var(--color-text-light);
      margin-top: 3px;
    }

    .field-error {
      display: block;
      font-size: 11px;
      color: var(--color-danger);
      margin-top: 3px;
      font-weight: 500;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--color-primary);
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark);
    }

    .btn-outline {
      background: white;
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
    }
    .btn-outline:hover {
      background: var(--color-surface-hover);
      border-color: var(--color-text-light);
      color: var(--color-text-main);
    }

    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
    .btn-danger:hover {
      background: #fca5a5;
      color: #b91c1c;
    }

    .readonly-box {
      background: var(--color-bg-main);
      border: 1px solid var(--color-border-light);
      border-radius: 8px;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .readonly-box__val {
      font-size: 24px;
      font-weight: 800;
      color: var(--color-text-main);
    }
    .readonly-box__lbl {
      font-size: 10px;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      margin-top: 4px;
      text-align: center;
      letter-spacing: 0.02em;
    }

    /* Alerts Banners */
    .alert-banner {
      display: flex;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid;
    }
    .banner-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .banner-content {
      flex: 1;
    }
    .banner-text {
      font-size: 12px;
      line-height: 1.5;
      margin: 0;
      font-weight: 500;
    }
    .warning-banner {
      background: var(--color-warning-bg);
      border-color: #fde68a;
      color: #92400e;
    }
    .warning-banner .banner-icon { color: var(--color-warning); }

    .danger-banner {
      background: var(--color-danger-bg);
      border-color: #fecaca;
      color: #991b1b;
    }
    .danger-banner .banner-icon { color: var(--color-danger); }
  `]
})
export class ConfigComponent implements OnInit {
  private storageService = inject(StorageService);
  private calcService = inject(CalculationService);
  private fb = inject(FormBuilder);
  private notifier = inject(NotificationService);

  configForm!: FormGroup;

  ngOnInit(): void {
    const config = this.storageService.getConfiguration();
    this.configForm = this.fb.group({
      nombreCagesTotal: [config.nombreCagesTotal || 144, [Validators.required, Validators.min(1)]],
      nombreCagesReproductrices: [config.nombreCagesReproductrices || 24, [Validators.required, Validators.min(0)]],
      densiteParCage: [config.densiteParCage || 3, [Validators.required, Validators.min(1)]],
      prixAlimentKg: [config.prixAlimentKg || 350, [Validators.required, Validators.min(0)]],
      prixVenteDefaut: [config.prixVenteDefaut || 3000, [Validators.required, Validators.min(0)]]
    });
  }

  saveConfig(): void {
    if (this.configForm.valid) {
      const formValues = this.configForm.value;
      const currentConfig = this.storageService.getConfiguration();
      const updatedConfig = {
        ...currentConfig,
        ...formValues
      };
      this.calcService.updateConfiguration(updatedConfig);
      this.notifier.success('Configuration enregistrée.');
    } else {
      this.notifier.error('Veuillez corriger les erreurs du formulaire.');
    }
  }

  resetForm(): void {
    const config = this.storageService.getConfiguration();
    this.configForm.reset({
      nombreCagesTotal: config.nombreCagesTotal || 144,
      nombreCagesReproductrices: config.nombreCagesReproductrices || 24,
      densiteParCage: config.densiteParCage || 3,
      prixAlimentKg: config.prixAlimentKg || 350,
      prixVenteDefaut: config.prixVenteDefaut || 3000
    });
    this.notifier.info('Modifications annulées.');
  }

  exportData(): void {
    try {
      const data = this.storageService.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sauvegarde_elevage_lapins_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.notifier.success('Base de données exportée.');
    } catch (e) {
      console.error(e);
      this.notifier.error('Échec de l\'exportation.');
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // Simple validation check: we expect some database keys in the backup JSON
        const keys = Object.keys(json);
        const hasRequiredKeys = keys.some(key => key.includes('REPRODUCTEURS') || key.includes('SAILLIES') || key.includes('BANDS'));
        
        if (!hasRequiredKeys) {
          this.notifier.error('Le fichier importé n\'est pas une sauvegarde valide.');
          return;
        }

        if (confirm('Importer cette sauvegarde ? Toutes vos données actuelles seront écrasées.')) {
          this.storageService.importData(json);
          this.calcService.loadAllData();
          this.ngOnInit();
          this.notifier.success('Sauvegarde restaurée avec succès.');
        }
      } catch (err) {
        console.error(err);
        this.notifier.error('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset
  }

  resetDatabase(): void {
    if (confirm('Réinitialiser la base de données locale avec les données de démonstration ? Vos données actuelles seront perdues.')) {
      this.storageService.clearAll();
      this.storageService.initSeedData(true);
      this.calcService.loadAllData();
      this.ngOnInit();
      this.notifier.success('Données de démonstration restaurées.');
    }
  }

  clearDatabase(): void {
    if (confirm('⚠️ DANGER : Supprimer définitivement toutes vos données locales ? Cette action est irréversible.')) {
      this.storageService.clearAll();
      this.calcService.loadAllData();
      this.ngOnInit();
      this.notifier.success('Toutes les données ont été effacées.');
    }
  }
}
