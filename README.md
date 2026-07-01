# UFA Invoicing

Aplikasi invoicing berbasis web untuk freelancer dan UMKM Indonesia. Buat, kelola, dan kirim invoice profesional dengan berbagai template PDF, unggah logo bisnis, dan kirim langsung ke klien via email.

## Fitur

- **Autentikasi** — Login dengan akun Google (OAuth)
- **Manajemen Invoice** — Buat, edit, hapus, dan lacak status invoice (Draft, Terkirim, Lunas, Jatuh Tempo)
- **5 Template PDF** — Classic, Modern, Minimal, Bold, Elegant — bisa dipilih per invoice
- **Preview Langsung** — Preview berubah secara real-time saat mengisi form, termasuk preview template
- **Logo Bisnis** — Upload logo yang tampil di semua PDF invoice
- **Kirim via Email** — Kirim invoice langsung ke klien sebagai lampiran PDF
- **Manajemen Klien** — Data klien tersimpan dan bisa digunakan ulang
- **Dashboard** — Ringkasan statistik invoice dan pendapatan bulan ini
- **Multi Mata Uang** — IDR, USD, EUR, SGD

## Tech Stack

| Kategori  | Teknologi                              |
| --------- | -------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack)     |
| UI        | shadcn/ui (Base UI), Tailwind CSS 4    |
| Font      | Plus Jakarta Sans                      |
| Auth      | NextAuth.js v5 (Google OAuth)          |
| Database  | PostgreSQL + Prisma 7                  |
| PDF       | @react-pdf/renderer                    |
| Email     | Nodemailer                             |
| Form      | React Hook Form + Zod 4                |

---

## Prasyarat

Pastikan sudah terinstal di mesin Anda:

- **Node.js** v20 atau lebih baru
- **PostgreSQL** v14 atau lebih baru (berjalan secara lokal atau remote)
- Akun **Google Cloud Console** (untuk OAuth)
- Akun email dengan akses SMTP (misalnya Gmail dengan App Password)

---

## Konfigurasi Langkah demi Langkah

### 1. Clone dan Install Dependensi

```bash
git clone <repository-url>
cd invoicing
npm install
```

### 2. Buat Database PostgreSQL

Buka terminal PostgreSQL atau pgAdmin dan jalankan:

```sql
CREATE DATABASE invoicing;
```

Catat URL koneksinya, formatnya:

```
postgresql://USER:PASSWORD@HOST:PORT/invoicing
```

Contoh lokal:

```
postgresql://postgres:password@localhost:5432/invoicing
```

### 3. Buat File Environment

Buat dua file environment di root project:

**`.env`** — hanya untuk Prisma CLI:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/invoicing"
```

**`.env.local`** — untuk Next.js (salin dari contoh lalu isi):

```bash
cp .env.local.example .env.local
```

Isi semua variabel di `.env.local` sesuai langkah-langkah berikut.

### 4. Setup Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Masuk ke **APIs & Services → Credentials**
4. Klik **Create Credentials → OAuth 2.0 Client IDs**
5. Pilih Application type: **Web application**
6. Di bagian **Authorized redirect URIs**, tambahkan:

   ```
   http://localhost:3000/api/auth/callback/google
   ```

7. Klik **Create** — catat **Client ID** dan **Client Secret**
8. Isi di `.env.local`:

   ```env
   GOOGLE_CLIENT_ID="xxxxxxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxx"
   ```

### 5. Generate NextAuth Secret

Jalankan perintah ini di terminal untuk menghasilkan secret yang aman:

```bash
openssl rand -base64 32
```

Isi hasilnya di `.env.local`:

```env
NEXTAUTH_SECRET="hasil-dari-openssl-di-atas"
NEXTAUTH_URL="http://localhost:3000"
```

> Saat deploy ke produksi, ubah `NEXTAUTH_URL` ke domain Anda (misal `https://invoice.domainanda.com`).

### 6. Setup Email SMTP

#### Menggunakan Gmail

1. Login ke akun Google yang akan dipakai untuk mengirim email
2. Aktifkan **2-Step Verification** di [myaccount.google.com/security](https://myaccount.google.com/security)
3. Buka [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Pilih app: **Mail**, pilih device: **Other** → beri nama (misalnya "UFA Invoicing")
5. Google akan menghasilkan **16-karakter App Password** — catat

Isi di `.env.local`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="emailanda@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM="emailanda@gmail.com"
```

#### Menggunakan SMTP Lain (Mailtrap, Brevo, dll.)

Sesuaikan `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, dan `SMTP_PASS` dengan kredensial provider SMTP Anda.

### 7. Jalankan Migrasi Database

Perintah ini membuat semua tabel di database berdasarkan skema Prisma:

```bash
npx prisma migrate dev --name init
```

Jika berhasil, Anda akan melihat pesan:

```text
Your database is now in sync with your schema.
```

### 8. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser. Anda akan diarahkan ke halaman login Google.

---

## Contoh `.env.local` Lengkap

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/invoicing"

# NextAuth
NEXTAUTH_SECRET="ganti-dengan-output-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="XXXXXXX-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="XXXXXXXXX"

# SMTP Email (contoh Gmail)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="emailanda@gmail.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"
SMTP_FROM="emailanda@gmail.com"
```

---

## Perintah yang Sering Digunakan

```bash
npm run dev                          # Jalankan dev server (Turbopack)
npm run build                        # Build untuk produksi
npx tsc --noEmit                     # Cek TypeScript tanpa build

npx prisma migrate dev --name <nama> # Buat dan terapkan migrasi baru
npx prisma generate                  # Regenerate Prisma client (jalankan setelah ubah skema)
npx prisma studio                    # Buka browser GUI untuk database
```

---

## Struktur Direktori

```text
app/
├── (auth)/login/          # Halaman login (publik)
├── (dashboard)/           # Semua halaman terproteksi (butuh login)
│   ├── dashboard/         # Halaman utama & statistik
│   ├── invoices/          # List, buat, edit invoice
│   └── settings/          # Profil bisnis, logo, template
└── api/                   # API routes
    ├── invoices/[id]/pdf/ # Generate PDF
    ├── invoices/[id]/send/# Kirim invoice via email
    └── settings/logo/     # Upload logo

components/
├── invoice/
│   ├── templates/         # 5 template PDF (Classic, Modern, Minimal, Bold, Elegant)
│   ├── InvoiceForm.tsx    # Form buat/edit invoice dengan preview langsung
│   └── InvoicePreview.tsx # Preview HTML dengan 5 varian tampilan
└── ui/                    # Komponen shadcn/ui

prisma/
├── schema.prisma          # Definisi skema database
└── migrations/            # Riwayat migrasi SQL

public/
└── uploads/logos/         # Logo bisnis yang diupload pengguna
```

---

## Catatan Penting

- **Dua file env** dibutuhkan: `.env` hanya untuk Prisma CLI, `.env.local` untuk Next.js. Jangan gabungkan keduanya.
- **Logo upload** disimpan di `public/uploads/logos/` — pastikan direktori ini writable dan tidak di-`.gitignore` jika ingin logo tersimpan saat deploy.
- Setelah mengubah `prisma/schema.prisma`, selalu jalankan `npx prisma migrate dev` lalu `npx prisma generate`, kemudian **restart dev server**.
- Template PDF menggunakan font bawaan (`Helvetica`, `Helvetica-Bold`) — tidak memerlukan koneksi internet saat generate PDF.
