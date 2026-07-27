import { ReferentielBande, ReferentielMale } from '../models';

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
