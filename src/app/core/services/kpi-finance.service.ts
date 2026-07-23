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

    // Coût de production par lapin (consommation estimée d'aliments pendant la durée d'engraissement)
    const consommationAlimentEstimeeKg = (dureeEngraissementJours * 0.1); // ~100g d'aliment / jour / lapin
    const coutProductionParLapin = Math.round(consommationAlimentEstimeeKg * prixAlimentKg);

    const totalSevres = sevrages.reduce((sum: number, s: Sevrage) => sum + (s.sevres || 0), 0);
    const totalVendus = ventes.reduce((sum: number, v: Vente) => sum + (v.vendus || 0), 0);

    // Revenus réels des ventes + revenus projetés des sevrages non encore vendus
    const actualRevenue = ventes.reduce((sum: number, v: Vente) => sum + (v.prixTotal || (v.vendus * prixVenteDefault) || 0), 0);
    const projectedRevenue = Math.max(0, totalSevres - totalVendus) * prixVenteDefault;
    const chiffreAffairesTotal = actualRevenue + projectedRevenue;

    const coutTotalProduction = totalSevres * coutProductionParLapin;

    const margeBruteTotale = Math.max(0, chiffreAffairesTotal - coutTotalProduction);

    // Revenu moyen par portée sevrée (ou portée mise-bas par défaut)
    const nbPortees = Math.max(1, sevrages.length > 0 ? sevrages.length : misesBas.length);
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
