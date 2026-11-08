<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserMerchandise;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminMerchandiseOrderController extends Controller
{
    public function index()
    {
        $orders = UserMerchandise::with([
            'user:id,name,email',
            'merchandise:id,name,image_url,point_cost',
        ])
            ->latest('redeemed_at')
            ->paginate(10);

        return Inertia::render('Admin/MerchandiseOrder/Index', [
            'orders' => $orders,
        ]);
    }

    public function update(Request $request, UserMerchandise $order)
    {
        $validated = $request->validate([
            'shipping_status' => [
                'required',
                Rule::in([
                    'menunggu',
                    'diproses',
                    'dikirim',
                    'diterima',
                ]),
            ],
            'tracking_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::requiredIf(
                    $request->input('shipping_status') === 'dikirim'
                ),
            ],
        ], [
            'shipping_status.required' => 'Status pengiriman wajib dipilih.',
            'shipping_status.in' => 'Status pengiriman tidak valid.',
            'tracking_number.required' => 'Nomor resi wajib diisi jika pesanan dikirim.',
            'tracking_number.max' => 'Nomor resi maksimal 100 karakter.',
        ]);

        $order->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Pesanan merchandise berhasil diperbarui.');
    }
}
