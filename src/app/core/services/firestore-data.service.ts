import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  collection, doc, getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase.config';
import {
  Configuration, Deces, MiseBas, Reproducteur, Saillie, Sevrage,
  Vente, Bande, Clapier, Palpation, Sexage, ReferentielBande,
  ReferentielMale, CalendrierSaillieItem, CycleBande, Engraissement
} from '../models';
import { DEFAULT_CONFIGURATION } from '../constants/farm-config.defaults';

@Injectable({
  providedIn: 'root',
})

export class FirestoreDataService {

  // --- Référentiels & Cycles ---
  getReferentielBandes(): Observable<ReferentielBande[]> {
    return this.getCollection<ReferentielBande>('referentiel_bandes');
  }

  getReferentielMales(): Observable<ReferentielMale[]> {
    return this.getCollection<ReferentielMale>('referentiel_males');
  }

  getReferentielCalendrierSaillie(): Observable<CalendrierSaillieItem[]> {
    return this.getCollection<CalendrierSaillieItem>('referentiel_calendrier_saillie');
  }

  getCyclesBande(): Observable<CycleBande[]> {
    return this.getCollection<CycleBande>('cycles_bande');
  }

  createCycleBande(item: CycleBande): Observable<CycleBande> {
    return this.setDocument<CycleBande>('cycles_bande', item.id, item);
  }

  // --- Bandes & Clapiers ---
  getBandes(): Observable<Bande[]> {
    return this.getCollection<Bande>('bandes');
  }

  patchBande(id: string, partial: Partial<Bande>): Observable<Bande> {
    const docRef = doc(db, 'bandes', id);
    return from(updateDoc(docRef, partial as Record<string, unknown>)).pipe(
      map(() => ({ id, ...partial } as Bande))
    );
  }

  getClapiers(): Observable<Clapier[]> {
    return this.getCollection<Clapier>('clapiers');
  }

  // --- Palpations, Sexages & Engraissements ---
  getPalpations(): Observable<Palpation[]> {
    return this.getCollection<Palpation>('palpations');
  }

  createPalpation(item: Palpation): Observable<Palpation> {
    const id = item.id || this.generateId('palp');
    const entry = { ...item, id };
    return this.setDocument<Palpation>('palpations', id, entry);
  }

  getSexages(): Observable<Sexage[]> {
    return this.getCollection<Sexage>('sexages');
  }

  createSexage(item: Sexage): Observable<Sexage> {
    const id = item.id || this.generateId('sex');
    const entry = { ...item, id };
    return this.setDocument<Sexage>('sexages', id, entry);
  }

  getEngraissements(): Observable<Engraissement[]> {
    return this.getCollection<Engraissement>('engraissements');
  }

  createEngraissement(item: Engraissement): Observable<Engraissement> {
    const id = item.id || this.generateId('eng');
    const entry = { ...item, id };
    return this.setDocument<Engraissement>('engraissements', id, entry);
  }

  // --- Reproducteurs ---
  getReproducteurs(): Observable<Reproducteur[]> {
    return this.getCollection<Reproducteur>('reproducteurs');
  }

  createReproducteur(item: Reproducteur): Observable<Reproducteur> {
    const id = item.id || this.generateId('rep');
    const entry = { ...item, id };
    return this.setDocument<Reproducteur>('reproducteurs', id, entry);
  }

  updateReproducteur(item: Reproducteur): Observable<Reproducteur> {
    return this.setDocument<Reproducteur>('reproducteurs', item.id, item);
  }

  deleteReproducteur(id: string): Observable<void> {
    return this.deleteDocument('reproducteurs', id);
  }

  // --- Saillies ---
  getSaillies(): Observable<Saillie[]> {
    return this.getCollection<Saillie>('saillies');
  }

  createSaillie(item: Saillie): Observable<Saillie> {
    const id = item.id || this.generateId('sal');
    const entry = { ...item, id };
    return this.setDocument<Saillie>('saillies', id, entry);
  }

  // --- Mises-bas ---
  getMisesBas(): Observable<MiseBas[]> {
    return this.getCollection<MiseBas>('misesBas');
  }

  createMiseBas(item: MiseBas): Observable<MiseBas> {
    const id = item.id || this.generateId('mb');
    const entry = { ...item, id };
    return this.setDocument<MiseBas>('misesBas', id, entry);
  }

  updateMiseBas(item: MiseBas): Observable<MiseBas> {
    return this.setDocument<MiseBas>('misesBas', item.id, item);
  }

  deleteMiseBas(id: string): Observable<void> {
    return this.deleteDocument('misesBas', id);
  }

  // --- Sevrages ---
  getSevrages(): Observable<Sevrage[]> {
    return this.getCollection<Sevrage>('sevrages');
  }

  createSevrage(item: Sevrage): Observable<Sevrage> {
    const id = item.id || this.generateId('sev');
    const entry = { ...item, id };
    return this.setDocument<Sevrage>('sevrages', id, entry);
  }

  updateSevrage(item: Sevrage): Observable<Sevrage> {
    return this.setDocument<Sevrage>('sevrages', item.id, item);
  }

  deleteSevrage(id: string): Observable<void> {
    return this.deleteDocument('sevrages', id);
  }

  // --- Ventes ---
  getVentes(): Observable<Vente[]> {
    return this.getCollection<Vente>('ventes');
  }

  createVente(item: Vente): Observable<Vente> {
    const id = item.id || this.generateId('vnt');
    const entry = { ...item, id };
    return this.setDocument<Vente>('ventes', id, entry);
  }

  updateVente(item: Vente): Observable<Vente> {
    return this.setDocument<Vente>('ventes', item.id, item);
  }

  deleteVente(id: string): Observable<void> {
    return this.deleteDocument('ventes', id);
  }

  // --- Décès ---
  getDeces(): Observable<Deces[]> {
    return this.getCollection<Deces>('deces');
  }

  createDeces(item: Deces): Observable<Deces> {
    const id = item.id || this.generateId('dec');
    const entry = { ...item, id };
    return this.setDocument<Deces>('deces', id, entry);
  }

  // --- Configuration ---
  getConfiguration(): Observable<Configuration> {
    const docRef = doc(db, 'configuration', 'default');
    return from(getDoc(docRef)).pipe(
      map((snapshot) => {
        if (snapshot.exists()) {
          return snapshot.data() as Configuration;
        }
        return this.getDefaultConfig();
      })
    );
  }

  updateConfiguration(config: Configuration): Observable<Configuration> {
    const docRef = doc(db, 'configuration', 'default');
    return from(setDoc(docRef, config)).pipe(map(() => config));
  }

  // --- Helpers d'accès générique à Firestore ---
  private getCollection<T>(collectionName: string): Observable<T[]> {
    const colRef = collection(db, collectionName);
    return from(getDocs(colRef)).pipe(
      map((snapshot) => {
        return snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as T[];
      })
    );
  }

  private setDocument<T extends { id?: string }>(
    collectionName: string, 
    docId: string, 
    data: T
  ): Observable<T> {
    const docRef = doc(db, collectionName, docId);
    return from(setDoc(docRef, data, { merge: true })).pipe(map(() => data));
  }

  private deleteDocument(collectionName: string, docId: string): Observable<void> {
    const docRef = doc(db, collectionName, docId);
    return from(deleteDoc(docRef));
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getDefaultConfig(): Configuration {
    return DEFAULT_CONFIGURATION;
  }
}

