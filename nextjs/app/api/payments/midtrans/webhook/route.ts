import { NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  isPaidStatus,
  type MidtransNotification,
} from "../../../../../../lib/payments/midtrans";

/**
 * POST /api/payments/midtrans/webhook — terima notifikasi status dari Midtrans.
 *
 * NOTED (penting, dari docs resmi):
 * 1. Daftarkan URL publik route ini di Dashboard → Settings → Configuration →
 *    Payment Notification URL. Midtrans TIDAK bisa memanggil localhost —
 *    saat dev pakai tunnel (ngrok/dsb), saat produksi pakai domain asli.
 * 2. SELALU verifikasi signature_key dulu (403 bila palsu). Tanpa ini siapa
 *    pun bisa memalsukan status "lunas".
 * 3. Balas 200 SECEPATNYA. Midtrans retry bila tidak dapat 200. Proses berat
 *    (kirim email, update stok) idealnya via antrean/queue, bukan di sini.
 *
 * Ref: https://docs.midtrans.com/docs/https-notification-webhooks
 */
export async function POST(req: Request) {
  let notif: MidtransNotification;
  try {
    notif = (await req.json()) as MidtransNotification;
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid" }, { status: 400 });
  }

  if (!notif?.order_id || !notif?.signature_key || !notif?.status_code || !notif?.gross_amount) {
    return NextResponse.json({ error: "Payload notifikasi tidak lengkap" }, { status: 400 });
  }

  let valid = false;
  try {
    valid = verifyWebhookSignature(notif);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Konfigurasi server bermasalah" },
      { status: 500 }
    );
  }
  if (!valid) {
    // NOTED: 403 agar Midtrans TIDAK retry notifikasi palsu.
    return NextResponse.json({ error: "Signature tidak valid" }, { status: 403 });
  }

  // NOTED: titik integrasi ke database-mu. Contoh:
  //   if (isPaidStatus(notif.transaction_status)) await db.order.markPaid(notif.order_id);
  //   else await db.order.syncStatus(notif.order_id, notif.transaction_status);
  // TODO pemilik project: ganti 2 baris contoh di atas dengan query aslimu.
  const paid = isPaidStatus(notif.transaction_status);

  return NextResponse.json({ ok: true, orderId: notif.order_id, paid });
}
