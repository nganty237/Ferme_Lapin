export interface Saillie {
  id: string;
  femelleId: string;
  maleId: string;
  dateSaillie: Date;
  dateMiseBasPrevue: Date;
  reussie?: boolean;
}

export interface MiseBas {
  id: string;
  saillieId: string;
  femelleId: string;
  dateMiseBas: Date;
  vivants: number;
  mortsNes: number;
  viabiliteCalculee: number;
}

export interface Sevrage {
  id: string;
  miseBasId: string;
  dateSevrage: Date;
  sevres: number;
  poidsMoyen?: number;
  cagesOccupees: number;
}

export interface Vente {
  id: string;
  dateVente: Date;
  vendus: number;
  poidsTotal?: number;
  prixKg?: number;
  prixTotal: number;
  client?: string;
}
