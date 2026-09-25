<?php

namespace App\Services;

/**
 * Service Midtrans Snap — disuntik Scaffdev Builder ke template Laravel.
 *
 * NOTED:
 * - File ini 100% milik modul "midtrans" (lihat scaff.integration.json).
 * - Memakai SDK resmi midtrans/midtrans-php (best practice vs curl manual):
 *   Config::$serverKey, Snap::getSnapToken, Notification.
 *   Ref: https://github.com/Midtrans/midtrans-php
 * - Server Key HANYA dari env (config/services.php), jangan hardcode.
 */
class MidtransService
{
    public function __construct()
    {
        // NOTED: panggil boot() sekali (mis. di AppServiceProvider) sebelum
        // memakai service ini, agar kredensial + mode terbaca dari env.
        $this->boot();
    }

    protected function boot(): void
    {
        \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
        // NOTED: default sandbox. Set MIDTRANS_IS_PRODUCTION=true hanya saat Go Live.
        \Midtrans\Config::$isProduction = (bool) env('MIDTRANS_IS_PRODUCTION', false);
        \Midtrans\Config::$isSanitized = true;
        \Midtrans\Config::$is3ds = true;
    }

    /**
     * Buat transaksi Snap. Return: ['token' => ..., 'redirect_url' => ...]
     */
    public function createSnap(string $orderId, int $amount, ?string $name = null, ?string $email = null): array
    {
        // NOTED: gagal cepat dengan pesan jelas sebelum request ke Midtrans.
        abort_if(trim($orderId) === '' || $amount <= 0, 422, 'orderId & amount tidak valid');

        $params = [
            'transaction_details' => ['order_id' => $orderId, 'gross_amount' => $amount],
        ];
        if ($name || $email) {
            $params['customer_details'] = array_filter([
                'first_name' => $name,
                'email' => $email,
            ]);
        }

        $snapToken = \Midtrans\Snap::getSnapToken($params);

        // NOTED: host vtweb mengikuti mode — token sandbox TIDAK jalan
        // di host production (dan sebaliknya).
        $host = \Midtrans\Config::$isProduction
            ? 'https://app.midtrans.com'
            : 'https://app.sandbox.midtrans.com';

        return ['token' => $snapToken, 'redirect_url' => "{$host}/snap/v2/vtweb/{$snapToken}"];
    }

    /**
     * Verifikasi webhook. Rumus resmi:
     * SHA512(order_id + status_code + gross_amount + ServerKey).
     */
    public function verifySignature(object $notif): bool
    {
        $raw = $notif->order_id . $notif->status_code . $notif->gross_amount . config('services.midtrans.server_key');

        return hash('sha512', $raw) === ($notif->signature_key ?? null);
    }

    public function isPaid(string $status): bool
    {
        return in_array($status, ['settlement', 'capture'], true);
    }
}
