import 'server-only';

import {
  cert,
  getApps,
  initializeApp,
  type App,
} from 'firebase-admin/app';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function adminApp(): App {
  const existing = getApps().find(
    (item) => item.name === 'nexora-admin',
  );

  if (existing) return existing;

  const raw = process.env.NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!raw?.trim()) {
    throw new Error(
      'Konfigurasi server Firebase belum tersedia. Tambahkan NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64.',
    );
  }

  try {
    const value = raw.trim();
    let serviceAccount: Record<string, unknown>;

    // Terima JSON langsung atau JSON yang di-encode Base64.
    if (value.startsWith('{')) {
      serviceAccount = JSON.parse(value);
    } else {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }

    if (
      typeof serviceAccount.project_id !== 'string' ||
      typeof serviceAccount.client_email !== 'string' ||
      typeof serviceAccount.private_key !== 'string'
    ) {
      throw new Error('Invalid service account structure');
    }

    const projectId = serviceAccount.project_id;

    return initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        }),
        projectId,
      },
      'nexora-admin',
    );
  } catch (error) {
    // Jangan log isi kredensial atau private key.
    console.error(
      '[NEXORA FIREBASE] Admin initialization failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    throw new Error(
      'Konfigurasi Firebase Admin tidak valid. Periksa JSON service account atau Base64-nya.',
    );
  }
}

export function getAdminServices() {
  const app = adminApp();

  return {
    adminAuth: getAuth(app),
    adminDb: getFirestore(app),
  };
}

export async function verifyRequest(request: Request) {
  const authorization = request.headers.get('authorization');

  if (!authorization) {
    console.warn('[NEXORA AUTH] Authorization header missing');
    return null;
  }

  const match = authorization.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    console.warn('[NEXORA AUTH] Invalid Authorization header format');
    return null;
  }

  try {
    const { adminAuth } = getAdminServices();
    const identity = await adminAuth.verifyIdToken(match[1]);

    console.info('[NEXORA AUTH] Firebase ID token verified');

    return identity;
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error
        ? String(error.code)
        : 'unknown';

    console.error(
      '[NEXORA AUTH] Firebase ID token verification failed:',
      code,
    );

    return null;
  }
}
