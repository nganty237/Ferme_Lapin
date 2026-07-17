import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FarmService } from '../../core/services/farm.service';
import { KpiService } from '../../core/services/kpi.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { MetricCardComponent } from '../../shared/components/metric-card/metric-card.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ventes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MetricCardComponent,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Gestion des ventes"
        subtitle="Enregistrez les commandes et suivez le taux de service commercial"
      >
      </app-page-header>

      <!-- KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <app-metric-card
          label="Taux de service"
          [value]="serviceRate() + '%'"
          hint="Proportion des commandes honorees"
          icon="verified"
          iconBg="#f0fdf4"
          iconColor="#166534"
        ></app-metric-card>
        <app-metric-card
          label="Lapins livres"
          [value]="totalSold() + ''"
          hint="Total des livraisons effectuees"
          icon="local_shipping"
          iconBg="#eef2ff"
          iconColor="#4338ca"
        ></app-metric-card>
        <app-metric-card
          label="Chiffre d'affaires"
          [value]="formattedRevenue()"
          hint="Revenus cumules"
          icon="account_balance_wallet"
          iconBg="#eff6ff"
          iconColor="#1e40af"
        ></app-metric-card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Form -->
        <div>
          <div class="panel">
            <p class="panel__title"><mat-icon>add_circle_outline</mat-icon> Nouvelle commande</p>
            <form [formGroup]="saleForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Date de commande</mat-label>
                <input matInput type="date" formControlName="dateOrder" />
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Client</mat-label>
                <mat-select formControlName="customer">
                  <mat-option value="Centragel">Centragel Bastos</mat-option>
                  <mat-option value="Marche Local">Marche local</mat-option>
                  <mat-option value="Autre">Autre</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Quantite commandee</mat-label>
                <input matInput type="number" formControlName="nbRequested" />
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Quantite livree</mat-label>
                <input matInput type="number" formControlName="nbDelivered" />
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline" floatLabel="always" hideRequiredMarker>
                <mat-label>Prix par kg (FCFA)</mat-label>
                <input matInput type="number" formControlName="pricePerKg" />
              </mat-form-field>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="saleForm.invalid"
                style="width:100%; border-radius:8px; height:42px;"
              >
                Enregistrer
              </button>
            </form>
          </div>
        </div>

        <!-- Table -->
        <div class="lg:col-span-2">
          <div class="panel" style="padding:0; overflow:hidden;">
            <div style="padding:20px 24px 0;">
              <p class="panel__title"><mat-icon>receipt_long</mat-icon> Historique des commandes</p>
            </div>
            <div style="overflow-x:auto;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Client</th>
                    <th style="text-align:center;">Commande</th>
                    <th style="text-align:center;">Livre</th>
                    <th style="text-align:right;">Prix/kg</th>
                    <th style="text-align:right;">Montant</th>
                    <th style="text-align:center;">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sale of sales(); track sale) {
                    <tr>
                      <td style="font-variant-numeric:tabular-nums;">{{ sale.dateOrder }}</td>
                      <td style="font-weight:500;">{{ sale.customer }}</td>
                      <td style="text-align:center;">{{ sale.nbRequested }}</td>
                      <td style="text-align:center;">{{ sale.nbDelivered }}</td>
                      <td style="text-align:right;">{{ sale.pricePerKg | number }}</td>
                      <td style="text-align:right; font-weight:600;">
                        {{ sale.totalAmount | number }} FCFA
                      </td>
                      <td style="text-align:center;">
                        @if (sale.nbDelivered >= sale.nbRequested) {
                          <span class="badge badge--success">Complet</span>
                        }
                        @if (sale.nbDelivered < sale.nbRequested) {
                          <span class="badge badge--danger">Rupture</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class VentesComponent {
  private farmService = inject(FarmService);
  private kpiService = inject(KpiService);
  private fb = inject(FormBuilder);
  private notifier = inject(NotificationService);

  sales = this.farmService.sales;
  serviceRate = computed(() => this.kpiService.calculateServiceRate(this.sales()));
  totalSold = computed(() => this.kpiService.calculateTotalSold(this.sales()));
  totalRevenue = computed(() => this.kpiService.calculateRevenue(this.sales()));
  formattedRevenue = computed(() => {
    const r = this.totalRevenue();
    if (r >= 1_000_000) return (r / 1_000_000).toFixed(1) + ' M FCFA';
    if (r >= 1_000) return (r / 1_000).toFixed(0) + ' k FCFA';
    return r + ' FCFA';
  });

  saleForm: FormGroup = this.fb.group({
    dateOrder: [new Date().toISOString().split('T')[0], [Validators.required]],
    customer: ['Centragel', [Validators.required]],
    nbRequested: [50, [Validators.required, Validators.min(1)]],
    nbDelivered: [50, [Validators.required, Validators.min(0)]],
    pricePerKg: [2800, [Validators.required, Validators.min(100)]],
  });

  onSubmit(): void {
    if (this.saleForm.valid) {
      const v = this.saleForm.value;
      const totalAmount = Math.round(v.nbDelivered * 2.3 * v.pricePerKg);
      this.farmService.addSale({
        dateOrder: v.dateOrder,
        customer: v.customer,
        nbRequested: Number(v.nbRequested),
        nbDelivered: Number(v.nbDelivered),
        pricePerKg: Number(v.pricePerKg),
        totalAmount,
      });
      this.notifier.success('Vente enregistree.');
      this.saleForm.reset({
        dateOrder: new Date().toISOString().split('T')[0],
        customer: 'Centragel',
        nbRequested: 50,
        nbDelivered: 50,
        pricePerKg: 2800,
      });
    }
  }
}

