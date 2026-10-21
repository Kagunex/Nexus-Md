# NEXORA MD

NEXORA MD menambahkan web control plane Next.js pada source bot WhatsApp Baileys yang sudah ada. Source bot lama (handler 8.033 baris, plugin, database JSON, dan dataset game) tetap dipertahankan; web app tidak mengeksekusi bot tersebut di Vercel.

## Hasil audit dan batas integrasi

- Bot berjalan sebagai proses Node.js persisten dari `index.js`; memakai `useMultiFileAuthState("session")`, filesystem lokal, prompt `readline`, socket Baileys yang menetap, dan reconnect loop.
- `LightSecret.js` berisi sekitar 996 label `case` untuk fitur/alias. Terlihat fitur AI, unduh media, konversi/sticker, administrasi grup, panel Pterodactyl/Linode, game, primbon, berita, serta fitur lain. `Plugins/` berisi plugin dinamis dan `Game/` memuat dataset. Source itu tetap ada.
- Pairing web belum aktif. Tidak tersedia worker persisten atau protokol remote worker dalam source. Endpoint menolak permintaan dengan HTTP 503 jika worker belum dikonfigurasi; tidak menghasilkan pairing code palsu. Endpoint pairing memanggil interface `BaileysWorkerAdapter`; implementasi adapter sengaja belum tersedia dan route mengembalikan HTTP 503. URL/token saja tidak mengaktifkan integrasi.
- Vercel cocok untuk Next.js, Firebase Auth, dan endpoint web singkat. Jalankan Baileys sebagai worker terpisah pada server/container persisten dengan storage secret yang sesuai; jangan mount sesi lokal ke Function Vercel.
- `firebase-admin` hanya di server. Admin endpoint memverifikasi Firebase ID token, mengikat akses ke UID token, dan baru menghapus metadata serta subtree credential setelah adapter worker mengonfirmasi pemutusan sesi. Karena adapter belum ada, pairing dan penghapusan sesi saat ini menolak request dengan HTTP 503.
- Tidak ada koneksi Firebase aktif sampai environment project NEXORA MD diisi. Tidak ada konfigurasi Firebase palsu di source.

## Setup Firebase khusus NEXORA MD

1. Buat Firebase project baru khusus NEXORA MD di Firebase Console. Jangan memakai project aplikasi lain.
2. Pada **Authentication → Sign-in method**, aktifkan **Email/Password**.
3. Buat **Cloud Firestore** pada project tersebut.
4. Tambahkan Firebase Web App dan salin config ke variabel `NEXT_PUBLIC_FIREBASE_*` dari `.env.example`.
5. Buat service account untuk server dari **Project settings → Service accounts**. Encode JSON service account sebagai Base64 untuk `NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64` (contoh Linux: `base64 -w0 service-account.json`; macOS: `base64 < service-account.json | tr -d '\n'`). Masukkan hasilnya langsung ke secret server Vercel atau `.env.local` lokal; jangan commit file JSON/base64 atau memasang prefix `NEXT_PUBLIC_`.
6. Deploy rules: `firebase deploy --only firestore:rules --project <ID_PROJECT_NEXORA>` setelah menyiapkan Firebase CLI dan memilih project yang benar. Rules default-deny, owner hanya membaca profil/sesi sendiri; hanya endpoint/worker terotorisasi yang dapat menulis lifecycle/status.

## Lokal

```sh
cp .env.example .env.local
# Isi variabel Firebase project NEXORA MD
npm install
npm run dev
```

Authentication memerlukan konfigurasi Firebase yang valid dan provider Email/Password aktif. `npm run typecheck`, `npm run lint`, dan `npm run build` tersedia untuk pemeriksaan.

## Vercel

1. Push repository ke GitHub.
2. Import repository pada Vercel dan gunakan preset Next.js.
3. Masukkan seluruh `NEXT_PUBLIC_FIREBASE_*` dari `.env.example` sebagai environment variables. Masukkan `NEXORA_FIREBASE_SERVICE_ACCOUNT_BASE64` sebagai secret server-only untuk endpoint terotorisasi. Variabel worker Baileys opsional belum mengaktifkan pairing karena adapter belum tersedia.
4. Deploy rules Firestore ke project NEXORA MD yang sama. Vercel deploy tidak otomatis memasang Firestore rules.
5. Deploy dari branch yang dipilih. Pastikan preview/production menggunakan config project Firebase yang tepat.

## Menjalankan source bot lama

Source bot tetap dapat dijalankan terpisah pada host Node.js persisten dengan `npm run bot:start` setelah seluruh dependency legacy dan konfigurasi `config.js` tersedia. File konfigurasi lama memuat nilai placeholder dan pengaturan bot; tinjau sebelum menjalankan. Web app tidak mengimpor entry point bot.

## Batasan Baileys

Pairing code asli pada source diminta secara interaktif saat proses lokal mulai dan Baileys menyimpan credential di direktori lokal `session`. Model filesystem dan socket jangka panjang tersebut tidak sesuai dengan lifecycle Function Vercel yang stateless. Sampai worker persisten, penyimpanan auth terenkripsi dan adapter worker diuji tersedia, web tidak dapat membuat atau menunjukkan pairing code, mengubah setting bot, atau memastikan status koneksi. Firestore session document sendiri tidak dianggap sebagai bukti koneksi. Jangan isi `NEXORA_BAILEYS_WORKER_URL`/token untuk membuatnya tampak aktif; kontrak adapter belum diimplementasikan.

## Atribusi source bot

Source legacy repository ini mencantumkan base ANTISOCIAL-MD oleh Kyami Silence, pengembang rizaldev, dan Baileys oleh Daf04. README asli menyatakan script gratis dan dilarang diperjualbelikan; pertahankan ketentuan tersebut ketika mendistribusikan source legacy.
