import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmService } from '../../core/services/farm.service';
import { KpiService } from '../../core/services/kpi.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface MonthlyReport {
  month: string;
  nbBornAlive: number;
  nbWeaned: number;
  nbSold: number;
  revenue: number;
  preWeaningMortality: number;
}

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, EmptyStateComponent, MatButtonModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="flex justify-between items-start">
        <app-page-header
          title="Rapports"
          subtitle="Bilans mensuels et export des donnees pour le memoire">
        </app-page-header>
        <button mat-flat-button color="primary" (click)="exportToCSV()" style="border-radius:8px; height:40px;">
          <mat-icon style="font-size:16px;width:16px;height:16px;margin-right:6px;">download</mat-icon>
          Exporter en CSV
        </button>
      </div>

      <div class="panel" style="padding:0; overflow:hidden;">
        <div style="padding:20px 24px 0;">
          <p class="panel__title"><mat-icon>assessment</mat-icon> Bilan mensuel</p>
        </div>
        <div style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mois</th>
                <th style="text-align:center;">Nes vivants</th>
                <th style="text-align:center;">Sevres</th>
                <th style="text-align:center;">Mortalite</th>
                <th style="text-align:center;">Vendus</th>
                <th style="text-align:right;">Chiffre d'affaires</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of monthlyReports()">
                <td style="font-weight:600;">{{ row.month }}</td>
                <td style="text-align:center;">{{ row.nbBornAlive }}</td>
                <td style="text-align:center;">{{ row.nbWeaned }}</td>
                <td style="text-align:center;">
                  <span class="badge" [class.badge--warning]="row.preWeaningMortality > 10" [class.badge--success]="row.preWeaningMortality <= 10">
                    {{ row.preWeaningMortality }}%
                  </span>
                </td>
                <td style="text-align:center;">{{ row.nbSold }}</td>
                <td style="text-align:right; font-weight:600;">{{ row.revenue | number }} FCFA</td>
              </tr>
              <tr *ngIf="monthlyReports().length === 0">
                <td colspan="6">
                  <app-empty-state icon="summarize" message="Pas encore de donnees pour generer un rapport."></app-empty-state>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-top:16px; padding:14px 18px; background:#f8fafc; border:1px solid #e8eaed; border-radius:10px; display:flex; gap:10px; align-items:flex-start;">
        <mat-icon style="font-size:16px;width:16px;height:16px;color:#94a3b8;margin-top:2px;">info_outline</mat-icon>
        <p style="font-size:12px; color:#64748b; margin:0; line-height:1.5;">
          Le fichier CSV exporte contient les donnees brutes de production structurees en tableau. Il est compatible avec Excel et R pour les analyses statistiques du memoire.
        </p>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class RapportsComponent {
  private farmService = inject(FarmService);
  private kpiService = inject(KpiService);

  monthlyReports = computed<MonthlyReport[]>(() => {
    const reproductions = this.farmService.reproductions();
    const weanings = this.farmService.weanings();
    const sales = this.farmService.sales();
    const groups: Record<string, { repros: typeof reproductions; sales: typeof sales }> = {};

    reproductions.forEach(r => {
      const d = new Date(r.dateBreeding);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = { repros: [], sales: [] };
      groups[key].repros.push(r);
    });
    sales.forEach(s => {
      const d = new Date(s.dateOrder);
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = { repros: [], sales: [] };
      groups[key].sales.push(s);
    });

    return Object.keys(groups).map(month => {
      const g = groups[month];
      const nbBornAlive = g.repros.reduce((s, r) => s + (r.nbBornAlive || 0), 0);
      const reproIds = g.repros.map(r => r.id);
      const nbWeaned = weanings.filter(w => reproIds.includes(w.reproductionId)).reduce((s, w) => s + w.nbWeaned, 0);
      return {
        month: month.charAt(0).toUpperCase() + month.slice(1),
        nbBornAlive, nbWeaned,
        nbSold: g.sales.reduce((s, v) => s + v.nbDelivered, 0),
        revenue: this.kpiService.calculateRevenue(g.sales),
        preWeaningMortality: this.kpiService.calculatePreWeaningMortality(g.repros)
      };
    });
  });

  exportToCSV(): void {
    const bands = this.farmService.bands();
    const reproductions = this.farmService.reproductions();
    const weanings = this.farmService.weanings();
    const sales = this.farmService.sales();
    let csv = '\uFEFF';

    csv += 'BANDES\nID;Nom;Date;Femelles;Statut;Notes\n';
    bands.forEach(b => csv += `${b.id};${b.name};${b.dateCreated};${b.nbFemales};${b.status};${b.notes || ''}\n`);

    csv += '\nREPRODUCTIONS\nID;Bande;Saillie;Mise bas prevue;Mise bas reelle;Nes vivants;Morts pre-sevrage\n';
    reproductions.forEach(r => {
      const bn = bands.find(b => b.id === r.bandId)?.name || '';
      csv += `${r.id};${bn};${r.dateBreeding};${r.dateExpectedKindling};${r.actualKindling || ''};${r.nbBornAlive ?? ''};${r.nbDeadBeforeWeaning ?? ''}\n`;
    });

    csv += '\nSEVRAGES\nID;Reproduction;Date;Sevres;Poids moyen (kg)\n';
    weanings.forEach(w => csv += `${w.id};${w.reproductionId};${w.dateWeaning};${w.nbWeaned};${w.avgWeightAtWeaning}\n`);

    csv += '\nVENTES\nID;Date;Client;Commandes;Livres;Prix/kg;Total (FCFA)\n';
    sales.forEach(s => csv += `${s.id};${s.dateOrder};${s.customer};${s.nbRequested};${s.nbDelivered};${s.pricePerKg};${s.totalAmount}\n`);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `saveurs-du-lapin-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}
