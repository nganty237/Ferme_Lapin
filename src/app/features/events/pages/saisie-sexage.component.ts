import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService, NotificationService } from '@core/services';
import { BandeId } from '@core/models';
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
    FormsModule,
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
  selectedBande = computed(() => (this.bandes() || []).find(b => b.id === this.bandeSelectionnee()));

  bandesAvecStatut = computed(() => {
    const allBandes = this.bandes() || [];
    return allBandes.map(b => {
      const estEnSexage = b.phase === 'Sexage' || b.phase === 'Engraissement' || b.phase === 'Allaitement';
      return {
        ...b,
        statutLabel: estEnSexage ? `Phase ${b.phase} — Prête au sexage` : `Au repos (${b.phase})`
      };
    });
  });

  sevragesBande = computed(() => {
    const bandeId = this.bandeSelectionnee();
    if (!bandeId) return [];

    const allSevrages = this.sevrages() || [];
    return allSevrages.filter(s => s.bandeId === bandeId).slice(0, 11);
  });

  get porteesFormArray() {
    return this.sexageForm.get('portees') as FormArray;
  }

  constructor() {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.sexageForm = this.fb.group({
      bande: ['bande-a', Validators.required],
      dateCommune: [todayStr, Validators.required],
      portees: this.fb.array([])
    });

    this.sexageForm.get('bande')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(bandeId => {
        this.bandeSelectionnee.set(bandeId || null);
      });

    // Auto-sélection initiale de la bande sevrée prête pour le sexage
    effect(() => {
      const allBandes = this.bandes() || [];
      const allSevrages = this.sevrages() || [];
      if (allBandes.length > 0) {
        const activeBande = allBandes.find(b => {
          const sevs = allSevrages.filter(s => s.bandeId === b.id);
          return sevs.length > 0 || b.phase === 'Sexage' || b.phase === 'Engraissement';
        }) || allBandes[0];

        if (activeBande && this.bandeSelectionnee() !== activeBande.id) {
          this.bandeSelectionnee.set(activeBande.id);
          this.sexageForm.patchValue({ bande: activeBande.id }, { emitEvent: false });
        }
      }
    }, { allowSignalWrites: true });

    // Synchronisation réactive auto du tableau des portées à sexer avec pré-remplissage
    effect(() => {
      const sevs = this.sevragesBande();
      this.updatePorteesArray(sevs);
    });
  }

  private lastSevragesHash = '';

  private updatePorteesArray(sevs: any[]) {
    const hash = sevs.map(s => `${s.id}_${s.femelleId}`).join(',');
    if (this.lastSevragesHash === hash && this.porteesFormArray.length === sevs.length) {
      return;
    }
    this.lastSevragesHash = hash;

    const allSexages = this.sexages() || [];

    this.porteesFormArray.clear();
    sevs.forEach(sev => {
      const existingSex = allSexages.find(sex => sex.bandeId === sev.bandeId);
      const malesVal = existingSex ? existingSex.nombreMales : Math.floor((sev.sevres || 0) / 2);
      const femellesVal = existingSex ? existingSex.nombreFemelles : Math.ceil((sev.sevres || 0) / 2);
      const retenusVal = existingSex ? (existingSex.retenus || 0) : 0;

      const group = this.fb.group({
        sevrageId: [sev.id],
        femelleId: [sev.femelleId],
        totalSevres: [sev.sevres],
        males: [malesVal, [Validators.required, Validators.min(0)]],
        femelles: [femellesVal, [Validators.required, Validators.min(0)]],
        retenus: [retenusVal, [Validators.min(0)]]
      });
      this.porteesFormArray.push(group);
    });
  }

  getFemelleName(id: string): string {
    const repro = this.reproducteurs()?.find(r => r.id === id);
    return repro ? repro.nom : id;
  }

  getTotalSexes(males: any, femelles: any): number {
    return (Number(males) || 0) + (Number(femelles) || 0);
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

      // TK-06 : cycleId dynamique depuis la bande
      const bande = (this.bandes() || []).find(b => b.id === formValue.bande);

      formValue.portees.forEach((p: any) => {
        this.bandeService.enregistrerSexage({
          id: `sex-${Date.now()}-${p.femelleId}`,
          cycleId: `cycle-${formValue.bande}-${bande?.numeroCycle || 1}`,
          bandeId: formValue.bande,
          dateSexage,
          nombreMales: Number(p.males) || 0,
          nombreFemelles: Number(p.femelles) || 0,
          totalSexes: (Number(p.males) || 0) + (Number(p.femelles) || 0),
          retenus: Number(p.retenus) || 0,  // TK-11 : inclure les retenus pour renouvellement
          clapierSexageId: 'clap-s1'
        });
      });

      // Fix P0 #4 : déclenchement immédiat du transfert en engraissement après sexage.
      this.bandeService.transfererEngraissement(formValue.bande as BandeId, new Date(dateSexage));

      this.notifier.success('Sexage enregistré avec succès.');
      // TK-07 : reset date en format ISO string
      this.sexageForm.reset({ dateCommune: new Date().toISOString().substring(0, 10) });
      this.porteesFormArray.clear();
    } catch (e) {
      this.notifier.error('Erreur lors de la sauvegarde.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
