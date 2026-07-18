export type NotificationType = 'INFO' | 'WARNING' | 'CRITIQUE';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  lue: boolean;
  lienRelatif?: string;
}
