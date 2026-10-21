import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function adminApp(): App {
  const existing = getApps().find((item) => item.name === 'nexora-admin');
  if (existing) return existing;
  const encoded = process.env.NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) throw new Error('Konfigurasi server Firebase belum tersedia. Tambahkan NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64.');
  try {
    const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    return initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id }, 'nexora-admin');
  } catch {
    throw new Error('Konfigurasi server Firebase tidak valid. Periksa format service account Base64.');
  }
}

export function getAdminServices() {
  const app = adminApp();
  return { adminAuth: getAuth(app), adminDb: getFirestore(app) };
}

export async function verifyRequest(request: Request) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) return null;
  try {
    const { adminAuth } = getAdminServices();
    return await adminAuth.verifyIdToken(match[1]);
  } catch {
    return null;
  }
}
