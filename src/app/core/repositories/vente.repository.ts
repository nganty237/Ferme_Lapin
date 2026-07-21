import { Injectable } from '@angular/core';
import { StorageBaseRepository, STORAGE_KEYS } from './storage-base.repository';
import { Vente } from '../models';

/**
 * Répertoire d'accès aux données des transactions de vente en localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class VenteRepository extends StorageBaseRepository {
  /**
   * Récupère l'ensemble des ventes enregistrées.
   */
  getAllVentes(): Vente[] {
    return this.getItems<Vente>(STORAGE_KEYS.VENTES);
  }

  /**
   * Enregistre une nouvelle transaction de vente.
   */
  addVente(item: Vente): Vente {
    const entry = { ...item, id: item.id || this.generateId('vnt') };
    const all = this.getAllVentes();
    all.push(entry);
    this.setItems<Vente>(STORAGE_KEYS.VENTES, all);
    return entry;
  }

  /**
   * Met à jour une vente existante.
   */
  updateVente(updated: Vente): void {
    const all = this.getAllVentes().map(v => v.id === updated.id ? { ...v, ...updated } : v);
    this.setItems<Vente>(STORAGE_KEYS.VENTES, all);
  }

  /**
   * Supprime une vente.
   */
  deleteVente(id: string): void {
    const all = this.getAllVentes().filter(v => v.id !== id);
    this.setItems<Vente>(STORAGE_KEYS.VENTES, all);
  }
}
