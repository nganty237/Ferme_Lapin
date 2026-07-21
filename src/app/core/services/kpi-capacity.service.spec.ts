import { TestBed } from '@angular/core/testing';
import { KpiCapacityService } from './kpi-capacity.service';
import { Sevrage, Vente, Configuration } from '../models';

describe('KpiCapacityService', () => {
  let service: KpiCapacityService;

  const mockConfig: Configuration = {
    nombreCagesTotal: 108,
    densiteParCage: 3,
    dureeGestationJours: 30,
    dureeAllaitementJours: 30,
    dureeSexageJours: 30,
    dureeEngraissementJours: 60,
    nombreCagesReproductrices: 33,
    prixAlimentKg: 350,
    prixVenteDefaut: 3000,
    nombreClapiers: 9,
    nombreCasesParClapier: 12,
    taillePorteeMoyenne: 6,
    nombreFemelles: 33,
    nombreMales: 3,
    nombreBandes: 3
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KpiCapacityService]
    });
    service = TestBed.inject(KpiCapacityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate theoretical capacity correctly', () => {
    const res = service.calculateCapacityKPIs([], [], mockConfig, [], []);
    expect(res.capaciteTheorique).toBe(108 * 3); // 324 lapins
    expect(res.occupationCages.occupees).toBe(0);
    expect(res.occupationCages.pourcentage).toBe(0);
  });

  it('should compute cage occupation based on sevrages and ventes', () => {
    const sevrages: Sevrage[] = [
      { id: 'sev1', miseBasId: 'mb1', dateSevrage: new Date(), sevres: 60, cagesOccupees: 20 }
    ];
    const ventes: Vente[] = [
      { id: 'v1', dateVente: new Date(), vendus: 15, prixTotal: 45000 }
    ];

    const res = service.calculateCapacityKPIs(sevrages, ventes, mockConfig, [], []);
    expect(res.occupationCages.occupees).toBe(15);
    expect(res.occupationCages.pourcentage).toBe(20);
  });

  it('should identify Cages engraissement as main bottleneck when occupation >= 85%', () => {
    const sevrages: Sevrage[] = [
      { id: 'sev1', miseBasId: 'mb1', dateSevrage: new Date(), sevres: 250, cagesOccupees: 84 }
    ];

    const res = service.calculateCapacityKPIs(sevrages, [], mockConfig, [], []);
    expect(res.goulotPrincipal).toBe('Cages engraissement');
  });

  it('should compute ROI for cage expansion correctly', () => {
    const res = service.calculateCapacityKPIs([], [], mockConfig, [], []);
    expect(res.roiAjouterCages.investissement).toBe(12 * 15000);
    expect(res.cagesSupplementairesPourObjectif).toBe(12);
  });
});
