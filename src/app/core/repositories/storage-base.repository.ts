import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const PREFIX = 'cunicole_';

export const STORAGE_KEYS = {
  REPRODUCTEURS: `${PREFIX}reproducteurs`,
  SAILLIES: `${PREFIX}saillies`,
  MISES_BAS: `${PREFIX}mises_bas`,
  SEVRAGES: `${PREFIX}sevrages`,
  VENTES: `${PREFIX}ventes`,
  DECES: `${PREFIX}deces`,
  CONFIGURATION: `${PREFIX}configuration`,
  NOTIFICATIONS: `${PREFIX}notifications`,
  AFFECTATION_MALES: `${PREFIX}affectation_males`,
  BANDES: `${PREFIX}bandes`,
  SESSIONS_SAILLIE: `${PREFIX}sessions_saillie`,
  PALPATIONS: `${PREFIX}palpations`,
  CLAPIERS: `${PREFIX}clapiers`,
  SEXAGES: `${PREFIX}sexages`,
} as const;

/**
 * Classe abstraite de base pour les répertoires de stockage localStorage.
 * Fournit les primitives d'accès sécurisé en lecture/écriture JSON et vérification d'environnement SSR.
 */
export abstract class StorageBaseRepository {
  private platformId = inject(PLATFORM_ID);

  /**
   * Vérifie si le code s'exécute dans l'environnement navigateur (compatible Angular SSR).
   */
  protected isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Lit et désérialise une collection d'objets depuis le localStorage.
   */
  protected getItems<T>(key: string): T[] {
    if (!this.isBrowser()) return [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`[StorageBaseRepository] Erreur lecture clé "${key}":`, e);
      return [];
    }
  }

  /**
   * Sérialise et enregistre une collection d'objets dans le localStorage.
   */
  protected setItems<T>(key: string, items: T[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.error(`[StorageBaseRepository] Erreur écriture clé "${key}":`, e);
    }
  }

  /**
   * Lit et désérialise un objet unique avec valeur par défaut de secours.
   */
  protected getObject<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.error(`[StorageBaseRepository] Erreur lecture clé "${key}":`, e);
      return defaultValue;
    }
  }

  /**
   * Sérialise et enregistre un objet unique dans le localStorage.
   */
  protected setObject<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageBaseRepository] Erreur écriture clé "${key}":`, e);
    }
  }

  /**
   * Génère un identifiant unique basé sur un préfixe et l'horodatage courant.
   */
  protected generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
