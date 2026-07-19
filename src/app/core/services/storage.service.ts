import { Injectable } from '@angular/core';
import { Reproducteur, Saillie, MiseBas, Sevrage, Vente, Deces, Configuration } from '../models';

const PREFIX = 'cunicole_';

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

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  
  /**
   * Initialise le service.
   * Logique : prepare les dependances et lance les traitements de demarrage.
   */
  constructor() {
    if (this.isBrowser()) {
      this.initSeedData();
    }
  }

  
  /**
   * Verifie si le code s execute dans le navigateur.
   * Logique : protege localStorage pendant le rendu serveur.
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  /**
   * Lit une collection depuis le localStorage.
   * Logique : deserialise le JSON et retourne une liste sure.
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

  /**
   * Ecrit une collection dans le localStorage.
   * Logique : serialise la liste et capture les erreurs d ecriture.
   */
  private setItems<T>(key: string, items: T[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error(`[StorageService] Erreur écriture clé "${key}":`, e);
    }
  }

  /**
   * Lit un objet depuis le localStorage.
   * Logique : retourne une valeur par defaut si la cle est absente ou invalide.
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

  /**
   * Ecrit un objet dans le localStorage.
   * Logique : serialise la valeur et capture les erreurs d ecriture.
   */
  private setObject<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageService] Erreur écriture clé "${key}":`, e);
    }
  }

  
  /**
   * Genere un identifiant unique.
   * Logique : combine un prefixe, le timestamp et une chaine aleatoire.
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  
  /**
   * Retourne tous les reproducteurs.
   * Logique : lit la collection reproducteurs depuis le stockage.
   */
  getAllReproducteurs(): Reproducteur[] {
    return this.getItems<Reproducteur>(STORAGE_KEYS.REPRODUCTEURS);
  }

  
  /**
   * Ajoute un reproducteur.
   * Logique : genere un id si necessaire, persiste la liste et retourne l entree creee.
   */
  addReproducteur(item: Reproducteur): Reproducteur {
    const entry = { ...item, id: item.id || this.generateId('rep') };
    const all = this.getAllReproducteurs();
    all.push(entry);
    this.setItems<Reproducteur>(STORAGE_KEYS.REPRODUCTEURS, all);
    return entry;
  }

  
  /**
   * Met a jour un reproducteur.
   * Logique : remplace l entree correspondante puis persiste la liste.
   */
  updateReproducteur(updated: Reproducteur): void {
    const all = this.getAllReproducteurs().map(r => r.id === updated.id ? { ...r, ...updated } : r);
    this.setItems<Reproducteur>(STORAGE_KEYS.REPRODUCTEURS, all);
  }

  
  /**
   * Supprime un reproducteur.
   * Logique : filtre l entree par id puis persiste la liste.
   */
  deleteReproducteur(id: string): void {
    const all = this.getAllReproducteurs().filter(r => r.id !== id);
    this.setItems<Reproducteur>(STORAGE_KEYS.REPRODUCTEURS, all);
  }

  
  /**
   * Retourne toutes les saillies.
   * Logique : lit la collection saillies depuis le stockage.
   */
  getAllSaillies(): Saillie[] {
    return this.getItems<Saillie>(STORAGE_KEYS.SAILLIES);
  }

  
  /**
   * Ajoute une saillie.
   * Logique : genere un id si necessaire, persiste la liste et retourne l entree creee.
   */
  addSaillie(item: Saillie): Saillie {
    const entry = { ...item, id: item.id || this.generateId('sal') };
    const all = this.getAllSaillies();
    all.push(entry);
    this.setItems<Saillie>(STORAGE_KEYS.SAILLIES, all);
    return entry;
  }

  
  /**
   * Met a jour une saillie.
   * Logique : remplace l entree correspondante puis persiste la liste.
   */
  updateSaillie(updated: Saillie): void {
    const all = this.getAllSaillies().map(s => s.id === updated.id ? { ...s, ...updated } : s);
    this.setItems<Saillie>(STORAGE_KEYS.SAILLIES, all);
  }

  
  /**
   * Supprime une saillie.
   * Logique : filtre l entree par id puis persiste la liste.
   */
  deleteSaillie(id: string): void {
    const all = this.getAllSaillies().filter(s => s.id !== id);
    this.setItems<Saillie>(STORAGE_KEYS.SAILLIES, all);
  }

  
  /**
   * Retourne toutes les mises-bas.
   * Logique : lit la collection mises-bas depuis le stockage.
   */
  getAllMisesBas(): MiseBas[] {
    return this.getItems<MiseBas>(STORAGE_KEYS.MISES_BAS);
  }

  
  /**
   * Ajoute une mise-bas.
   * Logique : calcule les valeurs derivees, persiste l evenement et met a jour l etat femelle.
   */
  addMiseBas(item: MiseBas): MiseBas {
    const entry = { ...item, id: item.id || this.generateId('mb') };
    const all = this.getAllMisesBas();
    all.push(entry);
    this.setItems<MiseBas>(STORAGE_KEYS.MISES_BAS, all);
    return entry;
  }

  
  /**
   * Met a jour une mise-bas.
   * Logique : remplace l entree correspondante puis persiste la liste.
   */
  updateMiseBas(updated: MiseBas): void {
    const all = this.getAllMisesBas().map(m => m.id === updated.id ? { ...m, ...updated } : m);
    this.setItems<MiseBas>(STORAGE_KEYS.MISES_BAS, all);
  }

  
  /**
   * Supprime une mise-bas.
   * Logique : filtre l entree par id puis persiste la liste.
   */
  deleteMiseBas(id: string): void {
    const all = this.getAllMisesBas().filter(m => m.id !== id);
    this.setItems<MiseBas>(STORAGE_KEYS.MISES_BAS, all);
  }

  
  /**
   * Retourne tous les sevrages.
   * Logique : lit la collection sevrages depuis le stockage.
   */
  getAllSevrages(): Sevrage[] {
    return this.getItems<Sevrage>(STORAGE_KEYS.SEVRAGES);
  }

  
  /**
   * Ajoute un sevrage.
   * Logique : calcule les cages occupees, persiste l evenement et remet la femelle au repos.
   */
  addSevrage(item: Sevrage): Sevrage {
    const entry = { ...item, id: item.id || this.generateId('sev') };
    const all = this.getAllSevrages();
    all.push(entry);
    this.setItems<Sevrage>(STORAGE_KEYS.SEVRAGES, all);
    return entry;
  }

  
  /**
   * Met a jour un sevrage.
   * Logique : remplace l entree correspondante puis persiste la liste.
   */
  updateSevrage(updated: Sevrage): void {
    const all = this.getAllSevrages().map(s => s.id === updated.id ? { ...s, ...updated } : s);
    this.setItems<Sevrage>(STORAGE_KEYS.SEVRAGES, all);
  }

  
  /**
   * Supprime un sevrage.
   * Logique : filtre l entree par id puis persiste la liste.
   */
  deleteSevrage(id: string): void {
    const all = this.getAllSevrages().filter(s => s.id !== id);
    this.setItems<Sevrage>(STORAGE_KEYS.SEVRAGES, all);
  }

  
  /**
   * Retourne toutes les ventes.
   * Logique : lit la collection ventes depuis le stockage.
   */
  getAllVentes(): Vente[] {
    return this.getItems<Vente>(STORAGE_KEYS.VENTES);
  }

  
  /**
   * Ajoute une vente.
   * Logique : normalise les montants puis persiste la vente et le flux reactif.
   */
  addVente(item: Vente): Vente {
    const entry = { ...item, id: item.id || this.generateId('ven') };
    const all = this.getAllVentes();
    all.push(entry);
    this.setItems<Vente>(STORAGE_KEYS.VENTES, all);
    return entry;
  }

  
  /**
   * Met a jour une vente.
   * Logique : remplace l entree correspondante puis persiste la liste.
   */
  updateVente(updated: Vente): void {
    const all = this.getAllVentes().map(v => v.id === updated.id ? { ...v, ...updated } : v);
    this.setItems<Vente>(STORAGE_KEYS.VENTES, all);
  }

  
  /**
   * Supprime une vente.
   * Logique : filtre l entree par id puis persiste la liste.
   */
  deleteVente(id: string): void {
    const all = this.getAllVentes().filter(v => v.id !== id);
    this.setItems<Vente>(STORAGE_KEYS.VENTES, all);
  }

  
  /**
   * Retourne tous les deces.
   * Logique : lit la collection deces depuis le stockage.
   */
  getAllDeces(): Deces[] {
    return this.getItems<Deces>(STORAGE_KEYS.DECES);
  }

  
  /**
   * Ajoute un deces.
   * Logique : genere un id si necessaire, persiste la liste et retourne l entree creee.
   */
  addDeces(item: Deces): Deces {
    const entry = { ...item, id: item.id || this.generateId('dec') };
    const all = this.getAllDeces();
    all.push(entry);
    this.setItems<Deces>(STORAGE_KEYS.DECES, all);
    return entry;
  }

  
  /**
   * Met a jour un deces.
   * Logique : remplace l entree correspondante puis persiste la liste.
   */
  updateDeces(updated: Deces): void {
    const all = this.getAllDeces().map(d => d.id === updated.id ? { ...d, ...updated } : d);
    this.setItems<Deces>(STORAGE_KEYS.DECES, all);
  }

  
  /**
   * Supprime un deces.
   * Logique : filtre l entree par id puis persiste la liste.
   */
  deleteDeces(id: string): void {
    const all = this.getAllDeces().filter(d => d.id !== id);
    this.setItems<Deces>(STORAGE_KEYS.DECES, all);
  }

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

  
  /**
   * Retourne la configuration courante.
   * Logique : lit la configuration ou applique les valeurs par defaut.
   */
  getConfiguration(): Configuration {
    return this.getObject<Configuration>(STORAGE_KEYS.CONFIGURATION, this.DEFAULT_CONFIG);
  }

  
  /**
   * Met a jour la configuration.
   * Logique : fusionne les valeurs recues avec la configuration par defaut puis persiste.
   */
  updateConfiguration(config: Partial<Configuration>): void {
    this.setObject<Configuration>(STORAGE_KEYS.CONFIGURATION, { ...this.DEFAULT_CONFIG, ...config });
  }

  
  /**
   * Exporte toutes les donnees applicatives.
   * Logique : agrege chaque cle de stockage dans un objet JSON.
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
   * Importe des donnees applicatives.
   * Logique : restaure les cles presentes dans le JSON fourni.
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
   * Vide la liste ou les donnees courantes.
   * Logique : supprime les cles connues ou remet le flux local a zero.
   */
  clearAll(): void {
    if (!this.isBrowser()) return;
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
  }

  
  /**
   * Initialise les donnees de demonstration.
   * Logique : injecte un jeu de donnees si le stockage n est pas deja initialise.
   */
  initSeedData(force = false): void {
    if (!this.isBrowser()) return;
    if (!force && localStorage.getItem(STORAGE_KEYS.REPRODUCTEURS)) {
      return;
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
