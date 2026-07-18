import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService, StorageService } from '@core/services';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-fiche-reproducteur',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="page-container">
      <!-- Bouton Retour -->
      <div class="mb-4">
        <button (click)="goBack()" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
      </div>

      @if (reproducteur()) {
        <!-- En-tête de la Fiche -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-4">
            <div class="gender-avatar" [ngClass]="reproducteur()?.sexe === 'F' ? 'gender-avatar--female' : 'gender-avatar--male'">
              {{ reproducteur()?.sexe === 'F' ? '♀' : '♂' }}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ reproducteur()?.nom || reproducteur()?.id }}</h1>
                <span class="badge" [ngClass]="getEtatClass(reproducteur()?.etat || '')">
                  {{ reproducteur()?.etat }}
                </span>
              </div>
              <p class="text-sm text-slate-500 font-mono mt-0.5">ID: {{ reproducteur()?.id }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <button class="btn btn-outline" (click)="startEdit()" *ngIf="!isEditing">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">edit</mat-icon>
              Modifier
            </button>
            <button class="btn btn-danger-outline" (click)="confirmDelete()" *ngIf="reproducteur()?.etat !== 'Réformé' && reproducteur()?.etat !== 'Mort'">
              <mat-icon style="font-size: 16px; width: 16px; height: 16px;">do_not_disturb_on</mat-icon>
              Retirer de l'élevage
            </button>
          </div>
        </div>

        <!-- Banner de Confirmation de Retrait -->
        <div class="panel border-red-200 bg-red-50/50 mb-6 flex flex-wrap items-center justify-between gap-4" *ngIf="showDeleteConfirm">
          <div class="flex items-start gap-3">
            <mat-icon class="text-red-600" style="font-size: 24px; width: 24px; height: 24px; margin-top: 2px;">warning</mat-icon>
            <div>
              <h3 class="text-sm font-bold text-red-950">Confirmer le retrait de l'élevage</h3>
              <p class="text-xs text-red-800 mt-1 max-w-xl">
                Êtes-vous sûr de vouloir retirer ce reproducteur ? 
                Cette action changera son état en <strong>Réformé</strong>. 
                Ses données historiques seront préservées pour ne pas altérer les statistiques globales de l'élevage.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-outline" (click)="cancelDelete()">Annuler</button>
            <button class="btn btn-primary bg-red-600 hover:bg-red-700 text-white border-none" (click)="performDelete()">
              Confirmer le Retrait
            </button>
          </div>
        </div>

        <!-- Grille Principale -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Colonne Gauche : Détails & KPIs -->
          <div class="space-y-6 lg:col-span-1">
            
            <!-- Fiche Details -->
            <div class="panel">
              <h2 class="section-title">
                <mat-icon>info</mat-icon>
                Informations Générales
              </h2>

              <div class="space-y-4" *ngIf="!isEditing; else editForm">
                <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-sm border-b pb-4 border-slate-100">
                  <span class="text-slate-500 font-medium">Sexe</span>
                  <span class="font-semibold text-slate-800">{{ reproducteur()?.sexe === 'F' ? 'Femelle' : 'Mâle' }}</span>
                  
                  <span class="text-slate-500 font-medium">Bande</span>
                  <span class="font-semibold text-slate-800">{{ bandName() || 'Aucune' }}</span>

                  <span class="text-slate-500 font-medium">État actuel</span>
                  <span>
                    <span class="badge" [ngClass]="getEtatClass(reproducteur()?.etat || '')">
                      {{ reproducteur()?.etat }}
                    </span>
                  </span>
                  
                  <span class="text-slate-500 font-medium">Date de naissance</span>
                  <span class="font-semibold text-slate-800">
                    {{ reproducteur()?.dateNaissance ? (reproducteur()?.dateNaissance | date:'dd/MM/yyyy') : 'Non renseignée' }}
                  </span>

                  <ng-container *ngIf="breederDeces() as dec">
                    <span class="text-slate-500 font-medium">Date de décès</span>
                    <span class="font-semibold text-red-600">{{ dec.dateDeces | date:'dd/MM/yyyy' }}</span>
                    
                    <span class="text-slate-500 font-medium">Cause du décès</span>
                    <span class="font-semibold text-red-600">{{ dec.cause || 'Non spécifiée' }}</span>
                  </ng-container>
                </div>
                
                <div>
                  <span class="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Observations / Notes</span>
                  <p class="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[60px] whitespace-pre-line leading-relaxed">
                    {{ reproducteur()?.notes || 'Aucune observation enregistrée.' }}
                  </p>
                </div>
              </div>

              <!-- Formulaire d'édition -->
              <ng-template #editForm>
                <div class="space-y-4">
                  <div>
                    <label class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Nom du Reproducteur</label>
                    <input type="text" class="form-input w-full" [(ngModel)]="editNom" />
                  </div>
                  <div>
                    <label class="text-[11px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Observations / Notes</label>
                    <textarea class="form-input w-full min-h-[100px]" [(ngModel)]="editNotes"></textarea>
                  </div>
                  <div class="flex gap-2 justify-end mt-4">
                    <button class="btn btn-outline" (click)="cancelEdit()">Annuler</button>
                    <button class="btn btn-primary" (click)="saveEdit()">Enregistrer</button>
                  </div>
                </div>
              </ng-template>
            </div>

            <!-- Performances Calculées -->
            <div class="panel">
              <h2 class="section-title">
                <mat-icon>analytics</mat-icon>
                Performances
              </h2>

              <!-- KPIs Femelle -->
              <div class="grid grid-cols-2 gap-4" *ngIf="reproducteur()?.sexe === 'F' && femaleKpis() as kpis">
                <div class="kpi-box">
                  <span class="kpi-box__label">Taux Fécondité</span>
                  <span class="kpi-box__value">{{ kpis.tauxReussiteSaillies }}%</span>
                  <span class="kpi-box__sub">{{ kpis.totalSaillies }} saillie(s)</span>
                </div>
                <div class="kpi-box">
                  <span class="kpi-box__label">Total Portées</span>
                  <span class="kpi-box__value">{{ kpis.totalPortees }}</span>
                  <span class="kpi-box__sub">mises-bas</span>
                </div>
                <div class="kpi-box">
                  <span class="kpi-box__label">Taille Moyenne</span>
                  <span class="kpi-box__value">{{ kpis.tailleMoyennePortee }}</span>
                  <span class="kpi-box__sub">nés/portée</span>
                </div>
                <div class="kpi-box">
                  <span class="kpi-box__label">Survie Sevrage</span>
                  <span class="kpi-box__value">{{ kpis.tauxSurvieSevrage }}%</span>
                  <span class="kpi-box__sub">au sevrage</span>
                </div>
              </div>

              <!-- KPIs Mâle -->
              <div class="grid grid-cols-2 gap-4" *ngIf="reproducteur()?.sexe === 'M' && maleKpis() as kpis">
                <div class="kpi-box">
                  <span class="kpi-box__label">Total Saillies</span>
                  <span class="kpi-box__value">{{ kpis.totalSaillies }}</span>
                  <span class="kpi-box__sub">couvertures</span>
                </div>
                <div class="kpi-box">
                  <span class="kpi-box__label">Taux Fertilité</span>
                  <span class="kpi-box__value">{{ kpis.tauxFertilite }}%</span>
                  <span class="kpi-box__sub">{{ kpis.sailliesReussies }} réussie(s)</span>
                </div>
                <div class="kpi-box col-span-2">
                  <div class="kpi-box flex-row justify-between items-center py-3">
                    <div>
                      <span class="kpi-box__label">Portées Produites</span>
                      <span class="kpi-box__sub block mt-0.5">Mises-bas engendrées</span>
                    </div>
                    <span class="kpi-box__value text-2xl pr-2">{{ kpis.porteesProduites }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Colonne Droite : Historiques -->
          <div class="space-y-6 lg:col-span-2">
            
            <!-- FEMELLE : Historique Saillies -->
            <div class="panel" *ngIf="reproducteur()?.sexe === 'F'">
              <h2 class="section-title">
                <mat-icon style="color: #ec4899;">favorite</mat-icon>
                Historique des Saillies
              </h2>

              <div class="overflow-x-auto">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Mâle Partenaire</th>
                      <th>Date M.B. Prévue</th>
                      <th class="text-center">Statut / Résultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="femaleSaillies().length === 0">
                      <td colspan="4" class="text-center py-6 text-slate-400">Aucune saillie enregistrée.</td>
                    </tr>
                    <tr *ngFor="let s of femaleSaillies()">
                      <td class="font-semibold text-slate-700">{{ s.dateSaillie | date:'dd/MM/yyyy' }}</td>
                      <td>
                        <a [routerLink]="['/reproducteurs', s.maleId]" class="partner-link font-semibold">
                          <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle;margin-right:2px;">link</mat-icon>
                          {{ s.maleName || s.maleId }}
                        </a>
                      </td>
                      <td class="font-mono text-slate-500">{{ s.dateMiseBasPrevue | date:'dd/MM/yyyy' }}</td>
                      <td class="text-center">
                        <span class="badge" [ngClass]="s.reussie === true ? 'badge--success' : s.reussie === false ? 'badge--danger' : 'badge--warning'">
                          {{ s.reussie === true ? 'Réussie' : s.reussie === false ? 'Échouée' : 'En attente' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- FEMELLE : Historique Portées -->
            <div class="panel" *ngIf="reproducteur()?.sexe === 'F'">
              <h2 class="section-title">
                <mat-icon style="color: #a855f7;">child_care</mat-icon>
                Historique des Portées & Sevrages
              </h2>

              <div class="overflow-x-auto">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date M.B.</th>
                      <th class="text-center">Nés Vivants</th>
                      <th class="text-center">Mort-nés</th>
                      <th class="text-center">Viabilité</th>
                      <th>Sevrage (Date)</th>
                      <th class="text-center">Sevrés</th>
                      <th class="text-center">Survie Sevrage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="femalePortees().length === 0">
                      <td colspan="7" class="text-center py-6 text-slate-400">Aucune portée enregistrée.</td>
                    </tr>
                    <tr *ngFor="let p of femalePortees()">
                      <td class="font-semibold text-slate-700">{{ p.dateMiseBas | date:'dd/MM/yyyy' }}</td>
                      <td class="text-center font-mono">{{ p.vivants }}</td>
                      <td class="text-center font-mono text-slate-400">{{ p.mortsNes }}</td>
                      <td class="text-center">
                        <span class="badge" [ngClass]="p.viabiliteCalculee >= 90 ? 'badge--success' : p.viabiliteCalculee >= 75 ? 'badge--warning' : 'badge--danger'">
                          {{ p.viabiliteCalculee }}%
                        </span>
                      </td>
                      <td>
                        <span class="text-slate-600" *ngIf="p.sevrageDate">{{ p.sevrageDate | date:'dd/MM/yyyy' }}</span>
                        <span class="text-slate-400 italic" *ngIf="!p.sevrageDate">En cours</span>
                      </td>
                      <td class="text-center font-mono text-slate-700">
                        {{ p.sevrageSevres !== null ? p.sevrageSevres : '—' }}
                      </td>
                      <td class="text-center">
                        <span class="badge" *ngIf="p.sevrageSevres !== null" [ngClass]="round((p.sevrageSevres / p.vivants) * 100) >= 90 ? 'badge--success' : round((p.sevrageSevres / p.vivants) * 100) >= 75 ? 'badge--warning' : 'badge--danger'">
                          {{ round((p.sevrageSevres / p.vivants) * 100) }}%
                        </span>
                        <span class="text-slate-400" *ngIf="p.sevrageSevres === null">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- MÂLE : Historique Couvertures -->
            <div class="panel" *ngIf="reproducteur()?.sexe === 'M'">
              <h2 class="section-title">
                <mat-icon style="color: #3b82f6;">favorite</mat-icon>
                Historique des Couvertures
              </h2>

              <div class="overflow-x-auto">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Femelle Partenaire</th>
                      <th>Date M.B. Prévue</th>
                      <th class="text-center">Statut / Résultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngIf="maleSaillies().length === 0">
                      <td colspan="4" class="text-center py-6 text-slate-400">Aucune couverture enregistrée.</td>
                    </tr>
                    <tr *ngFor="let s of maleSaillies()">
                      <td class="font-semibold text-slate-700">{{ s.dateSaillie | date:'dd/MM/yyyy' }}</td>
                      <td>
                        <a [routerLink]="['/reproducteurs', s.femelleId]" class="partner-link font-semibold">
                          <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle;margin-right:2px;">link</mat-icon>
                          {{ s.femaleName || s.femelleId }}
                        </a>
                      </td>
                      <td class="font-mono text-slate-500">{{ s.dateMiseBasPrevue | date:'dd/MM/yyyy' }}</td>
                      <td class="text-center">
                        <span class="badge" [ngClass]="s.reussie === true ? 'badge--success' : s.reussie === false ? 'badge--danger' : 'badge--warning'">
                          {{ s.reussie === true ? 'Réussie' : s.reussie === false ? 'Échouée' : 'En attente' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      } @else {
        <!-- État d'erreur / Non trouvé -->
        <div class="panel text-center py-16">
          <mat-icon class="text-slate-300" style="font-size: 64px; width: 64px; height: 64px;">error_outline</mat-icon>
          <h2 class="text-xl font-bold text-slate-700 mt-4">Reproducteur non trouvé</h2>
          <p class="text-slate-500 mt-2">L'ID demandé n'existe pas ou a été supprimé.</p>
          <button class="btn btn-primary mt-6" (click)="goBack()">
            Retour aux reproducteurs
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--color-text-muted);
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .back-btn:hover {
      color: var(--color-primary);
      background: var(--color-primary-alpha);
    }
    .back-btn .mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .gender-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .gender-avatar--female {
      background: linear-gradient(135deg, #f472b6, #db2777);
    }
    .gender-avatar--male {
      background: linear-gradient(135deg, #60a5fa, #2563eb);
    }

    .badge--success { background: #ecfdf5; color: #059669; }
    .badge--warning { background: #fffbeb; color: #d97706; }
    .badge--danger { background: #fef2f2; color: #dc2626; }
    .badge--neutral { background: #f1f5f9; color: #475569; }
    .badge--gestation { background: #fdf4ff; color: #a855f7; }
    .badge--allaitement { background: #eff6ff; color: #3b82f6; }

    .form-input {
      padding: 10px 14px;
      border: 1px solid var(--color-border, #e8eaed);
      border-radius: 8px;
      font-size: 13.5px;
      background: white;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      color: var(--color-text-main);
    }
    .form-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-alpha);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: var(--color-primary);
      color: white;
    }
    .btn-primary:hover {
      background: var(--color-primary-dark);
    }
    .btn-outline {
      background: white;
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
    }
    .btn-outline:hover {
      background: var(--color-surface-hover);
      border-color: var(--color-text-light);
      color: var(--color-text-main);
    }
    .btn-danger-outline {
      background: white;
      border: 1px solid #fee2e2;
      color: #dc2626;
    }
    .btn-danger-outline:hover {
      background: #fef2f2;
      border-color: #fca5a5;
    }

    .partner-link {
      color: var(--color-primary);
      text-decoration: none;
      transition: color 0.2s;
      display: inline-flex;
      align-items: center;
    }
    .partner-link:hover {
      color: var(--color-primary-dark);
      text-decoration: underline;
    }

    .kpi-box {
      background: var(--color-bg-main);
      border: 1px solid var(--color-border-light);
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
    }
    .kpi-box flex-row {
      display: flex;
      flex-direction: row;
    }
    .kpi-box__label {
      font-size: 11px;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-box__value {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text-main);
      margin: 4px 0 2px;
    }
    .kpi-box__sub {
      font-size: 11px;
      color: var(--color-text-light);
    }
  `]
})
export class FicheReproducteurComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private calcService = inject(CalculationService);
  private storageService = inject(StorageService);

  reproducteurId = signal<string>('');
  bandes = signal<any[]>([
    { id: 'b1', name: 'Bande A' },
    { id: 'b2', name: 'Bande B' },
    { id: 'b3', name: 'Bande C' }
  ]);

  reproducteurs = toSignal(this.calcService.reproducteurs$);
  saillies = toSignal(this.calcService.saillies$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);
  deces = toSignal(this.calcService.deces$);

  isEditing = false;
  editNom = '';
  editNotes = '';
  showDeleteConfirm = false;

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.reproducteurId.set(id);
      }
    });
  }

  reproducteur = computed(() => {
    const id = this.reproducteurId();
    const list = this.reproducteurs() || [];
    return list.find(r => r.id === id);
  });

  bandName = computed(() => {
    const r = this.reproducteur();
    if (!r || !r.bandeId) return '';
    const bList = this.bandes();
    const band = bList.find((b: any) => b.id === r.bandeId);
    return band ? band.name : r.bandeId;
  });

  breederDeces = computed(() => {
    const r = this.reproducteur();
    if (!r) return null;
    const allDeces = this.deces() || [];
    return allDeces.find((d: any) => d.reproducteurId === r.id);
  });

  femaleSaillies = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return [];
    const allSaillies = this.saillies() || [];
    const allRepros = this.reproducteurs() || [];
    return allSaillies
      .filter((s: any) => s.femelleId === r.id)
      .map((s: any) => {
        const male = allRepros.find((m: any) => m.id === s.maleId);
        return {
          ...s,
          maleName: male ? male.nom : s.maleId
        };
      })
      .sort((a: any, b: any) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime());
  });

  femalePortees = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return [];
    const allMisesBas = this.misesBas() || [];
    const allSevrages = this.sevrages() || [];
    return allMisesBas
      .filter((mb: any) => mb.femelleId === r.id)
      .map((mb: any) => {
        const sevrage = allSevrages.find((s: any) => s.miseBasId === mb.id);
        return {
          ...mb,
          sevrageDate: sevrage ? sevrage.dateSevrage : null,
          sevrageSevres: sevrage ? sevrage.sevres : null,
          sevrageCages: sevrage ? sevrage.cagesOccupees : null
        };
      })
      .sort((a: any, b: any) => new Date(b.dateMiseBas).getTime() - new Date(a.dateMiseBas).getTime());
  });

  maleSaillies = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'M') return [];
    const allSaillies = this.saillies() || [];
    const allRepros = this.reproducteurs() || [];
    return allSaillies
      .filter((s: any) => s.maleId === r.id)
      .map((s: any) => {
        const female = allRepros.find((f: any) => f.id === s.femelleId);
        return {
          ...s,
          femaleName: female ? female.nom : s.femelleId
        };
      })
      .sort((a: any, b: any) => new Date(b.dateSaillie).getTime() - new Date(a.dateSaillie).getTime());
  });

  femaleKpis = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'F') return null;

    const sailliesList = this.femaleSaillies();
    const porteesList = this.femalePortees();

    const totalSaillies = sailliesList.length;
    const sailliesReussies = sailliesList.filter((s: any) => s.reussie).length;
    const tauxReussiteSaillies = totalSaillies > 0 ? Math.round((sailliesReussies / totalSaillies) * 100) : 0;

    const totalPortees = porteesList.length;
    const totalVivants = porteesList.reduce((sum: number, mb: any) => sum + (mb.vivants || 0), 0);
    const tailleMoyennePortee = totalPortees > 0 ? Math.round((totalVivants / totalPortees) * 10) / 10 : 0;

    const totalSevres = porteesList.reduce((sum: number, mb: any) => sum + (mb.sevrageSevres || 0), 0);
    const totalVivantsPourSevrage = porteesList.filter((mb: any) => mb.sevrageSevres !== null).reduce((sum: number, mb: any) => sum + (mb.vivants || 0), 0);
    const tauxSurvieSevrage = totalVivantsPourSevrage > 0 ? Math.round((totalSevres / totalVivantsPourSevrage) * 100) : 0;

    return {
      totalSaillies,
      tauxReussiteSaillies,
      totalPortees,
      tailleMoyennePortee,
      tauxSurvieSevrage
    };
  });

  maleKpis = computed(() => {
    const r = this.reproducteur();
    if (!r || r.sexe !== 'M') return null;

    const sailliesList = this.maleSaillies();
    const totalSaillies = sailliesList.length;
    const sailliesReussies = sailliesList.filter((s: any) => s.reussie).length;
    const tauxFertilite = totalSaillies > 0 ? Math.round((sailliesReussies / totalSaillies) * 100) : 0;

    const allMisesBas = this.misesBas() || [];
    const saillieIds = new Set(sailliesList.map((s: any) => s.id));
    const porteesProduites = allMisesBas.filter((mb: any) => saillieIds.has(mb.saillieId)).length;

    return {
      totalSaillies,
      sailliesReussies,
      tauxFertilite,
      porteesProduites
    };
  });

  goBack(): void {
    const r = this.reproducteur();
    if (r) {
      if (r.sexe === 'F') {
        this.router.navigate(['/reproducteurs/femelles']);
      } else {
        this.router.navigate(['/reproducteurs/males']);
      }
    } else {
      this.location.back();
    }
  }

  getEtatClass(etat: string): string {
    switch (etat) {
      case 'Actif': return 'badge--success';
      case 'En gestation': return 'badge--gestation';
      case 'En allaitement': return 'badge--allaitement';
      case 'Réformé': return 'badge--warning';
      case 'Mort': return 'badge--danger';
      default: return 'badge--neutral';
    }
  }

  startEdit(): void {
    const r = this.reproducteur();
    if (r) {
      this.editNom = r.nom || '';
      this.editNotes = r.notes || '';
      this.isEditing = true;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  saveEdit(): void {
    const r = this.reproducteur();
    if (r) {
      const updated = {
        ...r,
        nom: this.editNom,
        notes: this.editNotes
      };
      this.calcService.updateReproducteur(updated);
      this.isEditing = false;
    }
  }

  confirmDelete(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  performDelete(): void {
    const r = this.reproducteur();
    if (r) {
      const updated = {
        ...r,
        etat: 'Réformé' as const
      };
      this.calcService.updateReproducteur(updated);
      this.showDeleteConfirm = false;
      this.goBack();
    }
  }

  round(val: number): number {
    return Math.round(val);
  }
}
