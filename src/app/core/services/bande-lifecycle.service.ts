import { Injectable, inject } from '@angular/core';
import { BandeId, EtatBande, Bande, Clapier, Sevrage, Sexage, Vente } from '../models';
import { DataStoreService } from './data-store.service';
import { NotificationService } from './notification.service';

/**
 * Service d'orchestration central du cycle de vie des 3 bandes (A, B, C).
 * Gère la rotation cunicole, la détection de la prochaine bande à saillir,
 * les cascades d'occupation de cages (clapiers), et le déverrouillage automatique.
 */
@Injectable({
  providedIn: 'root'
})
export class BandeLifecycleService {
  private dataStore = inject(DataStoreService);
  private notifier = inject(NotificationService);

  /** Rotation fixe des bandes cunicoles */
  readonly ROTATION_BANDES: BandeId[] = ['bande-a', 'bande-b', 'bande-c'];

  /**
   * Retourne la bande suivante dans la rotation (ex: A -> B -> C -> A)
   */
  getBandeSuivante(currentBandeId: BandeId): BandeId {
    const idx = this.ROTATION_BANDES.indexOf(currentBandeId);
    if (idx === -1) return 'bande-a';
    return this.ROTATION_BANDES[(idx + 1) % this.ROTATION_BANDES.length];
  }

  /**
   * Identifie la prochaine bande déverrouillée et éligible à la saillie
   */
  getProchaineBandeASaillir(bandes: Bande[]): Bande | null {
    if (!bandes || bandes.length === 0) return null;

    // Règle 1: Si une bande est en Gestation ou Saillie, aucune autre ne peut l'être
    const bandeEnGestation = bandes.find(b => b.phase === 'Gestation' || b.phase === 'Saillie');
    if (bandeEnGestation) {
      return null; // Toutes les autres sont verrouillées pendant la gestation/saillie
    }

    // Règle 2: Priorité à la bande en Repos qui suit la bande actuellement en Allaitement/Sexage/Engraissement
    const bandeEnAllaitement = bandes.find(b => b.phase === 'Allaitement' || b.phase === 'Sexage');
    if (bandeEnAllaitement) {
      const suivanteId = this.getBandeSuivante(bandeEnAllaitement.id);
      const candidate = bandes.find(b => b.id === suivanteId);
      if (candidate && candidate.phase === 'Repos') {
        return candidate;
      }
    }

    // Règle 3: Première bande en Repos par ordre chronologique de rotation
    for (const bId of this.ROTATION_BANDES) {
      const candidate = bandes.find(b => b.id === bId);
      if (candidate && candidate.phase === 'Repos') {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Vérifie si une bande spécifique peut être saillie selon les règles de gestation exclusive
   */
  estBandeSaillissable(bandeId: BandeId, bandes: Bande[]): { autorise: boolean; motif?: string } {
    const target = bandes.find(b => b.id === bandeId);
    if (!target) return { autorise: false, motif: 'Bande introuvable' };

    if (target.phase === 'Gestation' || target.phase === 'Saillie') {
      return { autorise: false, motif: `La ${target.nom} est déjà en phase de ${target.phase}.` };
    }

    const autreGestation = bandes.find(b => b.id !== bandeId && (b.phase === 'Gestation' || b.phase === 'Saillie'));
    if (autreGestation) {
      return {
        autorise: false,
        motif: `La ${autreGestation.nom} est actuellement en phase de ${autreGestation.phase}. Gestation exclusive active.`
      };
    }

    return { autorise: true };
  }

  /**
   * Cascade automatique de l'occupation des clapiers (cages) selon les phases réelles des bandes
   */
  actualiserClapiersEtCages(
    bandes: Bande[],
    sevrages: Sevrage[],
    sexages: Sexage[],
    ventes: Vente[]
  ): void {
    const clapiers = [...(this.dataStore.clapiers || [])];
    if (clapiers.length === 0) return;

    // 1. Clapiers Maternité (1, 2, 3 -> 12 cases chacun, 11 occupées si Saillie/Gestation/Allaitement)
    clapiers.forEach(c => {
      if (c.type === 'Maternité') {
        const b = bandes.find(band => band.id === c.bandeId);
        if (b && (b.phase === 'Saillie' || b.phase === 'Gestation' || b.phase === 'Allaitement')) {
          c.casesOccupees = 11; // 11 mères en maternité
        } else {
          c.casesOccupees = 0;
        }
      }
    });

    // 2. Clapier Sexage (4 -> 12 cases, 7 lapereaux/case)
    const bandeEnSexage = bandes.find(b => b.phase === 'Sexage');
    const clapierSexage = clapiers.find(c => c.type === 'Sexage');
    if (clapierSexage) {
      if (bandeEnSexage) {
        const sevrés = sevrages
          .filter(s => s.bandeId === bandeEnSexage.id)
          .reduce((sum, s) => sum + (s.sevres || 0), 0);
        clapierSexage.bandeId = bandeEnSexage.id;
        clapierSexage.casesOccupees = Math.min(12, Math.ceil((sevrés || 77) / 7));
      } else {
        clapierSexage.casesOccupees = 0;
      }
    }

    // 3. Clapiers Engraissement (5 à 9 -> 60 cases au total, 3 lapereaux/case)
    const bandesEngraissement = bandes.filter(b => b.phase === 'Engraissement');
    let totalLapinsEngraissement = 0;

    bandesEngraissement.forEach(b => {
      const totalSexes = sexages
        .filter(sx => sx.bandeId === b.id)
        .reduce((sum, sx) => sum + (sx.totalSexes || 0), 0);
      const totalVendus = ventes
        .filter(v => v.bandeId === b.id)
        .reduce((sum, v) => sum + (v.vendus || 0), 0);

      const restants = Math.max(0, totalSexes - totalVendus);
      totalLapinsEngraissement += restants;
    });

    let casesEngraisRequises = Math.ceil(totalLapinsEngraissement / 3);
    clapiers.forEach(c => {
      if (c.type === 'Engraissement') {
        const capacite = c.nombreCases || 12;
        const occ = Math.min(capacite, casesEngraisRequises);
        c.casesOccupees = occ;
        casesEngraisRequises -= occ;
      }
    });

    this.dataStore.updateAllClapiers(clapiers);
  }

  /**
   * Finalise une bande en Engraissement (Ventes terminées) -> VENDUE -> REPOS (cycle suivant)
   */
  cloturerCycleEtRemettreAuRepos(bandeId: BandeId): void {
    const bandes = this.dataStore.bandes || [];
    const b = bandes.find(item => item.id === bandeId);
    if (!b) return;

    const numCycleSuivant = (b.numeroCycle || 1) + 1;
    this.dataStore.updateBande(bandeId, {
      phase: 'Repos',
      numeroCycle: numCycleSuivant,
      dateDemarragePhase: new Date().toISOString()
    });

    this.notifier.success(`Cycle #${b.numeroCycle || 1} clôturé pour la ${b.nom}. Bande remise au Repos pour le cycle #${numCycleSuivant}.`);
  }
}
