import { Injectable, inject } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataStoreService } from './data-store.service';
import { KpiCapacityService, CapacityKPIs } from './kpi-capacity.service';
import { KpiReproductionService, ReproductionKPIs } from './kpi-reproduction.service';
import { KpiFinanceService, FinanceKPIs } from './kpi-finance.service';
import { 
  Reproducteur, 
  Saillie, 
  MiseBas, 
  Sevrage, 
  Vente, 
  Deces, 
  Configuration, 
  Bande, 
  Clapier, 
  SessionSaillie, 
  Palpation, 
  Sexage 
} from '../models';
import { AppNotification } from './notification.service';

export interface KPIs extends CapacityKPIs, ReproductionKPIs, FinanceKPIs {}

/**
 * Service Facade centralisant l'accès à la logique métier d'élevage.
 * Agrège DataStoreService, KpiCapacityService, KpiReproductionService et KpiFinanceService.
 * Conserve une interface 100% rétrocompatible pour l'ensemble des composants UI.
 */
@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  private dataStore = inject(DataStoreService);
  private capacityKpiService = inject(KpiCapacityService);
  private reproKpiService = inject(KpiReproductionService);
  private financeKpiService = inject(KpiFinanceService);

  readonly reproducteurs$: Observable<Reproducteur[]> = this.dataStore.reproducteurs$;
  readonly saillies$: Observable<Saillie[]> = this.dataStore.saillies$;
  readonly misesBas$: Observable<MiseBas[]> = this.dataStore.misesBas$;
  readonly sevrages$: Observable<Sevrage[]> = this.dataStore.sevrages$;
  readonly ventes$: Observable<Vente[]> = this.dataStore.ventes$;
  readonly deces$: Observable<Deces[]> = this.dataStore.deces$;
  readonly bandes$: Observable<Bande[]> = this.dataStore.bandes$;
  readonly clapiers$: Observable<Clapier[]> = this.dataStore.clapiers$;
  readonly sessionsSaillie$: Observable<SessionSaillie[]> = this.dataStore.sessionsSaillie$;
  readonly palpations$: Observable<Palpation[]> = this.dataStore.palpations$;
  readonly sexages$: Observable<Sexage[]> = this.dataStore.sexages$;
  readonly config$: Observable<Configuration> = this.dataStore.config$;
  readonly notifications$: Observable<AppNotification[]> = this.dataStore.notifications$;

  readonly kpis$: Observable<KPIs> = combineLatest([
    this.dataStore.reproducteurs$,
    this.dataStore.saillies$,
    this.dataStore.misesBas$,
    this.dataStore.sevrages$,
    this.dataStore.ventes$,
    this.dataStore.config$,
    this.dataStore.bandes$,
    this.dataStore.clapiers$,
    this.dataStore.palpations$
  ]).pipe(
    map(([reproducteurs, saillies, misesBas, sevrages, ventes, config, bandes, clapiers, palpations]) => {
      const capacityKpis = this.capacityKpiService.calculateCapacityKPIs(sevrages, ventes, config, reproducteurs, clapiers);
      const reproKpis = this.reproKpiService.calculateReproductionKPIs(reproducteurs, saillies, misesBas, sevrages, ventes, config, bandes, palpations);
      const financeKpis = this.financeKpiService.calculateFinanceKPIs(ventes, sevrages, misesBas, config, reproducteurs);

      return {
        ...capacityKpis,
        ...reproKpis,
        ...financeKpis
      };
    })
  );

  get reproducteurs(): Reproducteur[] { return this.dataStore.reproducteurs; }
  get saillies(): Saillie[] { return this.dataStore.saillies; }
  get misesBas(): MiseBas[] { return this.dataStore.misesBas; }
  get sevrages(): Sevrage[] { return this.dataStore.sevrages; }
  get ventes(): Vente[] { return this.dataStore.ventes; }
  get deces(): Deces[] { return this.dataStore.deces; }
  get config(): Configuration { return this.dataStore.config; }
  get notifications(): AppNotification[] { return this.dataStore.notifications; }

  loadAllData(): void { this.dataStore.loadAllData(); }
  addNotification(notification: AppNotification): void { this.dataStore.addNotification(notification); }
  addSaillie(saillie: Saillie): void { this.dataStore.addSaillie(saillie); }
  addMiseBas(miseBas: MiseBas): void { this.dataStore.addMiseBas(miseBas); }
  addSevrage(sevrage: Sevrage): void { this.dataStore.addSevrage(sevrage); }
  addVente(vente: Vente): void { this.dataStore.addVente(vente); }
  addDeces(deces: Deces): void { this.dataStore.addDeces(deces); }
  updateReproducteur(updated: Reproducteur): void { this.dataStore.updateReproducteur(updated); }
  deleteReproducteur(id: string): void { this.dataStore.deleteReproducteur(id); }
  updateConfiguration(config: Partial<Configuration>): void { this.dataStore.updateConfiguration(config); }
}
