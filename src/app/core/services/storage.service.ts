import { Injectable, inject } from '@angular/core';
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
import { StorageBaseRepository, STORAGE_KEYS } from '../repositories/storage-base.repository';
import { ReproducteurRepository } from '../repositories/reproducteur.repository';
import { BandeRepository, AffectationMaleGroup } from '../repositories/bande.repository';
import { EventRepository } from '../repositories/event.repository';
import { VenteRepository } from '../repositories/vente.repository';

/**
 * Service Façade pour le stockage local (localStorage).
 * Agrège les repositories spécialisés (ReproducteurRepository, BandeRepository, EventRepository, VenteRepository)
 * et garantit une compatibilité 100% avec l'ensemble du projet.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService extends StorageBaseRepository {
  private reproRepo = inject(ReproducteurRepository);
  private bandeRepo = inject(BandeRepository);
  private eventRepo = inject(EventRepository);
  private venteRepo = inject(VenteRepository);

  private readonly DEFAULT_CONFIG: Configuration = {
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
  };

  constructor() {
    super();
    if (this.isBrowser()) {
      this.initSeedData();
    }
  }

  // --- Configuration ---
  getConfiguration(): Configuration {
    return this.getObject<Configuration>(STORAGE_KEYS.CONFIGURATION, this.DEFAULT_CONFIG);
  }

  updateConfiguration(config: Partial<Configuration>): void {
    const current = this.getConfiguration();
    this.setObject<Configuration>(STORAGE_KEYS.CONFIGURATION, { ...current, ...config });
  }

  setConfiguration(config: Configuration): void {
    this.setObject<Configuration>(STORAGE_KEYS.CONFIGURATION, config);
  }

  // --- Reproducteurs ---
  getAllReproducteurs(): Reproducteur[] { return this.reproRepo.getAll(); }
  addReproducteur(item: Reproducteur): Reproducteur { return this.reproRepo.add(item); }
  updateReproducteur(updated: Reproducteur): void { this.reproRepo.update(updated); }
  deleteReproducteur(id: string): void { this.reproRepo.delete(id); }

  // --- Saillies ---
  getAllSaillies(): Saillie[] { return this.eventRepo.getAllSaillies(); }
  addSaillie(item: Saillie): Saillie { return this.eventRepo.addSaillie(item); }
  updateSaillie(updated: Saillie): void { this.eventRepo.updateSaillie(updated); }
  deleteSaillie(id: string): void { this.eventRepo.deleteSaillie(id); }

  // --- Mises-bas ---
  getAllMisesBas(): MiseBas[] { return this.eventRepo.getAllMisesBas(); }
  addMiseBas(item: MiseBas): MiseBas { return this.eventRepo.addMiseBas(item); }
  updateMiseBas(updated: MiseBas): void { this.eventRepo.updateMiseBas(updated); }
  deleteMiseBas(id: string): void { this.eventRepo.deleteMiseBas(id); }

  // --- Sevrages ---
  getAllSevrages(): Sevrage[] { return this.eventRepo.getAllSevrages(); }
  addSevrage(item: Sevrage): Sevrage { return this.eventRepo.addSevrage(item); }
  updateSevrage(updated: Sevrage): void { this.eventRepo.updateSevrage(updated); }
  deleteSevrage(id: string): void { this.eventRepo.deleteSevrage(id); }

  // --- Ventes ---
  getAllVentes(): Vente[] { return this.venteRepo.getAllVentes(); }
  addVente(item: Vente): Vente { return this.venteRepo.addVente(item); }
  updateVente(updated: Vente): void { this.venteRepo.updateVente(updated); }
  deleteVente(id: string): void { this.venteRepo.deleteVente(id); }

  // --- Décès ---
  getAllDeces(): Deces[] { return this.eventRepo.getAllDeces(); }
  addDeces(item: Deces): Deces { return this.eventRepo.addDeces(item); }
  updateDeces(updated: Deces): void { this.eventRepo.updateDeces(updated); }
  deleteDeces(id: string): void { this.eventRepo.deleteDeces(id); }

  // --- Bandes, Clapiers & Affectations ---
  getAllBandes(): Bande[] { return this.bandeRepo.getAllBandes(); }
  updateBande(id: string, partial: Partial<Bande>): void { this.bandeRepo.updateBande(id, partial); }
  getAllClapiers(): Clapier[] { return this.bandeRepo.getAllClapiers(); }
  getAllAffectationMales(): Record<string, AffectationMaleGroup[]> { return this.bandeRepo.getAllAffectationMales(); }

  // --- Sessions, Palpations & Sexages ---
  getAllSessionsSaillie(): SessionSaillie[] { return this.eventRepo.getAllSessionsSaillie(); }
  addSessionSaillie(session: SessionSaillie): void { this.eventRepo.addSessionSaillie(session); }
  getAllPalpations(): Palpation[] { return this.eventRepo.getAllPalpations(); }
  addPalpation(item: Palpation): void { this.eventRepo.addPalpation(item); }
  getAllSexages(): Sexage[] { return this.eventRepo.getAllSexages(); }
  addSexage(item: Sexage): void { this.eventRepo.addSexage(item); }

  // --- Utilitaires Import / Export / Clear ---
  exportData(): Record<string, unknown> {
    if (!this.isBrowser()) return {};
    const data: Record<string, unknown> = {};
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

  importData(json: Record<string, unknown>): void {
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

  clearAll(): void {
    if (!this.isBrowser()) return;
    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
  }

  initSeedData(force = false): void {
    // Initialisation optionnelle
  }
}
