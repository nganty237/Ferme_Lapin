import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { Band, Reproduction, Weaning, Fattening, Sales } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class FarmService {
  private storageService = inject(StorageService);

  // Core signals
  private bandsSignal = signal<Band[]>([]);
  private reproductionsSignal = signal<Reproduction[]>([]);
  private weaningsSignal = signal<Weaning[]>([]);
  private fatteningsSignal = signal<Fattening[]>([]);
  private salesSignal = signal<Sales[]>([]);

  // Public read-only signals
  public bands = computed(() => this.bandsSignal());
  public reproductions = computed(() => this.reproductionsSignal());
  public weanings = computed(() => this.weaningsSignal());
  public fattenings = computed(() => this.fatteningsSignal());
  public sales = computed(() => this.salesSignal());

  constructor() {
    this.loadAllData();
  }

  public loadAllData(): void {
    this.bandsSignal.set(this.storageService.getBands());
    this.reproductionsSignal.set(this.storageService.getReproductions());
    this.weaningsSignal.set(this.storageService.getWeanings());
    this.fatteningsSignal.set(this.storageService.getFattenings());
    this.salesSignal.set(this.storageService.getSales());
  }

  public resetSeedData(): void {
    this.storageService.clearAll();
    this.storageService.initSeedData(true);
    this.loadAllData();
  }

  // --- BANDS CRUD ---
  public addBand(band: Omit<Band, 'id'>): void {
    const newBand: Band = {
      ...band,
      id: 'b_' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [...this.bandsSignal(), newBand];
    this.bandsSignal.set(updated);
    this.storageService.saveBands(updated);
  }

  public updateBand(updatedBand: Band): void {
    const updated = this.bandsSignal().map(b => b.id === updatedBand.id ? updatedBand : b);
    this.bandsSignal.set(updated);
    this.storageService.saveBands(updated);
  }

  public deleteBand(id: string): void {
    const updated = this.bandsSignal().filter(b => b.id !== id);
    this.bandsSignal.set(updated);
    this.storageService.saveBands(updated);
    // Cascade deletion
    const reprosToDelete = this.reproductionsSignal().filter(r => r.bandId === id).map(r => r.id);
    this.reproductionsSignal.set(this.reproductionsSignal().filter(r => r.bandId !== id));
    this.storageService.saveReproductions(this.reproductionsSignal());

    const weaningsToDelete = this.weaningsSignal().filter(w => reprosToDelete.includes(w.reproductionId)).map(w => w.id);
    this.weaningsSignal.set(this.weaningsSignal().filter(w => !reprosToDelete.includes(w.reproductionId)));
    this.storageService.saveWeanings(this.weaningsSignal());

    this.fatteningsSignal.set(this.fatteningsSignal().filter(f => !weaningsToDelete.includes(f.weaningId)));
    this.storageService.saveFattenings(this.fatteningsSignal());
  }

  // --- REPRODUCTION CRUD ---
  public addReproduction(repro: Omit<Reproduction, 'id' | 'dateExpectedKindling'>): void {
    const dateExpected = this.calculateExpectedDate(repro.dateBreeding, 31);
    const newRepro: Reproduction = {
      ...repro,
      id: 'r_' + Math.random().toString(36).substr(2, 9),
      dateExpectedKindling: dateExpected
    };
    const updated = [...this.reproductionsSignal(), newRepro];
    this.reproductionsSignal.set(updated);
    this.storageService.saveReproductions(updated);

    // Update Band status
    const band = this.bandsSignal().find(b => b.id === repro.bandId);
    if (band) {
      const newStatus = repro.actualKindling ? 'sevrage' : 'gestation';
      this.updateBand({ ...band, status: newStatus });
    }
  }

  public updateReproduction(updatedRepro: Reproduction): void {
    updatedRepro.dateExpectedKindling = this.calculateExpectedDate(updatedRepro.dateBreeding, 31);
    const updated = this.reproductionsSignal().map(r => r.id === updatedRepro.id ? updatedRepro : r);
    this.reproductionsSignal.set(updated);
    this.storageService.saveReproductions(updated);

    // Update Band status
    const band = this.bandsSignal().find(b => b.id === updatedRepro.bandId);
    if (band) {
      const newStatus = updatedRepro.actualKindling ? 'sevrage' : 'gestation';
      this.updateBand({ ...band, status: newStatus });
    }
  }

  // --- WEANING CRUD ---
  public addWeaning(weaning: Omit<Weaning, 'id'>): void {
    const newWeaning: Weaning = {
      ...weaning,
      id: 'w_' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [...this.weaningsSignal(), newWeaning];
    this.weaningsSignal.set(updated);
    this.storageService.saveWeanings(updated);

    // Auto-create fattening event shell
    const dateExpectedSale = this.calculateExpectedDate(weaning.dateWeaning, 28);
    this.addFattening({
      weaningId: newWeaning.id,
      dateExpectedSale
    });

    // Update Band status to engraissement
    const repro = this.reproductionsSignal().find(r => r.id === weaning.reproductionId);
    if (repro) {
      const band = this.bandsSignal().find(b => b.id === repro.bandId);
      if (band) {
        this.updateBand({ ...band, status: 'engraissement' });
      }
    }
  }

  // --- FATTENING CRUD ---
  public addFattening(fattening: Omit<Fattening, 'id'>): void {
    const newFattening: Fattening = {
      ...fattening,
      id: 'f_' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [...this.fatteningsSignal(), newFattening];
    this.fatteningsSignal.set(updated);
    this.storageService.saveFattenings(updated);
  }

  public updateFattening(updatedFattening: Fattening): void {
    const updated = this.fatteningsSignal().map(f => f.id === updatedFattening.id ? updatedFattening : f);
    this.fatteningsSignal.set(updated);
    this.storageService.saveFattenings(updated);

    // If sold, check if we archive the band
    if (updatedFattening.nbSold && updatedFattening.nbSold > 0) {
      const weaning = this.weaningsSignal().find(w => w.id === updatedFattening.weaningId);
      if (weaning) {
        const repro = this.reproductionsSignal().find(r => r.id === weaning.reproductionId);
        if (repro) {
          const band = this.bandsSignal().find(b => b.id === repro.bandId);
          if (band) {
            this.updateBand({ ...band, status: 'archived' });
          }
        }
      }
    }
  }

  // --- SALES CRUD ---
  public addSale(sale: Omit<Sales, 'id'>): void {
    const newSale: Sales = {
      ...sale,
      id: 's_' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [...this.salesSignal(), newSale];
    this.salesSignal.set(updated);
    this.storageService.saveSales(updated);
  }

  // Helper date calculation
  private calculateExpectedDate(startDateStr: string, days: number): string {
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}
