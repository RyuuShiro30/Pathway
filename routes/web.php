<?php

use App\Http\Controllers\MentorRegistrationController;
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
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');

    Route::get('/mentor/register', [MentorRegistrationController::class, 'create'])
        ->name('mentor.register');

    Route::post('/mentor/register', [MentorRegistrationController::class, 'store'])
        ->name('mentor.register.store');

    Route::delete('/mentor/certificates/{certificate}', [MentorRegistrationController::class, 'destroyCertificate'])
        ->name('mentor.certificate.destroy');
});

require __DIR__.'/auth.php';