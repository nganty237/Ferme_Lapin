import { Injectable } from '@angular/core';
import { Sevrage, Vente, Configuration, Reproducteur, Clapier, isFemelle, isMale, Bande } from '../models';

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

@Injectable({
  providedIn: 'root'
})
export class KpiCapacityService {

  calculateCapacityKPIs(
    sevrages: Sevrage[],
    ventes: Vente[],
    config: Configuration,
    reproducteurs: Reproducteur[] = [],
    clapiers: Clapier[] = [],
    bandes: Bande[] = []
  ): CapacityKPIs {
    const totalCagesTotal = config.nombreCagesTotal || 108;
    const densite = config.densiteParCase || 3;
    const nbFemellesConfig = config.nombreFemelles || 33;
    const nbMalesConfig = config.nombreMales || 3;
    
    // Capacité théorique : reproducteurs (1/cage) + lapereaux (densité/cage)
    const cagesReproducteurs = nbFemellesConfig + nbMalesConfig;
    const cagesDisponiblesLapereaux = totalCagesTotal - cagesReproducteurs;
    const capaciteTotaleLapins = cagesReproducteurs + (cagesDisponiblesLapereaux * densite);

    const engraissementBandesIds = bandes.filter(b => b.phase === 'Engraissement').map(b => b.id);
    const totalSevresEngraiss = sevrages
      .filter(s => engraissementBandesIds.includes(s.bandeId))
      .reduce((sum: number, s: Sevrage) => sum + (s.sevres || 0), 0);
    const totalVendusEngraiss = ventes
      .filter(v => engraissementBandesIds.includes(v.bandeId))
      .reduce((sum: number, v: Vente) => sum + (v.vendus || 0), 0);
    
    const lapinsEnEngraissement = Math.max(0, totalSevresEngraiss - totalVendusEngraiss);

    const cagesOccupees = Math.ceil(lapinsEnEngraissement / densite);
    const cagesTotalesEngraissement = Math.max(1, cagesDisponiblesLapereaux);

    const pourcentageOccupation = Math.min(100, Math.round((cagesOccupees / cagesTotalesEngraissement) * 100));

    // Prochaines libérations dynamiques
    let j30 = 0; // Libérées dans 0-30 jours
    let j60 = 0; // Libérées dans 30-60 jours
    let j90 = 0; // Libérées dans 60+ jours

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let minDiffDays = 999;
    let prochaineVenteDate: string | undefined = undefined;

    for (const b of bandes) {
      if (b.phase === 'Engraissement') {
        const sevragesBande = sevrages.filter(s => s.bandeId === b.id);
        const ventesBande = ventes.filter(v => v.bandeId === b.id);
        const sevres = sevragesBande.reduce((sum: number, s: Sevrage) => sum + (s.sevres || 0), 0);
        const vendus = ventesBande.reduce((sum: number, v: Vente) => sum + (v.vendus || 0), 0);
        const restants = Math.max(0, sevres - vendus);
        const cages = Math.ceil(restants / densite);

        if (sevragesBande.length > 0) {
          const dateSevrageVal = new Date(sevragesBande[0].dateSevrage);
          dateSevrageVal.setHours(0, 0, 0, 0);
          const ageJours = Math.round((today.getTime() - dateSevrageVal.getTime()) / (1000 * 3600 * 24));
          const duration = config.dureeEngraissementJours || 60;
          const remaining = duration - ageJours;

          if (remaining <= 30) {
            j30 += cages;
          } else if (remaining <= 60) {
            j60 += cages;
          } else {
            j90 += cages;
          }

          if (remaining >= 0 && remaining < minDiffDays) {
            minDiffDays = remaining;
            const expectedSale = new Date(dateSevrageVal);
            expectedSale.setDate(expectedSale.getDate() + duration);
            prochaineVenteDate = expectedSale.toISOString().slice(0, 10);
          }
        }
      }
    }

    const delaiLiberationCagesJours = minDiffDays === 999 ? 0 : minDiffDays;

    const nbFemellesActives = reproducteurs.filter(isFemelle).filter(r => r.etat !== 'Réformée' && r.etat !== 'Morte').length;
    const nbMalesActifs = reproducteurs.filter(isMale).filter(r => r.etat !== 'Réformé' && r.etat !== 'Mort').length;

    let goulotPrincipal: 'Cages engraissement' | 'Femelles reproductrices' | 'Mâles' | 'Aucun' = 'Aucun';
    if (pourcentageOccupation >= 85) {
      goulotPrincipal = 'Cages engraissement';
    } else if (nbFemellesActives < (config.nombreFemelles || 33)) {
      goulotPrincipal = 'Femelles reproductrices';
    } else if (nbMalesActifs < (config.nombreMales || 3)) {
      goulotPrincipal = 'Mâles';
    }

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
      delaiLiberationCagesJours,
      prochaineVenteDate,
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
