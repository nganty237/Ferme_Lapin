import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase.config';
import { DEFAULT_CONFIGURATION } from '../constants/farm-config.defaults';

@Injectable({
  providedIn: 'root'
})
export class FirestoreSeedService {
  private http = inject(HttpClient);

  /**
   * Vérifie l'existence des collections fondamentales dans Firestore.
   * Si les collections sont vides, injecte automatiquement les référentiels statiques.
   */
  async ensureSeeded(): Promise<void> {
    try {
      await this.seedConfiguration();
      await this.seedReferentielBandes();
      await this.seedReferentielMales();
      await this.seedCalendrierSaillie();
      await this.seedClapiers();
      await this.seedBandes();
      await this.seedReproducteurs();
    } catch (err) {
      console.error('[FirestoreSeedService] Erreur lors de l\'initialisation des données Firestore:', err);
    }
  }

  private async seedConfiguration(): Promise<void> {
    const configRef = doc(db, 'configuration', 'default');
    const snap = await getDocs(collection(db, 'configuration'));
    if (snap.empty) {
      await setDoc(configRef, DEFAULT_CONFIGURATION);
      console.log('[FirestoreSeedService] Collection configuration initialisée.');
    }
  }

  private async seedReferentielBandes(): Promise<void> {
    const snap = await getDocs(collection(db, 'referentiel_bandes'));
    if (snap.empty) {
      const data = await this.http.get<any[]>('assets/data/referentiel-bandes.json').toPromise();
      if (data) {
        const batch = writeBatch(db);
        data.forEach(item => {
          batch.set(doc(db, 'referentiel_bandes', item.id), item);
        });
        await batch.commit();
        console.log('[FirestoreSeedService] Referentiel bandes initialisé.');
      }
    }
  }

  private async seedReferentielMales(): Promise<void> {
    const snap = await getDocs(collection(db, 'referentiel_males'));
    if (snap.empty) {
      const data = await this.http.get<any[]>('assets/data/referentiel-males.json').toPromise();
      if (data) {
        const batch = writeBatch(db);
        data.forEach(item => {
          batch.set(doc(db, 'referentiel_males', item.id), item);
        });
        await batch.commit();
        console.log('[FirestoreSeedService] Referentiel males initialisé.');
      }
    }
  }

  private async seedCalendrierSaillie(): Promise<void> {
    const snap = await getDocs(collection(db, 'referentiel_calendrier_saillie'));
    if (snap.empty) {
      const data = await this.http.get<any[]>('assets/data/calendrier-saillie.json').toPromise();
      if (data) {
        const batch = writeBatch(db);
        data.forEach(item => {
          const id = item.id || `${item.bandeId}_${item.femaleId || item.femelleId}_${item.ordre}`;
          batch.set(doc(db, 'referentiel_calendrier_saillie', id), { ...item, id });
        });
        await batch.commit();
        console.log('[FirestoreSeedService] Calendrier de saillie initialisé.');
      }
    }
  }

  private async seedClapiers(): Promise<void> {
    const snap = await getDocs(collection(db, 'clapiers'));
    if (snap.empty) {
      const data = await this.http.get<any[]>('assets/data/clapiers-structure.json').toPromise();
      if (data) {
        const batch = writeBatch(db);
        data.forEach(item => {
          batch.set(doc(db, 'clapiers', item.id), item);
        });
        await batch.commit();
        console.log('[FirestoreSeedService] Clapiers initialisés.');
      }
    }
  }

  private async seedBandes(): Promise<void> {
    const snap = await getDocs(collection(db, 'bandes'));
    if (snap.empty) {
      const defaultBandes = [
        { id: 'bande-a', nom: 'Bande A', phase: 'Gestation', dateDemarragePhase: '2026-07-20', numeroCycle: 1 },
        { id: 'bande-b', nom: 'Bande B', phase: 'Repos', dateDemarragePhase: '2026-07-20', numeroCycle: 1 },
        { id: 'bande-c', nom: 'Bande C', phase: 'Repos', dateDemarragePhase: '2026-07-20', numeroCycle: 1 }
      ];
      const batch = writeBatch(db);
      defaultBandes.forEach(b => batch.set(doc(db, 'bandes', b.id), b));
      await batch.commit();
      console.log('[FirestoreSeedService] Bandes initialisées.');
    }
  }

  private async seedReproducteurs(): Promise<void> {
    const snap = await getDocs(collection(db, 'reproducteurs'));
    if (snap.empty) {
      const batch = writeBatch(db);
      // Mâles
      const males = [
        { id: 'M01', nom: 'M01 — Mâle Reproducteur', sexe: 'M', etat: 'Actif', femellesIds: ['F001','F002','F003','F004','F005','F006','F007','F008','F009','F010','F011'] },
        { id: 'M02', nom: 'M02 — Mâle Reproducteur', sexe: 'M', etat: 'Actif', femellesIds: ['F012','F013','F014','F015','F016','F017','F018','F019','F020','F021','F022'] },
        { id: 'M03', nom: 'M03 — Mâle Reproducteur', sexe: 'M', etat: 'Actif', femellesIds: ['F023','F024','F025','F026','F027','F028','F029','F030','F031','F032','F033'] }
      ];
      males.forEach(m => batch.set(doc(db, 'reproducteurs', m.id), m));

      // Femelles (33) distribuées selon la matrice officielle des bandes
      const bandeAIds = ['F001','F002','F003','F004','F012','F013','F014','F015','F023','F024','F025'];
      const bandeBIds = ['F005','F006','F007','F008','F016','F017','F018','F019','F026','F027','F028'];

      for (let i = 1; i <= 33; i++) {
        const id = `F${String(i).padStart(3, '0')}`;
        const bandeId = bandeAIds.includes(id) ? 'bande-a' : bandeBIds.includes(id) ? 'bande-b' : 'bande-c';
        const maleResponsableId = i <= 11 ? 'M01' : i <= 22 ? 'M02' : 'M03';
        const etat = bandeId === 'bande-a' ? 'En gestation' : 'Au repos';
        batch.set(doc(db, 'reproducteurs', id), {
          id,
          nom: `${id} — Femelle Reproductrice`,
          sexe: 'F',
          bandeId,
          maleResponsableId,
          etat
        });
      }

      await batch.commit();
      console.log('[FirestoreSeedService] Reproducteurs initialisés.');
    }
  }
}
