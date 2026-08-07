import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { FirestoreDataService } from './firestore-data.service';
import { FirestoreSeedService } from './firestore-seed.service';
import { AuthService } from './auth.service';
import { DEFAULT_CONFIGURATION } from '../constants/farm-config.defaults';

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
  CalendrierSaillieItem,
  Engraissement
} from '../models';
import { AppNotification } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {
  private storageService = inject(StorageService);
  private dataApi = inject(FirestoreDataService);
  private seedApi = inject(FirestoreSeedService);
  private authService = inject(AuthService);
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
  private readonly _engraissements$ = new BehaviorSubject<Engraissement[]>([]);
  private readonly _cyclesBande$ = new BehaviorSubject<CycleBande[]>([]);
  private readonly _refBandes$ = new BehaviorSubject<ReferentielBande[]>([]);
  private readonly _refMales$ = new BehaviorSubject<ReferentielMale[]>([]);
  private readonly _refCalendrier$ = new BehaviorSubject<CalendrierSaillieItem[]>([]);
  private readonly _notifications$ = new BehaviorSubject<AppNotification[]>([]);

  private readonly _config$ = new BehaviorSubject<Configuration>(DEFAULT_CONFIGURATION);


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
  readonly engraissements$ = this._engraissements$.asObservable();
  readonly cyclesBande$ = this._cyclesBande$.asObservable();
  readonly refBandes$ = this._refBandes$.asObservable();
  readonly refMales$ = this._refMales$.asObservable();
  readonly refCalendrier$ = this._refCalendrier$.asObservable();
  readonly config$ = this._config$.asObservable();
  readonly notifications$ = this._notifications$.asObservable();

  constructor() {
    // Si l'utilisateur est déjà connecté au démarrage, charger les données
    if (this.authService.isAuthenticated()) {
      this.loadAllData();
    }
  }

  async loadAllData(): Promise<void> {
    // Ne charger AUCUNE donnée de la ferme si l'utilisateur n'est pas connecté
    if (!this.authService.isAuthenticated()) {
      return;
    }

    if (!this.isBrowser()) {
      this.loadLocalData();
      return;
    }

    await this.seedApi.ensureSeeded();

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
      engraissements: this.dataApi.getEngraissements(),
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

      const repros = data.reproducteurs || [];

      this.storageService.importData({
        REPRODUCTEURS: repros,
        SAILLIES: data.saillies,
        MISES_BAS: data.misesBas,
        SEVRAGES: data.sevrages,
        VENTES: data.ventes,
        DECES: data.deces,
        CONFIGURATION: data.config,
        BANDES: data.bandes,
        CLAPIERS: data.clapiers,
        PALPATIONS: data.palpations,
        SEXAGES: data.sexages,
        ENGRAISSEMENTS: data.engraissements,
        CYCLES_BANDE: data.cyclesBande,
        REFERENTIEL_BANDES: data.refBandes,
        REFERENTIEL_MALES: data.refMales,
        REFERENTIEL_CALENDRIER: data.refCalendrier
      });

      this._reproducteurs$.next(repros);
      this._saillies$.next(data.saillies || []);
      this._misesBas$.next(data.misesBas || []);
      this._sevrages$.next(data.sevrages || []);
      this._ventes$.next(data.ventes || []);
      this._deces$.next(data.deces || []);
      // Fusion avec DEFAULT_CONFIGURATION : les valeurs Firestore priment,
      // SAUF prixVenteDefaut qui utilise la valeur maximale (défaut ou Firestore)
      // pour éviter qu'une ancienne valeur stale (ex: 3000) n'écrase le défaut (10000).
      const mergedConfig: Configuration = {
        ...DEFAULT_CONFIGURATION,
        ...data.config,
        prixVenteDefaut: Math.max(
          data.config?.prixVenteDefaut || 0,
          DEFAULT_CONFIGURATION.prixVenteDefaut
        )
      };
      this._config$.next(mergedConfig);
      this._bandes$.next(data.bandes || []);
      this._clapiers$.next(data.clapiers || []);
      this._palpations$.next(data.palpations || []);
      this._sexages$.next(data.sexages || []);
      this._engraissements$.next(data.engraissements || []);
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
    this._engraissements$.next(this.storageService.getAllEngraissements());
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
  get engraissements(): Engraissement[] { return this._engraissements$.getValue(); }
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
    if (this.isBrowser()) {
      this.dataApi.createSaillie(created).subscribe({
        error: (err) => this.logApiError('addSaillie', err)
      });
    }
  }

  addMiseBas(miseBas: MiseBas): void {
    const created = this.storageService.addMiseBas(miseBas);
    this._misesBas$.next([...this._misesBas$.getValue(), created]);
    if (this.isBrowser()) {
      this.dataApi.createMiseBas(created).subscribe({
        error: (err) => this.logApiError('addMiseBas', err)
      });
    }
  }

  addSevrage(sevrage: Sevrage): void {
    const created = this.storageService.addSevrage(sevrage);
    this._sevrages$.next([...this._sevrages$.getValue(), created]);
    if (this.isBrowser()) {
      this.dataApi.createSevrage(created).subscribe({
        error: (err) => this.logApiError('addSevrage', err)
      });
    }
  }

  addVente(vente: Vente): void {
    const created = this.storageService.addVente(vente);
    this._ventes$.next([...this._ventes$.getValue(), created]);

    // TK-09 : libérer les cages d'engraissement après une vente (3 lapins/cage)
    const cagesLiberees = Math.ceil((vente.vendus || 0) / 3);
    if (cagesLiberees > 0) {
      const clapiers = [...this._clapiers$.getValue()];
      const engraisIndexes = clapiers
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.type === 'Engraissement')
        .sort((a, b) => (b.c.casesOccupees || 0) - (a.c.casesOccupees || 0));
      let remaining = cagesLiberees;
      for (const { c, i } of engraisIndexes) {
        if (remaining <= 0) break;
        const liberable = Math.min(remaining, c.casesOccupees || 0);
        clapiers[i] = { ...c, casesOccupees: (c.casesOccupees || 0) - liberable };
        remaining -= liberable;
      }
      this._clapiers$.next(clapiers);
    }

    if (this.isBrowser()) {
      this.dataApi.createVente(created).subscribe({
        error: (err) => this.logApiError('addVente', err)
      });
    }
  }

  addDeces(deces: Deces): void {
    const created = this.storageService.addDeces(deces);
    this._deces$.next([...this._deces$.getValue(), created]);

    if (deces.reproducteurId) {
      const list = this._reproducteurs$.getValue();
      const idx = list.findIndex(r => r.id === deces.reproducteurId);
      if (idx !== -1) {
        const repro = list[idx];
        const updated = {
          ...repro,
          etat: (repro.sexe === 'F' ? 'Morte' : 'Mort') as any
        };
        this.updateReproducteur(updated);
      }
    }

    if (this.isBrowser()) {
      this.dataApi.createDeces(created).subscribe({
        error: (err) => this.logApiError('addDeces', err)
      });
    }
  }

  addCycleBande(cycle: CycleBande): void {
    this.storageService.addCycleBande(cycle);
    this._cyclesBande$.next([...this._cyclesBande$.getValue(), cycle]);
    if (this.isBrowser()) {
      this.dataApi.createCycleBande(cycle).subscribe({
        error: (err) => this.logApiError('addCycleBande', err)
      });
    }
  }

  addPalpation(palpation: Palpation): void {
    this.storageService.addPalpation(palpation);
    this._palpations$.next([...this._palpations$.getValue(), palpation]);
    if (this.isBrowser()) {
      this.dataApi.createPalpation(palpation).subscribe({
        error: (err) => this.logApiError('addPalpation', err)
      });
    }
  }

  addSexage(sexage: Sexage): void {
    this.storageService.addSexage(sexage);
    this._sexages$.next([...this._sexages$.getValue(), sexage]);
    if (this.isBrowser()) {
      this.dataApi.createSexage(sexage).subscribe({
        error: (err) => this.logApiError('addSexage', err)
      });
    }
  }

  addEngraissement(engraissement: Engraissement): void {
    const created = this.storageService.addEngraissement(engraissement);
    this._engraissements$.next([...this._engraissements$.getValue(), created]);
    if (this.isBrowser()) {
      this.dataApi.createEngraissement(created).subscribe({
        error: (err) => this.logApiError('addEngraissement', err)
      });
    }
  }

  updateBande(id: string, partial: Partial<Bande>): void {
    const bandes = [...this._bandes$.getValue()];
    const idx = bandes.findIndex(b => b.id === id);
    if (idx !== -1) {
      bandes[idx] = { ...bandes[idx], ...partial };
      this._bandes$.next(bandes);
      this.storageService.saveBandes(bandes);
      if (this.isBrowser()) {
        this.dataApi.patchBande(id, partial).subscribe({
          error: (err: any) => this.logApiError('updateBande', err)
        });
      }
    }
  }

  updateClapier(id: string, partial: Partial<Clapier>): void {
    const clapiers = [...this._clapiers$.getValue()];
    const idx = clapiers.findIndex(c => c.id === id);
    if (idx !== -1) {
      clapiers[idx] = { ...clapiers[idx], ...partial };
      this._clapiers$.next(clapiers);
      this.storageService.saveClapiers(clapiers);
    }
  }

  updateAllClapiers(clapiersList: Clapier[]): void {
    this._clapiers$.next([...clapiersList]);
    this.storageService.saveClapiers(clapiersList);
  }

  updateReproducteur(updated: Reproducteur): void {
    this.storageService.updateReproducteur(updated);
    const list = this._reproducteurs$.getValue().map(r => r.id === updated.id ? { ...r, ...updated } : r);
    this._reproducteurs$.next(list);
    if (this.isBrowser()) {
      this.dataApi.updateReproducteur(updated).subscribe({
        error: (err) => this.logApiError('updateReproducteur', err)
      });
    }
  }

  deleteReproducteur(id: string): void {
    this.storageService.deleteReproducteur(id);
    const list = this._reproducteurs$.getValue().filter(r => r.id !== id);
    this._reproducteurs$.next(list);
    if (this.isBrowser()) {
      this.dataApi.deleteReproducteur(id).subscribe({
        error: (err) => this.logApiError('deleteReproducteur', err)
      });
    }
  }

  updateConfiguration(configPartial: Partial<Configuration>): void {
    const currentConfig = this._config$.getValue();
    const updated = { ...currentConfig, ...configPartial };
    this.storageService.setConfiguration(updated);
    this._config$.next(updated);
    if (this.isBrowser()) {
      this.dataApi.updateConfiguration(updated).subscribe({
        error: (err) => this.logApiError('updateConfiguration', err)
      });
    }
  }

  updateVente(updated: Vente): void {
    const list = this._ventes$.getValue().map(v => v.id === updated.id ? { ...v, ...updated } : v);
    this._ventes$.next(list);
    if (this.isBrowser()) {
      this.dataApi.updateVente(updated).subscribe({
        error: (err) => this.logApiError('updateVente', err)
      });
    }
  }

  deleteVente(id: string): void {
    const list = this._ventes$.getValue().filter(v => v.id !== id);
    this._ventes$.next(list);
    if (this.isBrowser()) {
      this.dataApi.deleteVente(id).subscribe({
        error: (err) => this.logApiError('deleteVente', err)
      });
    }
  }

  updateMiseBas(updated: MiseBas): void {
    const list = this._misesBas$.getValue().map(m => m.id === updated.id ? { ...m, ...updated } : m);
    this._misesBas$.next(list);
    if (this.isBrowser()) {
      this.dataApi.updateMiseBas(updated).subscribe({
        error: (err) => this.logApiError('updateMiseBas', err)
      });
    }
  }

  deleteMiseBas(id: string): void {
    const list = this._misesBas$.getValue().filter(m => m.id !== id);
    this._misesBas$.next(list);
    if (this.isBrowser()) {
      this.dataApi.deleteMiseBas(id).subscribe({
        error: (err) => this.logApiError('deleteMiseBas', err)
      });
    }
  }

  updateSevrage(updated: Sevrage): void {
    const list = this._sevrages$.getValue().map(s => s.id === updated.id ? { ...s, ...updated } : s);
    this._sevrages$.next(list);
    if (this.isBrowser()) {
      this.dataApi.updateSevrage(updated).subscribe({
        error: (err) => this.logApiError('updateSevrage', err)
      });
    }
  }

  deleteSevrage(id: string): void {
    const list = this._sevrages$.getValue().filter(s => s.id !== id);
    this._sevrages$.next(list);
    if (this.isBrowser()) {
      this.dataApi.deleteSevrage(id).subscribe({
        error: (err) => this.logApiError('deleteSevrage', err)
      });
    }
  }
}
