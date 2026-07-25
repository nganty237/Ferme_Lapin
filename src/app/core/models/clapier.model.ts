import type { BandeId } from './referentiel.model';

/**
 * Types fonctionnels d'un clapier.
 * Reflète les phases du cycle d'élevage auxquelles chaque clapier peut être affecté.
 *
 * Infrastructure : 9 clapiers de 12 cases chacun = 108 cases au total.
 *   - 3 clapiers de Maternité (reproduction + mise bas + allaitement, 36 cases)
 *   - 1 clapier de Sexage (séparation mâles/femelles, 30 jours, 7 lapereaux/case, 12 cases)
 *   - 5 clapiers d'Engraissement (croissance, 60 jours, 3 lapereaux/case max, 60 cases)
 *
 * Un clapier peut être réaffecté à l'Infirmerie ou au Vide sanitaire si besoin.
 */
export type TypeClapier =
  | 'Maternité'      // Clapiers des femelles reproductrices (saillie, gestation, allaitement)
  | 'Sexage'         // Clapier dédié à la séparation mâles/femelles post-sevrage
  | 'Engraissement'  // Clapiers d'engraissement (3 lapereaux/case)
  | 'Infirmerie'     // Clapier réservé en cas de maladie ou de quarantaine
  | 'Vide';          // Clapier non affecté (vide sanitaire entre deux bandes)

/**
 * DONNÉES MIXTES — Clapier (cage de groupement).
 *
 * Propriétés STATIQUES : id, nom, numero, nombreCases (toujours 12)
 * Propriétés DYNAMIQUES : type, casesOccupees, bandeId (changent selon les affectations)
 *
 * La ferme dispose de 9 clapiers :
 *   - Clapier 1, 2, 3 → Maternité (affectés aux 3 bandes en rotation)
 *   - Clapier 4       → Sexage
 *   - Clapier 5 à 9   → Engraissement
 */
export interface Clapier {
  id: string;              // 'clap-1' à 'clap-9'
  nom: string;             // 'Clapier Maternité 1', etc.
  numero: number;          // 1 à 9
  /** Type d'affectation actuel — DONNÉE DYNAMIQUE */
  type: TypeClapier;
  /** Nombre total de cases : toujours 12 (fixe) */
  nombreCases: number;
  /** Nombre de cases actuellement occupées — DONNÉE DYNAMIQUE */
  casesOccupees: number;
  /** Bande actuellement hébergée dans ce clapier — DONNÉE DYNAMIQUE */
  bandeId?: BandeId;
}
