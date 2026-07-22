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
  Palpation, 
  Sexage,
  CycleBande,
  ReferentielBande,
  ReferentielMale,
  CalendrierSaillieItem
} from '../models';
import { AppNotification } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {
  private storageService = inject(StorageService);
  private dataApi = inject(JsonServerDataService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private readonly _reproducteurs$ = new BehaviorSubject<Reproducteur[]>([]);
  private readonly _saillies$ = new BehaviorSubject<Saillie[]>([]);
  private readonly _misesBas$ = new BehaviorSubject<MiseBas[]>([]);
  private readonly _sevrages$ = new BehaviorSubject<Sevrage[]>([]);
  private readonly _ventes$ = new BehaviorSubject<Vente[]>([]);
  private readonly _deces$ = new BehaviorSubject<Deces[]>([]);
  private readonly _bandes$ = new BehaviorSubject<Bande[]>([]);
  private readonly _clapiers$ = new BehaviorSubject<Clapier[]>([]);
  private readonly _palpations$ = new BehaviorSubject<Palpation[]>([]);
  private readonly _sexages$ = new BehaviorSubject<Sexage[]>([]);
  private readonly _cyclesBande$ = new BehaviorSubject<CycleBande[]>([]);
  private readonly _refBandes$ = new BehaviorSubject<ReferentielBande[]>([]);
  private readonly _refMales$ = new BehaviorSubject<ReferentielMale[]>([]);
  private readonly _refCalendrier$ = new BehaviorSubject<CalendrierSaillieItem[]>([]);
  private readonly _notifications$ = new BehaviorSubject<AppNotification[]>([]);

  private readonly _config$ = new BehaviorSubject<Configuration>({
    nombreCagesTotal: 108,
    nombreClapiers: 9,
    nombreCasesParClapier: 12,
    nombreFemelles: 33,
    nombreMales: 3,
    nombreBandes: 3,
    nombreFemEllesParBande: 11,
    dureeGestationJours: 31,
    jourPalpation: 15,
    dureeAllaitementMinJours: 30,
    dureeAllaitementMaxJours: 35,
    dureeSexageJours: 30,
    dureeEngraissementJours: 60,
    taillePorteeMoyenne: 6,
    densiteParCase: 3,
    ageMaturiteSexuelleMois: 5,
    decalageAgeBandesMois: 1,
    prixAlimentKg: 350,
    prixVenteDefaut: 3000
  });

  readonly reproducteurs$ = this._reproducteurs$.asObservable();
  readonly saillies$ = this._saillies$.asObservable();
  readonly misesBas$ = this._misesBas$.asObservable();
  readonly sevrages$ = this._sevrages$.asObservable();
  readonly ventes$ = this._ventes$.asObservable();
  readonly deces$ = this._deces$.asObservable();
  readonly bandes$ = this._bandes$.asObservable();
  readonly clapiers$ = this._clapiers$.asObservable();
  readonly sessionsSaillie$ = this._saillies$.asObservable();
  readonly palpations$ = this._palpations$.asObservable();
  readonly sexages$ = this._sexages$.asObservable();
  readonly cyclesBande$ = this._cyclesBande$.asObservable();
  readonly refBandes$ = this._refBandes$.asObservable();
  readonly refMales$ = this._refMales$.asObservable();
  readonly refCalendrier$ = this._refCalendrier$.asObservable();
  readonly config$ = this._config$.asObservable();
  readonly notifications$ = this._notifications$.asObservable();

  constructor() {
    this.loadAllData();
  }

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
      palpations: this.dataApi.getPalpations(),
      sexages: this.dataApi.getSexages(),
      cyclesBande: this.dataApi.getCyclesBande(),
      refBandes: this.dataApi.getReferentielBandes(),
      refMales: this.dataApi.getReferentielMales(),
      refCalendrier: this.dataApi.getReferentielCalendrierSaillie()
    }).pipe(
      catchError((err) => {
        this.logApiError('loadAllData', err);
        this.loadLocalData();
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((data) => {
      if (!data) return;

      this._reproducteurs$.next(data.reproducteurs || []);
      this._saillies$.next(data.saillies || []);
      this._misesBas$.next(data.misesBas || []);
      this._sevrages$.next(data.sevrages || []);
      this._ventes$.next(data.ventes || []);
      this._deces$.next(data.deces || []);
      this._config$.next(data.config);
      this._bandes$.next(data.bandes || []);
      this._clapiers$.next(data.clapiers || []);
      this._palpations$.next(data.palpations || []);
      this._sexages$.next(data.sexages || []);
      this._cyclesBande$.next(data.cyclesBande || []);
      this._refBandes$.next(data.refBandes || []);
      this._refMales$.next(data.refMales || []);
      this._refCalendrier$.next(data.refCalendrier || []);
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
    this._palpations$.next(this.storageService.getAllPalpations());
    this._sexages$.next(this.storageService.getAllSexages());
    this._cyclesBande$.next(this.storageService.getCyclesBande());
    this._refBandes$.next(this.storageService.getReferentielBandes());
    this._refMales$.next(this.storageService.getReferentielMales());
    this._refCalendrier$.next(this.storageService.getReferentielCalendrierSaillie());
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private logApiError(operation: string, error: unknown): void {
    console.error(`[DataStoreService] Échec json-server: ${operation}`, error);
  }

  get reproducteurs(): Reproducteur[] { return this._reproducteurs$.getValue(); }
  get saillies(): Saillie[] { return this._saillies$.getValue(); }
  get misesBas(): MiseBas[] { return this._misesBas$.getValue(); }
  get sevrages(): Sevrage[] { return this._sevrages$.getValue(); }
  get ventes(): Vente[] { return this._ventes$.getValue(); }
  get deces(): Deces[] { return this._deces$.getValue(); }
  get bandes(): Bande[] { return this._bandes$.getValue(); }
  get clapiers(): Clapier[] { return this._clapiers$.getValue(); }
  get sessionsSaillie(): Saillie[] { return this._saillies$.getValue(); }
  get palpations(): Palpation[] { return this._palpations$.getValue(); }
  get sexages(): Sexage[] { return this._sexages$.getValue(); }
  get cyclesBande(): CycleBande[] { return this._cyclesBande$.getValue(); }
  get refBandes(): ReferentielBande[] { return this._refBandes$.getValue(); }
  get refMales(): ReferentielMale[] { return this._refMales$.getValue(); }
  get refCalendrier(): CalendrierSaillieItem[] { return this._refCalendrier$.getValue(); }
  get config(): Configuration { return this._config$.getValue(); }
  get notifications(): AppNotification[] { return this._notifications$.getValue(); }

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

  addCycleBande(cycle: CycleBande): void {
    this.storageService.addCycleBande(cycle);
    this._cyclesBande$.next([...this._cyclesBande$.getValue(), cycle]);
  }

  addPalpation(palpation: Palpation): void {
    this.storageService.addPalpation(palpation);
    this._palpations$.next([...this._palpations$.getValue(), palpation]);
  }

  addSexage(sexage: Sexage): void {
    this.storageService.addSexage(sexage);
    this._sexages$.next([...this._sexages$.getValue(), sexage]);
  }

  updateBande(id: string, partial: Partial<Bande>): void {
    this.storageService.updateBande(id, partial);
    const bandes = this._bandes$.getValue().map(b => b.id === id ? { ...b, ...partial } : b);
    this._bandes$.next(bandes);
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
