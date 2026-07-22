import type { BandeId, MomentSaillie, JourSaillieNumero } from './referentiel.model';
import type { EtatBande } from './reproducteur.model';

export interface CycleBande {
  id: string;
  bandeId: BandeId;
  numeroCycle: number;
  phaseCourante: EtatBande;
  dateDebutSaillie: string;
  dateDebutPhase: string;
  datePrevuFinPhase?: string;
  dateFinCycle?: string;
  nombreMisesBas?: number;
  totalLapereaux?: number;
  notes?: string;
}

export interface Saillie {
  id: string;
  cycleId: string;
  bandeId: BandeId;
  femelleId: string;
  maleId: string;
  dateSaillie: string;
  jourSaillie: JourSaillieNumero;
  moment: MomentSaillie;
  dateMiseBasPrevue: string;
  datePalpationPrevue: string;
  reussie?: boolean;
  notes?: string;
}

export interface Palpation {
  id: string;
  saillieId: string;
  cycleId: string;
  femelleId: string;
  bandeId: BandeId;
  datePalpation: string;
  resultat: 'Positive' | 'Negative' | 'Incertaine';
  observations?: string;
}

export interface MiseBas {
  id: string;
  saillieId: string;
  cycleId: string;
  femelleId: string;
  bandeId: BandeId;
  dateMiseBas: string;
  nes: number;
  vivants: number;
  mortsNes: number;
  viabiliteCalculee: number;
  dateSevragePrevue?: string;
}

export interface Sevrage {
  id: string;
  miseBasId: string;
  cycleId: string;
  femelleId: string;
  bandeId: BandeId;
  dateSevrage: string;
  sevres: number;
  poidsMoyenSevrage?: number;
  cagesOccupees: number;
}

export interface Sexage {
  id: string;
  cycleId: string;
  bandeId: BandeId;
  dateSexage: string;
  datePrevuFinSexage?: string;
  nombreMales: number;
  nombreFemelles: number;
  totalSexes: number;
  clapierSexageId?: string;
  clapierEngraissementId?: string;
}

export interface Engraissement {
  id: string;
  cycleId: string;
  bandeId: BandeId;
  sexageId: string;
  dateDebut: string;
  datePrevueFin: string;
  effectifDepart: number;
  casesOccupees: number;
  clapiersIds: string[];
  mortalite?: number;
  effectifFinal?: number;
}

export interface Vente {
  id: string;
  cycleId: string;
  bandeId: BandeId;
  engraissementId?: string;
  dateVente: string;
  vendus: number;
  poidsTotal?: number;
  prixUnitaire: number;
  prixTotal: number;
  client?: string;
  notes?: string;
}

export interface Deces {
  id: string;
  reproducteurId?: string;
  typeAnimal: 'Femelle' | 'Male' | 'Lapereau';
  bandeId?: BandeId;
  cycleId?: string;
  dateDeces: string;
  cause?: string;
  observations?: string;
}
