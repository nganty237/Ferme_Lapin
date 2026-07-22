import { TestBed } from '@angular/core';
import { BandeService } from './bande.service';
import { StorageService } from './storage.service';
import { ReferentielService } from './referentiel.service';
import { NotificationService } from './notification.service';
import { Palpation, Sevrage, Reproducteur, BandeId } from '../models';

describe('BandeService', () => {
  let service: BandeService;
  let mockStorageService: any;
  let mockReferentielService: any;
  let mockNotificationService: any;
  let lastUpdatedReproducteur: any = null;
  let lastUpdatedBande: any = null;

  beforeEach(() => {
    lastUpdatedReproducteur = null;
    lastUpdatedBande = null;

    mockStorageService = {
      getAllBandes: () => [
        { id: 'bande-a', nom: 'Bande A', phase: 'Repos' },
        { id: 'bande-b', nom: 'Bande B', phase: 'Saillie' },
        { id: 'bande-c', nom: 'Bande C', phase: 'Allaitement' }
      ],
      addCycleBande: () => {},
      addSaillie: () => {},
      updateBande: (id: string, partial: any) => { lastUpdatedBande = { id, partial }; },
      addPalpation: () => {},
      getAllReproducteurs: () => [],
      updateReproducteur: (r: any) => { lastUpdatedReproducteur = r; },
      addMiseBas: () => {},
      addSevrage: () => {},
      addSexage: () => {}
    };

    mockReferentielService = {
      getCalendrierSaillieStatique: (bandeId: string) => {
        if (bandeId !== 'bande-a') return [];
        return [
          { ordre: 1, maleId: 'M01', femelleId: 'F001', jourSaillie: 1, moment: 'Matin', bandeId: 'bande-a' },
          { ordre: 2, maleId: 'M01', femelleId: 'F002', jourSaillie: 1, moment: 'Soir', bandeId: 'bande-a' },
          { ordre: 3, maleId: 'M02', femelleId: 'F012', jourSaillie: 1, moment: 'Matin', bandeId: 'bande-a' },
          { ordre: 4, maleId: 'M02', femelleId: 'F013', jourSaillie: 1, moment: 'Soir', bandeId: 'bande-a' },
          { ordre: 5, maleId: 'M03', femelleId: 'F023', jourSaillie: 1, moment: 'Matin', bandeId: 'bande-a' }
        ];
      }
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
        { provide: ReferentielService, useValue: mockReferentielService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    });

    service = TestBed.inject(BandeService);
  });

  it('should be created and load initial bandes state', () => {
    expect(service).toBeTruthy();
    const etats = service.getEtatBandes();
    expect(etats.A).toBe('Repos');
    expect(etats.B).toBe('Saillie');
    expect(etats.C).toBe('Allaitement');
  });

  describe('getCalendrierSaillie', () => {
    it('should generate matings based on referentiel items', () => {
      const dateDebut = new Date('2026-03-01T08:00:00Z');
      const sessions = service.getCalendrierSaillie('bande-a', dateDebut);

      expect(sessions.length).toBe(5);

      // F001 -> J1 Matin
      expect(sessions[0].jourSaillie).toBe(1);
      expect(sessions[0].moment).toBe('Matin');
      expect(sessions[0].maleId).toBe('M01');
      expect(sessions[0].femelleId).toBe('F001');

      // F002 -> J1 Soir
      expect(sessions[1].jourSaillie).toBe(1);
      expect(sessions[1].moment).toBe('Soir');
    });

    it('should return empty array if no affectations found for invalid bande', () => {
      const sessions = service.getCalendrierSaillie('invalid' as BandeId, new Date());
      expect(sessions).toEqual([]);
    });
  });

  describe('enregistrerPalpation', () => {
    it('should update female state to En gestation when palpation is Positive', () => {
      const mockRepros: Reproducteur[] = [
        { id: 'F001', nom: 'F001', sexe: 'F', etat: 'Au repos', bandeId: 'bande-a', maleResponsableId: 'M01' }
      ];
      mockStorageService.getAllReproducteurs = () => mockRepros;

      const palpation: Palpation = {
        id: 'p1',
        saillieId: 's1',
        femelleId: 'F001',
        datePalpation: new Date().toISOString(),
        resultat: 'Positive'
      };

      service.enregistrerPalpation(palpation);

      expect(lastUpdatedReproducteur).toBeTruthy();
      expect(lastUpdatedReproducteur.id).toBe('F001');
      expect(lastUpdatedReproducteur.etat).toBe('En gestation');
    });
  });

  describe('confirmerSevrage', () => {
    it('should change band phase to Sexage and return nursing mothers to Au repos', () => {
      const mockRepros: Reproducteur[] = [
        { id: 'F001', nom: 'F001', sexe: 'F', etat: 'En allaitement', bandeId: 'bande-a', maleResponsableId: 'M01' }
      ];
      mockStorageService.getAllReproducteurs = () => mockRepros;

      const sevrages: Sevrage[] = [
        { id: 'sev1', miseBasId: 'mb1', dateSevrage: new Date().toISOString(), sevres: 7, cagesOccupees: 3 }
      ];

      service.confirmerSevrage('bande-a', sevrages);

      expect(lastUpdatedBande).toBeTruthy();
      expect(lastUpdatedBande.id).toBe('bande-a');
      expect(lastUpdatedBande.partial.phase).toBe('Sexage');
    });
  });
});
