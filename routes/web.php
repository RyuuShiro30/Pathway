<?php
use App\Http\Controllers\MentoringSessionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MentorProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/mentor/dashboard', [MentorProfileController::class, 'dashboard'])->name('mentor.dashboard');
    Route::patch('/mentor/availability', [MentorProfileController::class, 'updateAvailability'])->name('mentor.availability.update');

    Route::post('/booking', [MentoringSessionController::class, 'store'])->name('booking.store');
});

require __DIR__.'/auth.php';