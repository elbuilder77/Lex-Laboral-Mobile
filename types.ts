
export enum AppView {
  HOME = 'HOME',
  CALCULATOR = 'CALCULATOR',
  SOCIAL_SECURITY = 'SOCIAL_SECURITY',
  PENSION_CALCULATOR = 'PENSION_CALCULATOR',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY'
}

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
}
