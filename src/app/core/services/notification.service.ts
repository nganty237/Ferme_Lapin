import { Injectable, inject, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CalculationService, KPIs } from './calculation.service';
import { ToastService } from './toast.service';

/**
 * Types de notification : CRITIQUE (rouge), WARNING (orange), INFO (vert).
 */
export type NotifType = 'CRITIQUE' | 'WARNING' | 'INFO';

/**
 * Structure d'une notification applicative.
 */
export interface AppNotification {
  id: string;
  type: NotifType;
  message: string;
  icon: string;
  timestamp: Date;
  lue: boolean;
}

/**
 * NotificationService — Génération automatique de notifications + toasts.
 *
 * Responsabilités :
 * - Toasts visuels (success/error) via MatSnackBar (existant)
 * - Génération automatique de notifications basées sur les KPIs
 * - Observable notifications$ pour affichage dans le UI
 * - Pas de duplicates (ID unique par type de notification)
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private snackBar = inject(MatSnackBar);
  private calcService = inject(CalculationService);
  private toastService = inject(ToastService);

  private readonly _notifications$ = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this._notifications$.asObservable();

  private kpiSub: Subscription;

  constructor() {
    // S'abonner aux KPIs pour générer automatiquement les notifications
    this.kpiSub = this.calcService.kpis$.subscribe((kpis) => {
      this.generateFromKPIs(kpis);
    });
  }

  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
  }

  // ══════════════════════════════════════════════
  //  TOASTS (compatibilité existante)
  // ══════════════════════════════════════════════

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

  // ══════════════════════════════════════════════
  //  GESTION NOTIFICATIONS
  // ══════════════════════════════════════════════

  /** Ajoute une notification (remplace si même ID existe) */
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

    // Supprime l'ancienne notification du même ID (pas de duplicates)
    const current = this._notifications$.getValue().filter((n) => n.id !== notifId);
    this._notifications$.next([notif, ...current]);
  }

  /** Marque une notification comme lue */
  markAsRead(id: string): void {
    const updated = this._notifications$.getValue().map((n) =>
      n.id === id ? { ...n, lue: true } : n
    );
    this._notifications$.next(updated);
  }

  /** Marque toutes les notifications comme lues */
  markAllAsRead(): void {
    const updated = this._notifications$.getValue().map((n) => ({ ...n, lue: true }));
    this._notifications$.next(updated);
  }

  /** Supprime une notification */
  dismiss(id: string): void {
    const updated = this._notifications$.getValue().filter((n) => n.id !== id);
    this._notifications$.next(updated);
  }

  /** Vide toutes les notifications */
  clearAll(): void {
    this._notifications$.next([]);
  }

  /** Nombre de notifications non lues */
  get unreadCount(): number {
    return this._notifications$.getValue().filter((n) => !n.lue).length;
  }

  // ══════════════════════════════════════════════
  //  GÉNÉRATION AUTOMATIQUE DEPUIS KPIs
  // ══════════════════════════════════════════════

  /**
   * Génère les notifications basées sur les KPIs calculés.
   * Appelé automatiquement à chaque changement de données.
   * Remplace les notifications du même type (pas de duplicates).
   */
  private generateFromKPIs(kpis: KPIs): void {
    const notifs: AppNotification[] = [];

    // ── CAGES : CRITIQUE si > 95% ──
    if (kpis.occupationCages.pourcentage > 95) {
      notifs.push(this.createNotif(
        'CRITIQUE',
        `Cages saturées à ${kpis.occupationCages.pourcentage}% (${kpis.occupationCages.occupees}/${kpis.occupationCages.totales}). Action urgente requise !`,
        'error',
        'cages_critique'
      ));
    }
    // ── CAGES : WARNING si 80-95% ──
    else if (kpis.occupationCages.pourcentage >= 80) {
      notifs.push(this.createNotif(
        'WARNING',
        `Cages à ${kpis.occupationCages.pourcentage}% d'occupation (${kpis.occupationCages.occupees}/${kpis.occupationCages.totales}). Planifier des ventes.`,
        'warning',
        'cages_warning'
      ));
    }
    // ── CAGES : INFO si <= 80% ──
    else {
      notifs.push(this.createNotif(
        'INFO',
        `Cages à ${kpis.occupationCages.pourcentage}% d'occupation. Stock normal.`,
        'check_circle',
        'cages_info'
      ));
    }

    // ── FÉCONDITÉ : WARNING si basse ──
    if (kpis.tauxFecondite > 0 && kpis.tauxFecondite < 70) {
      notifs.push(this.createNotif(
        'WARNING',
        `Taux de fécondité faible : ${kpis.tauxFecondite}%. Vérifier la santé des reproducteurs.`,
        'warning',
        'fecondite_warning'
      ));
    }

    // ── SURVIE ALLAITEMENT : CRITIQUE si < 70% ──
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

    // ── PORTÉES EN COURS : INFO ──
    if (kpis.nombrePorteesEnCours > 0) {
      notifs.push(this.createNotif(
        'INFO',
        `${kpis.nombrePorteesEnCours} portée(s) en cours d'engraissement.`,
        'info',
        'portees_info'
      ));
    }

    // ── PHASES BANDES : INFO ──
    notifs.push(this.createNotif(
      'INFO',
      `Bandes : A:${kpis.phasesBandes.A} | B:${kpis.phasesBandes.B} | C:${kpis.phasesBandes.C}`,
      'view_timeline',
      'phases_info'
    ));

    // Générer les notifications liées aux événements temporels
    this.generateTimeBasedNotifs(notifs);

    // Remplacer toutes les notifications auto-générées (conserver les manuelles)
    const manualNotifs = this._notifications$.getValue().filter(
      (n) => !n.id.includes('_critique') && !n.id.includes('_warning') && !n.id.includes('_info')
    );
    this._notifications$.next([...notifs, ...manualNotifs]);
  }

  /**
   * Génère les notifications basées sur les dates (mise-bas prévue, sevrage demain, etc.)
   */
  private generateTimeBasedNotifs(notifs: AppNotification[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const saillies = this.calcService.saillies;
    const misesBas = this.calcService.misesBas;
    const sevrages = this.calcService.sevrages;
    const deces = this.calcService.deces;

    // ── CRITIQUE : Mise-bas prévue aujourd'hui ──
    for (const saillie of saillies) {
      if (saillie.dateMiseBasPrevue) {
        const datePrevue = new Date(saillie.dateMiseBasPrevue);
        datePrevue.setHours(0, 0, 0, 0);
        if (datePrevue.getTime() === today.getTime()) {
          // Vérifier qu'aucune mise-bas n'a été enregistrée pour cette saillie
          const mbExiste = misesBas.some((mb: any) => mb.saillieId === saillie.id);
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

    // ── WARNING : Sevrage demain ──
    for (const mb of misesBas) {
      // Sevrage attendu ~31 jours après mise-bas
      const config = this.calcService.config;
      const dateSevragePrevue = new Date(mb.dateMiseBas);
      dateSevragePrevue.setDate(dateSevragePrevue.getDate() + (config.dureeAllaitementJours || 31));
      dateSevragePrevue.setHours(0, 0, 0, 0);

      if (dateSevragePrevue.getTime() === tomorrow.getTime()) {
        const sevExiste = sevrages.some((s: any) => s.miseBasId === mb.id);
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

    // ── CRITIQUE : Mâle décédé ──
    const reproducteurs = this.calcService.reproducteurs;
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

    // ── INFO : Saillies confirmées ──
    const sailliesRecentes = saillies.filter((s: any) => {
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

  // ══════════════════════════════════════════════
  //  UTILITAIRES
  // ══════════════════════════════════════════════

  /** Crée un objet notification */
  private createNotif(type: NotifType, message: string, icon: string, id: string): AppNotification {
    return { id, type, message, icon, timestamp: new Date(), lue: false };
  }

  /** Formate une date en string lisible */
  private formatDate(date: any): string {
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
