<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MerchandiseInventory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminMerchandiseController extends Controller
{
    public function index()
    {
        $merchandises = MerchandiseInventory::withCount('userMerchandise')
            ->latest()
            ->get();

        return Inertia::render('Admin/Merchandise/Index', [
            'merchandises' => $merchandises,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Merchandise/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'point_cost' => 'required|integer|min:1',
            'image_url' => 'nullable|url|max:2048',
            'stock' => 'required|integer|min:0',
        ]);

        MerchandiseInventory::create($validated);

        return redirect()
            ->route('admin.merchandises.index')
            ->with('success', 'Merchandise berhasil ditambahkan.');
    }

    public function edit(MerchandiseInventory $merchandise)
    {
        return Inertia::render('Admin/Merchandise/Edit', [
            'merchandise' => $merchandise,
        ]);
    }

    public function update(Request $request, MerchandiseInventory $merchandise)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'point_cost' => 'required|integer|min:1',
            'image_url' => 'nullable|url|max:2048',
            'stock' => 'required|integer|min:0',
        ]);

        $merchandise->update($validated);

        return redirect()
            ->route('admin.merchandises.index')
            ->with('success', 'Merchandise berhasil diperbarui.');
    }

    public function destroy(MerchandiseInventory $merchandise)
    {
        if ($merchandise->userMerchandise()->exists()) {
            return redirect()
                ->route('admin.merchandises.index')
                ->with('error', 'Merchandise tidak dapat dihapus karena sudah pernah ditukarkan.');
        }

        $merchandise->delete();

        return redirect()
            ->route('admin.merchandises.index')
            ->with('success', 'Merchandise berhasil dihapus.');
    }
}
