import { ChangeDetectionStrategy, Component, inject, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, BandeService, BandeLifecycleService, NotificationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-saisie-vente',
  providers: [provideNativeDateAdapter()],
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    FormsModule,
    PageHeaderComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule
  ],
  templateUrl: './saisie-vente.component.html',
  styleUrl: './saisie-vente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaisieVenteComponent {
  private calcService = inject(CalculationService);
  private bandeService = inject(BandeService);
  private lifecycleService = inject(BandeLifecycleService);
  private notifier = inject(NotificationService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  config = toSignal(this.calcService.config$);
  kpis = toSignal(this.calcService.kpis$);
  ventes = toSignal(this.calcService.ventes$);
  sevrages = toSignal(this.calcService.sevrages$);
  bandes = toSignal(this.bandeService.bandes$, { initialValue: [] });

  // Normes Zootechniques d'Élevage
  readonly CONSO_JOUR_LAPIN_KG = 0.110;        // 110g / lapin / jour
  readonly CONSO_JOUR_EAU_LITRE = 0.5;          // 0.5L d'eau / lapin / jour
  readonly POIDS_SAC_ALIMENT_KG = 51;           // 51kg par sac
  readonly DUREE_ENGRAISSEMENT_JOURS = 90;      // 90 jours
  readonly POIDS_MOYEN_LAPIN_KG = 2.5;          // 2.5kg par lapin fini

  // Liste réactive des bandes d'engraissement
  bandesEngraissement = computed(() => {
    const list = this.bandes() || [];
    const engrais = list.filter((b: any) => b.phase === 'Engraissement');
    return engrais.length > 0 ? engrais : list;
  });

  formVente: FormGroup;
  get venteForm(): FormGroup { return this.formVente; }
  clients = ['Marché Local', 'Centragel', 'Hôtel / Restaurant', 'Particulier', 'Grossiste', 'Autre'];

  nbVendusInput = signal<number>(10);
  prixUnitaireInput = signal<number>(10000);

  // Prix du sac d'aliment calculé selon la configuration
  prixSacAliment = computed(() => {
    const configVal = this.config();
    const prixKg = configVal?.prixAlimentKg || 350;
    return prixKg * 51;
  });

  // Coût de production zootechnique par lapin sur 90 jours
  coutProductionParLapin = computed(() => {
    const consoAlimentKg = 90 * this.CONSO_JOUR_LAPIN_KG;
    const sacs = consoAlimentKg / this.POIDS_SAC_ALIMENT_KG;
    const coutAliment = sacs * (this.prixSacAliment() || 11000);

    const eauLitres = 90 * this.CONSO_JOUR_EAU_LITRE;
    const eauM3 = eauLitres / 1000;
    const coutEau = eauM3 * 364;

    return Math.round(coutAliment + coutEau);
  });

  totalRevenu = computed(() => {
    return (this.nbVendusInput() || 0) * (this.prixUnitaireInput() || 0);
  });

  coutTotalVente = computed(() => {
    return (this.nbVendusInput() || 0) * this.coutProductionParLapin();
  });

  margeNette = computed(() => {
    return this.totalRevenu() - this.coutTotalVente();
  });

  margeParLapin = computed(() => {
    const count = this.nbVendusInput() || 0;
    return count > 0 ? Math.round(this.margeNette() / count) : 0;
  });

  tauxRentabilite = computed(() => {
    const cout = this.coutTotalVente();
    return cout > 0 ? Math.round((this.margeNette() / cout) * 100) : 0;
  });

  prixAuKgEquiv = computed(() => {
    const p = this.prixUnitaireInput() || 0;
    return Math.round((p / this.POIDS_MOYEN_LAPIN_KG) * 10) / 10;
  });

  cagesLiberees = computed(() => {
    return Math.ceil((this.nbVendusInput() || 0) / 3);
  });

  recentVentes = computed(() => {
    const list = this.ventes() || [];
    return [...list].reverse().slice(0, 5);
  });

  constructor() {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.formVente = this.fb.group({
      date: [todayStr, Validators.required],
      bandeId: ['', Validators.required],
      vendus: [10, [Validators.required, Validators.min(1)]],
      prixUnitaire: [10000, [Validators.required, Validators.min(0)]],
      client: ['Marché Local'],
      observations: ['']
    });

    this.formVente.get('vendus')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.nbVendusInput.set(Number(v) || 0));

    this.formVente.get('prixUnitaire')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.prixUnitaireInput.set(Number(p) || 0));
  }

  onSubmit(): void {
    if (this.formVente.invalid) {
      this.notifier.error('Veuillez remplir correctement les champs du formulaire.');
      return;
    }

    const formValue = this.formVente.value;
    const vendus = Number(formValue.vendus);
    const prixUnitaire = Number(formValue.prixUnitaire);
    const prixTotal = vendus * prixUnitaire;

    const selectedBandeId = formValue.bandeId;
    const bandesList = this.bandes() || [];
    const bande = (bandesList as any[]).find((b: any) => b.id === selectedBandeId);
    const cycleId = `cycle-${selectedBandeId}-${bande?.numeroCycle || 1}`;

    this.calcService.addVente({
      id: `vnt_${Date.now()}`,
      cycleId,
      bandeId: selectedBandeId,
      dateVente: formValue.date,
      vendus,
      prixUnitaire,
      prixTotal,
      client: formValue.client || 'Client direct',
      notes: formValue.observations
    });

    // Vérification de la clôture complète de la bande après vente
    const allSevrages = this.sevrages() || [];
    const allVentes = this.ventes() || [];

    const sevresBande = allSevrages.filter(s => s.bandeId === selectedBandeId).reduce((sum, s) => sum + (s.sevres || 0), 0);
    const vendusBande = allVentes.filter(v => v.bandeId === selectedBandeId).reduce((sum, v) => sum + (v.vendus || 0), 0) + vendus;

    const effectifTotal = sevresBande > 0 ? sevresBande : 77;

    if (vendusBande >= effectifTotal) {
      this.lifecycleService.cloturerCycleEtRemettreAuRepos(selectedBandeId);
      this.notifier.success(`Vente enregistrée (${prixTotal} FCFA). La bande ${selectedBandeId.toUpperCase()} est totalement vendue et remise au Repos !`);
    } else {
      const restants = Math.max(0, effectifTotal - vendusBande);
      this.notifier.success(`Vente de ${vendus} lapins enregistrée (${prixTotal} FCFA). Restants en engraissement : ${restants} lapins.`);
    }

    this.onReset();
  }

  onReset(): void {
    const todayStr = new Date().toISOString().substring(0, 10);
    this.formVente.reset({
      date: todayStr,
      bandeId: '',
      vendus: 10,
      prixUnitaire: 10000,
      client: 'Marché Local',
      observations: ''
    });
    this.nbVendusInput.set(10);
    this.prixUnitaireInput.set(10000);
  }
}