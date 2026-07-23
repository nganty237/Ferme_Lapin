import { Injectable } from '@angular/core';
import { StorageBaseRepository, STORAGE_KEYS } from './storage-base.repository';
import { Saillie, MiseBas, Sevrage, Deces, SessionSaillie, Palpation, Sexage, Engraissement } from '../models';

/**
 * Répertoire d'accès aux événements de l'élevage (Saillies, Mises-bas, Sevrages, Palpations, Sexages, Décès).
 */
@Injectable({
  providedIn: 'root'
})
export class EventRepository extends StorageBaseRepository {
  // --- Saillies ---
  getAllSaillies(): Saillie[] {
    return this.getItems<Saillie>(STORAGE_KEYS.SAILLIES);
  }

  addSaillie(item: Saillie): Saillie {
    const entry = { ...item, id: item.id || this.generateId('sal') };
    const all = this.getAllSaillies();
    all.push(entry);
    this.setItems<Saillie>(STORAGE_KEYS.SAILLIES, all);
    return entry;
  }

  updateSaillie(updated: Saillie): void {
    const all = this.getAllSaillies().map(s => s.id === updated.id ? { ...s, ...updated } : s);
    this.setItems<Saillie>(STORAGE_KEYS.SAILLIES, all);
  }

  deleteSaillie(id: string): void {
    const all = this.getAllSaillies().filter(s => s.id !== id);
    this.setItems<Saillie>(STORAGE_KEYS.SAILLIES, all);
  }

  // --- Mises-bas ---
  getAllMisesBas(): MiseBas[] {
    return this.getItems<MiseBas>(STORAGE_KEYS.MISES_BAS);
  }

  addMiseBas(item: MiseBas): MiseBas {
    const entry = { ...item, id: item.id || this.generateId('mb') };
    const all = this.getAllMisesBas();
    all.push(entry);
    this.setItems<MiseBas>(STORAGE_KEYS.MISES_BAS, all);
    return entry;
  }

  updateMiseBas(updated: MiseBas): void {
    const all = this.getAllMisesBas().map(m => m.id === updated.id ? { ...m, ...updated } : m);
    this.setItems<MiseBas>(STORAGE_KEYS.MISES_BAS, all);
  }

  deleteMiseBas(id: string): void {
    const all = this.getAllMisesBas().filter(m => m.id !== id);
    this.setItems<MiseBas>(STORAGE_KEYS.MISES_BAS, all);
  }

  // --- Sevrages ---
  getAllSevrages(): Sevrage[] {
    return this.getItems<Sevrage>(STORAGE_KEYS.SEVRAGES);
  }

  addSevrage(item: Sevrage): Sevrage {
    const entry = { ...item, id: item.id || this.generateId('sev') };
    const all = this.getAllSevrages();
    all.push(entry);
    this.setItems<Sevrage>(STORAGE_KEYS.SEVRAGES, all);
    return entry;
  }

  updateSevrage(updated: Sevrage): void {
    const all = this.getAllSevrages().map(s => s.id === updated.id ? { ...s, ...updated } : s);
    this.setItems<Sevrage>(STORAGE_KEYS.SEVRAGES, all);
  }

  deleteSevrage(id: string): void {
    const all = this.getAllSevrages().filter(s => s.id !== id);
    this.setItems<Sevrage>(STORAGE_KEYS.SEVRAGES, all);
  }

  // --- Décès ---
  getAllDeces(): Deces[] {
    return this.getItems<Deces>(STORAGE_KEYS.DECES);
  }

  addDeces(item: Deces): Deces {
    const entry = { ...item, id: item.id || this.generateId('dec') };
    const all = this.getAllDeces();
    all.push(entry);
    this.setItems<Deces>(STORAGE_KEYS.DECES, all);
    return entry;
  }

  updateDeces(updated: Deces): void {
    const all = this.getAllDeces().map(d => d.id === updated.id ? { ...d, ...updated } : d);
    this.setItems<Deces>(STORAGE_KEYS.DECES, all);
  }

  deleteDeces(id: string): void {
    const all = this.getAllDeces().filter(d => d.id !== id);
    this.setItems<Deces>(STORAGE_KEYS.DECES, all);
  }

  // --- Sessions Saillie ---
  getAllSessionsSaillie(): SessionSaillie[] {
    return this.getItems<SessionSaillie>(STORAGE_KEYS.SESSIONS_SAILLIE);
  }

  addSessionSaillie(session: SessionSaillie): void {
    const entry = { ...session, id: session.id || this.generateId('sess') };
    const all = this.getAllSessionsSaillie();
    all.push(entry);
    this.setItems<SessionSaillie>(STORAGE_KEYS.SESSIONS_SAILLIE, all);
  }

  // --- Palpations ---
  getAllPalpations(): Palpation[] {
    return this.getItems<Palpation>(STORAGE_KEYS.PALPATIONS);
  }

  addPalpation(item: Palpation): void {
    const entry = { ...item, id: item.id || this.generateId('palp') };
    const all = this.getAllPalpations();
    all.push(entry);
    this.setItems<Palpation>(STORAGE_KEYS.PALPATIONS, all);
  }

  // --- Sexages ---
  getAllSexages(): Sexage[] {
    return this.getItems<Sexage>(STORAGE_KEYS.SEXAGES);
  }

  addSexage(item: Sexage): void {
    const entry = { ...item, id: item.id || this.generateId('sex') };
    const all = this.getAllSexages();
    all.push(entry);
    this.setItems<Sexage>(STORAGE_KEYS.SEXAGES, all);
  }

  // --- Engraissements ---
  getAllEngraissements(): Engraissement[] {
    return this.getItems<Engraissement>(STORAGE_KEYS.ENGRAISSEMENTS);
  }

  addEngraissement(item: Engraissement): Engraissement {
    const entry = { ...item, id: item.id || this.generateId('eng') };
    const all = this.getAllEngraissements();
    all.push(entry);
    this.setItems<Engraissement>(STORAGE_KEYS.ENGRAISSEMENTS, all);
    return entry;
  }
}
