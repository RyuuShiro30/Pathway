<?php

namespace App\Http\Controllers;

use App\Models\MerchandiseInventory;
use App\Models\PointTransaction;
use App\Models\User;
use App\Models\UserMerchandise;
use App\Services\PointService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MerchandiseController extends Controller
{
    public function __construct(
        private readonly PointService $pointService
    ) {}

    /**
     * Menampilkan katalog merchandise dan saldo poin mentor.
     */
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $merchandises = MerchandiseInventory::query()
            ->where('stock', '>', 0)
            ->orderBy('point_cost')
            ->get();

        return Inertia::render('Mentor/Merchandise/Index', [
            'merchandises' => $merchandises,
            'pointsBalance' => $this->pointService->balanceFor($user->id),
        ]);
    }

    /**
     * Menukarkan poin mentor dengan merchandise.
     */
    public function redeem(Request $request, int $id): RedirectResponse
    {
        abort_if(Auth::user()?->isSuspendedMentor(), 403, 'Akun mentor Anda sedang disuspend.');

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'phone_number' => ['required', 'string', 'max:30'],
            'shipping_address' => ['required', 'string', 'max:2000'],
        ]);

        $userId = Auth::id();

        DB::transaction(function () use ($validated, $id, $userId) {

            // Kunci akun mentor untuk mencegah transaksi poin bersamaan.
            User::query()
                ->whereKey($userId)
                ->lockForUpdate()
                ->firstOrFail();

            // Kunci stok merchandise.
            $merchandise = MerchandiseInventory::query()
                ->lockForUpdate()
                ->findOrFail($id);

            if ($merchandise->stock < $validated['quantity']) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stok merchandise tidak mencukupi.',
                ]);
            }

            $totalPoints = $merchandise->point_cost * $validated['quantity'];

            $pointsBalance = $this->pointService->balanceFor($userId);

            if ($pointsBalance < $totalPoints) {
                throw ValidationException::withMessages([
                    'quantity' => 'Poin kamu tidak cukup untuk menukar merchandise ini.',
                ]);
            }

            // Simpan data penukaran dan alamat pengiriman.
            UserMerchandise::query()->create([
                'user_id' => $userId,
                'merchandise_id' => $merchandise->id,
                'quantity' => $validated['quantity'],
                'points_spent' => $totalPoints,
                'recipient_name' => $validated['recipient_name'],
                'phone_number' => $validated['phone_number'],
                'shipping_address' => $validated['shipping_address'],
                'shipping_status' => 'menunggu',
                'redeemed_at' => now(),
            ]);

            // Catat transaksi pengurangan poin.
            PointTransaction::query()->create([
                'user_id' => $userId,
                'amount' => $totalPoints,
                'transaction_type' => 'redeemed_merchandise',
                'description' => 'Penukaran merchandise: '.$merchandise->name,
                'related_id' => $merchandise->id,
            ]);

            // Kurangi stok merchandise.
            $merchandise->decrement('stock', $validated['quantity']);
        });

        return back()->with(
            'success',
            'Merchandise berhasil ditukar! Pesanan menunggu diproses.'
        );
    }

    /**
     * Menampilkan riwayat penukaran merchandise mentor.
     */
    public function history(): Response
    {
        $history = UserMerchandise::query()
            ->with('merchandise')
            ->where('user_id', Auth::id())
            ->latest('redeemed_at')
            ->get();

        return Inertia::render('Mentor/Merchandise/History', [
            'history' => $history,
        ]);
    }
}
