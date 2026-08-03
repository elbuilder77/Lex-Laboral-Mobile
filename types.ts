
export interface Attachment {
  type: 'file' | 'text';
  mimeType?: string;
  data: string; // base64 for files, string content for text
  name: string;
}

export enum AppView {
  HOME = 'HOME',
  DRAFTING = 'DRAFTING',
  CALCULATOR = 'CALCULATOR',
  SOCIAL_SECURITY = 'SOCIAL_SECURITY',
  PENSION_CALCULATOR = 'PENSION_CALCULATOR',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY',
  HISTORY = 'HISTORY'
}

export interface DraftingState {
  prompt: string;
  generatedDoc: string;
}

export type CalculationKind = 'labor' | 'social_security' | 'pension';

export interface CalculationRecord {
  kind: CalculationKind;
  title: string;
  createdAt: string;
  inputs: Record<string, string | number | boolean>;
  results: Record<string, unknown>;
}

export type NotificationType = 'error' | 'success' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AnalyzedDocumentHistory {
  date: string;
  name: string;
  summary: string;
}
