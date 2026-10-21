/**
 * Boundary between stateless web routes and a separately deployed, persistent Baileys worker.
 * The repository contains no worker HTTP contract or remotely backed auth-state implementation,
 * so this adapter intentionally stays unavailable until that contract can be implemented/tested.
 */
export type PairingRequest = { uid: string; phoneNumber: string };
export type PairingResult = { sessionId: string; pairingCode: string };

export interface BaileysWorkerAdapter {
  requestPairing(input: PairingRequest): Promise<PairingResult>;
  deleteSession(input: { uid: string; sessionId: string }): Promise<void>;
}

export function getBaileysWorkerAdapter(): BaileysWorkerAdapter | null {
  // URL/token alone do not establish a compatible protocol or prove a worker is healthy.
  return null;
}
