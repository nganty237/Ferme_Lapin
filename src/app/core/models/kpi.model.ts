export interface KPI {
  productiviteMois: number;
  tauxSurvieAllaitement: number;
  cagesOccupees: number;
  cagesTotal: number;
  tauxFecondite: number;
  porteesEnCours: number;
  phaseBandeA?: string;
  phaseBandeB?: string;
  phaseBandeC?: string;
}

export interface BandeKPI {
  bandeId: string;
  nom: string;
  phase: string;
  nombreFemelles: number;
  porteesEnCours: number;
  dateProchainEvenement?: string | Date;
  typeProchainEvenement?: string;
}
