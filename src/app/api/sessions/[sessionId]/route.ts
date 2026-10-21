import { NextResponse } from 'next/server';
import { getAdminServices, verifyRequest } from '@/lib/firebase-admin';
import { getBaileysWorkerAdapter } from '@/lib/baileys-adapter';

export const runtime = 'nodejs';

function adminReady() { return Boolean(process.env.NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64); }
export async function DELETE(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  if (!adminReady()) return NextResponse.json({ error: 'Konfigurasi server Firebase belum tersedia. Tambahkan NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64.' }, { status: 503 });
  const identity = await verifyRequest(request);
  if (!identity) return NextResponse.json({ error: 'Sesi login tidak valid. Silakan login kembali.' }, { status: 401 });
  const worker = getBaileysWorkerAdapter();
  if (!worker) return NextResponse.json({ error: 'Penghapusan belum tersedia: belum ada adapter ke worker Baileys persisten. Tidak ada data sesi yang dihapus.' }, { status: 503 });
  const { sessionId } = await context.params;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(sessionId)) return NextResponse.json({ error: 'ID sesi tidak valid.' }, { status: 400 });
  try {
    const { adminDb } = getAdminServices();
    const sessionRef = adminDb.doc(`users/${identity.uid}/sessions/${sessionId}`);
    const session = await sessionRef.get();
    if (!session.exists) return NextResponse.json({ error: 'Sesi tidak ditemukan.' }, { status: 404 });
    // Admin bypasses Firestore rules, so ownership is enforced by the UID path after token verification.
    await worker.deleteSession({ uid: identity.uid, sessionId });
    await adminDb.recursiveDelete(adminDb.doc(`_baileysAuth/${sessionId}`));
    await sessionRef.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error && error.message.includes('Konfigurasi') ? error.message : 'Sesi belum dapat dihapus. Coba lagi nanti.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
