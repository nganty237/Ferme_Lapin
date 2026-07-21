import { TestBed } from '@angular/core/testing';
import { KpiReproductionService } from './kpi-reproduction.service';
import { Reproducteur, Saillie, MiseBas, Sevrage, Configuration } from '../models';

describe('KpiReproductionService', () => {
  let service: KpiReproductionService;

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
      providers: [KpiReproductionService]
    });
    service = TestBed.inject(KpiReproductionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate fecundity rate and average litter size correctly', () => {
    const repros: Reproducteur[] = [
      { id: 'F001', nom: 'Lapine 1', sexe: 'F', etat: 'Actif' },
      { id: 'F002', nom: 'Lapine 2', sexe: 'F', etat: 'Actif' },
      { id: 'M001', nom: 'Lapin 1', sexe: 'M', etat: 'Actif' }
    ];

    const saillies: Saillie[] = [
      { id: 'sal1', femelleId: 'F001', maleId: 'M001', dateSaillie: '2026-01-01', dateMiseBasPrevue: '2026-02-01' },
      { id: 'sal2', femelleId: 'F002', maleId: 'M001', dateSaillie: '2026-01-01', dateMiseBasPrevue: '2026-02-01' }
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
      { id: 'F001', nom: 'Lapine 1', sexe: 'F', etat: 'Actif' }
    ];

    const misesBas: MiseBas[] = [
      { id: 'mb1', saillieId: 'sal1', femelleId: 'F001', dateMiseBas: '2026-02-01', vivants: 10, mortsNes: 0, viabiliteCalculee: 100 }
    ];

    const sevrages: Sevrage[] = [
      { id: 'sev1', miseBasId: 'mb1', dateSevrage: new Date(), sevres: 8, cagesOccupees: 3 }
    ];

    const res = service.calculateReproductionKPIs(repros, [], misesBas, sevrages, [], mockConfig, [], []);
    expect(res.tauxSurvieAllaitement).toBe(80);
  });

  it('should detect pending palpation alerts', () => {
    const today = new Date();
    const dateSailliePast = new Date(today);
    dateSailliePast.setDate(dateSailliePast.getDate() - 14);

    const saillies: Saillie[] = [
      { id: 'sal1', femelleId: 'F001', maleId: 'M001', dateSaillie: dateSailliePast.toISOString(), dateMiseBasPrevue: '' }
    ];

    const res = service.calculateReproductionKPIs([], saillies, [], [], [], mockConfig, [], []);
    expect(res.alertesPalpation).toBeDefined();
    expect(res.alertesPalpation!.length).toBe(1);
    expect(res.alertesPalpation![0].femelleId).toBe('F001');
  });
});
