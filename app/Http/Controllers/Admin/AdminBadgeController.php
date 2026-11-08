<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BadgeInventory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminBadgeController extends Controller
{
    public function index()
    {
        $badges = BadgeInventory::withCount('userBadges')
            ->latest()
            ->get();

        return Inertia::render('Admin/Badge/Index', [
            'badges' => $badges,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Badge/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'point_cost' => 'required|integer|min:1',
            'image_url' => 'nullable|url|max:2048',
        ]);

        BadgeInventory::create($validated);

        return redirect()
            ->route('admin.badges.index')
            ->with('success', 'Badge berhasil ditambahkan.');
    }

    public function edit(BadgeInventory $badge)
    {
        return Inertia::render('Admin/Badge/Edit', [
            'badge' => $badge,
        ]);
    }

    public function update(Request $request, BadgeInventory $badge)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'point_cost' => 'required|integer|min:1',
            'image_url' => 'nullable|url|max:2048',
        ]);

        $badge->update($validated);

        return redirect()
            ->route('admin.badges.index')
            ->with('success', 'Badge berhasil diperbarui.');
    }

    public function destroy(BadgeInventory $badge)
    {
        if ($badge->userBadges()->exists()) {
            return redirect()
                ->route('admin.badges.index')
                ->with('error', 'Badge tidak dapat dihapus karena sudah dimiliki mentor.');
        }

        $badge->delete();

        return redirect()
            ->route('admin.badges.index')
            ->with('success', 'Badge berhasil dihapus.');
    }
}
