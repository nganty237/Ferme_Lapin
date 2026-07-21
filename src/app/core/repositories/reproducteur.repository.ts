import { Injectable } from '@angular/core';
import { StorageBaseRepository, STORAGE_KEYS } from './storage-base.repository';
import { Reproducteur } from '../models';

/**
 * Répertoire d'accès aux données des reproducteurs (mâles et femelles) en localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class ReproducteurRepository extends StorageBaseRepository {
  /**
   * Récupère l'ensemble des reproducteurs.
   */
  getAll(): Reproducteur[] {
    return this.getItems<Reproducteur>(STORAGE_KEYS.REPRODUCTEURS);
  }

  /**
   * Persiste un nouveau reproducteur avec attribution automatique d'ID si nécessaire.
   */
  add(item: Reproducteur): Reproducteur {
    const entry = { ...item, id: item.id || this.generateId('rep') };
    const all = this.getAll();
    all.push(entry);
    this.setItems<Reproducteur>(STORAGE_KEYS.REPRODUCTEURS, all);
    return entry;
  }

  /**
   * Met à jour un reproducteur existant par son identifiant.
   */
  update(updated: Reproducteur): void {
    const all = this.getAll().map(r => r.id === updated.id ? { ...r, ...updated } : r);
    this.setItems<Reproducteur>(STORAGE_KEYS.REPRODUCTEURS, all);
  }

  /**
   * Supprime un reproducteur du stockage.
   */
  delete(id: string): void {
    const all = this.getAll().filter(r => r.id !== id);
    this.setItems<Reproducteur>(STORAGE_KEYS.REPRODUCTEURS, all);
  }
}
