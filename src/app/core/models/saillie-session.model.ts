/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité descendante.
 * `SessionSaillie` a été fusionné dans `Saillie` (events.model.ts) qui
 * intègre désormais `jourSaillie`, `moment`, `cycleId` et `datePalpationPrevue`.
 *
 * Migrer vers `import { Saillie } from './events.model'`.
 */
export type { Saillie as SessionSaillie } from './events.model';
export type { MomentSaillie, JourSaillieNumero as JourSaillie } from './referentiel.model';
