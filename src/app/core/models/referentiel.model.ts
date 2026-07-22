export type MomentSaillie = 'Matin' | 'Soir';
export type JourSaillieNumero = 1 | 2;
export type BandeId = 'bande-a' | 'bande-b' | 'bande-c';

export interface ReferentielMale {
  id: string;
  nom: string;
  femellesIds: string[];
}

export interface ReferentielFemelle {
  id: string;
  nom: string;
  bandeId: BandeId;
  maleResponsableId: string;
}

export interface CalendrierSaillieItem {
  bandeId: BandeId;
  maleId: string;
  femelleId: string;
  jourSaillie: JourSaillieNumero;
  moment: MomentSaillie;
  ordre: number;
}

export interface GroupeFemellsParMale {
  maleId: string;
  femellesIds: string[];
}

export interface ReferentielBande {
  id: BandeId;
  nom: string;
  couleur: string;
  groupesParMale: GroupeFemellsParMale[];
  nombreFemelles: number;
  decalageAgeMois: number;
}
