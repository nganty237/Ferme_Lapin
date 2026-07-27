import { Injectable } from '@angular/core';
import { Sevrage, Vente, Configuration, Reproducteur, Clapier, isFemelle, isMale, Bande, Engraissement } from '../models';

export interface ClapierSynthese {
  clapierId: string;
  tauxOccupation: number;
  phaseActive: string;
}

export interface CapacityKPIs {
  capaciteTheorique: number;
  capaciteReelle: number;
  tauxUtilisationCages: number;
  cagesReproducteurs: { meubling?: number; meublees?: number; meublantes?: number; meublantTotale?: number; occupees: number; totales: number; pourcentage: number; nbFemellesActives: number; nbMalesActifs: number };
  occupationCages: { pourcentage: number; occupees: number; totales: number };
  prochainesLiberations: { j30: number; j60: number; j90: number };
  delaiLiberationCagesJours: number;
  prochaineVenteDate?: string;
  goulotPrincipal: 'Cages engraissement' | 'Femelles reproductrices' | 'Mâles' | 'Aucun';
  cagesSupplementairesPourObjectif: number;
  roiAjouterCages: { investissement: number; revenuNetMensuel: number; paybackMonths: number; roiAnnuelPourcent: number; cagesNeeded?: number; lapinsParBande?: number };
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
    bandes: Bande[] = [],
    engraissements: Engraissement[] = []
  ): CapacityKPIs {
    const totalCagesTotal = config.nombreCagesTotal || 108;
    const densiteEngraissement = config.densiteParCase || 3;
    const densiteSexage = config.densiteSexageParCase || 7;
    const nbFemellesConfig = config.nombreFemelles || 33;
    const nbMalesConfig = config.nombreMales || 3;
    
    // Capacité théorique exacte selon le plan de production :
    // - 36 cages Reproducteurs (3 clapiers) : 33F + 3M = 36 lapins (1/cage)
    // - 11 cages Sexage (1 clapier, 11 portées/bande) : 11 × 7 = 77 lapereaux (7/cage)
    // - 52 cages Engraissement (5 clapiers, 2 cohortes chevauchées × 26 cages [77 lapins / 3 = 25.66 → 26 cages]) : 52 × 3 ≈ 154 lapereaux (3/cage max)
    const cagesReproducteurs = nbFemellesConfig + nbMalesConfig; // 36
    const porteesParBande = config.nombreFemellesParBande || 11;
    const lapinsSexageTheorique = porteesParBande * densiteSexage; // 11 * 7 = 77
    const cagesParCohorteEngraissement = Math.ceil(lapinsSexageTheorique / densiteEngraissement); // 77 / 3 = 26 cages
    const cagesEngraissementTheorique = cagesParCohorteEngraissement * 2; // 2 cohortes chevauchées = 52 cages
    const lapinsEngraissementTheorique = lapinsSexageTheorique * 2; // 77 * 2 = 154 lapereaux
    
    const capaciteTotaleLapins = cagesReproducteurs + lapinsSexageTheorique + lapinsEngraissementTheorique; // 36 + 77 + 154 = 267

    let lapinsEnEngraissement = 0;
    let j30 = 0; // Libérées dans 0-30 jours
    let j60 = 0; // Libérées dans 30-60 jours
    let j90 = 0; // Libérées dans 60+ jours
    let minDiffDays = 999;
    let prochaineVenteDate: string | undefined = undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (engraissements && engraissements.length > 0) {
      const engraissementActif = engraissements.filter(eng => {
        const dateDebut = new Date(eng.dateDebut);
        dateDebut.setHours(0, 0, 0, 0);
        const dateFin = new Date(eng.dateFin || eng.datePrevueFin);
        dateFin.setHours(23, 59, 59, 999);
        return dateDebut <= today && today <= dateFin;
      });

      lapinsEnEngraissement = engraissementActif.reduce(
        (sum, eng) => sum + (eng.nombreLapereaux !== undefined ? eng.nombreLapereaux : eng.effectifDepart),
        0
      );

      for (const eng of engraissementActif) {
        const dateFinVal = new Date(eng.dateFin || eng.datePrevueFin);
        dateFinVal.setHours(0, 0, 0, 0);
        const remaining = Math.ceil((dateFinVal.getTime() - today.getTime()) / (1000 * 3600 * 24));
        const cages = Math.ceil((eng.nombreLapereaux !== undefined ? eng.nombreLapereaux : eng.effectifDepart) / densiteEngraissement);

        if (remaining <= 30) {
          j30 += cages;
        } else if (remaining <= 60) {
          j60 += cages;
        } else {
          j90 += cages;
        }

        if (remaining >= 0 && remaining < minDiffDays) {
          minDiffDays = remaining;
          prochaineVenteDate = dateFinVal.toISOString().slice(0, 10);
        }
      }
    } else {
      // Fallback : filtre uniquement par phase bande
      const engraissementBandesIds = bandes.filter(b => b.phase === 'Engraissement').map(b => b.id);
      const totalSevresEngraiss = sevrages
        .filter(s => engraissementBandesIds.includes(s.bandeId))
        .reduce((sum: number, s: Sevrage) => sum + (s.sevres || 0), 0);
      const totalVendusEngraiss = ventes
        .filter(v => engraissementBandesIds.includes(v.bandeId))
        .reduce((sum: number, v: Vente) => sum + (v.vendus || 0), 0);
      
      lapinsEnEngraissement = Math.max(0, totalSevresEngraiss - totalVendusEngraiss);

      for (const b of bandes) {
        if (b.phase === 'Engraissement') {
          const sevragesBande = sevrages.filter(s => s.bandeId === b.id);
          const ventesBande = ventes.filter(v => v.bandeId === b.id);
          const sevres = sevragesBande.reduce((sum: number, s: Sevrage) => sum + (s.sevres || 0), 0);
          const vendus = ventesBande.reduce((sum: number, v: Vente) => sum + (v.vendus || 0), 0);
          const restants = Math.max(0, sevres - vendus);
          const cages = Math.ceil(restants / densiteEngraissement);

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
    }

    // Occupation réelle d'engraissement basée sur les effectifs enregistrés
    const lapinsEffectifsEngraissement = lapinsEnEngraissement;
    const cagesOccupees = Math.ceil(lapinsEffectifsEngraissement / densiteEngraissement);
    const cagesEngraissementClapiers = clapiers && clapiers.length > 0
      ? clapiers.filter(c => c.type === 'Engraissement').reduce((sum, c) => sum + (c.nombreCases || 12), 0)
      : 60;
    const cagesTotalesEngraissement = Math.max(1, cagesEngraissementClapiers || 60);
    const pourcentageOccupation = Math.min(100, Math.round((cagesOccupees / cagesTotalesEngraissement) * 100));
    const delaiLiberationCagesJours = minDiffDays === 999 ? 30 : minDiffDays;

    const liberationsJ30 = j30;
    const liberationsJ60 = j60;

    const nbFemellesActives = reproducteurs && reproducteurs.length > 0
      ? reproducteurs.filter(isFemelle).filter(r => r.etat !== 'Réformée' && r.etat !== 'Morte').length
      : (config.nombreFemelles || 33);
    const nbMalesActifs = reproducteurs && reproducteurs.length > 0
      ? reproducteurs.filter(isMale).filter(r => r.etat !== 'Réformé' && r.etat !== 'Mort').length
      : (config.nombreMales || 3);

    const cagesReproducteursOccupees = nbFemellesActives + nbMalesActifs;
    const cagesReproducteursTotales = (config.nombreFemelles || 33) + (config.nombreMales || 3);
    const cagesReproducteursPourcentage = Math.min(100, Math.round((cagesReproducteursOccupees / cagesReproducteursTotales) * 100));

    let goulotPrincipal: 'Cages engraissement' | 'Femelles reproductrices' | 'Mâles' | 'Aucun' = 'Aucun';
    if (pourcentageOccupation >= 85) {
      goulotPrincipal = 'Cages engraissement';
    } else if (nbFemellesActives < (config.nombreFemelles || 33)) {
      goulotPrincipal = 'Femelles reproductrices';
    } else if (nbMalesActifs < (config.nombreMales || 3)) {
      goulotPrincipal = 'Mâles';
    }

    const coutUneCage = 15000;
    const nbFemellesParBande = config.nombreFemellesParBande || Math.round((config.nombreFemelles || 33) / 3) || 11;
    const porteeMoyenne = config.taillePorteeMoyenne || 7;
    const lapinsParBande = nbFemellesParBande * porteeMoyenne; // 11 femelles × 7 lapereaux = 77 lapins
    const cagesNeeded = Math.ceil(lapinsParBande / densiteEngraissement); // 77 / 3 = 26 cages

    const investissement = cagesNeeded * coutUneCage; // 26 × 15 000 = 390 000 FCFA
    const prixVente = config.prixVenteDefaut || 3000;
    const coutProd = (config.dureeEngraissementJours || 60) * 0.1 * (config.prixAlimentKg || 350);
    const margeParLapin = Math.max(500, prixVente - coutProd);
    const revenuNetMensuel = Math.round(lapinsParBande * margeParLapin); // 77 × 900 = 69 300 FCFA
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
      cagesReproducteurs: {
        occupees: cagesReproducteursOccupees,
        totales: cagesReproducteursTotales,
        pourcentage: cagesReproducteursPourcentage,
        nbFemellesActives,
        nbMalesActifs
      },
      occupationCages: {
        pourcentage: pourcentageOccupation,
        occupees: cagesOccupees,
        totales: cagesTotalesEngraissement
      },
      prochainesLiberations: { j30: liberationsJ30, j60: liberationsJ60, j90 },
      delaiLiberationCagesJours,
      prochaineVenteDate,
      goulotPrincipal,
      cagesSupplementairesPourObjectif: cagesNeeded,
      roiAjouterCages: {
        investissement,
        revenuNetMensuel,
        paybackMonths,
        roiAnnuelPourcent,
        cagesNeeded,
        lapinsParBande
      },
      clapiersSynthese
    };
  }
}
