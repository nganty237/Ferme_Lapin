import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CalculationService } from '@core/services';
import { PageHeaderComponent } from '@shared/components';
import { MatIconModule } from '@angular/material/icon';

interface PrevisionItem {
  id: string;
  date: Date;
  details: string;
  cle: string; // ex: femelle ID, nombre de lapereaux
}

@Component({
  selector: 'app-previsions-dashboard',
    imports: [PageHeaderComponent, MatIconModule],
  templateUrl: './previsions.component.html',
  styleUrl: './previsions.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrevisionsComponent {
  private calcService = inject(CalculationService);

  saillies = toSignal(this.calcService.saillies$);
  misesBas = toSignal(this.calcService.misesBas$);
  sevrages = toSignal(this.calcService.sevrages$);
  config = toSignal(this.calcService.config$);

  // Today marker
  private getTodayZero(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // 1. Prochaines Mises-bas (🔴)
  upcomingMisesBas = computed<PrevisionItem[]>(() => {
    const list = this.calcService.saillies;
    const mbList = this.calcService.misesBas;
    const c = this.calcService.config;
    const today = this.getTodayZero();

    const result: PrevisionItem[] = [];

    for (const saillie of list) {
      // Check if kindling already happened
      const isDone = mbList.some((m: any) => m.saillieId === saillie.id);
      if (isDone) continue;

      let datePrevue = saillie.dateMiseBasPrevue ? new Date(saillie.dateMiseBasPrevue) : null;
      if (!datePrevue && saillie.dateSaillie) {
        datePrevue = new Date(saillie.dateSaillie);
        datePrevue.setDate(datePrevue.getDate() + (c.dureeGestationJours || 31));
      }

      if (datePrevue && datePrevue >= today) {
        result.push({
          id: saillie.id,
          date: datePrevue,
          cle: `Femelle: ${saillie.femelleId || 'Inconnue'}`,
          details: `Saillie du ${this.formatSourceDate(saillie.dateSaillie)} avec le mâle ${saillie.maleId || '?'}`
        });
      }
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  });

  // 2. Prochains Sevrages (🟡)
  upcomingSevrages = computed<PrevisionItem[]>(() => {
    const list = this.calcService.misesBas;
    const sevList = this.calcService.sevrages;
    const c = this.calcService.config;
    const today = this.getTodayZero();

    const result: PrevisionItem[] = [];

    for (const mb of list) {
      // Check if weaning already happened
      const isDone = sevList.some((s: any) => s.miseBasId === mb.id);
      if (isDone) continue;

      const datePrevue = new Date(mb.dateMiseBas);
      datePrevue.setDate(datePrevue.getDate() + (c.dureeAllaitementJours || 31));

      if (datePrevue >= today) {
        result.push({
          id: mb.id,
          date: datePrevue,
          cle: `Portée: ${mb.vivants || 0} nés vivants`,
          details: `Femelle ${mb.femelleId || 'Inconnue'} - Nés le ${this.formatSourceDate(mb.dateMiseBas)}`
        });
      }
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  });

  // 3. Prochaines Ventes (🟢)
  upcomingVentes = computed<PrevisionItem[]>(() => {
    const list = this.calcService.sevrages;
    const c = this.calcService.config;
    const today = this.getTodayZero();

    const result: PrevisionItem[] = [];

    for (const sev of list) {
      const datePrevue = new Date(sev.dateSevrage);
      // Weaning to sale duration
      datePrevue.setDate(datePrevue.getDate() + (c.dureeEngraissementJours || 120));

      if (datePrevue >= today) {
        result.push({
          id: sev.id,
          date: datePrevue,
          cle: `Lot : ${sev.sevres || 0} lapereaux`,
          details: `Sevrés le ${this.formatSourceDate(sev.dateSevrage)} - Cages estimées: ${Math.ceil(sev.sevres / (c.densiteParCage || 3))}`
        });
      }
    }

    return result.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
  });

  // Format date helper: "dd MMM" (ex: "15 Août")
  formatDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  private formatSourceDate(dateStr: any): string {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    } catch {
      return String(dateStr);
    }
  }
}