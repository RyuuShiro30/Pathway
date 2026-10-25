<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\MentorDirectoryController;
use App\Http\Controllers\MentoringSessionController;
use App\Http\Controllers\MentorProfileController;
use App\Http\Controllers\MentorRegistrationController;
use App\Http\Controllers\NoShowReportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

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

// Katalog & Halaman Jendela Kelas
Route::get('/courses', [CourseController::class, 'index'])
    ->name('courses.index');

Route::get('/courses/{slug}', [CourseController::class, 'show'])
    ->name('courses.show');

// Direktori Mentor
Route::get('/mentors', [MentorDirectoryController::class, 'index'])
    ->name('mentors.index');

Route::get('/mentors/{id}', [MentorDirectoryController::class, 'show'])
    ->name('mentors.show');


/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {

    // Ruang Belajar Materi (Show.jsx)
    Route::get('/courses/{course:slug}/learn', [CourseController::class, 'learn'])
        ->name('courses.learn');

    // Forum Diskusi Kelas
    Route::get('/courses/{course:slug}/forums', [ForumController::class, 'index'])
        ->name('forums.index');

    Route::get('/courses/{course:slug}/forums/create', [ForumController::class, 'create'])
        ->name('forums.create');

    Route::post('/courses/{course:slug}/forums', [ForumController::class, 'store'])
        ->name('forums.store');

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
    Route::get('/mentor/become', function () {
        return Inertia::render('Mentor/BecomeMentor');
    })->name('mentor.become');

    Route::get('/mentor/register', [MentorRegistrationController::class, 'create'])
        ->name('mentor.register');

    Route::post('/mentor/register', [MentorRegistrationController::class, 'store'])
        ->name('mentor.register.store');

    Route::delete('/mentor/certificates/{certificate}', [MentorRegistrationController::class, 'destroyCertificate'])
        ->name('mentor.certificate.destroy');

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

    Route::patch('/bookings/{id}/cancel', [MentoringSessionController::class, 'cancelBooking'])
        ->name('student.bookings.cancel');

    Route::patch('/bookings/{id}/cancel-confirmed', [MentoringSessionController::class, 'cancelConfirmedBooking'])
        ->name('student.bookings.cancel-confirmed');

    Route::patch('/bookings/{id}/refund-confirmation', [MentoringSessionController::class, 'confirmRefund'])
        ->name('student.bookings.refund.confirm');

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

    // Mentor Refund & No Show
    Route::patch('/mentor/session/{id}/refund', [MentoringSessionController::class, 'completeRefund'])
        ->name('mentor.refund.complete');

    Route::get('/mentor/session/{id}/refund', [MentoringSessionController::class, 'refundForm'])
        ->name('mentor.refund.form');

    Route::post('/sessions/{id}/no-show', [NoShowReportController::class, 'store'])
        ->name('no-show.store');

    Route::patch('/no-show-reports/{id}/respond', [NoShowReportController::class, 'respond'])
        ->name('no-show.respond');

    Route::get('/no-show-reports/{id}/evidence/{type}', [NoShowReportController::class, 'evidence'])
        ->where('type', 'report|response')
        ->name('no-show.evidence');
});

require __DIR__.'/auth.php';