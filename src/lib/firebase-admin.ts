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

  if (existing) {
    return existing;
  }

  const encoded =
    process.env.NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!encoded) {
    throw new Error(
      'Konfigurasi server Firebase belum tersedia. Tambahkan NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64.',
    );
  }

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(decoded);

    if (
      !serviceAccount ||
      typeof serviceAccount !== 'object' ||
      typeof serviceAccount.project_id !== 'string' ||
      typeof serviceAccount.client_email !== 'string' ||
      typeof serviceAccount.private_key !== 'string'
    ) {
      throw new Error('Invalid service account structure');
    }

    return initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      },
      'nexora-admin',
    );
  } catch (error) {
    console.error(
      '[NEXORA FIREBASE] Admin initialization failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    throw new Error(
      'Konfigurasi server Firebase tidak valid. Periksa Base64 service account dan kredensial Firebase Admin.',
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

    const decodedToken = await adminAuth.verifyIdToken(match[1]);

    console.info('[NEXORA AUTH] Firebase ID token verified');

    return decodedToken;
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
