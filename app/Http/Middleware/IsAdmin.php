<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class IsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $adminEmail = 'pathway@admin.com';

        // Belum login: arahkan ke halaman login admin
        if (!Auth::check()) {
            return redirect()->route('admin.login');
        }

        // Sudah login tapi bukan admin: tolak tanpa logout
        if (Auth::user()->role !== 'admin') {
            abort(404);
        }

        return $next($request);
    }
}