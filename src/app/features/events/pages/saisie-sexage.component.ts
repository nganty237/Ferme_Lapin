import { ChangeDetectionStrategy, Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService, NotificationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-sexage',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule
  ],
  templateUrl: './saisie-sexage.component.html',
  styleUrl: './saisie-sexage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisieSexageComponent {
  private calcService = inject(CalculationService);
  private bandeService = inject(BandeService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  bandes = toSignal(this.bandeService.bandes$);
  sevrages = toSignal(this.calcService.sevrages$);
  sexages = toSignal(this.calcService.sexages$);
  reproducteurs = toSignal(this.calcService.reproducteurs$);

  sexageForm: FormGroup;
  bandeSelectionnee = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  bandesDisponibles = computed(() => this.bandes() || []);

  sevragesBande = computed(() => {
    const bandeId = this.bandeSelectionnee();
    const allSevrages = this.sevrages() || [];
    const allSexages = this.sexages() || [];
    if (!bandeId) return [];

    return allSevrages.filter(s => {
      const hasSexage = allSexages.some(sx => sx.sevrageId === s.id);
      return !hasSexage;
    }).filter(s => {
      if (!s.femelleId) return false;
      const b = this.bandes()?.find(b => b.id === bandeId);
      return b ? b.femellesIds?.includes(s.femelleId) : false;
    });
  });

  get porteesFormArray() {
    return this.sexageForm.get('portees') as FormArray;
  }

  constructor() {
    this.sexageForm = this.fb.group({
      bande: ['', Validators.required],
      dateCommune: [new Date(), Validators.required],
      portees: this.fb.array([])
    });

    this.sexageForm.get('bande')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(bandeId => {
        this.bandeSelectionnee.set(bandeId || null);
        this.initPorteesArray();
      });
  }

  initPorteesArray() {
    this.porteesFormArray.clear();
    const sevs = this.sevragesBande();

    sevs.forEach(sev => {
      const group = this.fb.group({
        sevrageId: [sev.id],
        femelleId: [sev.femelleId],
        totalSevres: [sev.sevres],
        males: [Math.floor((sev.sevres || 0) / 2), [Validators.required, Validators.min(0)]],
        femelles: [Math.ceil((sev.sevres || 0) / 2), [Validators.required, Validators.min(0)]],
        retenus: [0, [Validators.min(0)]]
      });
      this.porteesFormArray.push(group);
    });
  }

  getFemelleName(id: string): string {
    const repro = this.reproducteurs()?.find(r => r.id === id);
    return repro ? repro.nom : id;
  }

  onSubmit() {
    if (this.sexageForm.invalid) {
      this.sexageForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);

    try {
      const formValue = this.sexageForm.value;
      const dateSexage = new Date(formValue.dateCommune).toISOString();

      formValue.portees.forEach((p: any) => {
        this.bandeService.enregistrerSexage({
          id: `sex-${Date.now()}-${p.femelleId}`,
          sevrageId: p.sevrageId,
          bandeId: formValue.bande,
          dateSexage,
          nombreMales: Number(p.males) || 0,
          nombreFemelles: Number(p.femelles) || 0,
          totalSexes: (Number(p.males) || 0) + (Number(p.femelles) || 0),
          clapierDestination: 'clapier-4'
        });
      });

      this.notifier.success('Sexage enregistré avec succès.');
      this.sexageForm.reset({ dateCommune: new Date() });
      this.porteesFormArray.clear();
    } catch (e) {
      this.notifier.error('Erreur lors de la sauvegarde.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
