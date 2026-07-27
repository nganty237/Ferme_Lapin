import { Injectable } from '@angular/core';
import { StorageBaseRepository, STORAGE_KEYS } from './storage-base.repository';
import { 
  Bande, 
  Clapier, 
  ReferentielBande, 
  ReferentielMale, 
  CalendrierSaillieItem, 
  CycleBande 
} from '../models';

export interface AffectationMaleGroup {
  maleId: string;
  femellesIds: string[];
}

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

  updateClapier(id: string, partial: Partial<Clapier>): void {
    const all = this.getAllClapiers().map(c => c.id === id ? { ...c, ...partial } : c);
    this.setItems<Clapier>(STORAGE_KEYS.CLAPIERS, all);
  }

  saveClapiers(clapiers: Clapier[]): void {
    this.setItems<Clapier>(STORAGE_KEYS.CLAPIERS, clapiers);
  }

  getReferentielBandes(): ReferentielBande[] {
    return this.getItems<ReferentielBande>(STORAGE_KEYS.REFERENTIEL_BANDES);
  }

  getReferentielMales(): ReferentielMale[] {
    return this.getItems<ReferentielMale>(STORAGE_KEYS.REFERENTIEL_MALES);
  }

  getReferentielCalendrierSaillie(): CalendrierSaillieItem[] {
    return this.getItems<CalendrierSaillieItem>(STORAGE_KEYS.REFERENTIEL_CALENDRIER);
  }

  getCyclesBande(): CycleBande[] {
    return this.getItems<CycleBande>(STORAGE_KEYS.CYCLES_BANDE);
  }

  getAllCyclesBande(): CycleBande[] {
    return this.getCyclesBande();
  }

  addCycleBande(cycle: CycleBande): void {
    const list = this.getCyclesBande();
    this.setItems<CycleBande>(STORAGE_KEYS.CYCLES_BANDE, [...list, cycle]);
  }

  getAllAffectationMales(): Record<string, AffectationMaleGroup[]> {
    const refBandes = this.getReferentielBandes();
    if (refBandes && refBandes.length > 0) {
      const result: Record<string, AffectationMaleGroup[]> = {};
      refBandes.forEach(b => {
        result[b.id] = b.groupesParMale;
      });
      return result;
    }

    const refMales = this.getReferentielMales();
    const fallbackResult: Record<string, AffectationMaleGroup[]> = {};
    if (refMales && refMales.length > 0) {
      fallbackResult['bande-a'] = refMales.map(m => ({ maleId: m.id, femellesIds: m.femellesIds }));
    }
    return fallbackResult;
  }
}
