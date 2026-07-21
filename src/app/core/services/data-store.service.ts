import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { JsonServerDataService } from './json-server-data.service';
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

/**
 * Service centralisé de stockage et de gestion de l'état réactif de l'application (Data Store).
 * Gère le chargement, la persistance locale/API et la réactivité des collections.
 */
@Injectable({
  providedIn: 'root'
})
export class DataStoreService {
  private storageService = inject(StorageService);
  private dataApi = inject(JsonServerDataService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  // Flux réactifs internes (BehaviorSubjects)
  private readonly _reproducteurs$ = new BehaviorSubject<Reproducteur[]>([]);
  private readonly _saillies$ = new BehaviorSubject<Saillie[]>([]);
  private readonly _misesBas$ = new BehaviorSubject<MiseBas[]>([]);
  private readonly _sevrages$ = new BehaviorSubject<Sevrage[]>([]);
  private readonly _ventes$ = new BehaviorSubject<Vente[]>([]);
  private readonly _deces$ = new BehaviorSubject<Deces[]>([]);
  private readonly _bandes$ = new BehaviorSubject<Bande[]>([]);
  private readonly _clapiers$ = new BehaviorSubject<Clapier[]>([]);
  private readonly _sessionsSaillie$ = new BehaviorSubject<SessionSaillie[]>([]);
  private readonly _palpations$ = new BehaviorSubject<Palpation[]>([]);
  private readonly _sexages$ = new BehaviorSubject<Sexage[]>([]);
  private readonly _notifications$ = new BehaviorSubject<AppNotification[]>([]);

  private readonly _config$ = new BehaviorSubject<Configuration>({
    nombreCagesTotal: 108,
    densiteParCage: 3,
    dureeGestationJours: 30,
    dureeAllaitementJours: 30,
    dureeSexageJours: 30,
    dureeEngraissementJours: 60,
    nombreCagesReproductrices: 33,
    prixAlimentKg: 350,
    prixVenteDefaut: 3000,
    nombreClapiers: 9,
    nombreCasesParClapier: 12,
    taillePorteeMoyenne: 6,
    nombreFemelles: 33,
    nombreMales: 3,
    nombreBandes: 3
  });

  // Observables publics réactifs
  readonly reproducteurs$ = this._reproducteurs$.asObservable();
  readonly saillies$ = this._saillies$.asObservable();
  readonly misesBas$ = this._misesBas$.asObservable();
  readonly sevrages$ = this._sevrages$.asObservable();
  readonly ventes$ = this._ventes$.asObservable();
  readonly deces$ = this._deces$.asObservable();
  readonly bandes$ = this._bandes$.asObservable();
  readonly clapiers$ = this._clapiers$.asObservable();
  readonly sessionsSaillie$ = this._sessionsSaillie$.asObservable();
  readonly palpations$ = this._palpations$.asObservable();
  readonly sexages$ = this._sexages$.asObservable();
  readonly config$ = this._config$.asObservable();
  readonly notifications$ = this._notifications$.asObservable();

  constructor() {
    this.loadAllData();
  }

  /**
   * Charge l'intégralité des données métier depuis l'API REST (json-server) ou le localStorage de secours.
   */
  loadAllData(): void {
    if (!this.isBrowser()) {
      this.loadLocalData();
      return;
    }

    forkJoin({
      reproducteurs: this.dataApi.getReproducteurs(),
      saillies: this.dataApi.getSaillies(),
      misesBas: this.dataApi.getMisesBas(),
      sevrages: this.dataApi.getSevrages(),
      ventes: this.dataApi.getVentes(),
      deces: this.dataApi.getDeces(),
      config: this.dataApi.getConfiguration(),
      bandes: this.dataApi.getBandes(),
      clapiers: this.dataApi.getClapiers(),
      sessionsSaillie: this.dataApi.getSessionsSaillie(),
      palpations: this.dataApi.getPalpations(),
      sexages: this.dataApi.getSexages()
    }).pipe(
      catchError((err) => {
        this.logApiError('loadAllData', err);
        this.loadLocalData();
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      if (!data) return;

      this._reproducteurs$.next(data.reproducteurs);
      this._saillies$.next(data.saillies);
      this._misesBas$.next(data.misesBas);
      this._sevrages$.next(data.sevrages);
      this._ventes$.next(data.ventes);
      this._deces$.next(data.deces);
      this._config$.next(data.config);
      this._bandes$.next(data.bandes);
      this._clapiers$.next(data.clapiers);
      this._sessionsSaillie$.next(data.sessionsSaillie);
      this._palpations$.next(data.palpations);
      this._sexages$.next(data.sexages);
    });
  }

  private loadLocalData(): void {
    this._reproducteurs$.next(this.storageService.getAllReproducteurs());
    this._saillies$.next(this.storageService.getAllSaillies());
    this._misesBas$.next(this.storageService.getAllMisesBas());
    this._sevrages$.next(this.storageService.getAllSevrages());
    this._ventes$.next(this.storageService.getAllVentes());
    this._deces$.next(this.storageService.getAllDeces());
    this._config$.next(this.storageService.getConfiguration());
    
    this._bandes$.next(this.storageService.getAllBandes());
    this._clapiers$.next(this.storageService.getAllClapiers());
    this._sessionsSaillie$.next(this.storageService.getAllSessionsSaillie());
    this._palpations$.next(this.storageService.getAllPalpations());
    this._sexages$.next(this.storageService.getAllSexages());
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private logApiError(operation: string, error: unknown): void {
    console.error(`[DataStoreService] Échec json-server: ${operation}`, error);
  }

  // Getters synchrones
  get reproducteurs(): Reproducteur[] { return this._reproducteurs$.getValue(); }
  get saillies(): Saillie[] { return this._saillies$.getValue(); }
  get misesBas(): MiseBas[] { return this._misesBas$.getValue(); }
  get sevrages(): Sevrage[] { return this._sevrages$.getValue(); }
  get ventes(): Vente[] { return this._ventes$.getValue(); }
  get deces(): Deces[] { return this._deces$.getValue(); }
  get bandes(): Bande[] { return this._bandes$.getValue(); }
  get clapiers(): Clapier[] { return this._clapiers$.getValue(); }
  get sessionsSaillie(): SessionSaillie[] { return this._sessionsSaillie$.getValue(); }
  get palpations(): Palpation[] { return this._palpations$.getValue(); }
  get sexages(): Sexage[] { return this._sexages$.getValue(); }
  get config(): Configuration { return this._config$.getValue(); }
  get notifications(): AppNotification[] { return this._notifications$.getValue(); }

  // Méthodes de mutation
  addNotification(notification: AppNotification): void {
    const current = this._notifications$.getValue();
    this._notifications$.next([notification, ...current]);
  }

  addSaillie(saillie: Saillie): void {
    const created = this.storageService.addSaillie(saillie);
    this._saillies$.next([...this._saillies$.getValue(), created]);
  }

  addMiseBas(miseBas: MiseBas): void {
    const created = this.storageService.addMiseBas(miseBas);
    this._misesBas$.next([...this._misesBas$.getValue(), created]);
  }

  addSevrage(sevrage: Sevrage): void {
    const created = this.storageService.addSevrage(sevrage);
    this._sevrages$.next([...this._sevrages$.getValue(), created]);
  }

  addVente(vente: Vente): void {
    const created = this.storageService.addVente(vente);
    this._ventes$.next([...this._ventes$.getValue(), created]);
  }

  addDeces(deces: Deces): void {
    const created = this.storageService.addDeces(deces);
    this._deces$.next([...this._deces$.getValue(), created]);
  }

  updateReproducteur(updated: Reproducteur): void {
    this.storageService.updateReproducteur(updated);
    const list = this._reproducteurs$.getValue().map(r => r.id === updated.id ? { ...r, ...updated } : r);
    this._reproducteurs$.next(list);
  }

  deleteReproducteur(id: string): void {
    this.storageService.deleteReproducteur(id);
    const list = this._reproducteurs$.getValue().filter(r => r.id !== id);
    this._reproducteurs$.next(list);
  }

  updateConfiguration(configPartial: Partial<Configuration>): void {
    const currentConfig = this._config$.getValue();
    const updated = { ...currentConfig, ...configPartial };
    this.storageService.setConfiguration(updated);
    this._config$.next(updated);
  }
}
