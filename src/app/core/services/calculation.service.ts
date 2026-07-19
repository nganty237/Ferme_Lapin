import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { JsonServerDataService } from './json-server-data.service';
import { Reproducteur, Saillie, MiseBas, Sevrage, Vente, Deces, Configuration } from '../models';

export interface KPIs {
  capaciteTheorique: number;
  capaciteReelle: number;
  tauxUtilisationCages: number;
  occupationCages: { pourcentage: number; occupees: number; totales: number };
  prochainesLiberations: { j30: number; j60: number; j90: number };
  delaiLiberationCagesJours: number;
  prochaineVenteDate?: string;

  productiviteParFemelleAn: number;
  tailleMoyennePortee: number;
  porteesParFemelleAn: number;

  viabiliteImmediate: number;
  tauxSurvieAllaitement: number;
  tauxSurvieEngraissement: number;

  productiviteParMale: Record<string, number>;

  revenuMoyenPortee: number;
  coutProductionParLapin: number;
  margeBruteTotale: number;
  rentabiliteFemelleAn: number;

  goulotPrincipal: 'Cages engraissement' | 'Femelles reproductrices' | 'Mâles' | 'Aucun';
  cagesSupplementairesPourObjectif: number;
  roiAjouterCages: { investissement: number; revenuNetMensuel: number; paybackMonths: number; roiAnnuelPourcent: number };

  productiviteParFemelle: number;
  tauxFecondite: number;
  nombrePorteesEnCours: number;
  phasesBandes: { A: string; B: string; C: string };
}

@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  private storageService = inject(StorageService);
  private dataApi = inject(JsonServerDataService);

  private readonly _reproducteurs$ = new BehaviorSubject<Reproducteur[]>([]);
  private readonly _saillies$ = new BehaviorSubject<Saillie[]>([]);
  private readonly _misesBas$ = new BehaviorSubject<MiseBas[]>([]);
  private readonly _sevrages$ = new BehaviorSubject<Sevrage[]>([]);
  private readonly _ventes$ = new BehaviorSubject<Vente[]>([]);
  private readonly _deces$ = new BehaviorSubject<Deces[]>([]);
  private readonly _config$ = new BehaviorSubject<Configuration>({
    nombreCagesTotal: 144,
    densiteParCage: 3,
    dureeGestationJours: 31,
    dureeAllaitementJours: 31,
    dureeEngraissementJours: 120,
    nombreCagesReproductrices: 24,
    prixAlimentKg: 350,
    prixVenteDefaut: 3000,
  });
  private readonly _notifications$ = new BehaviorSubject<any[]>([]);

  
  readonly reproducteurs$ = this._reproducteurs$.asObservable();

  
  readonly saillies$ = this._saillies$.asObservable();

  
  readonly misesBas$ = this._misesBas$.asObservable();

  readonly sevrages$ = this._sevrages$.asObservable();

  
  readonly ventes$ = this._ventes$.asObservable();

  
  readonly deces$ = this._deces$.asObservable();

  
  readonly config$ = this._config$.asObservable();

  
  readonly notifications$ = this._notifications$.asObservable();

  
  readonly kpis$: Observable<KPIs> = combineLatest([
    this._reproducteurs$,
    this._saillies$,
    this._misesBas$,
    this._sevrages$,
    this._ventes$,
    this._config$,
  ]).pipe(
    map(([reproducteurs, saillies, misesBas, sevrages, ventes, config]) =>
      this.computeAllKpis(reproducteurs, saillies, misesBas, sevrages, ventes, config)
    )
  );

  
  /**
   * Initialise le service.
   * Logique : prepare les dependances et lance les traitements de demarrage.
   */
  constructor() {
    this.loadAllData();
  }

  
  
  /**
   * Charge toutes les donnees metier en memoire reactive.
   * Logique : lit le stockage local puis alimente les BehaviorSubject.
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
    }).pipe(
      catchError((error) => {
        console.warn('[CalculationService] API locale indisponible, fallback localStorage.', error);
        return of(null);
      })
    ).subscribe((data) => {
      if (!data) {
        this.loadLocalData();
        return;
      }

      this._reproducteurs$.next(data.reproducteurs);
      this._saillies$.next(data.saillies);
      this._misesBas$.next(data.misesBas);
      this._sevrages$.next(data.sevrages);
      this._ventes$.next(data.ventes);
      this._deces$.next(data.deces);
      this._config$.next(data.config);
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
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private logApiError(operation: string, error: unknown): void {
    console.error(`[CalculationService] Echec json-server: ${operation}`, error);
  }

  
  
  /**
   * Calcule l ensemble des indicateurs metier.
   * Logique : agrege reproduction, sevrages, ventes, capacite et configuration.
   */
  private computeAllKpis(
    reproducteurs: any[],
    saillies: any[],
    misesBas: any[],
    sevrages: any[],
    ventes: any[],
    config: any
  ): KPIs {
    const totalSevres = sevrages.reduce((sum: number, s: any) => sum + (s.sevres || 0), 0);
    const totalVendus = ventes.reduce((sum: number, v: any) => sum + (v.vendus || 0), 0);
    const activeEngraissement = Math.max(0, totalSevres - totalVendus);

    const capacityEngraissement = (config.nombreCagesTotal || 180) - (config.nombreCagesReproductrices || 36);
    const density = config.densiteParCage || 3;
    const capacityTheorique = capacityEngraissement * density;

    const occupees = Math.ceil(activeEngraissement / density);
    const pourcentage = capacityEngraissement > 0 ? Math.round((occupees / capacityEngraissement) * 100) : 0;
    const occupationCages = { pourcentage: Math.min(pourcentage, 100), occupees, totales: capacityEngraissement };

    const capacityReal = activeEngraissement;
    const utilizationRate = capacityTheorique > 0 ? Math.round((capacityReal / capacityTheorique) * 100) : 0;

    const sortedSevrages = [...sevrages].sort((a, b) => new Date(a.dateSevrage).getTime() - new Date(b.dateSevrage).getTime());
    let tempCumulativeSevres = 0;
    const soldWeaningIds = new Set<string>();
    for (const s of sortedSevrages) {
      tempCumulativeSevres += s.sevres || 0;
      if (totalVendus >= tempCumulativeSevres) {
        soldWeaningIds.add(s.id);
      }
    }

    const isWeaningSold = (weaning: any): boolean => {
      return soldWeaningIds.has(weaning.id);
    };

    let j30 = 0, j60 = 0, j90 = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextSaleDays = 999;
    let nextSaleDateStr = undefined;

    for (const s of sevrages) {
      if (!isWeaningSold(s)) {
        const dateSevrage = new Date(s.dateSevrage);
        const expectedSaleDate = new Date(dateSevrage);
        expectedSaleDate.setDate(expectedSaleDate.getDate() + 120);
        expectedSaleDate.setHours(0, 0, 0, 0);

        const diffTime = expectedSaleDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const cagesCount = Math.ceil((s.sevres || 0) / density);
        if (diffDays <= 30) j30 += cagesCount;
        else if (diffDays <= 60) j60 += cagesCount;
        else j90 += cagesCount;

        if (diffDays > 0 && diffDays < nextSaleDays) {
          nextSaleDays = diffDays;
          nextSaleDateStr = expectedSaleDate.toISOString().slice(0, 10);
        }
      }
    }

    const delayLiberation = nextSaleDays === 999 ? 0 : nextSaleDays;

    const femellesActives = reproducteurs.filter(
      (r) => r.sexe === 'F' && r.etat !== 'Réformé' && r.etat !== 'Mort'
    );
    const nbFemelles = femellesActives.length || 1;

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const nbInLastYear = misesBas.filter(mb => new Date(mb.dateMiseBas) >= oneYearAgo)
      .reduce((sum, mb) => sum + (mb.vivants || 0), 0);
    const prodFemelleAn = Math.round((nbInLastYear / nbFemelles) * 10) / 10;

    const averageLitter = misesBas.length > 0 ? Math.round((misesBas.reduce((sum, mb) => sum + (mb.vivants || 0), 0) / misesBas.length) * 10) / 10 : 0;
    const littersPerFemelleAn = misesBas.length > 0 ? Math.round((misesBas.length / nbFemelles) * 10) / 10 : 0;

    const totalBorn = misesBas.reduce((sum, mb) => sum + (mb.nes || 0), 0);
    const totalLiveBorn = misesBas.reduce((sum, mb) => sum + (mb.vivants || 0), 0);
    const viabImmediate = totalBorn > 0 ? Math.round((totalLiveBorn / totalBorn) * 100) : 0;

    const survieAllaitement = totalLiveBorn > 0 ? Math.round((totalSevres / totalLiveBorn) * 100) : 0;
    const survieEngraissement = totalSevres > 0 ? Math.round((totalVendus / totalSevres) * 100) : 0;

    const saillieVivantsMap = new Map<string, number>();
    for (const mb of misesBas) {
      if (mb.saillieId) {
        saillieVivantsMap.set(mb.saillieId, (saillieVivantsMap.get(mb.saillieId) || 0) + (mb.vivants || 0));
      }
    }

    const maleSailliesMap = new Map<string, string[]>();
    for (const s of saillies) {
      if (s.maleId) {
        if (!maleSailliesMap.has(s.maleId)) {
          maleSailliesMap.set(s.maleId, []);
        }
        maleSailliesMap.get(s.maleId)!.push(s.id);
      }
    }

    const productiviteParMale: Record<string, number> = {};
    for (const m of reproducteurs) {
      if (m.sexe === 'M') {
        const maleSailliesIds = maleSailliesMap.get(m.id) || [];
        let totalMaleVivants = 0;
        for (const saillieId of maleSailliesIds) {
          totalMaleVivants += saillieVivantsMap.get(saillieId) || 0;
        }
        productiviteParMale[m.id] = maleSailliesIds.length > 0 
          ? Math.round((totalMaleVivants / maleSailliesIds.length) * 10) / 10 
          : 0;
      }
    }

    const totalRevenue = ventes.reduce((sum: number, v: any) => sum + (v.prixTotal || 0), 0);
    const averageRevenuePortee = sevrages.length > 0 ? Math.round(totalRevenue / sevrages.length) : 0;

    const coutAlimentParLapin = (config.prixAlimentKg || 350) * 5;
    const coutProductionParLapin = coutAlimentParLapin + 500;
    const totalProdCosts = totalVendus * coutProductionParLapin;
    const totalMargin = Math.max(0, totalRevenue - totalProdCosts);
    const marginPerFemelleAn = Math.round(totalMargin / nbFemelles);

    const capacityFemales = nbFemelles * 8;
    const capacityCages = capacityEngraissement * density;
    const goulotPrincipal = capacityFemales < capacityCages ? 'Femelles reproductrices' : 'Cages engraissement';

    const cagesSupplementairesPourObjectif = Math.max(0, 800 - capacityEngraissement);

    const marginPerRabbit = (config.prixVenteDefaut || 3000) - coutProductionParLapin;
    const addRabbitsSalesPerMonth = (50 * 3) / 4;
    const netMonthlyROI = Math.round(addRabbitsSalesPerMonth * marginPerRabbit);
    const paybackMonths = netMonthlyROI > 0 ? Math.round((2000000 / netMonthlyROI) * 10) / 10 : 0;
    const roiAnnuelPourcent = netMonthlyROI > 0 ? Math.round(((netMonthlyROI * 12) / 2000000) * 100) : 0;

    return {
      capaciteTheorique: capacityTheorique,
      capaciteReelle: capacityReal,
      tauxUtilisationCages: utilizationRate,
      occupationCages,
      prochainesLiberations: { j30, j60, j90 },
      delaiLiberationCagesJours: delayLiberation,
      prochaineVenteDate: nextSaleDateStr,

      productiviteParFemelleAn: prodFemelleAn,
      tailleMoyennePortee: averageLitter,
      porteesParFemelleAn: littersPerFemelleAn,

      viabiliteImmediate: viabImmediate,
      tauxSurvieAllaitement: survieAllaitement,
      tauxSurvieEngraissement: survieEngraissement,

      productiviteParMale,

      revenuMoyenPortee: averageRevenuePortee,
      coutProductionParLapin,
      margeBruteTotale: totalMargin,
      rentabiliteFemelleAn: marginPerFemelleAn,

      goulotPrincipal,
      cagesSupplementairesPourObjectif,
      roiAjouterCages: { investissement: 2000000, revenuNetMensuel: netMonthlyROI, paybackMonths, roiAnnuelPourcent },

      productiviteParFemelle: this.calcProductiviteParFemelle(reproducteurs, misesBas),
      tauxFecondite: this.calcTauxFecondite(saillies, misesBas),
      nombrePorteesEnCours: this.countPorteesEnCours(sevrages, ventes),
      phasesBandes: this.calcPhasesBandes(saillies, misesBas, sevrages),
    };
  }

  
  
  /**
   * KPI - Productivite par femelle active.
   * Logique : rapporte les naissances vivantes au nombre de femelles actives.
   */
  private calcProductiviteParFemelle(reproducteurs: any[], misesBas: any[]): number {
    const femellesActives = reproducteurs.filter(
      (r) => r.sexe === 'F' && r.etat !== 'Réformé' && r.etat !== 'Mort'
    );
    const nbFemelles = femellesActives.length;
    if (nbFemelles === 0) return 0;

    const totalNes = misesBas.reduce((sum: number, mb: any) => sum + (mb.vivants || 0), 0);

    const result = totalNes / nbFemelles / 12;
    return Math.round(result * 100) / 100;
  }

  
  
  /**
   * KPI - Taux de survie pendant l allaitement.
   * Logique : compare les lapereaux sevres aux lapereaux nes vivants.
   */
  private calcTauxSurvieAllaitement(misesBas: any[], sevrages: any[]): number {
    if (misesBas.length === 0 || sevrages.length === 0) return 0;

    let totalNes = 0;
    let totalSevres = 0;

    for (const sev of sevrages) {
      const mb = misesBas.find((m: any) => m.id === sev.miseBasId);
      if (mb && mb.vivants > 0) {
        totalNes += mb.vivants;
        totalSevres += sev.sevres || 0;
      }
    }

    if (totalNes === 0) return 0;
    return Math.round((totalSevres / totalNes) * 100);
  }

  
  
  /**
   * KPI - Occupation des cages d engraissement.
   * Logique : compare les lapins non vendus a la capacite totale disponible.
   */
  private calcOccupationCages(
    sevrages: any[],
    ventes: any[],
    config: any
  ): { pourcentage: number; occupees: number; totales: number } {
    const capaciteTotale = (config.nombreCagesTotal || 144) * (config.densiteParCage || 3);

    const totalSevres = sevrages.reduce((sum: number, s: any) => sum + (s.sevres || 0), 0);
    const totalVendus = ventes.reduce((sum: number, v: any) => sum + (v.vendus || 0), 0);
    const occupees = Math.max(0, totalSevres - totalVendus);

    const pourcentage = capaciteTotale > 0 ? Math.round((occupees / capaciteTotale) * 100) : 0;

    return {
      pourcentage: Math.min(pourcentage, 100),
      occupees,
      totales: capaciteTotale,
    };
  }

  
  
  /**
   * KPI - Taux de fecondite.
   * Logique : compare les mises-bas realisees aux saillies enregistrees.
   */
  private calcTauxFecondite(saillies: any[], misesBas: any[]): number {
    if (saillies.length === 0) return 0;

    const sailliesAvecMiseBas = new Set(misesBas.map((mb: any) => mb.saillieId).filter(Boolean));
    const nbReussies = sailliesAvecMiseBas.size || misesBas.length;

    return Math.round((nbReussies / saillies.length) * 100);
  }

  
  
  /**
   * KPI 5 - Nombre de portees en cours.
   * Logique : compte les sevrages dont les lapins n ont pas encore ete entierement vendus.
   */
  private countPorteesEnCours(sevrages: any[], ventes: any[]): number {
    const totalSevres = sevrages.reduce((sum: number, s: any) => sum + (s.sevres || 0), 0);
    const totalVendus = ventes.reduce((sum: number, v: any) => sum + (v.vendus || 0), 0);

    if (totalSevres <= totalVendus) return 0;

    let restant = totalSevres - totalVendus;
    let porteesEnCours = 0;

    const sorted = [...sevrages].sort((a, b) => {
      const da = new Date(a.dateSevrage || 0).getTime();
      const db = new Date(b.dateSevrage || 0).getTime();
      return db - da;
    });

    for (const sev of sorted) {
      if (restant <= 0) break;
      porteesEnCours++;
      restant -= sev.sevres || 0;
    }

    return porteesEnCours;
  }

  
  
  /**
   * KPI - Phase courante des bandes.
   * Logique : deduit gestation, allaitement ou repos a partir des derniers evenements.
   */
  private calcPhasesBandes(
    saillies: any[],
    misesBas: any[],
    sevrages: any[]
  ): { A: string; B: string; C: string } {
    const allEvents = [
      ...saillies.map((s: any) => ({ type: 'saillie', date: s.dateSaillie, id: s.id })),
      ...misesBas.map((m: any) => ({ type: 'miseBas', date: m.dateMiseBas, saillieId: m.saillieId, id: m.id })),
      ...sevrages.map((s: any) => ({ type: 'sevrage', date: s.dateSevrage, miseBasId: s.miseBasId, id: s.id })),
    ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    const dernieresSaillies = this.getLastN(saillies, 'dateSaillie', 3);
    const phases: string[] = [];

    for (let i = 0; i < 3; i++) {
      const saillie = dernieresSaillies[i];
      if (!saillie) {
        phases.push('Saillies');
        continue;
      }

      const mb = misesBas.find((m: any) => m.saillieId === saillie.id);
      if (!mb) {
        phases.push('Gestation');
        continue;
      }

      const sev = sevrages.find((s: any) => s.miseBasId === mb.id);
      if (!sev) {
        phases.push('Allaitement');
        continue;
      }

      phases.push('Repos');
    }

    return {
      A: phases[0] || 'Saillies',
      B: phases[1] || 'Saillies',
      C: phases[2] || 'Saillies',
    };
  }

  
  
  /**
   * Recupere les derniers elements selon une date.
   * Logique : trie les donnees par date decroissante puis limite le resultat.
   */
  private getLastN(items: any[], dateField: string, n: number): any[] {
    return [...items]
      .sort((a, b) => new Date(b[dateField] || 0).getTime() - new Date(a[dateField] || 0).getTime())
      .slice(0, n);
  }

  
  /**
   * Execute reproducteurs.
   * Logique : encapsule le traitement metier associe.
   */
  get reproducteurs(): Reproducteur[] {
    return this._reproducteurs$.getValue();
  }

  
  /**
   * Execute saillies.
   * Logique : encapsule le traitement metier associe.
   */
  get saillies(): Saillie[] {
    return this._saillies$.getValue();
  }

  
  /**
   * Execute misesBas.
   * Logique : encapsule le traitement metier associe.
   */
  get misesBas(): MiseBas[] {
    return this._misesBas$.getValue();
  }

  
  /**
   * Execute sevrages.
   * Logique : encapsule le traitement metier associe.
   */
  get sevrages(): Sevrage[] {
    return this._sevrages$.getValue();
  }

  
  /**
   * Execute ventes.
   * Logique : encapsule le traitement metier associe.
   */
  get ventes(): Vente[] {
    return this._ventes$.getValue();
  }

  
  /**
   * Execute deces.
   * Logique : encapsule le traitement metier associe.
   */
  get deces(): Deces[] {
    return this._deces$.getValue();
  }

  
  /**
   * Execute config.
   * Logique : encapsule le traitement metier associe.
   */
  get config(): Configuration {
    return this._config$.getValue();
  }

  
  /**
   * Execute notifications.
   * Logique : encapsule le traitement metier associe.
   */
  get notifications(): any[] {
    return this._notifications$.getValue();
  }

  
  /**
   * Remplace les reproducteurs en memoire.
   * Logique : pousse la nouvelle liste dans le flux reactif.
   */
  setReproducteurs(data: Reproducteur[]): void {
    this._reproducteurs$.next(data);
  }

  
  /**
   * Remplace les saillies en memoire.
   * Logique : pousse la nouvelle liste dans le flux reactif.
   */
  setSaillies(data: Saillie[]): void {
    this._saillies$.next(data);
  }

  
  /**
   * Remplace les mises-bas en memoire.
   * Logique : pousse la nouvelle liste dans le flux reactif.
   */
  setMisesBas(data: MiseBas[]): void {
    this._misesBas$.next(data);
  }

  
  /**
   * Remplace les sevrages en memoire.
   * Logique : pousse la nouvelle liste dans le flux reactif.
   */
  setSevrages(data: Sevrage[]): void {
    this._sevrages$.next(data);
  }

  
  /**
   * Remplace les ventes en memoire.
   * Logique : pousse la nouvelle liste dans le flux reactif.
   */
  setVentes(data: Vente[]): void {
    this._ventes$.next(data);
  }

  
  /**
   * Remplace les deces en memoire.
   * Logique : pousse la nouvelle liste dans le flux reactif.
   */
  setDeces(data: Deces[]): void {
    this._deces$.next(data);
  }

  
  /**
   * Remplace la configuration en memoire.
   * Logique : pousse la nouvelle configuration dans le flux reactif.
   */
  setConfig(data: Configuration): void {
    this._config$.next(data);
  }

  
  /**
   * Remplace les notifications en memoire.
   * Logique : pousse la nouvelle liste dans le flux reactif.
   */
  setNotifications(data: any[]): void {
    this._notifications$.next(data);
  }

  
  /**
   * Ajoute une notification applicative.
   * Logique : remplace une notification existante de meme id puis remet la liste a jour.
   */
  addNotification(notification: any): void {
    const current = this._notifications$.getValue();
    this._notifications$.next([notification, ...current]);
  }

  
  /**
   * Ajoute une saillie.
   * Logique : genere un id si necessaire, persiste la liste et retourne l entree creee.
   */
  addSaillie(saillie: any): void {
    const dateSaillie = typeof saillie.dateSaillie === 'string' ? new Date(saillie.dateSaillie) : saillie.dateSaillie;
    const dateMiseBasPrevue = new Date(dateSaillie);
    dateMiseBasPrevue.setDate(dateMiseBasPrevue.getDate() + 31);

    const saillieToSave = {
      ...saillie,
      dateSaillie,
      dateMiseBasPrevue
    };

    const newSaillie = this.storageService.addSaillie(saillieToSave);
    this.dataApi.createSaillie(newSaillie).subscribe({
      error: (error) => this.logApiError('createSaillie', error),
    });
    const currentSaillies = this._saillies$.getValue();
    this._saillies$.next([...currentSaillies, newSaillie]);

    const reproducteurs = this._reproducteurs$.getValue();
    const updatedRepros = reproducteurs.map((r) => {
      if (r.id === saillie.femelleId) {
        const updated = { ...r, etat: 'En gestation' as const };
        this.storageService.updateReproducteur(updated);
        this.dataApi.updateReproducteur(updated).subscribe({
          error: (error) => this.logApiError('updateReproducteur', error),
        });
        return updated;
      }
      return r;
    });
    this._reproducteurs$.next(updatedRepros);
  }

  
  /**
   * Ajoute une mise-bas.
   * Logique : calcule les valeurs derivees, persiste l evenement et met a jour l etat femelle.
   */
  addMiseBas(miseBas: any): void {
    const nes = Number(miseBas.nes);
    const vivants = Number(miseBas.vivants);
    const mortsNes = Math.max(0, nes - vivants);
    const viabiliteCalculee = nes > 0 ? Math.round((vivants / nes) * 100) : 0;

    const newMiseBas = this.storageService.addMiseBas({
      ...miseBas,
      vivants,
      mortsNes,
      viabiliteCalculee
    });
    this.dataApi.createMiseBas(newMiseBas).subscribe({
      error: (error) => this.logApiError('createMiseBas', error),
    });

    const currentMisesBas = this._misesBas$.getValue();
    this._misesBas$.next([...currentMisesBas, newMiseBas]);

    const currentRepros = this._reproducteurs$.getValue();
    const updatedRepros = currentRepros.map((r) => {
      if (r.id === miseBas.femelleId) {
        const updated = { ...r, etat: 'En allaitement' as const };
        this.storageService.updateReproducteur(updated);
        this.dataApi.updateReproducteur(updated).subscribe({
          error: (error) => this.logApiError('updateReproducteur', error),
        });
        return updated;
      }
      return r;
    });
    this._reproducteurs$.next(updatedRepros);
  }

  
  /**
   * Ajoute un sevrage.
   * Logique : calcule les cages occupees, persiste l evenement et remet la femelle au repos.
   */
  addSevrage(sevrage: any): void {
    const sevres = Number(sevrage.sevres);
    const density = this.config.densiteParCage || 3;
    const cagesOccupees = Math.ceil(sevres / density);

    const newSevrage = this.storageService.addSevrage({
      ...sevrage,
      sevres,
      cagesOccupees
    });
    this.dataApi.createSevrage(newSevrage).subscribe({
      error: (error) => this.logApiError('createSevrage', error),
    });

    const currentSevrages = this._sevrages$.getValue();
    this._sevrages$.next([...currentSevrages, newSevrage]);

    const mb = this.misesBas.find((m: any) => m.id === sevrage.miseBasId);
    if (mb) {
      const currentRepros = this._reproducteurs$.getValue();
      const updatedRepros = currentRepros.map((r) => {
        if (r.id === mb.femelleId) {
          const updated = { ...r, etat: 'Au repos' as const };
          this.storageService.updateReproducteur(updated);
          this.dataApi.updateReproducteur(updated).subscribe({
            error: (error) => this.logApiError('updateReproducteur', error),
          });
          return updated;
        }
        return r;
      });
      this._reproducteurs$.next(updatedRepros);
    }
  }

  
  /**
   * Ajoute une vente.
   * Logique : normalise les montants puis persiste la vente et le flux reactif.
   */
  addVente(vente: any): void {
    const vendus = Number(vente.vendus);
    const prixKg = Number(vente.prixKg || 0);
    const prixTotal = Number(vente.prixTotal || 0);

    const newVente = this.storageService.addVente({
      ...vente,
      vendus,
      prixKg,
      prixTotal
    });
    this.dataApi.createVente(newVente).subscribe({
      error: (error) => this.logApiError('createVente', error),
    });

    const currentVentes = this._ventes$.getValue();
    this._ventes$.next([...currentVentes, newVente]);
  }

  
  /**
   * Ajoute un deces.
   * Logique : genere un id si necessaire, persiste la liste et retourne l entree creee.
   */
  addDeces(deces: any): void {
    const newDeces = this.storageService.addDeces({
      ...deces,
      dateDeces: deces.dateDeces ? new Date(deces.dateDeces) : new Date()
    });
    this.dataApi.createDeces(newDeces).subscribe({
      error: (error) => this.logApiError('createDeces', error),
    });

    const currentDeces = this._deces$.getValue();
    this._deces$.next([...currentDeces, newDeces]);

    if (deces.reproducteurId) {
      const currentRepros = this._reproducteurs$.getValue();
      const updatedRepros = currentRepros.map((r) => {
        if (r.id === deces.reproducteurId) {
          const updated = { ...r, etat: 'Mort' as const };
          this.storageService.updateReproducteur(updated);
          this.dataApi.updateReproducteur(updated).subscribe({
            error: (error) => this.logApiError('updateReproducteur', error),
          });
          return updated;
        }
        return r;
      });
      this._reproducteurs$.next(updatedRepros);
    }
  }

  
  /**
   * Met a jour un reproducteur.
   * Logique : remplace l entree correspondante puis persiste la liste.
   */
  updateReproducteur(updated: Reproducteur): void {
    this.storageService.updateReproducteur(updated);
    this.dataApi.updateReproducteur(updated).subscribe({
      error: (error) => this.logApiError('updateReproducteur', error),
    });
    const current = this._reproducteurs$.getValue();
    this._reproducteurs$.next(current.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  }

  
  /**
   * Supprime un reproducteur.
   * Logique : filtre l entree par id puis persiste la liste.
   */
  deleteReproducteur(id: string): void {
    this.storageService.deleteReproducteur(id);
    this.dataApi.deleteReproducteur(id).subscribe({
      error: (error) => this.logApiError('deleteReproducteur', error),
    });
    const current = this._reproducteurs$.getValue();
    this._reproducteurs$.next(current.filter(r => r.id !== id));
  }

  
  /**
   * Met a jour la configuration.
   * Logique : fusionne les valeurs recues avec la configuration par defaut puis persiste.
   */
  updateConfiguration(config: Partial<Configuration>): void {
    this.storageService.updateConfiguration(config);
    const nextConfig = this.storageService.getConfiguration();
    this.dataApi.updateConfiguration(nextConfig).subscribe({
      error: (error) => this.logApiError('updateConfiguration', error),
    });
    this._config$.next(nextConfig);
  }
}

