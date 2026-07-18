export type Sexe = 'F' | 'M';
export type EtatReproducteur = 'Actif' | 'En gestation' | 'En allaitement' | 'Au repos' | 'Réformé' | 'Mort';

export interface Reproducteur {
  id: string;
  nom: string;
  sexe: Sexe;
  dateNaissance?: Date;
  bandeId?: string;
  etat: EtatReproducteur;
  notes?: string;
}

export type PhaseBande = 'A:Allaite' | 'B:Gesta' | 'C:Saillies' | 'Vide';

export interface Bande {
  id: string;
  nom: string;
  phase: PhaseBande;
  dateCreation: Date;
  active: boolean;
}
