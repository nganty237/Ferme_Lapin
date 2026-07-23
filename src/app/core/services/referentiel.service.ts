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

    const num = parseInt(femelleId.replace('F', ''), 10);
    if (num <= 11) return 'M01';
    if (num <= 22) return 'M02';
    return 'M03';
  }

  getCalendrierSaillieStatique(bandeId: BandeId): CalendrierSaillieItem[] {
    const items = this.storageService.getReferentielCalendrierSaillie();
    return items.filter(item => item.bandeId === bandeId);
  }
}
