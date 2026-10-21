export type PairingRequest = {
  uid: string;
  phoneNumber: string;
};

export type PairingResult = {
  sessionId: string;
  pairingCode: string;
};

export interface BaileysWorkerAdapter {
  requestPairing(input: PairingRequest): Promise<PairingResult>;
  deleteSession(input: {
    uid: string;
    sessionId: string;
  }): Promise<void>;
}

function getConfig() {
  const url = process.env.NEXORA_BAILEYS_WORKER_URL?.replace(/\/+$/, "");
  const token = process.env.NEXORA_BAILEYS_WORKER_TOKEN;

  if (!url || !token || token.length < 32) return null;

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") return null;

    return { url, token };
  } catch {
    return null;
  }
}

export function getBaileysWorkerAdapter(): BaileysWorkerAdapter | null {
  const config = getConfig();

  if (!config) return null;

  // Salin konfigurasi setelah pemeriksaan null agar TypeScript
  // tetap mengetahui bahwa nilainya valid di dalam fungsi async.
  const workerConfig = config;

  async function call<T>(
    endpoint: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${workerConfig.url}${endpoint}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
      headers: {
        authorization: `Bearer ${workerConfig.token}`,
        "content-type": "application/json",
        ...init.headers,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = result as { error?: unknown };

      throw new Error(
        typeof error.error === "string"
          ? error.error
          : `Worker returned HTTP ${response.status}`,
      );
    }

    return result as T;
  }

  return {
    async requestPairing(input) {
      const result = await call<Partial<PairingResult>>("/pairing", {
        method: "POST",
        body: JSON.stringify(input),
      });

      if (
        typeof result.sessionId !== "string" ||
        typeof result.pairingCode !== "string"
      ) {
        throw new Error("Worker returned an invalid pairing response");
      }

      return {
        sessionId: result.sessionId,
        pairingCode: result.pairingCode,
      };
    },

    async deleteSession(input) {
      await call<{ ok: boolean }>("/session", {
        method: "DELETE",
        body: JSON.stringify(input),
      });
    },
  };
}
