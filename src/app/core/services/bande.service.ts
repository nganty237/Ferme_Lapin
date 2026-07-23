import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Bande,
  EtatBande,
  Saillie,
  Palpation,
  Sexage,
  MiseBas,
  Sevrage,
  BandeId,
  Femelle,
  isFemelle,
  CycleBande
} from '../models';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { ReferentielService } from './referentiel.service';
import { DataStoreService } from './data-store.service';

@Injectable({
  providedIn: 'root'
})
export class BandeService {
  private storageService = inject(StorageService);
  private dataStore = inject(DataStoreService);
  private referentielService = inject(ReferentielService);
  private notifier = inject(NotificationService);

  readonly bandes$: Observable<Bande[]> = this.dataStore.bandes$;

  getCalendrierSaillie(bandeId: BandeId, dateDebut: Date): Saillie[] {
    const itemsStatiques = this.referentielService.getCalendrierSaillieStatique(bandeId);
    if (!itemsStatiques || itemsStatiques.length === 0) return [];

    return itemsStatiques.map(item => {
      const jourOffset = item.jourSaillie - 1;
      const dateSaillie = new Date(dateDebut);
      dateSaillie.setDate(dateSaillie.getDate() + jourOffset);

      const dPalp = new Date(dateSaillie);
      dPalp.setDate(dPalp.getDate() + 15);

      const dMB = new Date(dateSaillie);
      dMB.setDate(dMB.getDate() + 31);

      return {
        id: `sal-${Date.now()}-${item.femelleId}`,
        cycleId: `cycle-${bandeId}-1`,
        bandeId,
        maleId: item.maleId,
        femelleId: item.femelleId,
        jourSaillie: item.jourSaillie,
        moment: item.moment,
        dateSaillie: dateSaillie.toISOString(),
        datePalpationPrevue: dPalp.toISOString(),
        dateMiseBasPrevue: dMB.toISOString()
      };
    });
  }

  demarrerCycle(bandeId: BandeId, dateDebutSaillie: Date): CycleBande {
    const bandes = this.storageService.getAllBandes();
    const bandeActuelle = bandes.find(b => b.id === bandeId);
    const numCycle = (bandeActuelle?.numeroCycle || 1) + 1;
    const cycleId = `cycle-${bandeId}-${numCycle}`;

    const nouveauCycle: CycleBande = {
      id: cycleId,
      bandeId,
      numeroCycle: numCycle,
      phaseCourante: 'Saillie',
      dateDebutSaillie: dateDebutSaillie.toISOString(),
      dateDebutPhase: dateDebutSaillie.toISOString()
    };

    this.dataStore.addCycleBande(nouveauCycle);
    this.changerPhase(bandeId, 'Saillie', dateDebutSaillie);

    const planifiedSaillies = this.getCalendrierSaillie(bandeId, dateDebutSaillie);
    planifiedSaillies.forEach(s => {
      s.cycleId = cycleId;
      this.dataStore.addSaillie(s);
    });

    this.notifier.success(`Nouveau cycle #${numCycle} démarré pour la ${bandeId} (${planifiedSaillies.length} saillies planifiées).`);
    return nouveauCycle;
  }

  demarrerSaillie(bandeId: BandeId, dateDebut: Date): void {
    this.demarrerCycle(bandeId, dateDebut);
  }

  enregistrerPalpation(palpation: Palpation): void {
    this.dataStore.addPalpation(palpation);
    
    const reproducteurs = this.storageService.getAllReproducteurs();
    const index = reproducteurs.findIndex(r => r.id === palpation.femelleId);
    if (index !== -1) {
      const repro = reproducteurs[index];
      if (isFemelle(repro)) {
        const updated = { ...repro, etat: (palpation.resultat === 'Positive' ? 'En gestation' : 'Au repos') as any };
        this.dataStore.updateReproducteur(updated);
      }
    }
  }

  confirmerMiseBas(bandeId: BandeId, misesBas: MiseBas[]): void {
    misesBas.forEach(mb => {
      mb.bandeId = bandeId;
      const dateSevrage = new Date(mb.dateMiseBas);
      dateSevrage.setDate(dateSevrage.getDate() + 35);
      mb.dateSevragePrevue = dateSevrage.toISOString();
      this.dataStore.addMiseBas(mb);

      const repro = this.storageService.getAllReproducteurs().find(r => r.id === mb.femelleId);
      if (repro && isFemelle(repro)) {
        this.dataStore.updateReproducteur({ ...repro, etat: 'En allaitement' });
      }
    });

    this.changerPhase(bandeId, 'Allaitement');
    this.notifier.success(`Bande ${bandeId} passée en phase Allaitement`);
  }

  confirmerSevrage(bandeId: BandeId, sevrages: Sevrage[]): void {
    sevrages.forEach(s => {
      s.bandeId = bandeId;
      this.dataStore.addSevrage(s);
    });

    const reproducteurs = this.storageService.getAllReproducteurs();
    reproducteurs.forEach(r => {
      if (isFemelle(r) && r.bandeId === bandeId && r.etat === 'En allaitement') {
        this.dataStore.updateReproducteur({ ...r, etat: 'Au repos' });
      }
    });

    this.changerPhase(bandeId, 'Sexage', new Date());
    this.notifier.success(`Bande ${bandeId} sevrée et prête pour le sexage`);
  }

  enregistrerSexage(sexage: Sexage): void {
    this.dataStore.addSexage(sexage);
    if (sexage.bandeId) {
      this.changerPhase(sexage.bandeId, 'Sexage');
    }
  }

  transfererEngraissement(bandeId: BandeId, dateTransfert: Date): void {
    this.changerPhase(bandeId, 'Engraissement', dateTransfert);
    this.notifier.success(`Bande ${bandeId} transférée en Engraissement`);
  }

  /**
   * Fix P0 #5 : replanifie une saillie pour une femelle dont la palpation est négative.
   * Réutilise le maleResponsableId de la femelle (affectation statique du référentiel).
   */
  replanifierSaillieFemelle(femelleId: string, bandeId: BandeId, dateSaillie: Date): void {
    const repros = this.storageService.getAllReproducteurs();
    const femelle = repros.find(r => r.id === femelleId && isFemelle(r)) as Femelle | undefined;
    if (!femelle) {
      this.notifier.error(`Femelle ${femelleId} introuvable.`);
      return;
    }
    const dateMB = new Date(dateSaillie);
    dateMB.setDate(dateMB.getDate() + 31);
    const datePalp = new Date(dateSaillie);
    datePalp.setDate(datePalp.getDate() + 15);
    const saillie: Saillie = {
      id: `sal-resal-${Date.now()}-${femelleId}`,
      cycleId: `cycle-${bandeId}-resal`,
      bandeId,
      femelleId,
      maleId: femelle.maleResponsableId,
      dateSaillie: dateSaillie.toISOString(),
      dateMiseBasPrevue: dateMB.toISOString(),
      datePalpationPrevue: datePalp.toISOString(),
      jourSaillie: 1,
      moment: 'Matin'
    };
    this.dataStore.addSaillie(saillie);
    this.dataStore.updateReproducteur({ ...femelle, etat: 'Au repos' });
    this.notifier.info(`Re-saillie planifiée pour ${femelleId} le ${dateSaillie.toLocaleDateString()}.`);
  }

  changerPhase(bandeId: BandeId, phase: EtatBande, datePhase: Date = new Date()): void {
    this.dataStore.updateBande(bandeId, { phase, dateDemarragePhase: datePhase.toISOString() });
  }

  getEtatBandes(): { A: EtatBande; B: EtatBande; C: EtatBande } {
    const bandes = this.storageService.getAllBandes();
    const findPhase = (id: string): EtatBande => bandes.find(b => b.id === id)?.phase || 'Repos';
    return {
      A: findPhase('bande-a'),
      B: findPhase('bande-b'),
      C: findPhase('bande-c')
    };
  }
}
