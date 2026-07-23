// ─── DONNÉES STATIQUES (Référentiel) ─────────────────────────────────────────
export * from './referentiel.model';   // ReferentielBande, ReferentielMale, ReferentielFemelle,
                                       // CalendrierSaillieItem, BandeId, MomentSaillie,
                                       // REFERENTIEL_BANDES, CALENDRIER_SAILLIE_THEORIQUE

export * from './config.model';        // Configuration (paramètres du cycle, infrastructure)

// ─── DONNÉES MIXTES (Statique + Dynamique) ───────────────────────────────────
export * from './reproducteur.model';  // Femelle, Male, Reproducteur, EtatFemelle, EtatMale,
                                       // EtatBande, Bande, EtatCycleBande, isFemelle, isMale

export * from './clapier.model';       // Clapier, TypeClapier

// ─── DONNÉES DYNAMIQUES (Transactionnelles) ───────────────────────────────────
export * from './events.model';        // CycleBande, Saillie, Palpation, MiseBas, Sevrage,
                                       // Sexage, Engraissement, Vente, Deces

// ─── KPIs & NOTIFICATIONS ────────────────────────────────────────────────────
export * from './kpi.model';           // KPI, BandeKPI
export * from './notification.model';  // Notification, NotificationType

// ─── COMPATIBILITÉ DESCENDANTE (deprecated — à migrer) ───────────────────────
export * from './saillie-session.model'; // SessionSaillie → alias de Saillie
export * from './deces.model';           // Deces → redirecteur vers events.model
