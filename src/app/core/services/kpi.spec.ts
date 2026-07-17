import { describe, it, expect } from 'vitest';
import { KpiService } from './kpi.service';
import { Reproduction, Weaning, Fattening, Sales, Band } from '../models/models';

describe('KpiService Tests', () => {
  const service = new KpiService();

  it('should calculate fertility rate correctly', () => {
    const repros: Reproduction[] = [
      { id: '1', bandId: 'b1', dateBreeding: '2026-01-01', dateExpectedKindling: '2026-02-01', actualKindling: '2026-02-01' },
      { id: '2', bandId: 'b1', dateBreeding: '2026-01-01', dateExpectedKindling: '2026-02-01', actualKindling: null },
      { id: '3', bandId: 'b1', dateBreeding: '2026-01-01', dateExpectedKindling: '2026-02-01', actualKindling: '2026-02-02' }
    ];
    // 2 kindlings out of 3 reproductions = 67%
    expect(service.calculateFertilityRate(repros)).toBe(67);
    expect(service.calculateFertilityRate([])).toBe(0);
  });

  it('should calculate prolificacy correctly', () => {
    const repros: Reproduction[] = [
      { id: '1', bandId: 'b1', dateBreeding: '2026-01-01', dateExpectedKindling: '2026-02-01', actualKindling: '2026-02-01', nbBornAlive: 8 },
      { id: '2', bandId: 'b1', dateBreeding: '2026-01-01', dateExpectedKindling: '2026-02-01', actualKindling: null },
      { id: '3', bandId: 'b1', dateBreeding: '2026-01-01', dateExpectedKindling: '2026-02-01', actualKindling: '2026-02-02', nbBornAlive: 10 }
    ];
    // (8 + 10) / 2 actual kindlings = 9
    expect(service.calculateProlificacy(repros)).toBe(9);
    expect(service.calculateProlificacy([])).toBe(0);
  });

  it('should calculate pre-weaning mortality rate correctly', () => {
    const repros: Reproduction[] = [
      { id: '1', bandId: 'b1', dateBreeding: '2026-01-01', dateExpectedKindling: '2026-02-01', actualKindling: '2026-02-01', nbBornAlive: 10, nbDeadBeforeWeaning: 2 },
      { id: '2', bandId: 'b1', dateBreeding: '2026-01-01', dateExpectedKindling: '2026-02-01', actualKindling: '2026-02-02', nbBornAlive: 10, nbDeadBeforeWeaning: 3 }
    ];
    // Total born = 20, total dead = 5 => 5/20 = 25%
    expect(service.calculatePreWeaningMortality(repros)).toBe(25);
    expect(service.calculatePreWeaningMortality([])).toBe(0);
  });

  it('should calculate GMQ (Gain Moyen Quotidien) correctly', () => {
    const weanings: Weaning[] = [
      { id: 'w1', reproductionId: 'r1', dateWeaning: '2026-01-01', nbWeaned: 10, avgWeightAtWeaning: 0.7 }
    ];
    const fattenings: Fattening[] = [
      { id: 'f1', weaningId: 'w1', dateExpectedSale: '2026-01-29', avgWeight: 2.1 }
    ];
    // (2.1 - 0.7) = 1.4kg over 28 days = 1400g / 28 = 50g/day
    expect(service.calculateAvgDailyGain(fattenings, weanings)).toBe(50);
    expect(service.calculateAvgDailyGain([], [])).toBe(0);
  });

  it('should calculate sales service rate correctly', () => {
    const sales: Sales[] = [
      { id: '1', dateOrder: '2026-01-01', customer: 'Centragel', nbRequested: 100, nbDelivered: 80, pricePerKg: 3000, totalAmount: 240000 },
      { id: '2', dateOrder: '2026-01-02', customer: 'Marché Local', nbRequested: 20, nbDelivered: 20, pricePerKg: 3000, totalAmount: 60000 }
    ];
    // Total requested = 120, delivered = 100 => 100/120 = 83%
    expect(service.calculateServiceRate(sales)).toBe(83);
    expect(service.calculateServiceRate([])).toBe(0);
  });
});
