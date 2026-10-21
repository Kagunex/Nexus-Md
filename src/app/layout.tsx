import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXORA MD — WhatsApp Bot Console',
  description: 'Kelola konfigurasi dan sesi bot WhatsApp NEXORA MD.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
