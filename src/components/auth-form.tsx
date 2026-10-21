'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ArrowLeft, ArrowUpRight, LockKeyhole } from 'lucide-react';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const router = useRouter();
  const isRegister = mode === 'register';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = new FormData(event.currentTarget); const email = String(data.get('email') || '').trim(); const password = String(data.get('password') || '');
    try {
      const auth = getFirebaseAuth(); const db = getFirebaseDb();
      if (isRegister) {
        const name = String(data.get('name') || '').trim();
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        await setDoc(doc(db, 'users', credential.user.uid), { displayName: name, email, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), preferences: { compactMode: false } });
      } else await signInWithEmailAndPassword(auth, email, password);
      router.replace('/dashboard');
    } catch (caught) {
      const code = (caught as { code?: string }).code;
      const messages: Record<string, string> = { 'auth/email-already-in-use': 'Email sudah digunakan.', 'auth/invalid-email': 'Format email tidak valid.', 'auth/weak-password': 'Password minimal 6 karakter.', 'auth/invalid-credential': 'Email atau password salah.', 'auth/network-request-failed': 'Jaringan bermasalah. Coba kembali.' };
      setError(messages[code || ''] || (caught instanceof Error ? caught.message : 'Permintaan gagal. Periksa konfigurasi Firebase.'));
    } finally { setBusy(false); }
  }
  return <main className="auth-screen"><Link href="/" className="auth-back"><ArrowLeft size={16}/> Beranda</Link><section className="auth-panel"><Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA <b>MD</b></span></Link><div className="auth-kicker"><LockKeyhole size={14}/> SECURE ACCESS</div><h1>{isRegister ? 'Mulai dari sini.' : 'Masuk ke kontrol.'}</h1><p>{isRegister ? 'Buat workspace NEXORA MD dengan Firebase Authentication.' : 'Gunakan akun Firebase NEXORA MD milikmu.'}</p><form onSubmit={submit}>
    {isRegister && <label>Nama tampilan<input name="name" autoComplete="name" required minLength={2} placeholder="Nama kamu"/></label>}
    <label>Email<input name="email" type="email" autoComplete="email" required placeholder="nama@email.com"/></label>
    <label>Password<input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={6} placeholder="Minimal 6 karakter"/></label>
    {error && <div className="form-error" role="alert">{error}</div>}
    <button className="button button-lime auth-submit" disabled={busy}>{busy ? 'Memproses…' : isRegister ? 'Buat akun' : 'Masuk'} {!busy && <ArrowUpRight size={18}/>}</button>
  </form><div className="auth-switch">{isRegister ? 'Sudah punya akun?' : 'Belum terdaftar?'} <Link href={isRegister ? '/login' : '/register'}>{isRegister ? 'Masuk' : 'Buat akun'}</Link></div><div className="auth-legal">Password ditangani oleh Firebase Authentication. NEXORA MD tidak menyimpan password di Firestore.</div></section><div className="auth-stamp">NXR / ACCOUNT GATE</div></main>;
}
