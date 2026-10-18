
<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MentorDirectoryController;
use App\Http\Controllers\MentorProfileController;
use App\Http\Controllers\MentorRegistrationController;
use App\Http\Controllers\MentoringSessionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/auth/google', [GoogleController::class, 'redirect'])
    ->name('google.login');

Route::get('/auth/google/callback', [GoogleController::class, 'callback']);

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/courses', function () {
    return Inertia::render('Course/Courses');
})->name('courses.index');

Route::get('/courses/{id}', function ($id) {
    return Inertia::render('Course/Show');
})->name('courses.show');

// Direktori Mentor
Route::get('/mentors', [MentorDirectoryController::class, 'index'])
    ->name('mentors.index');

Route::get('/mentors/{id}', [MentorDirectoryController::class, 'show'])
    ->name('mentors.show');

// Route yang memerlukan autentikasi
Route::middleware('auth')->group(function () {

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    // Rating & Ulasan Mentor
    Route::get('/sessions/{session}/review', [ReviewController::class, 'create'])
        ->name('reviews.create');

    Route::post('/sessions/{session}/review', [ReviewController::class, 'store'])
        ->name('reviews.store');

    // Mentor Registration
    Route::get('/mentor/register', [MentorRegistrationController::class, 'create'])
        ->name('mentor.register');

    Route::post('/mentor/register', [MentorRegistrationController::class, 'store'])
        ->name('mentor.register.store');

    Route::delete(
        '/mentor/certificates/{certificate}',
        [MentorRegistrationController::class, 'destroyCertificate']
    )->name('mentor.certificate.destroy');

    // Mentor Dashboard & Availability
    Route::get('/mentor/dashboard', [MentorProfileController::class, 'dashboard'])
        ->name('mentor.dashboard');

    Route::patch('/mentor/availability', [MentorProfileController::class, 'updateAvailability'])
        ->name('mentor.availability.update');

    // Booking Mentoring
    Route::get('/mentors/{mentor}/booking', [MentoringSessionController::class, 'schedule'])
        ->name('student.booking.schedule');

    Route::get('/mentors/{mentor}/booking/confirm', [MentoringSessionController::class, 'confirm'])
        ->name('student.booking.confirm');

    Route::post('/booking', [MentoringSessionController::class, 'store'])
        ->name('booking.store');

    Route::get('/bookings', [MentoringSessionController::class, 'studentIndex'])
        ->name('student.bookings.index');

    // Mentor Booking Requests
    Route::get('/mentor/requests', [MentoringSessionController::class, 'requests'])
        ->name('mentor.requests');

    Route::get('/mentor/booking/{id}', [MentoringSessionController::class, 'show'])
        ->name('mentor.booking.show');

    Route::patch('/mentor/booking/{id}/respond', [MentoringSessionController::class, 'respond'])
        ->name('mentor.booking.respond');

    // Mentor Session Tracking
    Route::get('/mentor/session/{id}', [MentoringSessionController::class, 'tracking'])
        ->name('mentor.session.tracking');

    Route::patch('/mentor/session/{id}/start', [MentoringSessionController::class, 'startSession'])
        ->name('mentor.session.start');

    Route::patch('/mentor/session/{id}/complete', [MentoringSessionController::class, 'completeSession'])
        ->name('mentor.session.complete');

    Route::patch('/mentor/session/{id}/cancel', [MentoringSessionController::class, 'cancelSession'])
        ->name('mentor.session.cancel');

    // Mentor Refund
    Route::patch('/mentor/session/{id}/refund', [MentoringSessionController::class, 'completeRefund'])
        ->name('mentor.refund.complete');

    Route::get('/mentor/session/{id}/refund', [MentoringSessionController::class, 'refundForm'])
        ->name('mentor.refund.form');
});

require __DIR__.'/auth.php';
