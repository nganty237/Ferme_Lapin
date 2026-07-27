import { TestBed } from '@angular/core';
import { KpiReproductionService } from './kpi-reproduction.service';
import { Reproducteur, Saillie, MiseBas, Sevrage, Configuration } from '../models';

describe('KpiReproductionService', () => {
  let service: KpiReproductionService;

  const mockConfig: Configuration = {
    nombreCagesTotal: 108,
    densiteParCase: 3,
    densiteSexageParCase: 7,
    dureeGestationJours: 31,
    jourPalpation: 15,
    dureeAllaitementMinJours: 30,
    dureeAllaitementMaxJours: 35,
    dureeSexageJours: 30,
    dureeEngraissementJours: 60,
    prixAlimentKg: 350,
    prixVenteDefaut: 3000,
    nombreClapiers: 9,
    nombreCasesParClapier: 12,
    taillePorteeMoyenne: 6,
    nombreFemelles: 33,
    nombreFemellesParBande: 11,
    nombreMales: 3,
    nombreBandes: 3,
    ageMaturiteSexuelleMois: 5,
    decalageAgeBandesMois: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KpiReproductionService]
    });
    service = TestBed.inject(KpiReproductionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate fecundity rate and average litter size correctly', () => {
    const repros: Reproducteur[] = [
      { id: 'F001', nom: 'F001', sexe: 'F', etat: 'Actif', bandeId: 'bande-a', maleResponsableId: 'M01' },
      { id: 'F002', nom: 'F002', sexe: 'F', etat: 'Actif', bandeId: 'bande-a', maleResponsableId: 'M01' },
      { id: 'M01', nom: 'M01', sexe: 'M', etat: 'Actif', femellesIds: ['F001', 'F002'] }
    ];

    const saillies: Saillie[] = [
      { id: 'sal1', femelleId: 'F001', maleId: 'M01', dateSaillie: '2026-01-01', dateMiseBasPrevue: '2026-02-01' },
      { id: 'sal2', femelleId: 'F002', maleId: 'M01', dateSaillie: '2026-01-01', dateMiseBasPrevue: '2026-02-01' }
    ];

    const misesBas: MiseBas[] = [
      { id: 'mb1', saillieId: 'sal1', femelleId: 'F001', dateMiseBas: '2026-02-01', vivants: 8, mortsNes: 0, viabiliteCalculee: 100 }
    ];

    const res = service.calculateReproductionKPIs(repros, saillies, misesBas, [], [], mockConfig, [], []);
    expect(res.tauxFecondite).toBe(50);
    expect(res.tailleMoyennePortee).toBe(8);
    expect(res.viabiliteImmediate).toBe(100);
  });

  it('should calculate suckling survival rate correctly', () => {
    const repros: Reproducteur[] = [
      { id: 'F001', nom: 'F001', sexe: 'F', etat: 'Actif', bandeId: 'bande-a', maleResponsableId: 'M01' }
    ];

    const misesBas: MiseBas[] = [
      { id: 'mb1', saillieId: 'sal1', femelleId: 'F001', dateMiseBas: '2026-02-01', vivants: 10, mortsNes: 0, viabiliteCalculee: 100 }
    ];

    const sevrages: Sevrage[] = [
      { id: 'sev1', miseBasId: 'mb1', dateSevrage: new Date().toISOString(), sevres: 8, cagesOccupees: 3 }
    ];

    const res = service.calculateReproductionKPIs(repros, [], misesBas, sevrages, [], mockConfig, [], []);
    expect(res.tauxSurvieAllaitement).toBe(80);
  });

  it('should detect pending palpation alerts', () => {
    const today = new Date();
    const dateSailliePast = new Date(today);
    dateSailliePast.setDate(dateSailliePast.getDate() - 14);

    const saillies: Saillie[] = [
      { id: 'sal1', femelleId: 'F001', maleId: 'M01', dateSaillie: dateSailliePast.toISOString(), dateMiseBasPrevue: '' }
    ];

    const res = service.calculateReproductionKPIs([], saillies, [], [], [], mockConfig, [], []);
    expect(res.alertesPalpation).toBeDefined();
    expect(res.alertesPalpation!.length).toBe(1);
    expect(res.alertesPalpation![0].femelleId).toBe('F001');
  });
});
