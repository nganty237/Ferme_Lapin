export type MomentSaillie = 'Matin' | 'Soir';
export type JourSaillie = number;

export interface SessionSaillie {
  id: string;
  bandeId: string;
  maleId: string;
  femelleId: string;
  jour: JourSaillie;       // Jour 1, Jour 2, etc. de la saillie
  moment: MomentSaillie;   // Matin ou Soir
  dateSaillie: string;     // ISO date
  reussie?: boolean;
  observations?: string;
}
