import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { Reproducteur, Saillie, MiseBas, Sevrage, Vente, Deces, Configuration } from '../models';

/**
 * Interface des 6 KPIs critiques calculés automatiquement.
 */
export interface KPIs {
  // --- Groupe 1 : Capacité ---
  capaciteTheorique: number;
  capaciteReelle: number;
  tauxUtilisationCages: number;
  occupationCages: { pourcentage: number; occupees: number; totales: number };
  prochainesLiberations: { j30: number; j60: number; j90: number };
  delaiLiberationCagesJours: number;
  prochaineVenteDate?: string;

  // --- Groupe 2 : Production ---
  productiviteParFemelleAn: number;
  tailleMoyennePortee: number;
  porteesParFemelleAn: number;

  // --- Groupe 3 : Viabilité ---
  viabiliteImmediate: number;
  tauxSurvieAllaitement: number;
  tauxSurvieEngraissement: number;

  // --- Groupe 4 : Performance Mâles ---
  productiviteParMale: Record<string, number>;

  // --- Groupe 5 : Économiques ---
  revenuMoyenPortee: number;
  coutProductionParLapin: number;
  margeBruteTotale: number;
  rentabiliteFemelleAn: number;

  // --- Groupe 6 : Optimisation ---
  goulotPrincipal: 'Cages engraissement' | 'Femelles reproductrices' | 'Mâles' | 'Aucun';
  cagesSupplementairesPourObjectif: number;
  roiAjouterCages: { investissement: number; revenuNetMensuel: number; paybackMonths: number; roiAnnuelPourcent: number };

  // --- Héritage ---
  productiviteParFemelle: number;
  tauxFecondite: number;
  nombrePorteesEnCours: number;
  phasesBandes: { A: string; B: string; C: string };
}

/**
 * CalculationService — État réactif centralisé + moteur de calcul KPIs.
 *
 * Responsabilités :
 * - Charger toutes les données depuis StorageService au démarrage
 * - Exposer chaque entité via BehaviorSubject (observable)
 * - Calculer les 6 KPIs critiques via combineLatest (auto-update)
 * - Servir de single source of truth réactive pour les composants
 */
@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  private storageService = inject(StorageService);

  // ══════════════════════════════════════════════
  //  ÉTAT RÉACTIF — BehaviorSubjects
  // ══════════════════════════════════════════════

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

  // ══════════════════════════════════════════════
  //  OBSERVABLES PUBLICS (lecture seule)
  // ══════════════════════════════════════════════

  /** Flux réactif des reproducteurs */
  readonly reproducteurs$ = this._reproducteurs$.asObservable();

  /** Flux réactif des saillies */
  readonly saillies$ = this._saillies$.asObservable();

  /** Flux réactif des mises-bas */
  readonly misesBas$ = this._misesBas$.asObservable();

  /** Flux réactif des sevrages */
  readonly sevrages$ = this._sevrages$.asObservable();

  /** Flux réactif des ventes */
  readonly ventes$ = this._ventes$.asObservable();

  /** Flux réactif des décès */
  readonly deces$ = this._deces$.asObservable();

  /** Flux réactif de la configuration */
  readonly config$ = this._config$.asObservable();

  /** Flux réactif des notifications */
  readonly notifications$ = this._notifications$.asObservable();

  // ══════════════════════════════════════════════
  //  KPIs RÉACTIFS — Auto-update via combineLatest
  // ══════════════════════════════════════════════

  /**
   * Observable des 6 KPIs critiques.
   * Se recalcule automatiquement dès qu'une source de données change.
   */
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

  // ══════════════════════════════════════════════
  //  INITIALISATION
  // ══════════════════════════════════════════════

  constructor() {
    this.loadAllData();
  }

  /**
   * Charge toutes les données depuis le StorageService
   * et met à jour chaque BehaviorSubject.
   */
  loadAllData(): void {
    this._reproducteurs$.next(this.storageService.getAllReproducteurs());
    this._saillies$.next(this.storageService.getAllSaillies());
    this._misesBas$.next(this.storageService.getAllMisesBas());
    this._sevrages$.next(this.storageService.getAllSevrages());
    this._ventes$.next(this.storageService.getAllVentes());
    this._deces$.next(this.storageService.getAllDeces());
    this._config$.next(this.storageService.getConfiguration());
    // Notifications initialisées vides (pas de persistance pour l'instant)
  }

  // ══════════════════════════════════════════════
  //  CALCULS KPIs PRIVÉS
  // ══════════════════════════════════════════════

  /**
   * Agrège tous les KPIs en un seul objet.
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

    // Helper FIFO function to check if a weaning is fully sold
    const isWeaningSold = (weaning: any): boolean => {
      const sortedSevrages = [...sevrages].sort((a, b) => new Date(a.dateSevrage).getTime() - new Date(b.dateSevrage).getTime());
      const idx = sortedSevrages.findIndex(item => item.id === weaning.id);
      if (idx === -1) return false;
      let cumulativeSevres = 0;
      for (let i = 0; i <= idx; i++) {
        cumulativeSevres += sortedSevrages[i].sevres || 0;
      }
      return totalVendus >= cumulativeSevres;
    };

    // Prochaines libérations
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

    // Production KPIs
    const femellesActives = reproducteurs.filter(
      (r) => r.sexe === 'F' && r.etat !== 'Réformé' && r.etat !== 'Mort'
    );
    const nbFemelles = femellesActives.length || 1;

    // Last year nés
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const nbInLastYear = misesBas.filter(mb => new Date(mb.dateMiseBas) >= oneYearAgo)
      .reduce((sum, mb) => sum + (mb.vivants || 0), 0);
    const prodFemelleAn = Math.round((nbInLastYear / nbFemelles) * 10) / 10;

    const averageLitter = misesBas.length > 0 ? Math.round((misesBas.reduce((sum, mb) => sum + (mb.vivants || 0), 0) / misesBas.length) * 10) / 10 : 0;
    const littersPerFemelleAn = misesBas.length > 0 ? Math.round((misesBas.length / nbFemelles) * 10) / 10 : 0;

    // Viabilité
    const totalBorn = misesBas.reduce((sum, mb) => sum + (mb.nes || 0), 0);
    const totalLiveBorn = misesBas.reduce((sum, mb) => sum + (mb.vivants || 0), 0);
    const viabImmediate = totalBorn > 0 ? Math.round((totalLiveBorn / totalBorn) * 100) : 0;

    const survieAllaitement = totalLiveBorn > 0 ? Math.round((totalSevres / totalLiveBorn) * 100) : 0;
    const survieEngraissement = totalSevres > 0 ? Math.round((totalVendus / totalSevres) * 100) : 0;

    // Performance Mâles
    const productiviteParMale: Record<string, number> = {};
    for (const m of reproducteurs.filter(r => r.sexe === 'M')) {
      const maleSaillies = saillies.filter(s => s.maleId === m.id);
      const maleSailliesIds = maleSaillies.map(s => s.id);
      const maleMisesBas = misesBas.filter(mb => maleSailliesIds.includes(mb.saillieId));
      const totalMaleVivants = maleMisesBas.reduce((sum, mb) => sum + (mb.vivants || 0), 0);
      productiviteParMale[m.id] = maleSaillies.length > 0 ? Math.round((totalMaleVivants / maleSaillies.length) * 10) / 10 : 0;
    }

    // Economique
    const totalRevenue = ventes.reduce((sum: number, v: any) => sum + (v.prixTotal || 0), 0);
    const averageRevenuePortee = sevrages.length > 0 ? Math.round(totalRevenue / sevrages.length) : 0;

    const coutAlimentParLapin = (config.prixAlimentKg || 350) * 5; // e.g. 5kg per rabbit
    const coutProductionParLapin = coutAlimentParLapin + 500; // feed + cage/infra cost
    const totalProdCosts = totalVendus * coutProductionParLapin;
    const totalMargin = Math.max(0, totalRevenue - totalProdCosts);
    const marginPerFemelleAn = Math.round(totalMargin / nbFemelles);

    // Goulot & ROI
    const capacityFemales = nbFemelles * 8; // 8 nés par femelle par mois
    const capacityCages = capacityEngraissement * density;
    const goulotPrincipal = capacityFemales < capacityCages ? 'Femelles reproductrices' : 'Cages engraissement';

    // objective 600
    const cagesSupplementairesPourObjectif = Math.max(0, 800 - capacityEngraissement);

    // ROI 50 cages
    const marginPerRabbit = (config.prixVenteDefaut || 3000) - coutProductionParLapin;
    const addRabbitsSalesPerMonth = (50 * 3) / 4; // 150 rabbits capacity / 4 months cycle = 37.5 sold per month
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

      // Héritage
      productiviteParFemelle: this.calcProductiviteParFemelle(reproducteurs, misesBas),
      tauxFecondite: this.calcTauxFecondite(saillies, misesBas),
      nombrePorteesEnCours: this.countPorteesEnCours(sevrages, ventes),
      phasesBandes: this.calcPhasesBandes(saillies, misesBas, sevrages),
    };
  }

  /**
   * KPI 1 — Productivité par femelle (lapereaux nés / femelle active / mois).
   * Formule : Σ(vivants) / nombre femelles actives / 12
   */
  private calcProductiviteParFemelle(reproducteurs: any[], misesBas: any[]): number {
    const femellesActives = reproducteurs.filter(
      (r) => r.sexe === 'F' && r.etat !== 'Réformé' && r.etat !== 'Mort'
    );
    const nbFemelles = femellesActives.length;
    if (nbFemelles === 0) return 0;

    const totalNes = misesBas.reduce((sum: number, mb: any) => sum + (mb.vivants || 0), 0);

    // Productivité annualisée ramenée au mois
    const result = totalNes / nbFemelles / 12;
    return Math.round(result * 100) / 100;
  }

  /**
   * KPI 2 — Taux de survie allaitement (%).
   * Formule : Moyenne(sevrés / nés vivants) * 100
   * On apparie chaque sevrage à sa mise-bas via miseBasId.
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
   * KPI 3 — Occupation des cages d'engraissement.
   * Formule : sevrés en cours (non vendus) / capacité totale (cages * densité) * 100
   */
  private calcOccupationCages(
    sevrages: any[],
    ventes: any[],
    config: any
  ): { pourcentage: number; occupees: number; totales: number } {
    const capaciteTotale = (config.nombreCagesTotal || 144) * (config.densiteParCage || 3);

    // Total sevrés - total vendus = lapins en engraissement
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
   * KPI 4 — Taux de fécondité (%).
   * Formule : (mises-bas réalisées / saillies totales) * 100
   */
  private calcTauxFecondite(saillies: any[], misesBas: any[]): number {
    if (saillies.length === 0) return 0;

    // Chaque mise-bas est liée à une saillie via saillieId
    const sailliesAvecMiseBas = new Set(misesBas.map((mb: any) => mb.saillieId).filter(Boolean));
    const nbReussies = sailliesAvecMiseBas.size || misesBas.length;

    return Math.round((nbReussies / saillies.length) * 100);
  }

  /**
   * KPI 5 — Nombre de portées en cours (sevrages sans vente correspondante).
   * Logique : on compte les sevrages dont les lapins n'ont pas été entièrement vendus.
   */
  private countPorteesEnCours(sevrages: any[], ventes: any[]): number {
    const totalSevres = sevrages.reduce((sum: number, s: any) => sum + (s.sevres || 0), 0);
    const totalVendus = ventes.reduce((sum: number, v: any) => sum + (v.vendus || 0), 0);

    // Si des sevrés n'ont pas été vendus, il y a des portées en cours
    if (totalSevres <= totalVendus) return 0;

    // Compter les sevrages qui ont encore des lapins non vendus
    // Approche simplifiée : nombre de sevrages récents non couverts par les ventes
    let restant = totalSevres - totalVendus;
    let porteesEnCours = 0;

    // Parcourir les sevrages du plus récent au plus ancien
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
   * KPI 6 — Phases actuelles des bandes (A, B, C).
   * Logique basée sur les dates des événements les plus récents :
   * - Si dernière saillie sans mise-bas → Gestation
   * - Si mise-bas sans sevrage → Allaitement
   * - Si sevrage enregistré → Repos
   * - Sinon → Saillies (en attente)
   */
  private calcPhasesBandes(
    saillies: any[],
    misesBas: any[],
    sevrages: any[]
  ): { A: string; B: string; C: string } {
    // Répartir les événements par index de bande (0=A, 1=B, 2=C)
    // On trie par date et on distribue en round-robin sur 3 bandes
    const allEvents = [
      ...saillies.map((s: any) => ({ type: 'saillie', date: s.dateSaillie, id: s.id })),
      ...misesBas.map((m: any) => ({ type: 'miseBas', date: m.dateMiseBas, saillieId: m.saillieId, id: m.id })),
      ...sevrages.map((s: any) => ({ type: 'sevrage', date: s.dateSevrage, miseBasId: s.miseBasId, id: s.id })),
    ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    // Déterminer la phase de chaque bande par les événements les plus récents
    const dernieresSaillies = this.getLastN(saillies, 'dateSaillie', 3);
    const phases: string[] = [];

    for (let i = 0; i < 3; i++) {
      const saillie = dernieresSaillies[i];
      if (!saillie) {
        phases.push('Saillies');
        continue;
      }

      // Chercher si cette saillie a une mise-bas
      const mb = misesBas.find((m: any) => m.saillieId === saillie.id);
      if (!mb) {
        phases.push('Gestation');
        continue;
      }

      // Chercher si cette mise-bas a un sevrage
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
   * Utilitaire : récupère les N derniers éléments triés par date décroissante.
   */
  private getLastN(items: any[], dateField: string, n: number): any[] {
    return [...items]
      .sort((a, b) => new Date(b[dateField] || 0).getTime() - new Date(a[dateField] || 0).getTime())
      .slice(0, n);
  }

  // ══════════════════════════════════════════════
  //  ACCESSEURS SYNCHRONES (snapshot de la valeur courante)
  // ══════════════════════════════════════════════

  get reproducteurs(): Reproducteur[] {
    return this._reproducteurs$.getValue();
  }

  get saillies(): Saillie[] {
    return this._saillies$.getValue();
  }

  get misesBas(): MiseBas[] {
    return this._misesBas$.getValue();
  }

  get sevrages(): Sevrage[] {
    return this._sevrages$.getValue();
  }

  get ventes(): Vente[] {
    return this._ventes$.getValue();
  }

  get deces(): Deces[] {
    return this._deces$.getValue();
  }

  get config(): Configuration {
    return this._config$.getValue();
  }

  get notifications(): any[] {
    return this._notifications$.getValue();
  }

  // ══════════════════════════════════════════════
  //  MUTATEURS (mise à jour état + persistance)
  // ══════════════════════════════════════════════

  setReproducteurs(data: Reproducteur[]): void {
    this._reproducteurs$.next(data);
  }

  setSaillies(data: Saillie[]): void {
    this._saillies$.next(data);
  }

  setMisesBas(data: MiseBas[]): void {
    this._misesBas$.next(data);
  }

  setSevrages(data: Sevrage[]): void {
    this._sevrages$.next(data);
  }

  setVentes(data: Vente[]): void {
    this._ventes$.next(data);
  }

  setDeces(data: Deces[]): void {
    this._deces$.next(data);
  }

  setConfig(data: Configuration): void {
    this._config$.next(data);
  }

  setNotifications(data: any[]): void {
    this._notifications$.next(data);
  }

  addNotification(notification: any): void {
    const current = this._notifications$.getValue();
    this._notifications$.next([notification, ...current]);
  }

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
    const currentSaillies = this._saillies$.getValue();
    this._saillies$.next([...currentSaillies, newSaillie]);

    // Mettre à jour l'état de la femelle en "En gestation"
    const reproducteurs = this._reproducteurs$.getValue();
    const updatedRepros = reproducteurs.map((r) => {
      if (r.id === saillie.femelleId) {
        const updated = { ...r, etat: 'En gestation' as const };
        this.storageService.updateReproducteur(updated);
        return updated;
      }
      return r;
    });
    this._reproducteurs$.next(updatedRepros);
  }

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

    const currentMisesBas = this._misesBas$.getValue();
    this._misesBas$.next([...currentMisesBas, newMiseBas]);

    // Mettre à jour l'état de la femelle en "En allaitement"
    const currentRepros = this._reproducteurs$.getValue();
    const updatedRepros = currentRepros.map((r) => {
      if (r.id === miseBas.femelleId) {
        const updated = { ...r, etat: 'En allaitement' as const };
        this.storageService.updateReproducteur(updated);
        return updated;
      }
      return r;
    });
    this._reproducteurs$.next(updatedRepros);
  }

  addSevrage(sevrage: any): void {
    const sevres = Number(sevrage.sevres);
    const density = this.config.densiteParCage || 3;
    const cagesOccupees = Math.ceil(sevres / density);

    const newSevrage = this.storageService.addSevrage({
      ...sevrage,
      sevres,
      cagesOccupees
    });

    const currentSevrages = this._sevrages$.getValue();
    this._sevrages$.next([...currentSevrages, newSevrage]);

    // Mettre à jour l'état de la femelle liée en "Au repos"
    const mb = this.misesBas.find((m: any) => m.id === sevrage.miseBasId);
    if (mb) {
      const currentRepros = this._reproducteurs$.getValue();
      const updatedRepros = currentRepros.map((r) => {
        if (r.id === mb.femelleId) {
          const updated = { ...r, etat: 'Au repos' as const };
          this.storageService.updateReproducteur(updated);
          return updated;
        }
        return r;
      });
      this._reproducteurs$.next(updatedRepros);
    }
  }

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

    const currentVentes = this._ventes$.getValue();
    this._ventes$.next([...currentVentes, newVente]);
  }

  addDeces(deces: any): void {
    const newDeces = this.storageService.addDeces({
      ...deces,
      dateDeces: deces.dateDeces ? new Date(deces.dateDeces) : new Date()
    });

    const currentDeces = this._deces$.getValue();
    this._deces$.next([...currentDeces, newDeces]);

    // Si le décès concerne un reproducteur, on met à jour son état à "Mort"
    if (deces.reproducteurId) {
      const currentRepros = this._reproducteurs$.getValue();
      const updatedRepros = currentRepros.map((r) => {
        if (r.id === deces.reproducteurId) {
          const updated = { ...r, etat: 'Mort' as const };
          this.storageService.updateReproducteur(updated);
          return updated;
        }
        return r;
      });
      this._reproducteurs$.next(updatedRepros);
    }
  }

  updateReproducteur(updated: Reproducteur): void {
    this.storageService.updateReproducteur(updated);
    const current = this._reproducteurs$.getValue();
    this._reproducteurs$.next(current.map(r => r.id === updated.id ? { ...r, ...updated } : r));
  }

  deleteReproducteur(id: string): void {
    this.storageService.deleteReproducteur(id);
    const current = this._reproducteurs$.getValue();
    this._reproducteurs$.next(current.filter(r => r.id !== id));
  }

  updateConfiguration(config: Partial<Configuration>): void {
    this.storageService.updateConfiguration(config);
    this._config$.next(this.storageService.getConfiguration());
  }
}

