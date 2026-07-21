export type TypeClapier = 
  | 'Reproduction'
  | 'Maternité'
  | 'Gestation'
  | 'Allaitement'
  | 'Sexage'
  | 'Engraissement'
  | 'Vide';

export interface Clapier {
  id: string;           // 'clapier-1' a 'clapier-9'
  nom?: string;         // 'Clapier 1'
  numero: number;       // 1 a 9
  type: TypeClapier;
  nombreCases: number;  // toujours 12
  casesOccupees: number;
  bandeId?: string;     // bande en cours dans ce clapier
}
