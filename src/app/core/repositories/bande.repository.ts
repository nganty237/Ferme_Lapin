import { Injectable } from '@angular/core';
import { StorageBaseRepository, STORAGE_KEYS } from './storage-base.repository';
import { Bande, Clapier } from '../models';

export interface AffectationMaleGroup {
  maleId: string;
  femellesIds: string[];
}

/**
 * Répertoire d'accès aux données des bandes, clapiers et affectations en localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class BandeRepository extends StorageBaseRepository {
  getAllBandes(): Bande[] {
    return this.getItems<Bande>(STORAGE_KEYS.BANDES);
  }

  updateBande(id: string, partial: Partial<Bande>): void {
    const all = this.getAllBandes().map(b => b.id === id ? { ...b, ...partial } : b);
    this.setItems<Bande>(STORAGE_KEYS.BANDES, all);
  }

  getAllClapiers(): Clapier[] {
    return this.getItems<Clapier>(STORAGE_KEYS.CLAPIERS);
  }

  getAllAffectationMales(): Record<string, AffectationMaleGroup[]> {
    return this.getObject<Record<string, AffectationMaleGroup[]>>(STORAGE_KEYS.AFFECTATION_MALES, {});
  }
}
