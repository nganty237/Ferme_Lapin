export interface Saillie {
  id: string;
  femelleId: string;
  maleId: string;
  dateSaillie: Date | string;
  dateMiseBasPrevue: Date | string;
  reussie?: boolean;
}

export interface MiseBas {
  id: string;
  saillieId: string;
  femelleId: string;
  dateMiseBas: Date | string;
  bandeId?: string;
  nes?: number;
  vivants: number;
  mortsNes: number;
  viabiliteCalculee: number;
  dateSevragePrevue?: string | Date;
}

export interface Palpation {
  id: string;
  femelleId: string;
  saillieId: string;
  datePalpation: string | Date;   // saillie + 15j
  resultat: 'Positive' | 'Negative' | 'Incertaine';
  observations?: string;
}

export interface Sexage {
  id: string;
  miseBasId?: string;
  sevrageId?: string;
  bandeId: string;
  dateSexage: string | Date;
  nombreMales: number;
  nombreFemelles: number;
  totalSexes: number;
  clapierDestination: string;  // id du clapier engraissement
}

export interface Sevrage {
  id: string;
  miseBasId: string;
  femelleId?: string;
  bandeId?: string;
  dateSevrage: Date | string;
  sevres: number;
  poidsMoyen?: number;
  cagesOccupees: number;
}

export interface Vente {
  id: string;
  dateVente: Date | string;
  vendus: number;
  poidsTotal?: number;
  prixKg?: number;
  prixTotal: number;
  client?: string;
  notes?: string;
}
