<?php

namespace App\Http\Controllers;

use App\Models\MentoringSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TransactionHistoryController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $user = Auth::user();
        
        $query = MentoringSession::query()
            ->with([
                'student:id,name',
                'mentor:id,name',
            ])
            ->orderByDesc('created_at');

        // Batasi data berdasarkan role sesuai SOP
        if ($user->role === 'admin') {
            // Admin melihat seluruh transaksi tanpa batasan.
        } elseif ($user->role === 'student') {
            $query->where('student_id', $user->id);
        } elseif ($user->role === 'mentor') {
            $query->where('mentor_id', $user->id);
        } else {
            abort(403);
        }

        $transactions = $query->paginate(15)->through(function ($session) {
            return [
                'id' => $session->id,
                'student_name' => $session->student?->name ?? 'Unknown',
                'mentor_name' => $session->mentor?->name ?? 'Unknown',
                'schedule_time' => $session->schedule_time?->toISOString(),
                'duration_hours' => $session->duration_hours,
                'is_free_session' => $session->is_free_session,
                'total_price' => $session->price_snapshot,
                'dp_amount' => $session->is_free_session ? 0 : (int) ceil($session->price_snapshot * 0.5),
                'payment_dp_status' => $session->payment_dp_status,
                'refund_status' => $session->refund_status,
                'status' => $session->status,
                'created_at' => $session->created_at?->toISOString(),
            ];
        });

        return Inertia::render('TransactionHistory/Index', [
            'transactions' => $transactions,
            'userRole' => $user->role,
        ]);
    }
}