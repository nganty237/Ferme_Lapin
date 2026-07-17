export interface Band {
  id: string;
  name: string;
  dateCreated: string; // YYYY-MM-DD
  nbFemales: number;
  status: 'reproduction' | 'gestation' | 'sevrage' | 'engraissement' | 'archived';
  notes?: string;
}

export interface Reproduction {
  id: string;
  bandId: string;
  dateBreeding: string; // YYYY-MM-DD (saillie)
  dateExpectedKindling: string; // YYYY-MM-DD (saillie + 31 days)
  actualKindling?: string | null; // YYYY-MM-DD (mise-bas)
  nbBornAlive?: number;
  nbDeadBeforeWeaning?: number;
}

export interface Weaning {
  id: string;
  reproductionId: string;
  dateWeaning: string; // YYYY-MM-DD
  nbWeaned: number;
  avgWeightAtWeaning: number; // in kg
}

export interface Fattening {
  id: string;
  weaningId: string;
  dateExpectedSale: string; // YYYY-MM-DD (sevrage + 28 days)
  nbDeadDuringFattening?: number;
  nbSold?: number;
  avgWeight?: number; // average weight at sale in kg
}

export interface Sales {
  id: string;
  fatteningId?: string | null;
  dateOrder: string; // YYYY-MM-DD
  customer: string; // 'Centragel' or other
  nbRequested: number;
  nbDelivered: number;
  pricePerKg: number;
  totalAmount: number;
}
