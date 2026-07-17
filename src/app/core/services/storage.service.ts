import { Injectable } from '@angular/core';
import { Band, Reproduction, Weaning, Fattening, Sales } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly KEYS = {
    BANDS: 'saveurs_lapin_bands',
    REPRODUCTIONS: 'saveurs_lapin_reproductions',
    WEANINGS: 'saveurs_lapin_weanings',
    FATTENINGS: 'saveurs_lapin_fattenings',
    SALES: 'saveurs_lapin_sales',
    SETTINGS: 'saveurs_lapin_settings'
  };

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  constructor() {
    if (this.isBrowser()) {
      this.initSeedData();
    }
  }

  getItem<T>(key: string): T[] {
    if (!this.isBrowser()) return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  saveItem<T>(key: string, items: T[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(key, JSON.stringify(items));
  }

  getBands(): Band[] {
    return this.getItem<Band>(this.KEYS.BANDS);
  }

  saveBands(bands: Band[]): void {
    this.saveItem(this.KEYS.BANDS, bands);
  }

  getReproductions(): Reproduction[] {
    return this.getItem<Reproduction>(this.KEYS.REPRODUCTIONS);
  }

  saveReproductions(reproductions: Reproduction[]): void {
    this.saveItem(this.KEYS.REPRODUCTIONS, reproductions);
  }

  getWeanings(): Weaning[] {
    return this.getItem<Weaning>(this.KEYS.WEANINGS);
  }

  saveWeanings(weanings: Weaning[]): void {
    this.saveItem(this.KEYS.WEANINGS, weanings);
  }

  getFattenings(): Fattening[] {
    return this.getItem<Fattening>(this.KEYS.FATTENINGS);
  }

  saveFattenings(fattenings: Fattening[]): void {
    this.saveItem(this.KEYS.FATTENINGS, fattenings);
  }

  getSales(): Sales[] {
    return this.getItem<Sales>(this.KEYS.SALES);
  }

  saveSales(sales: Sales[]): void {
    this.saveItem(this.KEYS.SALES, sales);
  }

  getSettings(): any {
    if (!this.isBrowser()) {
      return { gestationDays: 31, fatteningDays: 28, weaningDays: 11 };
    }
    const data = localStorage.getItem(this.KEYS.SETTINGS);
    return data ? JSON.parse(data) : { gestationDays: 31, fatteningDays: 28, weaningDays: 11 };
  }

  saveSettings(settings: any): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  }

  clearAll(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.KEYS.BANDS);
    localStorage.removeItem(this.KEYS.REPRODUCTIONS);
    localStorage.removeItem(this.KEYS.WEANINGS);
    localStorage.removeItem(this.KEYS.FATTENINGS);
    localStorage.removeItem(this.KEYS.SALES);
  }

  initSeedData(force = false): void {
    if (!this.isBrowser()) return;
    if (!force && localStorage.getItem(this.KEYS.BANDS)) {
      return; // Already initialized
    }

    const seedBands: Band[] = [
      { id: 'b1', name: 'Bande A - Janvier 2026', dateCreated: '2026-01-05', nbFemales: 15, status: 'archived', notes: 'Première bande de l\'année. Excellente prolificité.' },
      { id: 'b2', name: 'Bande B - Février 2026', dateCreated: '2026-02-10', nbFemales: 15, status: 'archived', notes: 'Légère mortalité pré-sevrage.' },
      { id: 'b3', name: 'Bande C - Avril 2026', dateCreated: '2026-04-01', nbFemales: 20, status: 'archived', notes: 'Excellente croissance en engraissement.' },
      { id: 'b4', name: 'Bande D - Mai 2026', dateCreated: '2026-05-10', nbFemales: 18, status: 'engraissement', notes: 'Actuellement en phase finale d\'engraissement.' },
      { id: 'b5', name: 'Bande E - Juin 2026', dateCreated: '2026-06-15', nbFemales: 16, status: 'sevrage', notes: 'Sevrage effectué récemment.' },
      { id: 'b6', name: 'Bande F - Juillet 2026', dateCreated: '2026-07-02', nbFemales: 15, status: 'gestation', notes: 'Gestation en cours.' }
    ];

    const seedReproductions: Reproduction[] = [
      { id: 'r1', bandId: 'b1', dateBreeding: '2026-01-05', dateExpectedKindling: '2026-02-05', actualKindling: '2026-02-05', nbBornAlive: 120, nbDeadBeforeWeaning: 10 },
      { id: 'r2', bandId: 'b2', dateBreeding: '2026-02-10', dateExpectedKindling: '2026-03-13', actualKindling: '2026-03-13', nbBornAlive: 110, nbDeadBeforeWeaning: 20 },
      { id: 'r3', bandId: 'b3', dateBreeding: '2026-04-01', dateExpectedKindling: '2026-05-02', actualKindling: '2026-05-02', nbBornAlive: 160, nbDeadBeforeWeaning: 15 },
      { id: 'r4', bandId: 'b4', dateBreeding: '2026-05-10', dateExpectedKindling: '2026-06-10', actualKindling: '2026-06-10', nbBornAlive: 144, nbDeadBeforeWeaning: 12 },
      { id: 'r5', bandId: 'b5', dateBreeding: '2026-06-15', dateExpectedKindling: '2026-07-16', actualKindling: '2026-07-16', nbBornAlive: 130, nbDeadBeforeWeaning: 8 },
      { id: 'r6', bandId: 'b6', dateBreeding: '2026-07-02', dateExpectedKindling: '2026-08-02', actualKindling: null }
    ];

    const seedWeanings: Weaning[] = [
      { id: 'w1', reproductionId: 'r1', dateWeaning: '2026-02-16', nbWeaned: 110, avgWeightAtWeaning: 0.72 },
      { id: 'w2', reproductionId: 'r2', dateWeaning: '2026-03-24', nbWeaned: 90, avgWeightAtWeaning: 0.68 },
      { id: 'w3', reproductionId: 'r3', dateWeaning: '2026-05-13', nbWeaned: 145, avgWeightAtWeaning: 0.75 },
      { id: 'w4', reproductionId: 'r4', dateWeaning: '2026-06-21', nbWeaned: 132, avgWeightAtWeaning: 0.71 },
      { id: 'w5', reproductionId: 'r5', dateWeaning: '2026-07-27', nbWeaned: 122, avgWeightAtWeaning: 0.73 }
    ];

    const seedFattenings: Fattening[] = [
      { id: 'f1', weaningId: 'w1', dateExpectedSale: '2026-03-16', nbDeadDuringFattening: 5, nbSold: 105, avgWeight: 2.35 },
      { id: 'f2', weaningId: 'w2', dateExpectedSale: '2026-04-21', nbDeadDuringFattening: 4, nbSold: 86, avgWeight: 2.25 },
      { id: 'f3', weaningId: 'w3', dateExpectedSale: '2026-06-10', nbDeadDuringFattening: 6, nbSold: 139, avgWeight: 2.42 },
      { id: 'f4', weaningId: 'w4', dateExpectedSale: '2026-07-19', nbDeadDuringFattening: 3 }
    ];

    const seedSales: Sales[] = [
      { id: 's1', fatteningId: 'f1', dateOrder: '2026-03-14', customer: 'Centragel', nbRequested: 100, nbDelivered: 100, pricePerKg: 2800, totalAmount: 658000 },
      { id: 's2', fatteningId: 'f1', dateOrder: '2026-03-15', customer: 'Marché Local', nbRequested: 10, nbDelivered: 5, pricePerKg: 3000, totalAmount: 35250 },
      { id: 's3', fatteningId: 'f2', dateOrder: '2026-04-20', customer: 'Centragel', nbRequested: 90, nbDelivered: 86, pricePerKg: 2800, totalAmount: 541800 },
      { id: 's4', fatteningId: 'f3', dateOrder: '2026-06-08', customer: 'Centragel', nbRequested: 150, nbDelivered: 139, pricePerKg: 2900, totalAmount: 975522 }
    ];

    this.saveBands(seedBands);
    this.saveReproductions(seedReproductions);
    this.saveWeanings(seedWeanings);
    this.saveFattenings(seedFattenings);
    this.saveSales(seedSales);
  }
}
