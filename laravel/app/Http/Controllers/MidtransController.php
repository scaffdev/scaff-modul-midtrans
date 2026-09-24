<?php

namespace App\Http\Controllers;

use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Controller Midtrans — STAGED untuk dukungan Laravel (aktif di v1.1.0).
 *
 * NOTED:
 * - Daftarkan route manual saat v1.1.0 rilis:
 *     Route::post('/api/payments/midtrans', [MidtransController::class, 'create']);
 *     Route::post('/api/payments/midtrans/webhook', [MidtransController::class, 'webhook']);
 * - Webhook WAJIB URL publik + verifikasi signature (lihat method webhook).
 */
class MidtransController extends Controller
{
    public function __construct(protected MidtransService $midtrans) {}

    /** POST /api/payments/midtrans — buat transaksi Snap. */
    public function create(Request $request): JsonResponse
    {
        $data = $request->validate([
            'orderId' => 'required|string|max:50',
            'amount' => 'required|integer|min:1',
            'customerName' => 'nullable|string|max:100',
            'customerEmail' => 'nullable|email|max:255',
        ]);

        $result = $this->midtrans->createSnap(
            $data['orderId'],
            $data['amount'],
            $data['customerName'] ?? null,
            $data['customerEmail'] ?? null
        );

        return response()->json($result);
    }

    /** POST /api/payments/midtrans/webhook — terima notifikasi Midtrans. */
    public function webhook(Request $request): JsonResponse
    {
        // NOTED: SDK resmi mem-parse JSON notifikasi jadi object Notification.
        $notif = new \Midtrans\Notification();

        if (! $this->midtrans->verifySignature($notif)) {
            // NOTED: 403 agar Midtrans tidak retry notifikasi palsu.
            return response()->json(['error' => 'Signature tidak valid'], 403);
        }

        // NOTED: titik integrasi ke database-mu, contoh:
        //   Order::where('external_id', $notif->order_id)->update(['status' => ...]);
        // TODO pemilik project: ganti dengan query aslimu.
        $paid = $this->midtrans->isPaid($notif->transaction_status);

        return response()->json(['ok' => true, 'orderId' => $notif->order_id, 'paid' => $paid]);
    }
}
