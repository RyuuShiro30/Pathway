<?php

use App\Http\Controllers\MentoringSessionController;
use App\Http\Controllers\MentorProfileController;
use App\Http\Controllers\ProfileController;
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
    Route::get('/mentor/requests', [MentoringSessionController::class, 'requests'])->name('mentor.requests');
    Route::get('/mentor/booking/{id}', [MentoringSessionController::class, 'show'])->name('mentor.booking.show');
    Route::patch('/mentor/booking/{id}/respond', [MentoringSessionController::class, 'respond'])->name('mentor.booking.respond');
    Route::get('/mentor/session/{id}', [MentoringSessionController::class, 'tracking'])->name('mentor.session.tracking');
    Route::patch('/mentor/session/{id}/start', [MentoringSessionController::class, 'startSession'])->name('mentor.session.start');
    Route::patch('/mentor/session/{id}/complete', [MentoringSessionController::class, 'completeSession'])->name('mentor.session.complete');
    Route::patch('/mentor/session/{id}/cancel', [MentoringSessionController::class, 'cancelSession'])->name('mentor.session.cancel');
    Route::patch('/mentor/session/{id}/refund', [MentoringSessionController::class, 'completeRefund'])->name('mentor.refund.complete');
    Route::get('/mentor/session/{id}/refund', [MentoringSessionController::class, 'refundForm'])->name('mentor.refund.form');
});

require __DIR__.'/auth.php';
