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

type WorkerConfig = {
  url: string;
  token: string;
};

type WorkerErrorResponse = {
  error?: unknown;
  message?: unknown;
};

function getConfig(): WorkerConfig | null {
  const rawUrl = process.env.NEXORA_BAILEYS_WORKER_URL?.trim();
  const token = process.env.NEXORA_BAILEYS_WORKER_TOKEN?.trim();

  if (!rawUrl || !token || token.length < 32) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);

    // Worker wajib menggunakan HTTPS.
    if (parsed.protocol !== "https:") {
      return null;
    }

    // URL tidak boleh berisi kredensial.
    if (parsed.username || parsed.password) {
      return null;
    }

    const url = parsed.toString().replace(/\/+$/, "");

    return { url, token };
  } catch {
    return null;
  }
}

export function getBaileysWorkerAdapter(): BaileysWorkerAdapter | null {
  const config = getConfig();

  // Jangan lanjut jika konfigurasi worker belum valid.
  if (config === null) {
    return null;
  }

  // Salinan non-null untuk digunakan di dalam fungsi async.
  const workerConfig: WorkerConfig = config;

  async function call<T>(
    endpoint: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${workerConfig.url}${endpoint}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
      headers: {
        ...init.headers,
        authorization: `Bearer ${workerConfig.token}`,
        "content-type": "application/json",
      },
    });

    const result: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const errorResult = result as WorkerErrorResponse | null;

      const message =
        typeof errorResult?.error === "string"
          ? errorResult.error
          : typeof errorResult?.message === "string"
            ? errorResult.message
            : `Worker returned HTTP ${response.status}`;

      throw new Error(message);
    }

    if (result === null || typeof result !== "object") {
      throw new Error("Worker returned an invalid JSON response");
    }

    return result as T;
  }

  return {
    async requestPairing(input: PairingRequest): Promise<PairingResult> {
      const phoneNumber = input.phoneNumber.replace(/\D/g, "");

      if (!phoneNumber) {
        throw new Error("Nomor WhatsApp tidak valid");
      }

      const result = await call<Partial<PairingResult>>("/pairing", {
        method: "POST",
        body: JSON.stringify({
          uid: input.uid,
          phoneNumber,
        }),
      });

      if (
        typeof result.sessionId !== "string" ||
        !result.sessionId.trim() ||
        typeof result.pairingCode !== "string" ||
        !result.pairingCode.trim()
      ) {
        throw new Error("Worker returned an invalid pairing response");
      }

      return {
        sessionId: result.sessionId,
        pairingCode: result.pairingCode,
      };
    },

    async deleteSession(input: {
      uid: string;
      sessionId: string;
    }): Promise<void> {
      await call<{ ok: boolean }>("/session", {
        method: "DELETE",
        body: JSON.stringify(input),
      });
    },
  };
}
