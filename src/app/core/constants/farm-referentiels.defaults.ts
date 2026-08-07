import { ReferentielBande, ReferentielMale, CalendrierSaillieItem } from '../models';

/**
 * Référentiel officiel par défaut des Bandes de la ferme.
 * Définit la composition exacte de chaque bande (11 femelles distribuées sur 3 mâles).
 */
export const DEFAULT_REFERENTIEL_BANDES: ReferentielBande[] = [
  {
    id: 'bande-a',
    nom: 'Bande A',
    couleur: '#4CAF50',
    nombreFemelles: 11,
    decalageAgeMois: 0,
    groupesParMale: [
      { maleId: 'M01', femellesIds: ['F001', 'F002', 'F003', 'F004'] },
      { maleId: 'M02', femellesIds: ['F012', 'F013', 'F014', 'F015'] },
      { maleId: 'M03', femellesIds: ['F023', 'F024', 'F025'] }
    ]
  },
  {
    id: 'bande-b',
    nom: 'Bande B',
    couleur: '#2196F3',
    nombreFemelles: 11,
    decalageAgeMois: 1,
    groupesParMale: [
      { maleId: 'M01', femellesIds: ['F005', 'F006', 'F007', 'F008'] },
      { maleId: 'M02', femellesIds: ['F016', 'F017', 'F018', 'F019'] },
      { maleId: 'M03', femellesIds: ['F026', 'F027', 'F028'] }
    ]
  },
  {
    id: 'bande-c',
    nom: 'Bande C',
    couleur: '#FF9800',
    nombreFemelles: 11,
    decalageAgeMois: 2,
    groupesParMale: [
      { maleId: 'M01', femellesIds: ['F009', 'F010', 'F011'] },
      { maleId: 'M02', femellesIds: ['F020', 'F021', 'F022'] },
      { maleId: 'M03', femellesIds: ['F029', 'F030', 'F031', 'F032', 'F033'] }
    ]
  }
];

/**
 * Référentiel officiel par défaut des Mâles de la ferme.
 */
export const DEFAULT_REFERENTIEL_MALES: ReferentielMale[] = [
  {
    id: 'M01',
    nom: 'M01 — Mâle Reproducteur',
    femellesIds: ['F001', 'F002', 'F003', 'F004', 'F005', 'F006', 'F007', 'F008', 'F009', 'F010', 'F011']
  },
  {
    id: 'M02',
    nom: 'M02 — Mâle Reproducteur',
    femellesIds: ['F012', 'F013', 'F014', 'F015', 'F016', 'F017', 'F018', 'F019', 'F020', 'F021', 'F022']
  },
  {
    id: 'M03',
    nom: 'M03 — Mâle Reproducteur',
    femellesIds: ['F023', 'F024', 'F025', 'F026', 'F027', 'F028', 'F029', 'F030', 'F031', 'F032', 'F033']
  }
];

/**
 * Calendrier de saillie par défaut — 11 femelles par bande, 2 jours de saillie.
 * Source de vérité utilisée en fallback si le localStorage est vide ou incomplet.
 */
export const DEFAULT_CALENDRIER_SAILLIE: CalendrierSaillieItem[] = [
  // ─── Bande A — Jour 1 ───────────────────────────────────────────────────
  { bandeId: 'bande-a', maleId: 'M01', femelleId: 'F001', jourSaillie: 1, moment: 'Matin', ordre: 1 },
  { bandeId: 'bande-a', maleId: 'M01', femelleId: 'F002', jourSaillie: 1, moment: 'Soir',  ordre: 2 },
  { bandeId: 'bande-a', maleId: 'M02', femelleId: 'F012', jourSaillie: 1, moment: 'Matin', ordre: 3 },
  { bandeId: 'bande-a', maleId: 'M02', femelleId: 'F013', jourSaillie: 1, moment: 'Soir',  ordre: 4 },
  { bandeId: 'bande-a', maleId: 'M03', femelleId: 'F023', jourSaillie: 1, moment: 'Matin', ordre: 5 },
  { bandeId: 'bande-a', maleId: 'M03', femelleId: 'F024', jourSaillie: 1, moment: 'Soir',  ordre: 6 },
  // ─── Bande A — Jour 2 ───────────────────────────────────────────────────
  { bandeId: 'bande-a', maleId: 'M01', femelleId: 'F003', jourSaillie: 2, moment: 'Matin', ordre: 7 },
  { bandeId: 'bande-a', maleId: 'M01', femelleId: 'F004', jourSaillie: 2, moment: 'Soir',  ordre: 8 },
  { bandeId: 'bande-a', maleId: 'M02', femelleId: 'F014', jourSaillie: 2, moment: 'Matin', ordre: 9 },
  { bandeId: 'bande-a', maleId: 'M02', femelleId: 'F015', jourSaillie: 2, moment: 'Soir',  ordre: 10 },
  { bandeId: 'bande-a', maleId: 'M03', femelleId: 'F025', jourSaillie: 2, moment: 'Matin', ordre: 11 },
  // ─── Bande B — Jour 1 ───────────────────────────────────────────────────
  { bandeId: 'bande-b', maleId: 'M01', femelleId: 'F005', jourSaillie: 1, moment: 'Matin', ordre: 1 },
  { bandeId: 'bande-b', maleId: 'M01', femelleId: 'F006', jourSaillie: 1, moment: 'Soir',  ordre: 2 },
  { bandeId: 'bande-b', maleId: 'M02', femelleId: 'F016', jourSaillie: 1, moment: 'Matin', ordre: 3 },
  { bandeId: 'bande-b', maleId: 'M02', femelleId: 'F017', jourSaillie: 1, moment: 'Soir',  ordre: 4 },
  { bandeId: 'bande-b', maleId: 'M03', femelleId: 'F026', jourSaillie: 1, moment: 'Matin', ordre: 5 },
  { bandeId: 'bande-b', maleId: 'M03', femelleId: 'F027', jourSaillie: 1, moment: 'Soir',  ordre: 6 },
  // ─── Bande B — Jour 2 ───────────────────────────────────────────────────
  { bandeId: 'bande-b', maleId: 'M01', femelleId: 'F007', jourSaillie: 2, moment: 'Matin', ordre: 7 },
  { bandeId: 'bande-b', maleId: 'M01', femelleId: 'F008', jourSaillie: 2, moment: 'Soir',  ordre: 8 },
  { bandeId: 'bande-b', maleId: 'M02', femelleId: 'F018', jourSaillie: 2, moment: 'Matin', ordre: 9 },
  { bandeId: 'bande-b', maleId: 'M02', femelleId: 'F019', jourSaillie: 2, moment: 'Soir',  ordre: 10 },
  { bandeId: 'bande-b', maleId: 'M03', femelleId: 'F028', jourSaillie: 2, moment: 'Matin', ordre: 11 },
  // ─── Bande C — Jour 1 ───────────────────────────────────────────────────
  { bandeId: 'bande-c', maleId: 'M01', femelleId: 'F009', jourSaillie: 1, moment: 'Matin', ordre: 1 },
  { bandeId: 'bande-c', maleId: 'M01', femelleId: 'F010', jourSaillie: 1, moment: 'Soir',  ordre: 2 },
  { bandeId: 'bande-c', maleId: 'M02', femelleId: 'F020', jourSaillie: 1, moment: 'Matin', ordre: 3 },
  { bandeId: 'bande-c', maleId: 'M02', femelleId: 'F021', jourSaillie: 1, moment: 'Soir',  ordre: 4 },
  { bandeId: 'bande-c', maleId: 'M03', femelleId: 'F029', jourSaillie: 1, moment: 'Matin', ordre: 5 },
  { bandeId: 'bande-c', maleId: 'M03', femelleId: 'F030', jourSaillie: 1, moment: 'Soir',  ordre: 6 },
  // ─── Bande C — Jour 2 ───────────────────────────────────────────────────
  { bandeId: 'bande-c', maleId: 'M01', femelleId: 'F011', jourSaillie: 2, moment: 'Matin', ordre: 7 },
  { bandeId: 'bande-c', maleId: 'M02', femelleId: 'F022', jourSaillie: 2, moment: 'Soir',  ordre: 8 },
  { bandeId: 'bande-c', maleId: 'M03', femelleId: 'F031', jourSaillie: 2, moment: 'Matin', ordre: 9 },
  { bandeId: 'bande-c', maleId: 'M03', femelleId: 'F032', jourSaillie: 2, moment: 'Soir',  ordre: 10 },
  { bandeId: 'bande-c', maleId: 'M03', femelleId: 'F033', jourSaillie: 2, moment: 'Matin', ordre: 11 },
];

