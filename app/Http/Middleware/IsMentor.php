<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsMentor
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role === 'admin') {
            return redirect()->route('admin.dashboard');
        }

        if (! $request->user() || $request->user()->role !== 'mentor') {
            abort(403, 'Akses hanya untuk mentor.');
        }

        return $next($request);
    }
}
