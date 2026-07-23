import { Injectable } from '@angular/core';
import { 
  Reproducteur, 
  Saillie, 
  MiseBas, 
  Sevrage, 
  Vente, 
  Configuration, 
  Bande, 
  Palpation,
  EtatBande 
} from '../models';

/**
 * Fallback conservateur (92%) tant qu'aucun flux `engraissements$` n'est exposé
 * par DataStoreService. À remplacer par Σ(effectifFinal) / Σ(mortalite + effectifFinal)
 * quand la collection `engraissements` sera flowifiée (P1 hors périmètre).
 */
const TAUX_SURVIE_ENGRAIS_FALLBACK = 92;

export interface AlertePalpation {
  femelleId: string;
  datePalpation: string;
  joursRestants: number;
}

export interface AlerteMiseBas {
  femelleId: string;
  datePrevue: string;
  joursRestants: number;
  urgence: 'imminente' | 'proche' | 'normale';
}

export interface ProductiviteBande {
  bandeId: string;
  nombrePortees: number;
  lapereauTotal: number;
  tauxSurvie: number;
  revenuEstime: number;
}

export interface EtatBandesInfo {
  phase: EtatBande;
  nombreFemelles: number;
  joursPhase: number;
  prochainEvenement: string;
}

export interface ReproductionKPIs {
  productiviteParFemelleAn: number;
  productiviteParFemelle: number;
  tailleMoyennePortee: number;
  porteesParFemelleAn: number;
  tauxFecondite: number;
  viabiliteImmediate: number;
  tauxSurvieAllaitement: number;
  tauxSurvieEngraissement: number;
  productiviteParMale: Record<string, number>;
  nombrePorteesEnCours: number;
  phasesBandes: { A: string; B: string; C: string };
  etatBandes?: Record<string, EtatBandesInfo>;
  alertesPalpation?: AlertePalpation[];
  alertesMiseBas?: AlerteMiseBas[];
  productiviteParBande?: ProductiviteBande[];
}

/**
 * Service spécialisé dans les calculs de reproduction, fécondité, viabilité et alertes de bande.
 */
@Injectable({
  providedIn: 'root'
})
export class KpiReproductionService {

  /**
   * Calcule l'ensemble des indicateurs de performance de reproduction.
   */
  calculateReproductionKPIs(
    reproducteurs: Reproducteur[],
    saillies: Saillie[],
    misesBas: MiseBas[],
    sevrages: Sevrage[],
    ventes: Vente[],
    config: Configuration,
    bandes: Bande[] = [],
    palpations: Palpation[] = []
  ): ReproductionKPIs {
    const femellesActives = reproducteurs.filter(r => r.sexe === 'F' && r.etat !== 'Réformée' && r.etat !== 'Morte');
    const nbFemelles = Math.max(1, femellesActives.length);
    const totalNesVivants = misesBas.reduce((sum: number, mb: MiseBas) => sum + (mb.vivants || 0), 0);
    const totalMortNes = misesBas.reduce((sum: number, mb: MiseBas) => sum + (mb.mortsNes || 0), 0);
    const totalNaissances = totalNesVivants + totalMortNes;

    let totalSevres = 0;
    let totalNesSevrage = 0;
    for (const sev of sevrages) {
      const mb = misesBas.find((m: MiseBas) => m.id === sev.miseBasId);
      if (mb && mb.vivants > 0) {
        totalNesSevrage += mb.vivants;
        totalSevres += sev.sevres || 0;
      }
    }

    const tailleMoyennePortee = misesBas.length > 0 ? Math.round((totalNesVivants / misesBas.length) * 10) / 10 : 0;
    const porteesParFemelleAn = Math.round((misesBas.length / nbFemelles) * 10) / 10;
    const productiviteParFemelleAn = Math.round((totalSevres / nbFemelles) * 10) / 10;

    // Taux de fécondité
    let tauxFecondite = 0;
    if (saillies.length > 0) {
      const sailliesAvecMiseBas = new Set(misesBas.map((mb: MiseBas) => mb.saillieId).filter(Boolean));
      const nbReussies = sailliesAvecMiseBas.size || misesBas.length;
      tauxFecondite = Math.round((nbReussies / saillies.length) * 100);
    }

    // Viabilité et Survie
    const viabiliteImmediate = totalNaissances > 0 ? Math.round((totalNesVivants / totalNaissances) * 100) : 0;
    const tauxSurvieAllaitement = totalNesSevrage > 0 ? Math.round((totalSevres / totalNesSevrage) * 100) : 0;
    const tauxSurvieEngraissement = TAUX_SURVIE_ENGRAIS_FALLBACK;

    // Productivité par mâle
    const malesActifs = reproducteurs.filter(r => r.sexe === 'M');
    const productiviteParMale: Record<string, number> = {};
    for (const male of malesActifs) {
      const sailliesMale = saillies.filter(s => s.maleId === male.id);
      const porteesMale = misesBas.filter(mb => sailliesMale.some(s => s.id === mb.saillieId));
      productiviteParMale[male.id] = porteesMale.length;
    }

    // Nombre de portées en cours d'engraissement
    const totalVendus = ventes.reduce((sum: number, v: Vente) => sum + (v.vendus || 0), 0);
    const lapinsRestants = Math.max(0, totalSevres - totalVendus);
    const nombrePorteesEnCours = Math.ceil(lapinsRestants / Math.max(1, (config.taillePorteeMoyenne || 6)));

    // Phases et état des bandes
    // Fix P0 #2 : phases dérivées de `bandes[].phase` (au lieu de valeurs hardcodées).
    const phasesBandes = this.calcPhasesBandes(bandes);
    const etatBandes = this.calcEtatBandes(bandes);
    const alertesPalpation = this.calcAlertesPalpation(saillies, palpations);
    const alertesMiseBas = this.calcAlertesMiseBas(saillies, misesBas, config.dureeGestationJours || 31);
    const productiviteParBande = this.calcProductiviteParBande(bandes, misesBas, sevrages);

    return {
      productiviteParFemelleAn,
      productiviteParFemelle: productiviteParFemelleAn,
      tailleMoyennePortee,
      porteesParFemelleAn,
      tauxFecondite,
      viabiliteImmediate,
      tauxSurvieAllaitement,
      tauxSurvieEngraissement,
      productiviteParMale,
      nombrePorteesEnCours,
      phasesBandes,
      etatBandes,
      alertesPalpation,
      alertesMiseBas,
      productiviteParBande
    };
  }

  private calcPhasesBandes(bandes: Bande[]): { A: string; B: string; C: string } {
    const get = (id: string): string => bandes.find(b => b.id === id)?.phase ?? 'Repos';
    return { A: get('bande-a'), B: get('bande-b'), C: get('bande-c') };
  }

  private calcEtatBandes(bandes: Bande[]): Record<string, EtatBandesInfo> {
    const res: Record<string, EtatBandesInfo> = {};
    if (!bandes || bandes.length === 0) return res;
    bandes.forEach(b => {
      const key = b.id.replace('bande-', '').toUpperCase();
      res[key] = {
        phase: b.phase,
        nombreFemelles: 11,
        joursPhase: b.dateDemarragePhase ? Math.floor((new Date().getTime() - new Date(b.dateDemarragePhase).getTime()) / (1000 * 3600 * 24)) : 0,
        prochainEvenement: b.phase === 'Repos' ? 'Saillie' : b.phase === 'Saillie' ? 'Mise-bas' : 'Sevrage',
      };
    });
    return res;
  }

  private calcAlertesPalpation(saillies: Saillie[], palpations: Palpation[]): AlertePalpation[] {
    const alertes: AlertePalpation[] = [];
    const today = new Date();
    saillies.forEach(s => {
      const hasPalpation = palpations.find(p => p.saillieId === s.id);
      if (!hasPalpation) {
        const dateSaillie = new Date(s.dateSaillie);
        const datePalpation = new Date(dateSaillie);
        datePalpation.setDate(datePalpation.getDate() + 15);
        const diffDays = Math.floor((datePalpation.getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 5 && diffDays >= -5) {
          alertes.push({
            femelleId: s.femelleId,
            datePalpation: datePalpation.toISOString().slice(0, 10),
            joursRestants: diffDays
          });
        }
      }
    });
    return alertes;
  }

  private calcAlertesMiseBas(saillies: Saillie[], misesBas: MiseBas[], dureeGestation: number): AlerteMiseBas[] {
    const alertes: AlerteMiseBas[] = [];
    const today = new Date();
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    saillies.forEach(s => {
      if (s.reussie !== false) {
        const hasMiseBas = misesBas.find(mb => mb.saillieId === s.id);
        if (!hasMiseBas) {
          const expectedMB = new Date(s.dateSaillie);
          expectedMB.setDate(expectedMB.getDate() + dureeGestation);
          expectedMB.setHours(0, 0, 0, 0);
          
          const diffDays = Math.round((expectedMB.getTime() - todayMidnight.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 7 && diffDays >= -3) {
            alertes.push({
              femelleId: s.femelleId,
              datePrevue: expectedMB.toISOString().slice(0, 10),
              joursRestants: diffDays,
              urgence: diffDays <= 2 ? 'imminente' : diffDays <= 5 ? 'proche' : 'normale'
            });
          }
        }
      }
    });
    return alertes;
  }

  private calcProductiviteParBande(bandes: Bande[], misesBas: MiseBas[], sevrages: Sevrage[]): ProductiviteBande[] {
    if (!bandes) return [];
    return bandes.map(b => {
      const mbBande = misesBas.filter(mb => mb.bandeId === b.id);
      const sevBande = sevrages.filter(s => mbBande.find(mb => mb.id === s.miseBasId));
      const nbPortees = mbBande.length;
      const nes = mbBande.reduce((sum, mb) => sum + (mb.vivants || 0), 0);
      const sevres = sevBande.reduce((sum, s) => sum + (s.sevres || 0), 0);
      return {
        bandeId: b.id,
        nombrePortees: nbPortees,
        lapereauTotal: nes,
        tauxSurvie: nes > 0 ? Math.round((sevres / nes) * 100) : 0,
        revenuEstime: sevres * 3000
      };
    });
  }
}
