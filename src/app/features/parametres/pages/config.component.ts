import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorageService, CalculationService, NotificationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-config',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent, 
    MatButtonModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './config.component.html',
  styleUrl: './config.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigComponent implements OnInit {
  private storageService = inject(StorageService);
  private calcService = inject(CalculationService);
  private fb = inject(FormBuilder);
  private notifier = inject(NotificationService);

  configForm!: FormGroup;

  ngOnInit(): void {
    const config = this.calcService.config || this.storageService.getConfiguration();
    this.configForm = this.fb.group({
      nombreCagesTotal: [config.nombreCagesTotal || 108, [Validators.required, Validators.min(1)]],
      nombreFemelles: [config.nombreFemelles || 33, [Validators.required, Validators.min(0)]],
      densiteParCase: [config.densiteParCase || 3, [Validators.required, Validators.min(1)]],
      densiteSexageParCase: [config.densiteSexageParCase || 7, [Validators.required, Validators.min(1)]],
      prixAlimentKg: [config.prixAlimentKg || 350, [Validators.required, Validators.min(0)]],
      prixVenteDefaut: [config.prixVenteDefaut || 3000, [Validators.required, Validators.min(0)]]
    });
  }

  saveConfig(): void {
    if (this.configForm.valid) {
      const formValues = this.configForm.value;
      const currentConfig = this.calcService.config || this.storageService.getConfiguration();
      const updatedConfig = {
        ...currentConfig,
        ...formValues
      };
      this.calcService.updateConfiguration(updatedConfig);
      this.notifier.success('Configuration enregistrée avec succès.');
    } else {
      this.notifier.error('Veuillez corriger les erreurs du formulaire.');
    }
  }

  resetForm(): void {
    const config = this.calcService.config || this.storageService.getConfiguration();
    this.configForm.reset({
      nombreCagesTotal: config.nombreCagesTotal || 108,
      nombreFemelles: config.nombreFemelles || 33,
      densiteParCase: config.densiteParCase || 3,
      densiteSexageParCase: config.densiteSexageParCase || 7,
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
        const keys = Object.keys(json);
        const hasRequiredKeys = keys.some(key => key.includes('REPRODUCTEURS') || key.includes('SAILLIES') || key.includes('BANDES'));

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
    event.target.value = '';
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
    if (confirm('DANGER : Supprimer définitivement toutes vos données locales ? Cette action est irréversible.')) {
      this.storageService.clearAll();
      this.calcService.loadAllData();
      this.ngOnInit();
      this.notifier.success('Toutes les données ont été effacées.');
    }
  }
}