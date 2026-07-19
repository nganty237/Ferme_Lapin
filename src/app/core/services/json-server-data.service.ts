import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Configuration, Deces, MiseBas, Reproducteur, Saillie, Sevrage, Vente } from '../models';

type CollectionName = 'reproducteurs' | 'saillies' | 'misesBas' | 'sevrages' | 'ventes' | 'deces';

@Injectable({
  providedIn: 'root',
})
export class JsonServerDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

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
