import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyRequest } from '@/lib/firebase-admin';
import { getBaileysWorkerAdapter } from '@/lib/baileys-adapter';

export const runtime = 'nodejs';

function adminReady() { return Boolean(process.env.NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64); }
const createSchema = z.object({ phoneNumber: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Gunakan format internasional, misalnya +6281234567890.') });

export async function POST(request: Request) {
  if (!adminReady()) return NextResponse.json({ error: 'Konfigurasi server Firebase belum tersedia. Tambahkan NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64.' }, { status: 503 });
  const identity = await verifyRequest(request);
  if (!identity) return NextResponse.json({ error: 'Sesi login tidak valid. Silakan login kembali.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Nomor tidak valid.' }, { status: 400 });
  const worker = getBaileysWorkerAdapter();
  if (!worker) return NextResponse.json({ error: 'Pairing belum tersedia: belum ada adapter ke worker Baileys persisten. Tidak ada pairing code yang dibuat.' }, { status: 503 });
  try {
    const result = await worker.requestPairing({ uid: identity.uid, phoneNumber: parsed.data.phoneNumber });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Worker pairing gagal merespons. Tidak ada pairing code yang diterima.' }, { status: 502 });
  }
}
