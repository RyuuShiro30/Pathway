<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminAuthController extends Controller
{
    public function create()
    {
        return Inertia::render('Admin/Auth/Login');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if ($credentials['email'] !== 'pathway@admin.com') {
            return back()->withErrors([
                'email' => 'Akses ditolak. Bukan akun admin.',
            ]);
        }

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->route('admin.courses.index');
        }

        return back()->withErrors([
            'email' => 'Email atau password Admin salah.',
        ]);
    }
}