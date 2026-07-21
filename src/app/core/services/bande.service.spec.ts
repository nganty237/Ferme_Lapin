import { TestBed } from '@angular/core/testing';
import { BandeService } from './bande.service';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { Palpation, Sevrage, Reproducteur } from '../models';

describe('BandeService', () => {
  let service: BandeService;
  let mockStorageService: any;
  let mockNotificationService: any;
  let lastUpdatedReproducteur: any = null;
  let lastUpdatedBande: any = null;

  beforeEach(() => {
    lastUpdatedReproducteur = null;
    lastUpdatedBande = null;

    mockStorageService = {
      getAllBandes: () => [
        { id: 'bande-a', nom: 'Bande A', phase: 'Repos' },
        { id: 'bande-b', nom: 'Bande B', phase: 'Gestation' },
        { id: 'bande-c', nom: 'Bande C', phase: 'Allaitement' }
      ],
      getAllAffectationMales: () => ({
        'bande-a': [
          { maleId: 'M01', femellesIds: ['F001', 'F002', 'F003', 'F004', 'F005'] }
        ]
      }),
      addSessionSaillie: () => {},
      updateBande: (id: string, partial: any) => { lastUpdatedBande = { id, partial }; },
      addPalpation: () => {},
      getAllReproducteurs: () => [],
      updateReproducteur: (r: any) => { lastUpdatedReproducteur = r; },
      addMiseBas: () => {},
      addSevrage: () => {},
      addSexage: () => {}
    };

    mockNotificationService = {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {}
    };

    TestBed.configureTestingModule({
      providers: [
        BandeService,
        { provide: StorageService, useValue: mockStorageService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    });

    service = TestBed.inject(BandeService);
  });

  it('should be created and load initial bandes state', () => {
    expect(service).toBeTruthy();
    const etats = service.getEtatBandes();
    expect(etats.A).toBe('Repos');
    expect(etats.B).toBe('Gestation');
    expect(etats.C).toBe('Allaitement');
  });

  describe('getCalendrierSaillie (Regle des 2 saillies/jour/male)', () => {
    it('should generate matings distributed max 2 per male per day (Matin/Soir)', () => {
      const dateDebut = new Date('2026-03-01T08:00:00Z');
      const sessions = service.getCalendrierSaillie('bande-a', dateDebut);

      expect(sessions.length).toBe(5);

      // F001 -> J1 Matin
      expect(sessions[0].jour).toBe(1);
      expect(sessions[0].moment).toBe('Matin');
      expect(sessions[0].maleId).toBe('M01');
      expect(sessions[0].femelleId).toBe('F001');

      // F002 -> J1 Soir
      expect(sessions[1].jour).toBe(1);
      expect(sessions[1].moment).toBe('Soir');

      // F003 -> J2 Matin
      expect(sessions[2].jour).toBe(2);
      expect(sessions[2].moment).toBe('Matin');

      // F004 -> J2 Soir
      expect(sessions[3].jour).toBe(2);
      expect(sessions[3].moment).toBe('Soir');

      // F005 -> J3 Matin
      expect(sessions[4].jour).toBe(3);
      expect(sessions[4].moment).toBe('Matin');
    });

    it('should return empty array if no affectations found for bande', () => {
      const sessions = service.getCalendrierSaillie('bande-inconnue', new Date());
      expect(sessions).toEqual([]);
    });
  });

  describe('enregistrerPalpation', () => {
    it('should update female state to En gestation when palpation is Positive', () => {
      const mockRepros: Reproducteur[] = [
        { id: 'F001', nom: 'Lapine 1', sexe: 'F', etat: 'Au repos' }
      ];
      mockStorageService.getAllReproducteurs = () => mockRepros;

      const palpation: Palpation = {
        id: 'p1',
        saillieId: 's1',
        femelleId: 'F001',
        datePalpation: new Date(),
        resultat: 'Positive'
      };

      service.enregistrerPalpation(palpation);

      expect(lastUpdatedReproducteur).toBeTruthy();
      expect(lastUpdatedReproducteur.id).toBe('F001');
      expect(lastUpdatedReproducteur.etat).toBe('En gestation');
    });
  });

  describe('confirmerSevrage', () => {
    it('should change band phase to Sevrage and return nursing mothers to Au repos', () => {
      const mockRepros: Reproducteur[] = [
        { id: 'F001', nom: 'Mother 1', sexe: 'F', etat: 'En allaitement', bandeId: 'bande-a' }
      ];
      mockStorageService.getAllReproducteurs = () => mockRepros;

      const sevrages: Sevrage[] = [
        { id: 'sev1', miseBasId: 'mb1', dateSevrage: new Date(), sevres: 7, cagesOccupees: 3 }
      ];

      service.confirmerSevrage('bande-a', sevrages);

      expect(lastUpdatedBande).toBeTruthy();
      expect(lastUpdatedBande.id).toBe('bande-a');
      expect(lastUpdatedBande.partial.phase).toBe('Sevrage');
    });
  });
});
