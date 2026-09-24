/**
 * Client Midtrans Snap — disuntik Scaffdev Builder ke template Next.js.
 *
 * NOTED:
 * - File ini 100% milik modul "midtrans". CLI menghapusnya saat user copot
 *   modul (lihat REMOVE.md). Jangan import file ini dari kode inti template.
 * - Semua rahasia HANYA dibaca dari env server (MIDTRANS_SERVER_KEY).
 *   JANGAN PERNAH kirim Server Key ke browser.
 * - Client Key (MIDTRANS_CLIENT_KEY) dipakai di browser untuk Snap.js —
 *   lihat contoh di SETUP-FRAGMENT.md.
 *
 * Referensi resmi:
 * - Snap API (buat transaksi): https://docs.midtrans.com/docs/snap-snap-integration-guide
 * - Webhook + signature_key  : https://docs.midtrans.com/docs/https-notification-webhooks
 */
import { createHash } from "node:crypto";

// NOTED: Sandbox vs Production dipilih via env. Default = Sandbox agar aman
// untuk testing. Set MIDTRANS_IS_PRODUCTION=true hanya saat Go Live.
const SNAP_BASE =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";

function authHeader(): string {
  // NOTED: Basic Auth Midtrans = base64("<ServerKey>:") — titik dua wajib ada,
  // password dikosongkan. Ref: docs "Server Key" → HTTP header Authorization.
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MISSING_ENV: isi MIDTRANS_SERVER_KEY di .env.local");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export interface SnapParams {
  /** order_id unik dari tokomu. NOTED: tidak boleh dipakai ulang untuk transaksi baru. */
  orderId: string;
  /** gross_amount dalam Rupiah, bilangan bulat (tanpa desimal). */
  amount: number;
  customerName?: string;
  customerEmail?: string;
}

export interface SnapResult {
  token: string;
  redirectUrl: string;
}

/**
 * Membuat transaksi Snap. Mengembalikan token + redirect_url.
 * Frontend tinggal: window.snap.pay(token)  ATAU  redirect ke redirectUrl.
 */
export async function createSnapTransaction(params: SnapParams): Promise<SnapResult> {
  // NOTED: validasi di sini agar gagal cepat dengan pesan jelas,
  // sebelum request sampai ke Midtrans.
  if (!params.orderId?.trim()) throw new Error("orderId wajib diisi");
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw new Error("amount harus bilangan bulat Rupiah > 0");
  }

  const res = await fetch(`${SNAP_BASE}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      transaction_details: { order_id: params.orderId, gross_amount: params.amount },
      // NOTED: customer_details opsional — dikirim hanya bila ada datanya,
      // agar payload tetap minimal.
      ...(params.customerName || params.customerEmail
        ? { customer_details: { first_name: params.customerName, email: params.customerEmail } }
        : {}),
    }),
  });

  if (!res.ok) {
    // NOTED: Midtrans mengembalikan JSON error { error_messages: [...] }.
    // Dilempar apa adanya agar gampang di-debug dari log server.
    throw new Error(`Midtrans error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { token: string; redirect_url: string };
  return { token: data.token, redirectUrl: data.redirect_url };
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  payment_type?: string;
}

/**
 * Verifikasi keaslian webhook (WAJIB sebelum percaya status bayar).
 * Rumus resmi: SHA512(order_id + status_code + gross_amount + ServerKey)
 * dibandingkan dengan field signature_key dari Midtrans.
 */
export function verifyWebhookSignature(notif: MidtransNotification): boolean {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MISSING_ENV: isi MIDTRANS_SERVER_KEY di .env.local");
  // NOTED: gross_amount dari webhook berbentuk string desimal ("10000.00") —
  // pakai persis apa adanya, JANGAN di-parse/format ulang (merusak hash).
  const raw = `${notif.order_id}${notif.status_code}${notif.gross_amount}${key}`;
  const calc = createHash("sha512").update(raw).digest("hex");
  return calc === notif.signature_key;
}

/** Status yang berarti uang SUDAH masuk (aman update order jadi lunas). */
export function isPaidStatus(status: string): boolean {
  // NOTED: "capture" = kartu kredit (cek fraud_status == "accept" bila
  // diaktifkan), "settlement" = semua metode lain yang sudah lunas.
  return status === "settlement" || status === "capture";
}
