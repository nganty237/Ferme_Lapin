import { Configuration } from '../models/config.model';

/**
 * Source unique de vérité pour la configuration par défaut de la ferme
 */
export const DEFAULT_CONFIGURATION: Configuration = {
  nombreCagesTotal: 108,
  nombreClapiers: 9,
  nombreCasesParClapier: 12,
  nombreFemelles: 33,
  nombreMales: 3,
  nombreBandes: 3,
  nombreFemellesParBande: 11,
  dureeGestationJours: 31,
  jourPalpation: 15,
  dureeAllaitementMinJours: 35,
  dureeAllaitementMaxJours: 35,
  dureeSexageJours: 30,
  dureeEngraissementJours: 60,
  taillePorteeMoyenne: 7,
  densiteParCase: 3,
  densiteSexageParCase: 7,
  ageMaturiteSexuelleMois: 5,
  decalageAgeBandesMois: 1,
  prixAlimentKg: 350,
  prixVenteDefaut: 10000,
  seuilOccupationCritique: 95,
  seuilOccupationWarning: 80,
  seuilFeconditeMin: 70,
  seuilSurvieMin: 70,
};
