import { Injectable, inject, computed } from '@angular/core';
import { FarmService } from './farm.service';
import { KpiService } from './kpi.service';

export interface AlertItem {
  id: string;
  type: 'danger' | 'warning' | 'info';
  message: string;
  category: 'kindling' | 'weaning' | 'stock' | 'sale';
}

@Injectable({
  providedIn: 'root'
})
export class AlertEngineService {
  private farmService = inject(FarmService);
  private kpiService = inject(KpiService);

  // Computes active alerts reactively based on farm status
  public alerts = computed<AlertItem[]>(() => {
    const bands = this.farmService.bands();
    const reproductions = this.farmService.reproductions();
    const weanings = this.farmService.weanings();
    const fattenings = this.farmService.fattenings();
    const sales = this.farmService.sales();

    const list: AlertItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Biological alerts: Expected Kindling (Mise bas) under 3 days
    reproductions.forEach(r => {
      if (!r.actualKindling) {
        const expDate = new Date(r.dateExpectedKindling);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const band = bands.find(b => b.id === r.bandId);
        const bandName = band ? band.name : `Bande ${r.bandId}`;

        if (diffDays >= 0 && diffDays <= 3) {
          list.push({
            id: `kindling_${r.id}`,
            type: 'danger',
            message: `Mise bas attendue pour la ${bandName} dans ${diffDays} jour(s) (${r.dateExpectedKindling}).`,
            category: 'kindling'
          });
        } else if (diffDays < 0) {
          list.push({
            id: `kindling_${r.id}`,
            type: 'danger',
            message: `Mise bas en retard pour la ${bandName} (Prévue le ${r.dateExpectedKindling}).`,
            category: 'kindling'
          });
        }
      }
    });

    // 2. Biological alerts: Weaning (Sevrage) due today or soon
    // Weaning should happen ~11 days after actualKindling (according to user's diagram)
    reproductions.forEach(r => {
      if (r.actualKindling) {
        // Check if weaning record exists for this reproduction
        const hasWeaning = weanings.some(w => w.reproductionId === r.id);
        if (!hasWeaning) {
          const kindlingDate = new Date(r.actualKindling);
          const expectedWeaningDate = new Date(kindlingDate);
          expectedWeaningDate.setDate(expectedWeaningDate.getDate() + 11);
          expectedWeaningDate.setHours(0, 0, 0, 0);

          const diffTime = expectedWeaningDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const band = bands.find(b => b.id === r.bandId);
          const bandName = band ? band.name : `Bande ${r.bandId}`;

          const expectedWeaningStr = expectedWeaningDate.toISOString().split('T')[0];

          if (diffDays === 0) {
            list.push({
              id: `weaning_${r.id}`,
              type: 'warning',
              message: `Sevrage aujourd'hui pour la ${bandName}.`,
              category: 'weaning'
            });
          } else if (diffDays > 0 && diffDays <= 2) {
            list.push({
              id: `weaning_${r.id}`,
              type: 'info',
              message: `Sevrage à planifier pour la ${bandName} sous ${diffDays} jour(s) (${expectedWeaningStr}).`,
              category: 'weaning'
            });
          } else if (diffDays < 0) {
            list.push({
              id: `weaning_${r.id}`,
              type: 'warning',
              message: `Sevrage en retard de ${Math.abs(diffDays)} jour(s) pour la ${bandName}.`,
              category: 'weaning'
            });
          }
        }
      }
    });

    // 3. Commercial alerts: Fattening band ready to sell
    fattenings.forEach(f => {
      if (!f.nbSold) {
        const expSaleDate = new Date(f.dateExpectedSale);
        expSaleDate.setHours(0, 0, 0, 0);
        const diffTime = expSaleDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Trace band name
        const weaning = weanings.find(w => w.id === f.weaningId);
        const repro = weaning ? reproductions.find(r => r.id === weaning.reproductionId) : null;
        const band = repro ? bands.find(b => b.id === repro.bandId) : null;
        const bandName = band ? band.name : `Bande ID ${f.id}`;

        if (diffDays <= 0) {
          list.push({
            id: `sale_${f.id}`,
            type: 'warning',
            message: `La ${bandName} est prête pour la commercialisation (Prévue le ${f.dateExpectedSale}).`,
            category: 'sale'
          });
        }
      }
    });

    // 4. Stock alert: Risk of stockout
    // Available rabbits vs future orders or a minimum threshold (e.g. 50 rabbits for buffer)
    const availableRabbits = this.kpiService.calculateAvailableRabbits(bands, reproductions, weanings, fattenings);
    
    // Simulate stock warning: let's say if available rabbits are less than 20 and there are active bands in fattening
    // Or if we have a sale request that cannot be fulfilled.
    // Let's check future orders where nbDelivered < nbRequested (pending sales)
    const pendingSalesCount = sales
      .filter(s => s.nbDelivered < s.nbRequested)
      .reduce((sum, s) => sum + (s.nbRequested - s.nbDelivered), 0);

    if (pendingSalesCount > 0 && availableRabbits < pendingSalesCount) {
      list.push({
        id: 'stockout_risk',
        type: 'danger',
        message: `Risque de rupture : ${availableRabbits} lapin(s) disponible(s) pour ${pendingSalesCount} commandé(s) en attente.`,
        category: 'stock'
      });
    } else if (availableRabbits < 15) {
      list.push({
        id: 'low_stock',
        type: 'info',
        message: `Stock faible : seulement ${availableRabbits} lapin(s) disponible(s) en engraissement.`,
        category: 'stock'
      });
    }

    return list;
  });
}
