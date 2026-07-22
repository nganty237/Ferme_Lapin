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

export interface MaleReproducteur extends Reproducteur {
  sexe: 'M';
  femellesIds: string[];      // F001-F011 pour M01
  nombreSailliesJour: number; // max 2 par jour
}

export type EtatBande = 
  | 'Repos'
  | 'Saillie'
  | 'Gestation'
  | 'Palpation'
  | 'Allaitement'
  | 'Sevrage'
  | 'Sexage'
  | 'Engraissement';

export interface Bande {
  id: string;              // 'bande-a' | 'bande-b' | 'bande-c'
  nom: string;             // 'Bande A'
  phase: EtatBande;
  dateDemarragePhase?: string;
  femellesIds?: string[];
  couleur?: string;
}
