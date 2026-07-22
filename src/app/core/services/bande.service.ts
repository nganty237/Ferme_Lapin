import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  Bande, 
  EtatBande, 
  SessionSaillie, 
  Palpation, 
  Sexage, 
  MiseBas, 
  Sevrage,
  Reproducteur 
} from '../models';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { AffectationMaleGroup } from '../repositories/bande.repository';

/**
 * Service de gestion du cycle de vie des bandes d'élevage cunicole et des événements associés.
 * Flow : Repos → Saillie → Gestation → Palpation → Allaitement → Sevrage → Sexage → Engraissement → Repos.
 */
@Injectable({
  providedIn: 'root'
})
export class BandeService {
  private storageService = inject(StorageService);
  private notifier = inject(NotificationService);

  private readonly _bandes$ = new BehaviorSubject<Bande[]>([]);
  readonly bandes$: Observable<Bande[]> = this._bandes$.asObservable();

  private get AFFECTATION_MALES(): Record<string, AffectationMaleGroup[]> {
    return this.storageService.getAllAffectationMales();
  }

  constructor() {
    this.loadBandes();
  }

  /**
   * Recharge les bandes depuis le stockage centralisé.
   */
  loadBandes(): void {
    const bandes = this.storageService.getAllBandes();
    this._bandes$.next(bandes);
  }

  /**
   * Génère le calendrier de saillie d'une bande en respectant la contrainte biologique de 2 saillies max par mâle par jour (Matin/Soir).
   * @param bandeId Identifiant de la bande ('bande-a' | 'bande-b' | 'bande-c').
   * @param dateDebut Date de démarrage de la session de saillie.
   * @returns Liste planifiée des sessions de saillie.
   */
  getCalendrierSaillie(bandeId: string, dateDebut: Date): SessionSaillie[] {
    const affectations = this.AFFECTATION_MALES[bandeId];
    if (!affectations || !Array.isArray(affectations)) return [];

    const sessions: SessionSaillie[] = [];

    affectations.forEach((affectation: AffectationMaleGroup) => {
      // Contrainte zootechnique cunicole : un mâle peut effectuer au maximum 2 saillies par jour (1 Matin, 1 Soir).
      affectation.femellesIds.forEach((femId: string, index: number) => {
        const jourOffset = Math.floor(index / 2); // 0 pour les 2 premières femelles (J1), 1 pour les 2 suivantes (J2), etc.
        const jourNumber = jourOffset + 1;
        const moment = (index % 2 === 0) ? 'Matin' : 'Soir';

        const dateSaillie = new Date(dateDebut);
        dateSaillie.setDate(dateSaillie.getDate() + jourOffset);

        sessions.push({
          id: `sess-${Date.now()}-${femId}`,
          bandeId,
          maleId: affectation.maleId,
          femelleId: femId,
          jour: jourNumber,
          moment,
          dateSaillie: dateSaillie.toISOString()
        });
      });
    });

    return sessions;
  }

  /**
   * Démarre une nouvelle phase de saillie pour une bande.
   */
  demarrerSaillie(bandeId: string, dateDebut: Date): void {
    const sessions = this.getCalendrierSaillie(bandeId, dateDebut);
    sessions.forEach(s => this.storageService.addSessionSaillie(s));

    this.changerPhase(bandeId, 'Saillie', dateDebut);
    this.notifier.success(`Bande ${bandeId} passée en phase Saillie`);
  }

  /**
   * Enregistre un résultat de palpation à J+15 et met à jour le statut physiologique de la femelle.
   */
  enregistrerPalpation(palpation: Palpation): void {
    this.storageService.addPalpation(palpation);
    
    const reproducteurs = this.storageService.getAllReproducteurs();
    const index = reproducteurs.findIndex(r => r.id === palpation.femelleId);
    if (index !== -1) {
      reproducteurs[index].etat = palpation.resultat === 'Positive' ? 'En gestation' : 'Au repos';
      this.storageService.updateReproducteur(reproducteurs[index]);
    }
  }

  /**
   * Confirme la mise-bas d'une portée et passe la bande en phase d'allaitement.
   */
  confirmerMiseBas(bandeId: string, misesBas: MiseBas[]): void {
    misesBas.forEach(mb => {
      mb.bandeId = bandeId;
      const dateSevrage = new Date(mb.dateMiseBas);
      dateSevrage.setDate(dateSevrage.getDate() + 31);
      mb.dateSevragePrevue = dateSevrage.toISOString();
      this.storageService.addMiseBas(mb);

      // Met à jour l'état de la femelle en allaitement
      const repro = this.storageService.getAllReproducteurs().find(r => r.id === mb.femelleId);
      if (repro) {
        this.storageService.updateReproducteur({ ...repro, etat: 'En allaitement' });
      }
    });

    this.changerPhase(bandeId, 'Allaitement');
    this.notifier.success(`Bande ${bandeId} passée en phase Allaitement`);
  }

  /**
   * Confirme le sevrage des lapereaux et remet les mères au repos.
   */
  confirmerSevrage(bandeId: string, sevrages: Sevrage[]): void {
    sevrages.forEach(s => {
      s.bandeId = bandeId;
      this.storageService.addSevrage(s);
    });

    // Les mères reproductrices réintègrent la phase de repos
    const reproducteurs = this.storageService.getAllReproducteurs();
    reproducteurs.forEach(r => {
      if (r.bandeId === bandeId && r.sexe === 'F' && r.etat === 'En allaitement') {
        this.storageService.updateReproducteur({ ...r, etat: 'Au repos' });
      }
    });

    this.changerPhase(bandeId, 'Sevrage', new Date());
    this.notifier.success(`Bande ${bandeId} sevrée et prête pour le sexage`);
  }

  /**
   * Enregistre le sexage d'un lot de lapereaux sevrés.
   */
  enregistrerSexage(sexage: Sexage): void {
    this.storageService.addSexage(sexage);
    if (sexage.bandeId) {
      this.changerPhase(sexage.bandeId, 'Sexage');
    }
  }

  /**
   * Transfère la bande sevrée vers les cages d'engraissement.
   */
  transfererEngraissement(bandeId: string, dateTransfert: Date): void {
    this.changerPhase(bandeId, 'Engraissement', dateTransfert);
    this.notifier.success(`Bande ${bandeId} transférée en Engraissement`);
  }

  /**
   * Modifie la phase courante d'une bande et persiste le changement.
   */
  changerPhase(bandeId: string, phase: EtatBande, datePhase: Date = new Date()): void {
    this.storageService.updateBande(bandeId, { phase, dateDemarragePhase: datePhase.toISOString() });
    this.loadBandes();
  }

  /**
   * Retourne l'état synthétique actuel des 3 bandes principales.
   */
  getEtatBandes(): { A: EtatBande; B: EtatBande; C: EtatBande } {
    const bandes = this._bandes$.getValue();
    const findPhase = (id: string): EtatBande => bandes.find(b => b.id === id)?.phase || 'Repos';
    return {
      A: findPhase('bande-a'),
      B: findPhase('bande-b'),
      C: findPhase('bande-c')
    };
  }
}
