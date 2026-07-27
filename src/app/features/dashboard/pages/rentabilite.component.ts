import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface DetailsMoisCalcul {
  moisIndex: number;
  label: string;
  jours: number;
  consoAlimentKg: number;
  nbrSacsAliment: number;
  coutAliment: number;
  volEauLitres: number;
  volEauM3: number;
  coutEau: number;
  coutTotalMois: number;
}

export interface BilanZootechniqueBande {
  effectifLapins: number;
  prixSacAliment: number;
  prixEauM3: number;
  prixVenteLapin: number;
  detailsMois: DetailsMoisCalcul[];
  totalAlimentKg: number;
  totalSacsAliment: number;
  totalCoutAliment: number;
  totalEauLitres: number;
  totalEauM3: number;
  totalCoutEau: number;
  totalCoutProduction: number;
  revenuBrutVente: number;
  margeNette: number;
  tauxRentabilite: number;
  depenseParLapin: number;
  margeParLapin: number;
}

@Component({
  selector: 'app-rentabilite',
  standalone: true,
  imports: [DecimalPipe, FormsModule, PageHeaderComponent, MatIconModule, MatButtonModule],
  templateUrl: './rentabilite.component.html',
  styleUrl: './rentabilite.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RentabiliteComponent {

  // Données STATIQUES (Normes Zootechniques & Référentiels d'Élevage Fixes)
  readonly CONSO_JOUR_LAPIN_KG = 0.110;        // 110 g / lapin / jour (Norme rationnement)
  readonly CONSO_JOUR_EAU_LITRE = 0.5;          // 0.5 L d'eau / lapin / jour (Norme abrévement)
  readonly POIDS_SAC_ALIMENT_KG = 51;           // 51 kg par sac d'aliment
  readonly DUREE_PERIODE_JOURS = 90;           // 3 mois (Sexage + Engraissement)
  readonly POIDS_VENTE_LAPIN_KG = 2.5;          // Lapin fini de 2.5 kg

  // Données DYNAMIQUES (Variables modifiables par le fermier)
  effectifLapins = signal<number>(77);
  prixSacAliment = signal<number>(11000);
  prixEauM3 = signal<number>(364);
  prixVenteLapin = signal<number>(10000);

  // Visibilité des paramètres
  showParameters = signal<boolean>(false);

  /**
   * Calcul d'ingénierie zootechnique et financière pour une bande sur 3 mois (90 jours).
   */
  bilan = computed<BilanZootechniqueBande>(() => {
    const effectif = Math.max(1, this.effectifLapins() || 77);
    const prixSac = Math.max(0, this.prixSacAliment() || 11000);
    const tarifEau = Math.max(0, this.prixEauM3() || 364);
    const prixVente = Math.max(0, this.prixVenteLapin() || 10000);

    const detailsMois: DetailsMoisCalcul[] = [];
    let totalAlimentKg = 0;
    let totalEauLitres = 0;

    // Calcul ventilation mois par mois (3 mois = 90j, 30j par mois)
    for (let m = 1; m <= 3; m++) {
      const joursMois = 30;

      // 1. Consommation Alimentaire
      const consoAlimentKg = effectif * this.CONSO_JOUR_LAPIN_KG * joursMois; // ex: 77 * 0.11 * 30 = 254.1 kg
      const nbrSacsAliment = consoAlimentKg / this.POIDS_SAC_ALIMENT_KG;     // ex: 254.1 / 51 = 4.982 sacs
      const coutAliment = nbrSacsAliment * prixSac;                           // ex: 4.982 * 11000 = 54 808.82 FCFA

      // 2. Consommation d'Eau (CAMWATER)
      const volEauLitres = effectif * this.CONSO_JOUR_EAU_LITRE * joursMois;  // ex: 77 * 0.5 * 30 = 1 155 L
      const volEauM3 = volEauLitres / 1000;                                   // ex: 1.155 m³
      const coutEau = volEauM3 * tarifEau;                                    // ex: 1.155 * 364 = 420.42 FCFA

      const coutTotalMois = coutAliment + coutEau;

      totalAlimentKg += consoAlimentKg;
      totalEauLitres += volEauLitres;

      detailsMois.push({
        moisIndex: m,
        label: `Mois ${m}`,
        jours: joursMois,
        consoAlimentKg,
        nbrSacsAliment,
        coutAliment,
        volEauLitres,
        volEauM3,
        coutEau,
        coutTotalMois
      });
    }

    const totalSacsAliment = totalAlimentKg / this.POIDS_SAC_ALIMENT_KG;     // 762.3 / 51 = 14.947 sacs
    const totalCoutAliment = totalSacsAliment * prixSac;                     // 14.947 * 11000 = 164 417.65 FCFA
    const totalEauM3 = totalEauLitres / 1000;                                 // 3 465 L = 3.465 m³
    const totalCoutEau = totalEauM3 * tarifEau;                              // 3.465 * 364 = 1 261.26 FCFA

    const totalCoutProduction = totalCoutAliment + totalCoutEau;             // Dépense totale de la bande

    const revenuBrutVente = effectif * prixVente;                             // 77 * 10000 = 770 000 FCFA
    const margeNette = revenuBrutVente - totalCoutProduction;                // 770000 - 165679 = 604 321 FCFA
    const tauxRentabilite = totalCoutProduction > 0 ? (margeNette / totalCoutProduction) * 100 : 0;

    const depenseParLapin = totalCoutProduction / effectif;
    const margeParLapin = margeNette / effectif;

    return {
      effectifLapins: effectif,
      prixSacAliment: prixSac,
      prixEauM3: tarifEau,
      prixVenteLapin: prixVente,
      detailsMois,
      totalAlimentKg,
      totalSacsAliment,
      totalCoutAliment,
      totalEauLitres,
      totalEauM3,
      totalCoutEau,
      totalCoutProduction,
      revenuBrutVente,
      margeNette,
      tauxRentabilite,
      depenseParLapin,
      margeParLapin
    };
  });

  resetDefaults(): void {
    this.effectifLapins.set(77);
    this.prixSacAliment.set(11000);
    this.prixEauM3.set(364);
    this.prixVenteLapin.set(10000);
  }

  toggleParameters(): void {
    this.showParameters.update(v => !v);
  }
}