# scaff-modul-midtrans

Modul pembayaran **Midtrans Snap** untuk [Scaffdev](https://scaffdev.vercel.app) Builder.
Disuntik via `scaff ... --with=midtrans` (CLI 0.2.0+).

| Framework | Status | Isi |
|---|---|---|
| Next.js | ✅ v1.0.0 | Snap client + route buat transaksi + route webhook terverifikasi |
| Laravel | ✅ v1.0.0 | Service + Controller (SDK midtrans-php) |

## Struktur

```
scaff-modul-midtrans/
├── scaff.integration.json   ← manifest (satu-satunya yang dibaca CLI)
├── SETUP-FRAGMENT.md        ← digabung ke SETUP.md hasil racikan
├── REMOVE.md                ← panduan copot (skenario double payment)
├── nextjs/                  ← sumber untuk base Next.js
│   ├── lib/payments/midtrans.ts
│   └── app/api/payments/midtrans/{route.ts,webhook/route.ts}
└── laravel/                 ← sumber untuk base Laravel
    ├── app/Services/MidtransService.php
    └── app/Http/Controllers/MidtransController.php
```

## Env (harus terdaftar di admin Scaffdev → tabel `integrasi`)

| Key | Keterangan |
|---|---|
| `MIDTRANS_SERVER_KEY` | Server Key (rahasia, server saja) |
| `MIDTRANS_CLIENT_KEY` | Client Key (aman untuk browser/Snap.js) |

## Validasi lokal (sebelum push)

```bash
scaffdev validate-module .
```

Harus `ok` — manifest valid + semua `src` ada + `REMOVE.md` ada +
tidak ada import silang mencurigakan.

## Docs resmi yang dirujuk kode

- Snap integration guide: https://docs.midtrans.com/docs/snap-snap-integration-guide
- Webhook + signature: https://docs.midtrans.com/docs/https-notification-webhooks
