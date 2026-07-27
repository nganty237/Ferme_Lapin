import { Injectable, inject } from '@angular/core';
import { 
  BandeId, 
  ReferentielBande, 
  ReferentielMale, 
  CalendrierSaillieItem,
  GroupeFemellsParMale 
} from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ReferentielService {
  private storageService = inject(StorageService);

  getReferentielBandes(): ReferentielBande[] {
    return this.storageService.getReferentielBandes();
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


  getCalendrierSaillieStatique(bandeId: BandeId): CalendrierSaillieItem[] {
    const items = this.storageService.getReferentielCalendrierSaillie();
    return items.filter(item => item.bandeId === bandeId);
  }
}
