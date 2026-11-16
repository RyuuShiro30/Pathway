<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\JourneyReport;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminJourneyReportController extends Controller
{
    public function index(Request $request)
    {
        $currentStatus = $request->query('status', JourneyReport::STATUS_MENUNGGU);

        if (! in_array($currentStatus, ['menunggu', 'selesai', 'semua'], true)) {
            $currentStatus = JourneyReport::STATUS_MENUNGGU;
        }

        $reports = JourneyReport::query()
            ->with([
                'journey:id,title,slug,status,author_id',
                'reporter:id,name,email',
            ])
            ->when(
                $currentStatus !== 'semua',
                fn ($query) => $query->where('status', $currentStatus)
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $counts = [
            'menunggu' => JourneyReport::where(
                'status',
                JourneyReport::STATUS_MENUNGGU
            )->count(),
            'selesai' => JourneyReport::where(
                'status',
                JourneyReport::STATUS_SELESAI
            )->count(),
            'semua' => JourneyReport::count(),
        ];

        return Inertia::render('Admin/JourneyReport/Index', [
            'reports' => $reports,
            'counts' => $counts,
            'currentStatus' => $currentStatus,
        ]);
    }

    public function resolve(JourneyReport $report)
    {
        $report->update(['status' => JourneyReport::STATUS_SELESAI]);

        return back()->with('success', 'Laporan journey ditandai selesai.');
    }
}
