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

### B.1. Hapus file (aman — tidak dipakai kode lain)

- `app/Services/MidtransService.php` — client & config Snap Midtrans.
- `app/Http/Controllers/MidtransController.php` — buat transaksi + terima webhook.

```bash
rm "app/Services/MidtransService.php" "app/Http/Controllers/MidtransController.php"
```

### B.2. Hapus env (dari `.env`)

- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION` (bila ada)

Hapus barisnya, jangan dikosongkan saja.

### B.3. Bersihkan dependency

```bash
composer remove midtrans/midtrans-php
```

### B.4. Verifikasi (wajib lolos semua)

```bash
composer install --no-dev
php artisan config:clear
```

```bash
grep -ri "midtrans" app routes resources config
```

- Install harus sukses tanpa error.
- Grep harus menghasilkan **0 baris**. Bila masih ada sisa (mis. route di
  `routes/api.php`), hapus route + pemakaiannya, lalu verifikasi ulang.
- Hapus juga blok `midtrans` di `config/services.php` bila kamu menambahkannya.

### B.5. Yang JANGAN dihapus (Laravel)

- `config/services.php` itu sendiri (cukup hapus blok `midtrans`-nya).
- Route/form checkout umum, `composer.json`, `.env` (cukup hapus baris env-nya).
