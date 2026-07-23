import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  Configuration, 
  Deces, 
  MiseBas, 
  Reproducteur, 
  Saillie, 
  Sevrage, 
  Vente, 
  Bande, 
  Clapier, 
  Palpation, 
  Sexage,
  ReferentielBande,
  ReferentielMale,
  CalendrierSaillieItem,
  CycleBande
} from '../models';

type CollectionName = 
  | 'reproducteurs' 
  | 'saillies' 
  | 'misesBas' 
  | 'sevrages' 
  | 'ventes' 
  | 'deces' 
  | 'bandes' 
  | 'clapiers' 
  | 'palpations' 
  | 'sexages'
  | 'referentiel_males'
  | 'referentiel_bandes'
  | 'referentiel_calendrier_saillie'
  | 'cycles_bande';

@Injectable({
  providedIn: 'root',
})
export class JsonServerDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  getReferentielBandes(): Observable<ReferentielBande[]> {
    return this.list<ReferentielBande>('referentiel_bandes');
  }

  getReferentielMales(): Observable<ReferentielMale[]> {
    return this.list<ReferentielMale>('referentiel_males');
  }

  getReferentielCalendrierSaillie(): Observable<CalendrierSaillieItem[]> {
    return this.list<CalendrierSaillieItem>('referentiel_calendrier_saillie');
  }

  getCyclesBande(): Observable<CycleBande[]> {
    return this.list<CycleBande>('cycles_bande');
  }

  createCycleBande(item: CycleBande): Observable<CycleBande> {
    return this.create<CycleBande>('cycles_bande', item);
  }

  getBandes(): Observable<Bande[]> {
    return this.list<Bande>('bandes');
  }

  getClapiers(): Observable<Clapier[]> {
    return this.list<Clapier>('clapiers');
  }

  getPalpations(): Observable<Palpation[]> {
    return this.list<Palpation>('palpations');
  }

  createPalpation(item: Palpation): Observable<Palpation> {
    return this.create<Palpation>('palpations', item);
  }

  getSexages(): Observable<Sexage[]> {
    return this.list<Sexage>('sexages');
  }

  createSexage(item: Sexage): Observable<Sexage> {
    return this.create<Sexage>('sexages', item);
  }

  patchBande(id: string, partial: Partial<Bande>): Observable<Bande> {
    return this.http.patch<Bande>(`${this.apiUrl}/bandes/${id}`, partial);
  }

  getReproducteurs(): Observable<Reproducteur[]> {
    return this.list<Reproducteur>('reproducteurs');
  }

  createReproducteur(item: Reproducteur): Observable<Reproducteur> {
    return this.create<Reproducteur>('reproducteurs', item);
  }

  updateReproducteur(item: Reproducteur): Observable<Reproducteur> {
    return this.update<Reproducteur>('reproducteurs', item.id, item);
  }

  deleteReproducteur(id: string): Observable<void> {
    return this.delete('reproducteurs', id);
  }

  getSaillies(): Observable<Saillie[]> {
    return this.list<Saillie>('saillies');
  }

  createSaillie(item: Saillie): Observable<Saillie> {
    return this.create<Saillie>('saillies', item);
  }

  getMisesBas(): Observable<MiseBas[]> {
    return this.list<MiseBas>('misesBas');
  }

  createMiseBas(item: MiseBas): Observable<MiseBas> {
    return this.create<MiseBas>('misesBas', item);
  }

  getSevrages(): Observable<Sevrage[]> {
    return this.list<Sevrage>('sevrages');
  }

  createSevrage(item: Sevrage): Observable<Sevrage> {
    return this.create<Sevrage>('sevrages', item);
  }

  getVentes(): Observable<Vente[]> {
    return this.list<Vente>('ventes');
  }

  createVente(item: Vente): Observable<Vente> {
    return this.create<Vente>('ventes', item);
  }

  getDeces(): Observable<Deces[]> {
    return this.list<Deces>('deces');
  }

  createDeces(item: Deces): Observable<Deces> {
    return this.create<Deces>('deces', item);
  }

  getConfiguration(): Observable<Configuration> {
    return this.http.get<Configuration>(`${this.apiUrl}/configuration`);
  }

  updateConfiguration(config: Configuration): Observable<Configuration> {
    return this.http.put<Configuration>(`${this.apiUrl}/configuration`, config);
  }

  private list<T>(collection: CollectionName): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${collection}`);
  }

  private create<T>(collection: CollectionName, item: T): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${collection}`, item);
  }

  private update<T>(collection: CollectionName, id: string, item: T): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${collection}/${id}`, item);
  }

  private delete(collection: CollectionName, id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${collection}/${id}`);
  }
}
