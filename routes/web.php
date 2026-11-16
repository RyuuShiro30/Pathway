<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminBadgeController;
use App\Http\Controllers\Admin\AdminCourseController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminMaterialController;
use App\Http\Controllers\Admin\AdminMentorController;
use App\Http\Controllers\Admin\AdminMerchandiseController;
use App\Http\Controllers\Admin\AdminMerchandiseOrderController;
use App\Http\Controllers\Admin\AdminNoShowReportController;
use App\Http\Controllers\Admin\AdminPaymentReminderController;
use App\Http\Controllers\Admin\AdminRefundReportController;
use App\Http\Controllers\Admin\AdminReviewController;
use App\Http\Controllers\Admin\AdminSessionController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\BadgeController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\JourneyController;
use App\Http\Controllers\MentorDirectoryController;
use App\Http\Controllers\MentoringSessionController;
use App\Http\Controllers\MentorProfileController;
use App\Http\Controllers\MentorRegistrationController;
use App\Http\Controllers\MerchandiseController;
use App\Http\Controllers\NoShowReportController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TransactionHistoryController;
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
    ->whereNumber('id')
    ->name('mentors.show');

// Sharing Journey - halaman publik
Route::get('/journeys', [JourneyController::class, 'index'])
    ->name('journeys.index');

Route::get('/journeys/{journey:slug}', [JourneyController::class, 'show'])
    ->where('journey', '^(?!create$)[a-zA-Z0-9-]+$')
    ->name('journeys.show');

/*
|--------------------------------------------------------------------------
| Admin Guest Routes (Hanya bisa diakses jika BELUM login)
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AdminAuthController::class, 'create'])
        ->name('login');

    Route::post('/login', [AdminAuthController::class, 'store'])
        ->name('login.store');
});

/*
|--------------------------------------------------------------------------
| Admin Protected Routes (Hanya bisa diakses oleh Admin)
|--------------------------------------------------------------------------
*/

Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('courses', AdminCourseController::class);
    Route::resource('courses.materials', AdminMaterialController::class)->shallow();

    Route::patch('/courses/{course}/toggle-status', [AdminCourseController::class, 'toggleStatus'])
        ->name('courses.toggle-status');

    // Redeem Point - Badge
    Route::resource('badges', AdminBadgeController::class)->except(['show']);

    // Redeem Point - Merchandise
    Route::resource('merchandises', AdminMerchandiseController::class)->except(['show']);

    // Redeem Point - Pesanan Merchandise
    Route::get('/merchandise-orders', [AdminMerchandiseOrderController::class, 'index'])
        ->name('merchandise-orders.index');

    Route::put('/merchandise-orders/{order}', [AdminMerchandiseOrderController::class, 'update'])
        ->whereNumber('order')
        ->name('merchandise-orders.update');

    Route::get('/dashboard', [AdminDashboardController::class, 'index'])
        ->name('dashboard');
    Route::get('/refund-reports', [AdminRefundReportController::class, 'index'])
        ->name('refund-reports.index');
    Route::get('/refund-reports/{session}', [AdminRefundReportController::class, 'show'])
        ->whereNumber('session')
        ->name('refund-reports.show');
    Route::patch('/refund-reports/{session}/decide', [AdminRefundReportController::class, 'decide'])
        ->whereNumber('session')
        ->name('refund-reports.decide');
    Route::post('/refund-reports/{session}/remind', [AdminRefundReportController::class, 'remind'])
        ->whereNumber('session')
        ->name('refund-reports.remind');

    Route::get('/no-show-reports', [AdminNoShowReportController::class, 'index'])
        ->name('no-show-reports.index');
    Route::get('/no-show-reports/{report}', [AdminNoShowReportController::class, 'show'])
        ->whereNumber('report')
        ->name('no-show-reports.show');
    Route::patch('/no-show-reports/{report}/decide', [AdminNoShowReportController::class, 'decide'])
        ->whereNumber('report')
        ->name('no-show-reports.decide');

    Route::get('/payment-reminders', [AdminPaymentReminderController::class, 'index'])
        ->name('payment-reminders.index');
    Route::post('/payment-reminders/remind-all', [AdminPaymentReminderController::class, 'remindAll'])
        ->name('payment-reminders.remind-all');
    Route::match(['post', 'patch'], '/payment-reminders/{session}/remind', [AdminPaymentReminderController::class, 'remind'])
        ->whereNumber('session')
        ->name('payment-reminders.remind');

    Route::get('/reviews', [AdminReviewController::class, 'index'])
        ->name('reviews.index');
    Route::patch('/reviews/{review}/approve', [AdminReviewController::class, 'approve'])
        ->whereNumber('review')
        ->name('reviews.approve');
    Route::patch('/reviews/{review}/reject', [AdminReviewController::class, 'reject'])
        ->whereNumber('review')
        ->name('reviews.reject');

    Route::get('/sessions', [AdminSessionController::class, 'index'])
        ->name('sessions.index');

    Route::get('/mentors', [AdminMentorController::class, 'index'])
        ->name('mentors.index');
    Route::patch('/mentors/{mentorProfile}/discord', [AdminMentorController::class, 'updateDiscord'])
        ->whereNumber('mentorProfile')
        ->name('mentors.discord');
    Route::patch('/mentors/{mentorProfile}/verify', [AdminMentorController::class, 'verify'])
        ->whereNumber('mentorProfile')
        ->name('mentors.verify');
    Route::post('/mentors/{mentorProfile}/suspend', [AdminMentorController::class, 'suspend'])
        ->whereNumber('mentorProfile')
        ->name('mentors.suspend');
    Route::post('/mentors/{mentorProfile}/unsuspend', [AdminMentorController::class, 'unsuspend'])
        ->whereNumber('mentorProfile')
        ->name('mentors.unsuspend');
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes (Mahasiswa & Mentor)
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {

    // Ruang Belajar Materi
    Route::get('/courses/{course:slug}/learn', [CourseController::class, 'learn'])
        ->name('courses.learn');

    Route::post('/courses/{slug}/materials/{materialId}/complete', [CourseController::class, 'markAsCompleted'])
        ->whereNumber('materialId')
        ->name('courses.materials.complete');

    // Forum Diskusi Kelas
    Route::get('/courses/{course:slug}/forums', [ForumController::class, 'index'])
        ->name('forums.index');

    Route::get('/courses/{course:slug}/forums/create', [ForumController::class, 'create'])
        ->name('forums.create');

    Route::post('/courses/{course:slug}/forums', [ForumController::class, 'store'])
        ->name('forums.store');

    Route::get('/courses/{course:slug}/forums/{forum}', [ForumController::class, 'show'])
        ->name('forums.show');

    Route::post('/courses/{course:slug}/forums/{forum}/replies', [ForumController::class, 'storeReply'])
        ->name('forums.replies.store');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    Route::post('/profile/photo', [ProfileController::class, 'updatePhoto'])
        ->name('profile.photo.update');

    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');

    Route::patch('/profile/mentor', [ProfileController::class, 'updateMentorProfile'])
        ->name('profile.mentor.update');

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    // Sharing Journey - kelola artikel
    Route::get('/journeys/create', [JourneyController::class, 'create'])
        ->name('journeys.create');

    Route::post('/journeys', [JourneyController::class, 'store'])
        ->name('journeys.store');

    Route::get('/journeys/{journey:slug}/edit', [JourneyController::class, 'edit'])
        ->name('journeys.edit');

    Route::put('/journeys/{journey:slug}', [JourneyController::class, 'update'])
        ->name('journeys.update');

    Route::delete('/journeys/{journey:slug}', [JourneyController::class, 'destroy'])
        ->name('journeys.destroy');

    // Rating & Ulasan Mentor
    Route::get('/sessions/{session}/review', [ReviewController::class, 'create'])
        ->whereNumber('session')
        ->name('reviews.create');

    Route::post('/sessions/{session}/review', [ReviewController::class, 'store'])
        ->whereNumber('session')
        ->name('reviews.store');

    // Riwayat Transaksi Mentoring
    Route::get('/transactions', [TransactionHistoryController::class, 'index'])
        ->name('transactions.index');

    // Mentor Registration (untuk calon mentor — TIDAK perlu role mentor)
    Route::get('/mentor/become', function () {
        return Inertia::render('Mentor/BecomeMentor');
    })->name('mentor.become');

    Route::get('/mentor/register', [MentorRegistrationController::class, 'create'])
        ->name('mentor.register');

    Route::post('/mentor/register', [MentorRegistrationController::class, 'store'])
        ->name('mentor.register.store');

    Route::delete('/mentor/certificates/{certificate}', [MentorRegistrationController::class, 'destroyCertificate'])
        ->name('mentor.certificate.destroy');

    // Mentor-only: Dashboard, Availability, Requests, Booking, Session, Refund
    Route::middleware('mentor')->group(function () {

        // Dashboard & Availability
        Route::get('/mentor/dashboard', [MentorProfileController::class, 'dashboard'])
            ->name('mentor.dashboard');

        Route::patch('/mentor/availability', [MentorProfileController::class, 'updateAvailability'])
            ->name('mentor.availability.update');

        // Badge
        Route::get('/mentor/badges', [BadgeController::class, 'index'])
            ->name('mentor.badges.index');

        Route::post('/mentor/badges/{id}/redeem', [BadgeController::class, 'redeem'])
            ->whereNumber('id')
            ->name('mentor.badges.redeem');

        // Merchandise
        Route::get('/mentor/merchandise', [MerchandiseController::class, 'index'])
            ->name('mentor.merchandise.index');

        Route::post('/mentor/merchandise/{id}/redeem', [MerchandiseController::class, 'redeem'])
            ->whereNumber('id')
            ->name('mentor.merchandise.redeem');

        Route::get('/mentor/merchandise/history', [MerchandiseController::class, 'history'])
            ->name('mentor.merchandise.history');
    });

    // Booking Mentoring
    Route::get('/mentors/{mentor}/booking', [MentoringSessionController::class, 'schedule'])
        ->name('student.booking.schedule');

    Route::get('/mentors/{mentor}/booking/confirm', [MentoringSessionController::class, 'confirm'])
        ->name('student.booking.confirm');

    Route::post('/booking', [MentoringSessionController::class, 'store'])
        ->name('booking.store');

    Route::get('/bookings', [MentoringSessionController::class, 'studentIndex'])
        ->name('student.bookings.index');

    Route::get('/bookings/{id}/reschedule', [MentoringSessionController::class, 'rescheduleForm'])
        ->whereNumber('id')
        ->name('student.bookings.reschedule');

    Route::post('/bookings/{id}/reschedule', [MentoringSessionController::class, 'requestReschedule'])
        ->whereNumber('id')
        ->name('student.bookings.reschedule.store');

    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');

    Route::patch('/notifications/read-all', [NotificationController::class, 'readAll'])
        ->name('notifications.read-all');

    Route::patch('/notifications/{id}/read', [NotificationController::class, 'read'])
        ->name('notifications.read');

    Route::patch('/bookings/{id}/cancel', [MentoringSessionController::class, 'cancelBooking'])
        ->whereNumber('id')
        ->name('student.bookings.cancel');

    Route::patch('/bookings/{id}/cancel-confirmed', [MentoringSessionController::class, 'cancelConfirmedBooking'])
        ->whereNumber('id')
        ->name('student.bookings.cancel-confirmed');

    Route::patch('/bookings/{id}/refund-confirmation', [MentoringSessionController::class, 'confirmRefund'])
        ->whereNumber('id')
        ->name('student.bookings.refund.confirm');

    Route::patch('/bookings/{id}/refund-reschedule/respond', [MentoringSessionController::class, 'respondRefundRescheduleOffer'])
        ->whereNumber('id')
        ->name('student.bookings.refund-reschedule.respond');

    Route::post('/bookings/{id}/payment-final', [MentoringSessionController::class, 'uploadFinalPaymentProof'])
        ->whereNumber('id')
        ->name('student.bookings.payment-final.upload');

    // Mentor Booking Requests
    Route::get('/mentor/requests', [MentoringSessionController::class, 'requests'])
        ->name('mentor.requests');

    Route::get('/mentor/booking/{id}', [MentoringSessionController::class, 'show'])
        ->whereNumber('id')
        ->name('mentor.booking.show');

    Route::patch('/mentor/booking/{id}/respond', [MentoringSessionController::class, 'respond'])
        ->whereNumber('id')
        ->name('mentor.booking.respond');

    Route::patch('/mentor/booking/{id}/reschedule/respond', [MentoringSessionController::class, 'respondReschedule'])
        ->whereNumber('id')
        ->name('mentor.booking.reschedule.respond');

    // Mentor Session Tracking
    Route::get('/mentor/session/{id}', [MentoringSessionController::class, 'tracking'])
        ->whereNumber('id')
        ->name('mentor.session.tracking');

    Route::patch('/mentor/session/{id}/start', [MentoringSessionController::class, 'startSession'])
        ->whereNumber('id')
        ->name('mentor.session.start');

    Route::patch('/mentor/session/{id}/complete', [MentoringSessionController::class, 'completeSession'])
        ->whereNumber('id')
        ->name('mentor.session.complete');

    Route::patch('/mentor/session/{id}/cancel', [MentoringSessionController::class, 'cancelSession'])
        ->whereNumber('id')
        ->name('mentor.session.cancel');

    // No-show (dipakai murid dan mentor)

    // Mentor Refund & No Show
    Route::patch('/mentor/session/{id}/refund', [MentoringSessionController::class, 'completeRefund'])
        ->whereNumber('id')
        ->name('mentor.refund.complete');

    Route::get('/mentor/session/{id}/refund', [MentoringSessionController::class, 'refundForm'])
        ->whereNumber('id')
        ->name('mentor.refund.form');

    // Halaman penawaran jadwal pengganti
    Route::get('/mentor/session/{id}/reschedule-offer', [MentoringSessionController::class, 'rescheduleOfferForm'])
        ->whereNumber('id')
        ->name('mentor.refund.reschedule-offer.form');

    Route::post('/mentor/session/{id}/refund/reschedule-offer', [MentoringSessionController::class, 'offerRefundReschedule'])
        ->whereNumber('id')
        ->name('mentor.refund.reschedule-offer');

    Route::post('/sessions/{id}/no-show', [NoShowReportController::class, 'store'])
        ->whereNumber('id')
        ->name('no-show.store');

    Route::patch('/no-show-reports/{id}/respond', [NoShowReportController::class, 'respond'])
        ->whereNumber('id')
        ->name('no-show.respond');

    Route::get('/no-show-reports/{id}/evidence/{type}', [NoShowReportController::class, 'evidence'])
        ->whereNumber('id')
        ->where('type', 'report|response')
        ->name('no-show.evidence');

    Route::get('/sessions/{id}/proof/{type}', [MentoringSessionController::class, 'proof'])
        ->whereNumber('id')
        ->where('type', 'dp|final|refund|session')
        ->name('session.proof');

    // Mentor Booking Requests
    Route::middleware('mentor')->group(function () {
        Route::get('/mentor/requests', [MentoringSessionController::class, 'requests'])
            ->name('mentor.requests');

        Route::get('/mentor/booking/{id}', [MentoringSessionController::class, 'show'])
            ->whereNumber('id')
            ->name('mentor.booking.show');

        Route::patch('/mentor/booking/{id}/respond', [MentoringSessionController::class, 'respond'])
            ->whereNumber('id')
            ->name('mentor.booking.respond');

        Route::patch('/mentor/booking/{id}/reschedule/respond', [MentoringSessionController::class, 'respondReschedule'])
            ->whereNumber('id')
            ->name('mentor.booking.reschedule.respond');

        // Mentor Session Tracking
        Route::get('/mentor/session/{id}', [MentoringSessionController::class, 'tracking'])
            ->whereNumber('id')
            ->name('mentor.session.tracking');

        Route::patch('/mentor/session/{id}/start', [MentoringSessionController::class, 'startSession'])
            ->whereNumber('id')
            ->name('mentor.session.start');

        Route::patch('/mentor/session/{id}/complete', [MentoringSessionController::class, 'completeSession'])
            ->whereNumber('id')
            ->name('mentor.session.complete');

        Route::patch('/mentor/session/{id}/cancel', [MentoringSessionController::class, 'cancelSession'])
            ->whereNumber('id')
            ->name('mentor.session.cancel');

        Route::patch('/mentor/session/{id}/payment-final', [MentoringSessionController::class, 'verifyFinalPayment'])
            ->whereNumber('id')
            ->name('mentor.session.payment-final.verify');

        Route::patch('/mentor/session/{id}/payment-final/accept', [MentoringSessionController::class, 'acceptFinalPayment'])
            ->whereNumber('id')
            ->name('mentor.session.payment-final.accept');

        Route::patch('/mentor/session/{id}/payment-final/reject', [MentoringSessionController::class, 'rejectFinalPayment'])
            ->whereNumber('id')
            ->name('mentor.session.payment-final.reject');

        // Mentor Refund & No Show
        Route::patch('/mentor/session/{id}/refund', [MentoringSessionController::class, 'completeRefund'])
            ->whereNumber('id')
            ->name('mentor.refund.complete');

        Route::get('/mentor/session/{id}/refund', [MentoringSessionController::class, 'refundForm'])
            ->whereNumber('id')
            ->name('mentor.refund.form');

        // Penawaran jadwal pengganti
        Route::get('/mentor/session/{id}/reschedule-offer', [MentoringSessionController::class, 'rescheduleOfferForm'])
            ->whereNumber('id')
            ->name('mentor.refund.reschedule-offer.form');

        Route::post('/mentor/session/{id}/refund/reschedule-offer', [MentoringSessionController::class, 'offerRefundReschedule'])
            ->whereNumber('id')
            ->name('mentor.refund.reschedule-offer');
    });
});

require __DIR__.'/auth.php';
