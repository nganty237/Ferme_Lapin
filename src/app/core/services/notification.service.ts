import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { CalculationService, KPIs } from './calculation.service';
import { ToastService } from './toast.service';
import { Saillie, MiseBas, Sevrage, Deces, Reproducteur, Bande } from '../models';

export type NotifType = 'CRITIQUE' | 'WARNING' | 'INFO';

export interface AppNotification {
  id: string;
  type: NotifType;
  message: string;
  icon: string;
  timestamp: Date;
  lue: boolean;
}

/**
 * Service centralisé de gestion des notifications applicatives et alertes d'élevage.
 * S'abonne de manière 100% réactive à l'ensemble des flux d'événements de la ferme.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private calcService = inject(CalculationService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private readonly _notifications$ = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this._notifications$.asObservable();

  constructor() {
    // Écoute réactive synchronisée de tous les flux de données de la ferme
    combineLatest([
      this.calcService.kpis$,
      this.calcService.saillies$,
      this.calcService.misesBas$,
      this.calcService.sevrages$,
      this.calcService.deces$,
      this.calcService.bandes$
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([kpis, saillies, misesBas, sevrages, deces, bandes]) => {
        this.generateAlerts(kpis, saillies, misesBas, sevrages, deces, bandes);
      });
  }

  success(message: string): void {
    this.toastService.success(message);
  }

  error(message: string): void {
    this.toastService.error(message);
  }

  warning(message: string): void {
    this.toastService.warning(message);
  }

  info(message: string): void {
    this.toastService.info(message);
  }

  addNotification(type: NotifType, message: string, icon: string, id?: string): void {
    const notifId = id || `${type}_${Date.now()}`;
    const notif: AppNotification = {
      id: notifId,
      type,
      message,
      icon,
      timestamp: new Date(),
      lue: false,
    };

    const current = this._notifications$.getValue().filter((n) => n.id !== notifId);
    this._notifications$.next([notif, ...current]);
  }

  markAsRead(id: string): void {
    const updated = this._notifications$.getValue().map((n) =>
      n.id === id ? { ...n, lue: true } : n
    );
    this._notifications$.next(updated);
  }

  markAllAsRead(): void {
    const updated = this._notifications$.getValue().map((n) => ({ ...n, lue: true }));
    this._notifications$.next(updated);
  }

  dismiss(id: string): void {
    const updated = this._notifications$.getValue().filter((n) => n.id !== id);
    this._notifications$.next(updated);
  }

  clearAll(): void {
    this._notifications$.next([]);
  }

  get unreadCount(): number {
    return this._notifications$.getValue().filter((n) => !n.lue).length;
  }

  private generateAlerts(
    kpis: KPIs,
    saillies: Saillie[],
    misesBas: MiseBas[],
    sevrages: Sevrage[],
    deces: Deces[],
    bandes: Bande[]
  ): void {
    const notifs: AppNotification[] = [];

    // 1. Alerte Taux d'occupation des cages d'engraissement (60 cages)
    const pctEngrais = kpis.occupationCages ? kpis.occupationCages.pourcentage : 87;
    const occEngrais = kpis.occupationCages ? kpis.occupationCages.occupees : 52;
    const totEngrais = kpis.occupationCages ? kpis.occupationCages.totales : 60;

    if (pctEngrais > 95) {
      notifs.push(this.createNotif(
        'CRITIQUE',
        `Cages à ${pctEngrais}% d'occupation (${occEngrais}/${totEngrais}). Action urgente de vente requise !`,
        'error',
        'cages_critique'
      ));
    } else if (pctEngrais >= 80) {
      notifs.push(this.createNotif(
        'WARNING',
        `Cages à ${pctEngrais}% d'occupation (${occEngrais}/${totEngrais}). Planifier des ventes.`,
        'warning',
        'cages_warning'
      ));
    } else {
      notifs.push(this.createNotif(
        'INFO',
        `Cages à ${pctEngrais}% d'occupation (${occEngrais}/${totEngrais}). Stock normal.`,
        'check_circle',
        'cages_info'
      ));
    }

    // 2. Alerte Fécondité
    if (kpis.tauxFecondite > 0 && kpis.tauxFecondite < 70) {
      notifs.push(this.createNotif(
        'WARNING',
        `Taux de fécondité faible : ${kpis.tauxFecondite}%. Vérifier la santé des reproducteurs.`,
        'warning',
        'fecondite_warning'
      ));
    }

    // 3. Alerte Survie Allaitement
    if (kpis.tauxSurvieAllaitement > 0 && kpis.tauxSurvieAllaitement < 70) {
      notifs.push(this.createNotif(
        'CRITIQUE',
        `Taux de survie allaitement critique : ${kpis.tauxSurvieAllaitement}%. Vérifier conditions d'élevage.`,
        'error',
        'survie_critique'
      ));
    } else if (kpis.tauxSurvieAllaitement >= 70 && kpis.tauxSurvieAllaitement < 85) {
      notifs.push(this.createNotif(
        'WARNING',
        `Taux de survie allaitement en dessous de l'optimal : ${kpis.tauxSurvieAllaitement}%.`,
        'warning',
        'survie_warning'
      ));
    }

    // 4. Synthèse réactive des Bandes (Phases réelles)
    const phaseA = (bandes.find(b => b.id === 'bande-a')?.phase) || kpis.phasesBandes.A;
    const phaseB = (bandes.find(b => b.id === 'bande-b')?.phase) || kpis.phasesBandes.B;
    const phaseC = (bandes.find(b => b.id === 'bande-c')?.phase) || kpis.phasesBandes.C;
    notifs.push(this.createNotif(
      'INFO',
      `Bandes : A:${phaseA} | B:${phaseB} | C:${phaseC}`,
      'view_timeline',
      'phases_info'
    ));

    // 5. Portées en cours
    if (kpis.nombrePorteesEnCours > 0) {
      notifs.push(this.createNotif(
        'INFO',
        `${kpis.nombrePorteesEnCours} portée(s) en cours d'engraissement.`,
        'info',
        'portees_info'
      ));
    }

    // 6. Alertes Palpations & Mises-bas imminentes
    if (kpis.alertesPalpation && kpis.alertesPalpation.length > 0) {
      const imminentes = kpis.alertesPalpation.filter(a => a.joursRestants <= 2);
      if (imminentes.length > 0) {
        notifs.push(this.createNotif(
          'WARNING',
          `${imminentes.length} palpation(s) à réaliser très prochainement (J+15).`,
          'event_note',
          'palpations_warning'
        ));
      }
    }

    if (kpis.alertesMiseBas && kpis.alertesMiseBas.length > 0) {
      const imminentes = kpis.alertesMiseBas.filter(a => a.urgence === 'imminente');
      if (imminentes.length > 0) {
        notifs.push(this.createNotif(
          'CRITIQUE',
          `${imminentes.length} mise(s)-bas imminente(s) ! Préparer les nids.`,
          'warning',
          'misesbas_critique'
        ));
      }
    }

    // 7. Alertes temporelles (Mises-bas du jour, Sevrages prévus, Décès)
    this.generateTimeBasedNotifs(notifs, saillies, misesBas, sevrages, deces);

    // Déduplication stricte par ID pour éviter les cartes en double
    const uniqueNotifsMap = new Map<string, AppNotification>();
    notifs.forEach(n => {
      if (!uniqueNotifsMap.has(n.id)) {
        uniqueNotifsMap.set(n.id, n);
      }
    });

    const manualNotifs = this._notifications$.getValue().filter(
      (n) => !n.id.includes('_critique') && !n.id.includes('_warning') && !n.id.includes('_info')
    );

    this._notifications$.next([...Array.from(uniqueNotifsMap.values()), ...manualNotifs]);
  }

  private generateTimeBasedNotifs(
    notifs: AppNotification[],
    saillies: Saillie[],
    misesBas: MiseBas[],
    sevrages: Sevrage[],
    deces: Deces[]
  ): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Alertes Mise-bas prévues aujourd'hui
    for (const saillie of saillies) {
      if (saillie.dateMiseBasPrevue) {
        const datePrevue = new Date(saillie.dateMiseBasPrevue);
        datePrevue.setHours(0, 0, 0, 0);
        if (datePrevue.getTime() === today.getTime()) {
          const mbExiste = misesBas.some((mb: MiseBas) => mb.saillieId === saillie.id);
          if (!mbExiste) {
            notifs.push(this.createNotif(
              'CRITIQUE',
              `Mise-bas prévue aujourd'hui pour la saillie du ${this.formatDate(saillie.dateSaillie)}. Surveiller la femelle !`,
              'error',
              `misebas_today_${saillie.id}`
            ));
          }
        }
      }
    }

    // Alertes Sevrages prévus (Dédupliqués par miseBasId)
    const config = this.calcService.config;
    const dureeAllaitement = config.dureeAllaitementMinJours || 35;

    for (const mb of misesBas) {
      const dateSevragePrevue = new Date(mb.dateMiseBas);
      dateSevragePrevue.setDate(dateSevragePrevue.getDate() + dureeAllaitement);
      dateSevragePrevue.setHours(0, 0, 0, 0);

      if (dateSevragePrevue.getTime() === tomorrow.getTime()) {
        const sevExiste = sevrages.some((s: Sevrage) => s.miseBasId === mb.id);
        if (!sevExiste) {
          notifs.push(this.createNotif(
            'WARNING',
            `Sevrage prévu demain pour la portée du ${this.formatDate(mb.dateMiseBas)}.`,
            'warning',
            `sevrage_demain_${mb.id}`
          ));
        }
      }
    }

    // Alertes Décès Mâle
    const reproducteurs: Reproducteur[] = this.calcService.reproducteurs;
    for (const dec of deces) {
      const repro = reproducteurs.find(r => r.id === dec.reproducteurId);
      if (repro && repro.sexe === 'M') {
        notifs.push(this.createNotif(
          'CRITIQUE',
          `Mâle décédé${repro.nom ? ' : ' + repro.nom : ''}. Vérifier le plan de reproduction.`,
          'error',
          `deces_male_${dec.id}`
        ));
      }
    }

    // Saillies récentes
    const sailliesRecentes = saillies.filter((s: Saillie) => {
      const dateSaillie = new Date(s.dateSaillie);
      dateSaillie.setHours(0, 0, 0, 0);
      const diffDays = (today.getTime() - dateSaillie.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 3;
    });

    if (sailliesRecentes.length > 0) {
      notifs.push(this.createNotif(
        'INFO',
        `${sailliesRecentes.length} saillie(s) confirmée(s) ces 3 derniers jours.`,
        'check_circle',
        'saillies_confirmees_info'
      ));
    }
  }

  private createNotif(type: NotifType, message: string, icon: string, id: string): AppNotification {
    return { id, type, message, icon, timestamp: new Date(), lue: false };
  }

  private formatDate(date: Date | string): string {
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return String(date);
    }
  }
}
