import { Injectable, inject } from '@angular/core';
import { 
  BandeId, 
  ReferentielBande, 
  ReferentielMale, 
  CalendrierSaillieItem,
  GroupeFemellsParMale 
} from '../models';
import { StorageService } from './storage.service';
import { DEFAULT_REFERENTIEL_BANDES } from '../constants/farm-referentiels.defaults';

@Injectable({
  providedIn: 'root'
})
export class ReferentielService {
  private storageService = inject(StorageService);

  getReferentielBandes(): ReferentielBande[] {
    const loaded = this.storageService.getReferentielBandes();
    return loaded && loaded.length > 0 ? loaded : DEFAULT_REFERENTIEL_BANDES;
  }

  getCompositionBande(bandeId: BandeId): ReferentielBande | undefined {
    return this.getReferentielBandes().find(b => b.id === bandeId);
  }

  getGroupesParMale(bandeId: BandeId): GroupeFemellsParMale[] {
    const bande = this.getCompositionBande(bandeId);
    return bande ? bande.groupesParMale : [];
  }

  getFemellesDeBande(bandeId: BandeId): string[] {
    const groupes = this.getGroupesParMale(bandeId);
    return groupes.flatMap(g => g.femellesIds);
  }

  getMaleResponsable(femelleId: string): string {
    const males = this.storageService.getReferentielMales();
    const found = males.find((m: ReferentielMale) => m.femellesIds.includes(femelleId));
    if (found) return found.id;

    console.warn(`[ReferentielService] Aucun mâle associé trouvé pour la femelle "${femelleId}". Mâle par défaut (M01) retourné.`);
    return males.length > 0 ? males[0].id : 'M01';
  }

  getBandeDeFemelle(femelleId: string): BandeId {
    const bandes = this.getReferentielBandes();
    for (const b of bandes) {
      if (b.groupesParMale) {
        const fIds = b.groupesParMale.flatMap(g => g.femellesIds);
        if (fIds.includes(femelleId)) {
          return b.id;
        }
      }
    }
    return 'bande-a';
  }

  getCalendrierSaillieStatique(bandeId: BandeId): CalendrierSaillieItem[] {
    const items = this.storageService.getReferentielCalendrierSaillie();
    return items.filter(item => item.bandeId === bandeId);
  }
}

