export interface Configuration {
  // Infrastructure
  nombreCagesTotal: number;          // 108 (9 clapiers × 12 cases)
  nombreClapiers?: number;           // 9
  nombreCasesParClapier?: number;    // 12
  densiteParCage: number;            // 3 lapereaux par case en engraissement
  nombreCagesReproductrices: number; // 33 (1 par femelle)

  // Durées des phases (jours)
  dureeGestationJours: number;       // 31
  dureeAllaitementJours: number;     // 31 (30–35)
  dureeSexageJours?: number;         // 30
  dureeEngraissementJours: number;   // 60

  // Cheptel
  nombreFemelles?: number;           // 33
  nombreMales?: number;              // 3
  nombreBandes?: number;             // 3
  taillePorteeMoyenne?: number;      // 6 lapereaux/portée

  // Économie
  prixAlimentKg: number;             // 350 FCFA/kg
  prixVenteDefaut: number;           // 3000 FCFA/lapin
}
