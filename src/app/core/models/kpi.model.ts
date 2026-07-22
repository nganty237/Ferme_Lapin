import type { EtatBande } from './reproducteur.model';
import type { BandeId } from './referentiel.model';

/**
 * Indicateurs clés de performance globaux de la ferme.
 * Calculés en temps réel à partir des données dynamiques.
 */
export interface KPI {
  // ── Production ──────────────────────────────────────────────────────────
  /** Nombre total de lapereaux produits sur le mois courant */
  productiviteMois: number;
  /** Taux de survie des lapereaux pendant l'allaitement (%) */
  tauxSurvieAllaitement: number;
  /** Taux de fécondité global (saillies réussies / saillies totales) */
  tauxFecondite: number;
  /** Nombre de portées actuellement en cours d'allaitement */
  porteesEnCours: number;

  // ── Occupation ──────────────────────────────────────────────────────────
  /** Nombre de cases actuellement occupées */
  cagesOccupees: number;
  /** Nombre total de cases disponibles (108) */
  cagesTotal: number;
  /** Taux d'occupation (cagesOccupees / cagesTotal × 100) */
  tauxOccupation?: number;

  // ── États des bandes (DYNAMIQUE) ────────────────────────────────────────
  phaseBandeA?: EtatBande;
  phaseBandeB?: EtatBande;
  phaseBandeC?: EtatBande;
}

/**
 * KPI résumé par bande — pour l'affichage du tableau de bord.
 */
export interface BandeKPI {
  bandeId: BandeId;
  nom: string;
  /** Phase active à l'instant T */
  phase: EtatBande;
  /** Numéro du cycle courant */
  numeroCycle: number;
  /** Nombre de femelles dans la bande (toujours 11) */
  nombreFemelles: number;
  /** Nombre de portées en cours dans cette bande */
  porteesEnCours: number;
  /** Nombre de lapereaux vivants dans la bande (allaitement + sexage + engraissement) */
  effectifLapereaux?: number;
  /** Date du prochain événement prévu (palpation, mise bas, sevrage, vente, etc.) */
  dateProchainEvenement?: string;
  /** Type du prochain événement */
  typeProchainEvenement?: 'Palpation' | 'MiseBas' | 'Sevrage' | 'Sexage' | 'Engraissement' | 'Vente';
  /** Revenu généré par cette bande dans le cycle courant (FCFA) */
  revenuCycle?: number;
}
