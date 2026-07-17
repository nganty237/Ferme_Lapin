import { Injectable } from '@angular/core';
import { Band, Reproduction, Weaning, Fattening, Sales } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class KpiService {
  /**
   * Calcul du taux de fertilité : (Mises-bas réelles / Total Saillies) * 100
   */
  calculateFertilityRate(reproductions: Reproduction[]): number {
    if (!reproductions || reproductions.length === 0) return 0;
    const actualKindlings = reproductions.filter(r => !!r.actualKindling).length;
    return Math.round((actualKindlings / reproductions.length) * 100);
  }

  /**
   * Calcul de la prolificité : Nombre moyen de nés vivants par portée (mise-bas)
   */
  calculateProlificacy(reproductions: Reproduction[]): number {
    const actualKindlings = reproductions.filter(r => !!r.actualKindling && r.nbBornAlive !== undefined);
    if (actualKindlings.length === 0) return 0;
    const totalBornAlive = actualKindlings.reduce((sum, r) => sum + (r.nbBornAlive || 0), 0);
    return Math.round((totalBornAlive / actualKindlings.length) * 10) / 10;
  }

  /**
   * Taux de mortalité pré-sevrage : (Morts avant sevrage / Nés vivants) * 100
   */
  calculatePreWeaningMortality(reproductions: Reproduction[]): number {
    const actualKindlings = reproductions.filter(r => !!r.actualKindling && r.nbBornAlive !== undefined && r.nbDeadBeforeWeaning !== undefined);
    if (actualKindlings.length === 0) return 0;
    const totalBornAlive = actualKindlings.reduce((sum, r) => sum + (r.nbBornAlive || 0), 0);
    const totalDead = actualKindlings.reduce((sum, r) => sum + (r.nbDeadBeforeWeaning || 0), 0);
    if (totalBornAlive === 0) return 0;
    return Math.round((totalDead / totalBornAlive) * 100);
  }

  /**
   * Gain Moyen Quotidien (GMQ) en grammes/jour : (Poids moyen vente - Poids moyen sevrage) / 28 jours
   */
  calculateAvgDailyGain(fattenings: Fattening[], weanings: Weaning[]): number {
    let count = 0;
    let sumGmq = 0;

    fattenings.forEach(f => {
      if (f.avgWeight && f.avgWeight > 0) {
        const weaning = weanings.find(w => w.id === f.weaningId);
        if (weaning && weaning.avgWeightAtWeaning > 0) {
          const gainKg = f.avgWeight - weaning.avgWeightAtWeaning;
          const gmqGrams = (gainKg / 28) * 1000; // 28 jours d'engraissement
          sumGmq += gmqGrams;
          count++;
        }
      }
    });

    return count > 0 ? Math.round(sumGmq / count) : 0;
  }

  /**
   * Taux de service des ventes : (Lapins livrés / Commandés) * 100
   */
  calculateServiceRate(sales: Sales[]): number {
    if (!sales || sales.length === 0) return 0;
    const totalRequested = sales.reduce((sum, s) => sum + s.nbRequested, 0);
    const totalDelivered = sales.reduce((sum, s) => sum + s.nbDelivered, 0);
    if (totalRequested === 0) return 0;
    return Math.round((totalDelivered / totalRequested) * 100);
  }

  /**
   * Nombre de lapins actuellement disponibles en engraissement (prêts pour la vente)
   * On prend les bandes dont le statut est 'engraissement' et on somme le nombre de sevrés
   */
  calculateAvailableRabbits(bands: Band[], reproductions: Reproduction[], weanings: Weaning[], fattenings: Fattening[]): number {
    let available = 0;
    bands.forEach(b => {
      if (b.status === 'engraissement') {
        const repros = reproductions.filter(r => r.bandId === b.id);
        repros.forEach(r => {
          const weaning = weanings.find(w => w.reproductionId === r.id);
          if (weaning) {
            const fattening = fattenings.find(f => f.weaningId === weaning.id);
            const dead = fattening?.nbDeadDuringFattening || 0;
            const sold = fattening?.nbSold || 0;
            available += (weaning.nbWeaned - dead - sold);
          }
        });
      }
    });
    return Math.max(0, available);
  }

  /**
   * Nombre total de lapins vendus
   */
  calculateTotalSold(sales: Sales[]): number {
    return sales.reduce((sum, s) => sum + s.nbDelivered, 0);
  }

  /**
   * Chiffre d'affaires total
   */
  calculateRevenue(sales: Sales[]): number {
    return sales.reduce((sum, s) => sum + s.totalAmount, 0);
  }
}
