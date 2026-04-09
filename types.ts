
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
  CEO_DASHBOARD = 'CEO_DASHBOARD',
  TERMS = 'TERMS',
  PRIVACY = 'PRIVACY'
}

export interface DraftingState {
  prompt: string;
  generatedDoc: string;
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
