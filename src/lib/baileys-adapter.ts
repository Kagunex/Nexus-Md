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

  if (!url || !token) return null;

  // Never send the worker secret over plain HTTP.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (token.length < 32) return null;

  return { url, token };
}

export function getBaileysWorkerAdapter(): BaileysWorkerAdapter | null {
  const config = getConfig();
  if (!config) return null;

  async function call<T>(
    endpoint: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${config.url}${endpoint}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
      headers: {
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
        ...init.headers,
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof result.error === "string"
          ? result.error
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
