export type SessionStatus = 'pending' | 'connecting' | 'connected' | 'disconnected' | 'error';
export type WhatsAppSession = { id: string; phoneNumber: string; status: SessionStatus; lastReportedAt?: Date; lastError?: string };
