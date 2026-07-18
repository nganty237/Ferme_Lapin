import { Injectable } from '@angular/core';

/** Préfixe localStorage pour éviter les collisions */
const PREFIX = 'cunicole_';

/** Clés de stockage avec préfixe */
const STORAGE_KEYS = {
  REPRODUCTEURS: `${PREFIX}reproducteurs`,
  SAILLIES: `${PREFIX}saillies`,
  MISES_BAS: `${PREFIX}mises_bas`,
  SEVRAGES: `${PREFIX}sevrages`,
  VENTES: `${PREFIX}ventes`,
  DECES: `${PREFIX}deces`,
  CONFIGURATION: `${PREFIX}configuration`,
  NOTIFICATIONS: `${PREFIX}notifications`,
} as const;

/**
 * StorageService — Wrapper centralisé pour toutes les opérations CRUD localStorage.
 *
 * Responsabilités :
 * - CRUD complet pour chaque entité métier
 * - Sérialisation/désérialisation JSON avec gestion d'erreurs
 * - Export/Import de toutes les données
 * - Seed data de démonstration
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() {
    if (this.isBrowser()) {
      this.initSeedData();
    }
  }

  // ══════════════════════════════════════════════
  //  UTILITAIRES INTERNES
  // ══════════════════════════════════════════════

  /** Vérifie si on est dans un contexte navigateur (pas SSR) */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Lecture générique avec gestion d'erreurs de désérialisation.
   * Retourne un tableau vide en cas de données corrompues.
   */
  private getItems<T>(key: string): T[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`[StorageService] Erreur lecture clé "${key}":`, e);
      return [];
    }
  }

  /** Écriture générique avec gestion d'erreurs de sérialisation */
  private setItems<T>(key: string, items: T[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error(`[StorageService] Erreur écriture clé "${key}":`, e);
    }
  }

  /**
   * Lecture générique d'un objet unique (ex: configuration).
   * Retourne la valeur par défaut si absent ou corrompu.
   */
  private getObject<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`[StorageService] Erreur lecture clé "${key}":`, e);
      return defaultValue;
    }
  }

  /** Écriture générique d'un objet unique */
  private setObject<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageService] Erreur écriture clé "${key}":`, e);
    }
  }

  /** Génère un ID unique préfixé */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // ══════════════════════════════════════════════
  //  CRUD REPRODUCTEURS
  // ══════════════════════════════════════════════

  getAllReproducteurs(): any[] {
    return this.getItems(STORAGE_KEYS.REPRODUCTEURS);
  }

  addReproducteur(item: any): any {
    const entry = { ...item, id: item.id || this.generateId('rep') };
    const all = this.getAllReproducteurs();
    all.push(entry);
    this.setItems(STORAGE_KEYS.REPRODUCTEURS, all);
    return entry;
  }

  updateReproducteur(updated: any): void {
    const all = this.getAllReproducteurs().map(r => r.id === updated.id ? { ...r, ...updated } : r);
    this.setItems(STORAGE_KEYS.REPRODUCTEURS, all);
  }

  deleteReproducteur(id: string): void {
    const all = this.getAllReproducteurs().filter(r => r.id !== id);
    this.setItems(STORAGE_KEYS.REPRODUCTEURS, all);
  }

  // ══════════════════════════════════════════════
  //  CRUD SAILLIES
  // ══════════════════════════════════════════════

  getAllSaillies(): any[] {
    return this.getItems(STORAGE_KEYS.SAILLIES);
  }

  addSaillie(item: any): any {
    const entry = { ...item, id: item.id || this.generateId('sal') };
    const all = this.getAllSaillies();
    all.push(entry);
    this.setItems(STORAGE_KEYS.SAILLIES, all);
    return entry;
  }

  updateSaillie(updated: any): void {
    const all = this.getAllSaillies().map(s => s.id === updated.id ? { ...s, ...updated } : s);
    this.setItems(STORAGE_KEYS.SAILLIES, all);
  }

  deleteSaillie(id: string): void {
    const all = this.getAllSaillies().filter(s => s.id !== id);
    this.setItems(STORAGE_KEYS.SAILLIES, all);
  }

  // ══════════════════════════════════════════════
  //  CRUD MISES BAS
  // ══════════════════════════════════════════════

  getAllMisesBas(): any[] {
    return this.getItems(STORAGE_KEYS.MISES_BAS);
  }

  addMiseBas(item: any): any {
    const entry = { ...item, id: item.id || this.generateId('mb') };
    const all = this.getAllMisesBas();
    all.push(entry);
    this.setItems(STORAGE_KEYS.MISES_BAS, all);
    return entry;
  }

  updateMiseBas(updated: any): void {
    const all = this.getAllMisesBas().map(m => m.id === updated.id ? { ...m, ...updated } : m);
    this.setItems(STORAGE_KEYS.MISES_BAS, all);
  }

  deleteMiseBas(id: string): void {
    const all = this.getAllMisesBas().filter(m => m.id !== id);
    this.setItems(STORAGE_KEYS.MISES_BAS, all);
  }

  // ══════════════════════════════════════════════
  //  CRUD SEVRAGES
  // ══════════════════════════════════════════════

  getAllSevrages(): any[] {
    return this.getItems(STORAGE_KEYS.SEVRAGES);
  }

  addSevrage(item: any): any {
    const entry = { ...item, id: item.id || this.generateId('sev') };
    const all = this.getAllSevrages();
    all.push(entry);
    this.setItems(STORAGE_KEYS.SEVRAGES, all);
    return entry;
  }

  updateSevrage(updated: any): void {
    const all = this.getAllSevrages().map(s => s.id === updated.id ? { ...s, ...updated } : s);
    this.setItems(STORAGE_KEYS.SEVRAGES, all);
  }

  deleteSevrage(id: string): void {
    const all = this.getAllSevrages().filter(s => s.id !== id);
    this.setItems(STORAGE_KEYS.SEVRAGES, all);
  }

  // ══════════════════════════════════════════════
  //  CRUD VENTES
  // ══════════════════════════════════════════════

  getAllVentes(): any[] {
    return this.getItems(STORAGE_KEYS.VENTES);
  }

  addVente(item: any): any {
    const entry = { ...item, id: item.id || this.generateId('ven') };
    const all = this.getAllVentes();
    all.push(entry);
    this.setItems(STORAGE_KEYS.VENTES, all);
    return entry;
  }

  updateVente(updated: any): void {
    const all = this.getAllVentes().map(v => v.id === updated.id ? { ...v, ...updated } : v);
    this.setItems(STORAGE_KEYS.VENTES, all);
  }

  deleteVente(id: string): void {
    const all = this.getAllVentes().filter(v => v.id !== id);
    this.setItems(STORAGE_KEYS.VENTES, all);
  }

  // ══════════════════════════════════════════════
  //  CRUD DÉCÈS
  // ══════════════════════════════════════════════

  getAllDeces(): any[] {
    return this.getItems(STORAGE_KEYS.DECES);
  }

  addDeces(item: any): any {
    const entry = { ...item, id: item.id || this.generateId('dec') };
    const all = this.getAllDeces();
    all.push(entry);
    this.setItems(STORAGE_KEYS.DECES, all);
    return entry;
  }

  updateDeces(updated: any): void {
    const all = this.getAllDeces().map(d => d.id === updated.id ? { ...d, ...updated } : d);
    this.setItems(STORAGE_KEYS.DECES, all);
  }

  deleteDeces(id: string): void {
    const all = this.getAllDeces().filter(d => d.id !== id);
    this.setItems(STORAGE_KEYS.DECES, all);
  }

  // ══════════════════════════════════════════════
  //  CONFIGURATION
  // ══════════════════════════════════════════════

  private readonly DEFAULT_CONFIG = {
    nombreCagesTotal: 180,
    densiteParCage: 3,
    dureeGestationJours: 31,
    dureeAllaitementJours: 31,
    dureeEngraissementJours: 120,
    nombreCagesReproductrices: 36,
    prixAlimentKg: 350,
    prixVenteDefaut: 3000,
  };

  getConfiguration(): any {
    return this.getObject(STORAGE_KEYS.CONFIGURATION, this.DEFAULT_CONFIG);
  }

  updateConfiguration(config: any): void {
    this.setObject(STORAGE_KEYS.CONFIGURATION, { ...this.DEFAULT_CONFIG, ...config });
  }

  // ══════════════════════════════════════════════
  //  EXPORT / IMPORT / CLEAR
  // ══════════════════════════════════════════════

  /**
   * Exporte toutes les données cunicole_ en un seul objet JSON.
   * Utile pour backup ou transfert.
   */
  exportData(): Record<string, any> {
    if (!this.isBrowser()) return {};
    const data: Record<string, any> = {};
    for (const [label, key] of Object.entries(STORAGE_KEYS)) {
      try {
        const raw = localStorage.getItem(key);
        data[label] = raw ? JSON.parse(raw) : null;
      } catch {
        data[label] = null;
      }
    }
    return data;
  }

  /**
   * Importe des données JSON et restaure le localStorage.
   * Écrase les données existantes pour les clés présentes dans le JSON.
   */
  importData(json: Record<string, any>): void {
    if (!this.isBrowser()) return;
    for (const [label, key] of Object.entries(STORAGE_KEYS)) {
      if (json[label] !== undefined && json[label] !== null) {
        try {
          localStorage.setItem(key, JSON.stringify(json[label]));
        } catch (e) {
          console.error(`[StorageService] Erreur import clé "${key}":`, e);
        }
      }
    }
  }

  /**
   * Vide toutes les données cunicole_ du localStorage.
   * Utile pour dev/test ou réinitialisation utilisateur.
   */
  clearAll(): void {
    if (!this.isBrowser()) return;
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
  }

  // ══════════════════════════════════════════════
  //  SEED DATA (données de démonstration)
  // ══════════════════════════════════════════════

  initSeedData(force = false): void {
    if (!this.isBrowser()) return;
    if (!force && localStorage.getItem(STORAGE_KEYS.REPRODUCTEURS)) {
      return; // Déjà initialisé
    }

    const seedReproducteurs = [
      { id: 'F001', nom: 'Goliath Junior (Femelle F001)', sexe: 'F', etat: 'Actif', bandeId: 'b1' },
      { id: 'F002', nom: 'Blanchette F002', sexe: 'F', etat: 'Actif', bandeId: 'b1' },
      { id: 'F003', nom: 'Roussette F003', sexe: 'F', etat: 'Actif', bandeId: 'b2' },
      { id: 'F004', nom: 'Chocolat F004', sexe: 'F', etat: 'Actif', bandeId: 'b2' },
      { id: 'F005', nom: 'Lapine F005', sexe: 'F', etat: 'En gestation', bandeId: 'b3' },
      { id: 'F006', nom: 'Lapine F006', sexe: 'F', etat: 'En allaitement', bandeId: 'b3' },
      { id: 'M001', nom: 'Rex M001 (Mâle)', sexe: 'M', etat: 'Actif' },
      { id: 'M002', nom: 'Titan M002 (Mâle)', sexe: 'M', etat: 'Actif' }
    ];

    const seedSaillies = [
      { id: 'sal1', femelleId: 'F001', maleId: 'M001', dateSaillie: '2026-01-05', dateMiseBasPrevue: '2026-02-05', reussie: true },
      { id: 'sal2', femelleId: 'F002', maleId: 'M002', dateSaillie: '2026-02-10', dateMiseBasPrevue: '2026-03-13', reussie: true },
      { id: 'sal3', femelleId: 'F003', maleId: 'M001', dateSaillie: '2026-04-01', dateMiseBasPrevue: '2026-05-02', reussie: true },
      { id: 'sal4', femelleId: 'F004', maleId: 'M002', dateSaillie: '2026-05-10', dateMiseBasPrevue: '2026-06-10', reussie: true },
      { id: 'sal5', femelleId: 'F005', maleId: 'M001', dateSaillie: '2026-06-15', dateMiseBasPrevue: '2026-07-16', reussie: true },
      { id: 'sal6', femelleId: 'F006', maleId: 'M002', dateSaillie: '2026-07-02', dateMiseBasPrevue: '2026-08-02', reussie: false }
    ];

    const seedMisesBas = [
      { id: 'mb1', saillieId: 'sal1', femelleId: 'F001', dateMiseBas: '2026-02-05', vivants: 85, mortsNes: 5, viabiliteCalculee: 94 },
      { id: 'mb2', saillieId: 'sal2', femelleId: 'F002', dateMiseBas: '2026-03-13', vivants: 78, mortsNes: 8, viabiliteCalculee: 90 },
      { id: 'mb3', saillieId: 'sal3', femelleId: 'F003', dateMiseBas: '2026-05-02', vivants: 90, mortsNes: 2, viabiliteCalculee: 97 },
      { id: 'mb4', saillieId: 'sal4', femelleId: 'F004', dateMiseBas: '2026-06-10', vivants: 82, mortsNes: 4, viabiliteCalculee: 95 },
      { id: 'mb5', saillieId: 'sal5', femelleId: 'F005', dateMiseBas: '2026-07-16', vivants: 80, mortsNes: 3, viabiliteCalculee: 96 }
    ];

    const seedSevrages = [
      { id: 'sev1', miseBasId: 'mb1', dateSevrage: '2026-03-08', sevres: 80, cagesOccupees: 27 },
      { id: 'sev2', miseBasId: 'mb2', dateSevrage: '2026-04-13', sevres: 72, cagesOccupees: 24 },
      { id: 'sev3', miseBasId: 'mb3', dateSevrage: '2026-06-02', sevres: 86, cagesOccupees: 29 },
      { id: 'sev4', miseBasId: 'mb4', dateSevrage: '2026-07-11', sevres: 76, cagesOccupees: 26 }
    ];

    const seedVentes = [
      { id: 'ven1', dateVente: '2026-05-08', vendus: 78, prixTotal: 218400, client: 'Centragel' },
      { id: 'ven2', dateVente: '2026-06-13', vendus: 70, prixTotal: 196000, client: 'Marché Local' },
      { id: 'ven3', dateVente: '2026-08-02', vendus: 84, prixTotal: 235200, client: 'Centragel' }
    ];

    const seedDeces = [
      { id: 'dec1', dateDeces: '2026-02-20', reproducteurId: 'F002', cause: 'Maladie' }
    ];

    this.setItems(STORAGE_KEYS.REPRODUCTEURS, seedReproducteurs);
    this.setItems(STORAGE_KEYS.SAILLIES, seedSaillies);
    this.setItems(STORAGE_KEYS.MISES_BAS, seedMisesBas);
    this.setItems(STORAGE_KEYS.SEVRAGES, seedSevrages);
    this.setItems(STORAGE_KEYS.VENTES, seedVentes);
    this.setItems(STORAGE_KEYS.DECES, seedDeces);
    this.updateConfiguration({
      nombreCagesTotal: 180,
      densiteParCage: 3,
      dureeGestationJours: 31,
      dureeAllaitementJours: 31,
      dureeEngraissementJours: 120,
      nombreCagesReproductrices: 36,
      prixAlimentKg: 350,
      prixVenteDefaut: 3000,
    });
  }
}
