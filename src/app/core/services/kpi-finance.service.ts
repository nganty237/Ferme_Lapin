import { Injectable } from '@angular/core';
import { Vente, Sevrage, MiseBas, Configuration, Reproducteur } from '../models';

export interface FinanceKPIs {
  revenuMoyenPortee: number;
  coutProductionParLapin: number;
  margeBruteTotale: number;
  rentabiliteFemelleAn: number;
}

/**
 * Service spécialisé dans les calculs financiers, coûts de production et rentabilité.
 */
@Injectable({
  providedIn: 'root'
})
export class KpiFinanceService {

  /**
   * Calcule l'ensemble des indicateurs de performance financière de l'élevage.
   */
  calculateFinanceKPIs(
    ventes: Vente[],
    sevrages: Sevrage[],
    misesBas: MiseBas[],
    config: Configuration,
    reproducteurs: Reproducteur[] = []
  ): FinanceKPIs {
    const prixVenteDefault = config.prixVenteDefaut || 3000;
    const prixAlimentKg = config.prixAlimentKg || 350;
    const dureeEngraissementJours = config.dureeEngraissementJours || 60;

    // Revenus totaux des ventes
    const chiffreAffairesTotal = ventes.reduce((sum: number, v: Vente) => sum + (v.prixTotal || (v.vendus * prixVenteDefault) || 0), 0);

    // Coût de production par lapin (consommation estimée d'aliments pendant la durée d'engraissement)
    const consommationAlimentEstimeeKg = (dureeEngraissementJours * 0.1); // ~100g d'aliment / jour / lapin
    const coutProductionParLapin = Math.round(consommationAlimentEstimeeKg * prixAlimentKg);

    const totalVendus = ventes.reduce((sum: number, v: Vente) => sum + (v.vendus || 0), 0);
    const coutTotalProduction = totalVendus * coutProductionParLapin;

    const margeBruteTotale = Math.max(0, chiffreAffairesTotal - coutTotalProduction);

    // Revenu moyen par portée
    const nbPortees = Math.max(1, misesBas.length);
    const revenuMoyenPortee = Math.round(chiffreAffairesTotal / nbPortees);

    // Rentabilité par femelle par an
    const femellesActives = reproducteurs.filter(r => r.sexe === 'F' && r.etat !== 'Réformée' && r.etat !== 'Morte').length;
    const nbFemelles = Math.max(1, femellesActives || (config.nombreFemelles || 33));
    const rentabiliteFemelleAn = Math.round(margeBruteTotale / nbFemelles);

    return {
      revenuMoyenPortee,
      coutProductionParLapin,
      margeBruteTotale,
      rentabiliteFemelleAn
    };
  }
}
