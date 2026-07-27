import type { BandeId } from './referentiel.model';

export type Sexe = 'F' | 'M';

export type EtatFemelle =
  | 'Au repos'
  | 'En gestation'
  | 'En allaitement'
  | 'Réformée'
  | 'Morte';

export type EtatMale = 'Actif' | 'Mort';

export interface Femelle {
  id: string;
  nom: string;
  sexe: 'F';
  bandeId: BandeId;
  maleResponsableId: string;
  etat: EtatFemelle;
  dateNaissance?: string;
  notes?: string;
}

export interface Male {
  id: string;
  nom: string;
  sexe: 'M';
  femellesIds: string[];
  etat: EtatMale;
  dateNaissance?: string;
  notes?: string;
}

export type Reproducteur = Femelle | Male;

export function isFemelle(r: Reproducteur): r is Femelle {
  return r.sexe === 'F';
}

export function isMale(r: Reproducteur): r is Male {
  return r.sexe === 'M';
}

export type EtatBande =
  | 'Repos'
  | 'Saillie'
  | 'Gestation'
  | 'Allaitement'
  | 'Sexage'
  | 'Engraissement'
  | 'Vendue';

export interface EtatCycleBande {
  bandeId: BandeId;
  phaseCourante: EtatBande;
  dateDebutPhaseCourante: string;
  datePrevuFinPhase?: string;
  numeroCycle: number;
  cycleId: string;
}

export interface Bande {
  id: BandeId;
  nom: string;
  couleur?: string;
  phase: EtatBande;
  dateDemarragePhase?: string;
  numeroCycle?: number;
}
