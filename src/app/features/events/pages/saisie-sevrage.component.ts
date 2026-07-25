import { ChangeDetectionStrategy, Component, inject, signal, computed, DestroyRef, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService, NotificationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-sevrage',
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
  templateUrl: './saisie-sevrage.component.html',
  styleUrl: './saisie-sevrage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisieSevrageComponent {
  private fb = inject(FormBuilder);
  private bandeService = inject(BandeService);
  private calcService = inject(CalculationService);
  private notifier = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  bandes = toSignal(this.bandeService.bandes$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);
  reproducteurs = toSignal(this.calcService.reproducteurs$);

  bandesDisponibles = computed(() => {
    return this.bandes() || [];
  });

  sevrageForm: FormGroup;
  bandeSelectionnee = signal<string | null>(null);
  selectedBande = computed(() => (this.bandes() || []).find(b => b.id === this.bandeSelectionnee()));
  isSubmitting = signal(false);

  misesBasBande = computed(() => {
    const bandeId = this.bandeSelectionnee();
    const allMisesBas = this.misesBas() || [];
    const allSevrages = this.sevrages() || [];
    const repros = this.reproducteurs() || [];
    if (!bandeId) return [];

    return allMisesBas.filter(mb => {
      if (mb.bandeId !== bandeId) return false;
      const alreadySevre = allSevrages.find(s => s.miseBasId === mb.id);
      if (alreadySevre) return false;
      // TK-03 : exclure les femelles mortes ou réformées
      const repro = repros.find(r => r.id === mb.femelleId);
      if (repro && (repro.etat === 'Morte' || repro.etat === 'Réformée')) return false;
      return true;
    });
  });

  get femellesFormArray() {
    return this.sevrageForm.get('femelles') as FormArray;
  }

  constructor() {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.sevrageForm = this.fb.group({
      bande: ['', Validators.required],
      dateCommune: [todayStr, Validators.required],
      femelles: this.fb.array([])
    });

    this.sevrageForm.get('bande')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(bandeId => {
        this.bandeSelectionnee.set(bandeId || null);
      });

    // TK-05 : effet réactif — reconstruit le FormArray dès que misesBasBande() change
    effect(() => {
      const mbs = this.misesBasBande();
      this.femellesFormArray.clear();
      mbs.forEach(mb => {
        const group = this.fb.group({
          miseBasId: [mb.id],
          femelleId: [mb.femelleId],
          vivantsInitiaux: [mb.vivants],
          sevres: [mb.vivants, [Validators.required, Validators.min(0)]],
          observations: ['']
        });
        this.femellesFormArray.push(group);
      });
    });
  }

  initFemellesArray() {
    this.femellesFormArray.clear();
    const mbs = this.misesBasBande();
    
    mbs.forEach(mb => {
      const group = this.fb.group({
        miseBasId: [mb.id],
        femelleId: [mb.femelleId],
        vivantsInitiaux: [mb.vivants],
        sevres: [mb.vivants, [Validators.required, Validators.min(0)]], // Default to what was born alive
        observations: ['']
      });

      this.femellesFormArray.push(group);
    });
  }

  getFemelleName(id: string): string {
    const repro = this.reproducteurs()?.find(r => r.id === id);
    return repro ? repro.nom : id;
  }

  getTauxSurvie(sevres: any, vivants: any): number {
    const s = Number(sevres) || 0;
    const v = Number(vivants) || 0;
    return v > 0 ? Math.round((s / v) * 100) : 0;
  }

  onSubmit() {
    if (this.sevrageForm.invalid) {
      this.sevrageForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);

    try {
      const formValue = this.sevrageForm.value;
      const dateSev = new Date(formValue.dateCommune).toISOString();
      const sevrages: any[] = [];

      formValue.femelles.forEach((f: any) => {
        if (f.sevres > 0) {
          // TK-06 : cycleId dynamique depuis la bande sélectionnée
          const bande = (this.bandes() || []).find(b => b.id === formValue.bande);
          const sev = {
            id: `sev-${Date.now()}-${f.femelleId}`,
            miseBasId: f.miseBasId,
            cycleId: `cycle-${formValue.bande}-${bande?.numeroCycle || 1}`,
            femelleId: f.femelleId,
            dateSevrage: dateSev,
            sevres: f.sevres,
            cagesOccupees: Math.ceil(f.sevres / 3),
            bandeId: formValue.bande
          };
          sevrages.push(sev);
          // TK-02 : suppression du double addSevrage (bandeService.confirmerSevrage gère l'insertion)
        }
      });

      this.bandeService.confirmerSevrage(formValue.bande, sevrages);

      this.notifier.success('Sevrage de la bande enregistré avec succès.');
      // TK-07 : reset date en format ISO string
      this.sevrageForm.reset({ dateCommune: new Date().toISOString().substring(0, 10) });
      this.femellesFormArray.clear();
    } catch (e) {
      this.notifier.error('Erreur lors de la sauvegarde.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}