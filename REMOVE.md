# Cara mencopot Midtrans

> Dibutuhkan bila kamu ganti ke payment lain (mis. via Scaffdev Builder).
> Estimasi: ±10 menit. Ikuti berurutan — jangan loncat.

## 0. Aturan emas (baca dulu!)

- Hapus **HANYA** file di bagian 1. File lain (config, layout, form checkout
  umum) **JANGAN PERNAH** dihapus.
- Kalau ragu satu file, BERHENTI dan tanya pembuat template. Menebak = merusak project.

---

## A. Template Next.js

### A.1. Hapus file (aman — tidak dipakai kode lain)

- `lib/payments/midtrans.ts` — client & verifikasi signature Midtrans.
- `app/api/payments/midtrans/route.ts` — buat transaksi Snap.
- `app/api/payments/midtrans/webhook/route.ts` — terima notifikasi status.

```bash
rm lib/payments/midtrans.ts "app/api/payments/midtrans/route.ts" "app/api/payments/midtrans/webhook/route.ts"
```

### A.2. Hapus env (dari `.env.local`)

- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION` (bila ada)

Hapus barisnya, jangan dikosongkan saja.

### A.3. Bersihkan dependency

Tidak ada dependency tambahan (modul ini memakai `fetch` bawaan Node).

### A.4. Verifikasi (wajib lolos semua)

```bash
npm run build
```

```bash
grep -ri "midtrans" app lib components
```

- Build harus sukses.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa (mis. `snap.pay`
  di komponen checkout), hapus pemakaiannya, lalu build ulang.

### A.5. Yang JANGAN dihapus

- Komponen/form checkout umum (hanya memanggil API di atas).
- `package.json`, `.env.local` (cukup hapus baris env-nya), layout, config.

---

## B. Template Laravel

Modul ini v1.0.0 mendukung Next.js saja. File `laravel/` berstatus STAGED
(belum disuntik CLI) sehingga tidak ada yang perlu dicopot.
Berlaku mulai v1.1.0 — panduan section B akan ditambahkan saat itu.
