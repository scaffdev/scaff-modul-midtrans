import { NextResponse } from "next/server";
import { createSnapTransaction } from "../../../../../lib/payments/midtrans";

/**
 * POST /api/payments/midtrans — buat transaksi Snap.
 *
 * NOTED:
 * - Import pakai path RELATIF (bukan "@/...") agar jalan di template base
 *   mana pun tanpa bergantung setting alias tsconfig.
 * - Route ini berjalan 100% di server → Server Key aman, tak bocor ke browser.
 *
 * Body: { orderId: string, amount: number, customerName?: string, customerEmail?: string }
 * Balikan: { token, redirectUrl }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body harus JSON valid" }, { status: 400 });
  }

  const { orderId, amount, customerName, customerEmail } = (body ?? {}) as {
    orderId?: unknown;
    amount?: unknown;
    customerName?: unknown;
    customerEmail?: unknown;
  };

  if (typeof orderId !== "string" || !orderId.trim()) {
    return NextResponse.json({ error: "orderId wajib string non-kosong" }, { status: 400 });
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount wajib bilangan bulat Rupiah > 0" }, { status: 400 });
  }

  try {
    const result = await createSnapTransaction({
      orderId: orderId.trim(),
      amount,
      customerName: typeof customerName === "string" ? customerName : undefined,
      customerEmail: typeof customerEmail === "string" ? customerEmail : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    // NOTED: pesan error Midtrans diteruskan; JANGAN selipkan Server Key ke respons.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat transaksi" },
      { status: 502 }
    );
  }
}
