## Setup Midtrans (digabung otomatis ke SETUP.md)

> 3 langkah, ±10 menit. Mode Sandbox gratis untuk testing.
> Docs resmi: https://docs.midtrans.com/docs/snap-snap-integration-guide

### 1. Ambil key

1. Daftar/login di https://dashboard.midtrans.com
2. Buka **Settings → Access Keys**, salin **Server Key** dan **Client Key**.
3. Untuk testing, tetap di environment **Sandbox** (default modul ini).

### 2. Isi env

```bash
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx   # rahasia! hanya di server
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx   # boleh dipakai di browser
# MIDTRANS_IS_PRODUCTION=true            # buka komentar ini hanya saat Go Live
```

NOTED: `MIDTRANS_CLIENT_KEY` aman untuk browser (dipakai Snap.js).
`MIDTRANS_SERVER_KEY` JANGAN PERNAH diawali `NEXT_PUBLIC_` — itu membocorkannya ke browser.

### 3. Coba bayar (sandbox)

1. `POST /api/payments/midtrans` dengan body:
   ```json
   { "orderId": "order-1", "amount": 15000 }
   ```
2. Ambil `token` dari respons, bayar via Snap.js:
   ```html
   <script src="https://app.sandbox.midtrans.com/snap/snap.js"
           data-client-key="SB-Mid-client-xxxx"></script>
   <script>window.snap.pay("<token-dari-api>");</script>
   ```
   NOTED: URL Snap.js sandbox vs production berbeda. Ganti ke
   `https://app.midtrans.com/snap/snap.js` + Client Key production saat Go Live.
3. Kartu tes sandbox: `4811 1111 1111 1114`, CVV `123`, exp jauh ke depan.

### 4. Webhook (status lunas otomatis)

1. Saat dev, expose localhost via tunnel (mis. ngrok) — Midtrans tidak bisa
   memanggil `localhost`. Ref: https://docs.midtrans.com/docs/https-notification-webhooks
2. Daftarkan `https://domainmu/api/payments/midtrans/webhook` di
   Dashboard → **Settings → Configuration → Payment Notification URL**.
3. Test: lakukan pembayaran sandbox → cek respons `{"ok":true,"paid":true}` di log server.
