import { Injectable } from '@angular/core';
import { Sevrage, Vente, Configuration, Reproducteur, Clapier } from '../models';

export interface ClapierSynthese {
  clapierId: string;
  tauxOccupation: number;
  phaseActive: string;
}

export interface CapacityKPIs {
  capaciteTheorique: number;
  capaciteReelle: number;
  tauxUtilisationCages: number;
  occupationCages: { pourcentage: number; occupees: number; totales: number };
  prochainesLiberations: { j30: number; j60: number; j90: number };
  delaiLiberationCagesJours: number;
  prochaineVenteDate?: string;
  goulotPrincipal: 'Cages engraissement' | 'Femelles reproductrices' | 'Mâles' | 'Aucun';
  cagesSupplementairesPourObjectif: number;
  roiAjouterCages: { investissement: number; revenuNetMensuel: number; paybackMonths: number; roiAnnuelPourcent: number };
  clapiersSynthese?: ClapierSynthese[];
}

/**
 * Service spécialisé dans les calculs de capacité des clapiers, occupation et projections d'extension.
 */
@Injectable({
  providedIn: 'root'
})
export class KpiCapacityService {

  /**
   * Calcule l'ensemble des métriques de capacité des cages et d'occupation.
   */
  calculateCapacityKPIs(
    sevrages: Sevrage[],
    ventes: Vente[],
    config: Configuration,
    reproducteurs: Reproducteur[] = [],
    clapiers: Clapier[] = []
  ): CapacityKPIs {
    const totalCagesTotal = config.nombreCagesTotal || 108;
    const densite = config.densiteParCage || 3;
    const capaciteTotaleLapins = totalCagesTotal * densite;

    const totalSevres = sevrages.reduce((sum: number, s: Sevrage) => sum + (s.sevres || 0), 0);
    const totalVendus = ventes.reduce((sum: number, v: Vente) => sum + (v.vendus || 0), 0);
    const lapinsEnEngraissement = Math.max(0, totalSevres - totalVendus);

    const cagesOccupees = Math.ceil(lapinsEnEngraissement / densite);
    const cagesTotalesEngraissement = Math.max(1, totalCagesTotal - (config.nombreCagesReproductrices || 33));

    const pourcentageOccupation = Math.min(100, Math.round((cagesOccupees / cagesTotalesEngraissement) * 100));

    const j30 = Math.round(cagesOccupees * 0.4);
    const j60 = Math.round(cagesOccupees * 0.35);
    const j90 = Math.round(cagesOccupees * 0.25);

    // Détection du goulot d'étranglement principal
    const nbFemellesActives = reproducteurs.filter(r => r.sexe === 'F' && r.etat !== 'Réformé' && r.etat !== 'Mort').length;
    const nbMalesActifs = reproducteurs.filter(r => r.sexe === 'M' && r.etat !== 'Réformé' && r.etat !== 'Mort').length;

    let goulotPrincipal: 'Cages engraissement' | 'Femelles reproductrices' | 'Mâles' | 'Aucun' = 'Aucun';
    if (pourcentageOccupation >= 85) {
      goulotPrincipal = 'Cages engraissement';
    } else if (nbFemellesActives < (config.nombreFemelles || 33)) {
      goulotPrincipal = 'Femelles reproductrices';
    } else if (nbMalesActifs < (config.nombreMales || 3)) {
      goulotPrincipal = 'Mâles';
    }

    // Estimation du ROI d'extension
    const coutUneCage = 15000;
    const cagesNeeded = 12;
    const investissement = cagesNeeded * coutUneCage;
    const prixVente = config.prixVenteDefaut || 3000;
    const coutProd = (config.dureeEngraissementJours || 60) * 0.1 * (config.prixAlimentKg || 350);
    const margeParLapin = Math.max(500, prixVente - coutProd);
    const lapinsSupplementairesParMois = cagesNeeded * densite;
    const revenuNetMensuel = Math.round(lapinsSupplementairesParMois * margeParLapin);
    const paybackMonths = revenuNetMensuel > 0 ? Math.round((investissement / revenuNetMensuel) * 10) / 10 : 0;
    const roiAnnuelPourcent = investissement > 0 ? Math.round(((revenuNetMensuel * 12) / investissement) * 100) : 0;

    const clapiersSynthese: ClapierSynthese[] = clapiers ? clapiers.map(c => ({
      clapierId: c.id,
      tauxOccupation: Math.round(((c.casesOccupees || 0) / (c.nombreCases || 12)) * 100),
      phaseActive: c.type || 'Vide'
    })) : [];

    return {
      capaciteTheorique: capaciteTotaleLapins,
      capaciteReelle: capaciteTotaleLapins,
      tauxUtilisationCages: pourcentageOccupation,
      occupationCages: {
        pourcentage: pourcentageOccupation,
        occupees: cagesOccupees,
        totales: cagesTotalesEngraissement
      },
      prochainesLiberations: { j30, j60, j90 },
      delaiLiberationCagesJours: 15,
      prochaineVenteDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      goulotPrincipal,
      cagesSupplementairesPourObjectif: cagesNeeded,
      roiAjouterCages: {
        investissement,
        revenuNetMensuel,
        paybackMonths,
        roiAnnuelPourcent
      },
      clapiersSynthese
    };
  }
}
