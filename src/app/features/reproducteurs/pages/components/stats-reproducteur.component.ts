import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Reproducteur } from '@core/models';

@Component({
  selector: 'app-stats-reproducteur',
  imports: [DatePipe, RouterLink, MatIconModule],
  template: `
    <div class="space-y-6">
      <!-- Informations Générales -->
      <div class="bg-white border border-slate-200 rounded-xl p-6">
        <h2 class="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <mat-icon class="text-emerald-700">info</mat-icon>
          Informations Générales
        </h2>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-y-3 gap-x-2 text-sm border-b pb-4 border-slate-100">
            <span class="text-slate-500 font-medium">Sexe</span>
            <span class="font-semibold text-slate-800">{{ reproducteur()?.sexe === 'F' ? 'Femelle' : 'Mâle' }}</span>
            
            <span class="text-slate-500 font-medium">Bande</span>
            <span class="font-semibold text-slate-800">
              {{ reproducteur()?.sexe === 'M' ? 'Référentiel Mâle (Couvre les 3 bandes)' : (bandName() || 'Aucune') }}
            </span>

            @if (reproducteur()?.sexe === 'F' && assignedMale()) {
              <span class="text-slate-500 font-medium">Mâle Partenaire</span>
              <span class="font-semibold text-slate-800">
                <a [routerLink]="['/reproducteurs', assignedMale()!.id]" class="text-emerald-700 hover:underline inline-flex items-center gap-1 font-bold">
                  <mat-icon style="font-size:14px;width:14px;height:14px;">male</mat-icon>
                  {{ assignedMale()!.nom }}
                </a>
              </span>
            }

            <span class="text-slate-500 font-medium">État actuel</span>
            <span>
              <span [class]="getEtatClass(reproducteur()?.etat || '')">
                {{ reproducteur()?.etat }}
              </span>
            </span>
            
            <span class="text-slate-500 font-medium">Date de naissance</span>
            <span class="font-semibold text-slate-800">
              {{ reproducteur()?.dateNaissance ? (reproducteur()?.dateNaissance | date:'dd/MM/yyyy') : 'Non renseignée' }}
            </span>

            @if (breederDeces(); as dec) {
              <span class="text-slate-500 font-medium">Date de décès</span>
              <span class="font-semibold text-red-600">{{ dec.dateDeces | date:'dd/MM/yyyy' }}</span>
              
              <span class="text-slate-500 font-medium">Cause du décès</span>
              <span class="font-semibold text-red-600">{{ dec.cause || 'Non spécifiée' }}</span>
            }
          </div>

          <!-- Carte Gestation en cours -->
          @if (reproducteur()?.sexe === 'F' && reproducteur()?.etat === 'En gestation') {
            <div class="bg-purple-50/70 border border-purple-200 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <mat-icon class="text-purple-700 style-20">bedroom_baby</mat-icon>
                <span class="text-xs font-bold text-purple-950 uppercase tracking-wider">Suivi de Gestation Active</span>
              </div>

              @if (gestationActiveInfo(); as gInfo) {
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between items-center text-purple-900">
                    <span class="font-medium text-slate-600">Mâle Partenaire :</span>
                    <a [routerLink]="['/reproducteurs', gInfo.maleId]" class="font-bold text-emerald-700 hover:underline inline-flex items-center gap-0.5">
                      <mat-icon style="font-size:12px;width:12px;height:12px;">link</mat-icon>
                      {{ gInfo.maleName }}
                    </a>
                  </div>
                  @if (gInfo.dateSaillie) {
                    <div class="flex justify-between items-center text-purple-900">
                      <span class="font-medium text-slate-600">Date de Saillie :</span>
                      <span class="font-semibold">{{ gInfo.dateSaillie | date:'dd/MM/yyyy' }}</span>
                    </div>
                  }
                  @if (gInfo.dateMiseBasPrevue) {
                    <div class="flex justify-between items-center text-purple-900">
                      <span class="font-medium text-slate-600">Mise Bas Prévue :</span>
                      <span class="font-bold text-purple-800">{{ gInfo.dateMiseBasPrevue | date:'dd/MM/yyyy' }}</span>
                    </div>
                  }
                  @if (gInfo.joursRestants !== null && gInfo.joursRestants !== undefined) {
                    <div class="mt-2 pt-2 border-t border-purple-200/60 flex justify-between items-center font-bold text-purple-950">
                      <span>Jours avant Mise Bas :</span>
                      <span class="px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-xs font-extrabold">
                        {{ gInfo.joursRestants }} jour(s)
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <p class="text-xs text-purple-800">
                  Femelle déclarée en gestation. Mâle référent : 
                  <a [routerLink]="['/reproducteurs', assignedMale()?.id || 'M01']" class="font-bold text-emerald-700 underline">
                    {{ assignedMale()?.nom || 'M01' }}
                  </a>
                </p>
              }
            </div>
          }

          <!-- Section Femelles Attribuées pour Mâle -->
          @if (reproducteur()?.sexe === 'M' && assignedFemales().length > 0) {
            <div class="border-b pb-4 border-slate-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  Femelles Attribuées ({{ assignedFemales().length }})
                </span>
                <span class="text-[11px] text-slate-400">11 femelles / mâle</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                @for (f of assignedFemales(); track f.id) {
                  <a [routerLink]="['/reproducteurs', f.id]" 
                     class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-medium hover:bg-emerald-100 transition-colors">
                    <mat-icon style="font-size:12px;width:12px;height:12px;">female</mat-icon>
                    {{ f.nom || f.id }}
                  </a>
                }
              </div>
            </div>
          }
          
          <div>
            <span class="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Observations / Notes</span>
            <p class="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[60px] whitespace-pre-line leading-relaxed">
              {{ reproducteur()?.notes || 'Aucune observation enregistrée.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Performances Calculées -->
      <div class="bg-white border border-slate-200 rounded-xl p-6">
        <h2 class="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <mat-icon class="text-emerald-700">analytics</mat-icon>
          Performances
        </h2>

        <!-- KPIs Femelle -->
        @if (reproducteur()?.sexe === 'F' && femaleKpis()) {
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span class="text-[11px] font-medium text-slate-500 block uppercase">Taux Fécondité</span>
              <span class="text-xl font-bold text-slate-800 block my-1">{{ femaleKpis()!.tauxReussiteSaillies }}%</span>
              <span class="text-[10px] text-slate-400 block">{{ femaleKpis()!.totalSaillies }} saillie(s)</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span class="text-[11px] font-medium text-slate-500 block uppercase">Total Portées</span>
              <span class="text-xl font-bold text-slate-800 block my-1">{{ femaleKpis()!.totalPortees }}</span>
              <span class="text-[10px] text-slate-400 block">mises-bas</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span class="text-[11px] font-medium text-slate-500 block uppercase">Taille Moyenne</span>
              <span class="text-xl font-bold text-slate-800 block my-1">{{ femaleKpis()!.tailleMoyennePortee }}</span>
              <span class="text-[10px] text-slate-400 block">nés/portée</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span class="text-[11px] font-medium text-slate-500 block uppercase">Survie Sevrage</span>
              <span class="text-xl font-bold text-slate-800 block my-1">{{ femaleKpis()!.tauxSurvieSevrage }}%</span>
              <span class="text-[10px] text-slate-400 block">au sevrage</span>
            </div>
          </div>
        }

        <!-- KPIs Mâle -->
        @if (reproducteur()?.sexe === 'M' && maleKpis()) {
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span class="text-[11px] font-medium text-slate-500 block uppercase">Total Saillies</span>
              <span class="text-xl font-bold text-slate-800 block my-1">{{ maleKpis()!.totalSaillies }}</span>
              <span class="text-[10px] text-slate-400 block">couvertures</span>
            </div>
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span class="text-[11px] font-medium text-slate-500 block uppercase">Taux Fertilité</span>
              <span class="text-xl font-bold text-slate-800 block my-1">{{ maleKpis()!.tauxFertilite }}%</span>
              <span class="text-[10px] text-slate-400 block">{{ maleKpis()!.sailliesReussies }} réussie(s)</span>
            </div>
            <div class="col-span-2 p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center px-4 py-3">
              <div>
                <span class="text-[11px] font-medium text-slate-500 block uppercase">Portées Produites</span>
                <span class="text-[10px] text-slate-400 block mt-0.5">Mises-bas engendrées</span>
              </div>
              <span class="text-2xl font-bold text-slate-800 pr-2">{{ maleKpis()!.porteesProduites }}</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsReproducteurComponent {
  reproducteur = input<Reproducteur | undefined>();
  bandName = input<string>('');
  breederDeces = input<any>();
  femaleKpis = input<any>();
  maleKpis = input<any>();
  assignedFemales = input<any[]>([]);
  assignedMale = input<{ id: string; nom: string } | null>(null);
  gestationActiveInfo = input<{ maleId: string; maleName: string; dateSaillie?: string; dateMiseBasPrevue?: string; joursRestants?: number | null } | null>(null);

  getEtatClass(etat: string): string {
    const base = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide';
    switch (etat) {
      case 'Actif': return `${base} bg-emerald-100 text-emerald-800`;
      case 'En gestation': return `${base} bg-purple-100 text-purple-800`;
      case 'En allaitement': return `${base} bg-blue-100 text-blue-800`;
      case 'Au repos': return `${base} bg-slate-100 text-slate-700`;
      case 'Réformé':
      case 'Réformée': return `${base} bg-amber-100 text-amber-800`;
      case 'Mort': return `${base} bg-red-100 text-red-800`;
      default: return `${base} bg-slate-100 text-slate-700`;
    }
  }
}
