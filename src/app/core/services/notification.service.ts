import { Injectable, inject, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CalculationService, KPIs } from './calculation.service';
import { ToastService } from './toast.service';

export type NotifType = 'CRITIQUE' | 'WARNING' | 'INFO';

export interface AppNotification {
  id: string;
  type: NotifType;
  message: string;
  icon: string;
  timestamp: Date;
  lue: boolean;
}

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

  
  /**
   * Initialise le service.
   * Logique : prepare les dependances et lance les traitements de demarrage.
   */
  constructor() {
    this.kpiSub = this.calcService.kpis$.subscribe((kpis) => {
      this.generateFromKPIs(kpis);
    });
  }

  
  /**
   * Nettoie les abonnements du service.
   * Logique : libere la souscription aux KPI.
   */
  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
  }

  
  /**
   * Affiche un toast de succes.
   * Logique : delegue l affichage au service de toast.
   */
  success(message: string): void {
    this.toastService.success(message);
  }

  
  /**
   * Affiche un toast d erreur.
   * Logique : delegue l affichage au service de toast.
   */
  error(message: string): void {
    this.toastService.error(message);
  }

  
  /**
   * Affiche un toast d avertissement.
   * Logique : delegue l affichage au service de toast.
   */
  warning(message: string): void {
    this.toastService.warning(message);
  }

  
  /**
   * Affiche un toast d information.
   * Logique : delegue l affichage au service de toast.
   */
  info(message: string): void {
    this.toastService.info(message);
  }

  
  
  /**
   * Ajoute une notification applicative.
   * Logique : remplace une notification existante de meme id puis remet la liste a jour.
   */
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

  
  
  /**
   * Marque une notification comme lue.
   * Logique : met a jour l element correspondant dans le flux local.
   */
  markAsRead(id: string): void {
    const updated = this._notifications$.getValue().map((n) =>
      n.id === id ? { ...n, lue: true } : n
    );
    this._notifications$.next(updated);
  }

  
  
  /**
   * Marque toutes les notifications comme lues.
   * Logique : applique l etat lu a toute la liste.
   */
  markAllAsRead(): void {
    const updated = this._notifications$.getValue().map((n) => ({ ...n, lue: true }));
    this._notifications$.next(updated);
  }

  
  
  /**
   * Supprime un element affiche.
   * Logique : retire la notification ou le toast correspondant a l id.
   */
  dismiss(id: string): void {
    const updated = this._notifications$.getValue().filter((n) => n.id !== id);
    this._notifications$.next(updated);
  }

  
  
  /**
   * Vide la liste ou les donnees courantes.
   * Logique : supprime les cles connues ou remet le flux local a zero.
   */
  clearAll(): void {
    this._notifications$.next([]);
  }

  
  
  /**
   * Retourne le nombre de notifications non lues.
   * Logique : filtre la liste courante sur les notifications non lues.
   */
  get unreadCount(): number {
    return this._notifications$.getValue().filter((n) => !n.lue).length;
  }

  
  
  /**
   * Genere les notifications a partir des KPI.
   * Logique : transforme les seuils metier en notifications automatiques.
   */
  private generateFromKPIs(kpis: KPIs): void {
    const notifs: AppNotification[] = [];

    if (kpis.occupationCages.pourcentage > 95) {
      notifs.push(this.createNotif(
        'CRITIQUE',
        `Cages saturées à ${kpis.occupationCages.pourcentage}% (${kpis.occupationCages.occupees}/${kpis.occupationCages.totales}). Action urgente requise !`,
        'error',
        'cages_critique'
      ));
    }
    else if (kpis.occupationCages.pourcentage >= 80) {
      notifs.push(this.createNotif(
        'WARNING',
        `Cages à ${kpis.occupationCages.pourcentage}% d'occupation (${kpis.occupationCages.occupees}/${kpis.occupationCages.totales}). Planifier des ventes.`,
        'warning',
        'cages_warning'
      ));
    }
    else {
      notifs.push(this.createNotif(
        'INFO',
        `Cages à ${kpis.occupationCages.pourcentage}% d'occupation. Stock normal.`,
        'check_circle',
        'cages_info'
      ));
    }

    if (kpis.tauxFecondite > 0 && kpis.tauxFecondite < 70) {
      notifs.push(this.createNotif(
        'WARNING',
        `Taux de fécondité faible : ${kpis.tauxFecondite}%. Vérifier la santé des reproducteurs.`,
        'warning',
        'fecondite_warning'
      ));
    }

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

    if (kpis.nombrePorteesEnCours > 0) {
      notifs.push(this.createNotif(
        'INFO',
        `${kpis.nombrePorteesEnCours} portée(s) en cours d'engraissement.`,
        'info',
        'portees_info'
      ));
    }

    notifs.push(this.createNotif(
      'INFO',
      `Bandes : A:${kpis.phasesBandes.A} | B:${kpis.phasesBandes.B} | C:${kpis.phasesBandes.C}`,
      'view_timeline',
      'phases_info'
    ));

    this.generateTimeBasedNotifs(notifs);

    const manualNotifs = this._notifications$.getValue().filter(
      (n) => !n.id.includes('_critique') && !n.id.includes('_warning') && !n.id.includes('_info')
    );
    this._notifications$.next([...notifs, ...manualNotifs]);
  }

  
  
  /**
   * Genere les notifications basees sur les dates.
   * Logique : inspecte les evenements proches pour creer les alertes temporelles.
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

    for (const saillie of saillies) {
      if (saillie.dateMiseBasPrevue) {
        const datePrevue = new Date(saillie.dateMiseBasPrevue);
        datePrevue.setHours(0, 0, 0, 0);
        if (datePrevue.getTime() === today.getTime()) {
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

    for (const mb of misesBas) {
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

  
  
  /**
   * Construit une notification.
   * Logique : normalise les champs necessaires a l affichage.
   */
  private createNotif(type: NotifType, message: string, icon: string, id: string): AppNotification {
    return { id, type, message, icon, timestamp: new Date(), lue: false };
  }

  
  
  /**
   * Formate une date pour l affichage.
   * Logique : utilise le format francais et prevoit un fallback texte.
   */
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
