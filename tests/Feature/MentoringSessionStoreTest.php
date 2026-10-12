<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class MentoringSessionStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_book_free_slot_with_zero_price_snapshot(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);

        $response = $this->submitBooking($mentor, ['is_free_session' => false]);

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'is_free_session' => true,
            'price_snapshot' => '0.00',
        ]);
    }

    public function test_student_can_book_two_hours_of_paid_slot_at_hourly_price(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        Storage::fake('public');

        $response = $this->submitBooking($mentor, [
            'duration_hours' => 2,
            'payment_dp_proof' => UploadedFile::fake()->image('payment.png'),
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'is_free_session' => false,
            'price_snapshot' => '100000.00',
        ]);
    }

    public function test_paid_slot_ignores_client_free_session_flag(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 65000],
        ]);
        Storage::fake('public');

        $response = $this->submitBooking($mentor, [
            'is_free_session' => true,
            'payment_dp_proof' => UploadedFile::fake()->image('payment.png'),
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'is_free_session' => false,
            'price_snapshot' => '65000.00',
        ]);
    }

    public function test_paid_slot_ignores_client_price(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 72000],
        ]);
        Storage::fake('public');

        $response = $this->submitBooking($mentor, [
            'price' => 1,
            'payment_dp_proof' => UploadedFile::fake()->image('payment.png'),
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'price_snapshot' => '72000.00',
        ]);
    }

    public function test_student_cannot_book_outside_all_available_slots(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);

        $response = $this->submitBooking($mentor, [
            'schedule_time' => '2026-10-12T04:00:00+00:00',
        ]);

        $response->assertSessionHasErrors([
            'schedule_time' => 'Jadwal tidak tersedia.',
        ]);
        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_student_cannot_book_on_a_day_the_mentor_is_closed(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);

        $response = $this->submitBooking($mentor, [
            'schedule_time' => '2026-10-13T02:00:00+00:00',
        ]);

        $response->assertSessionHasErrors([
            'schedule_time' => 'Jadwal tidak tersedia.',
        ]);
        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_student_cannot_book_past_the_end_of_an_available_slot(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);

        $response = $this->submitBooking($mentor, [
            'schedule_time' => '2026-10-12T03:30:00+00:00',
        ]);

        $response->assertSessionHasErrors([
            'schedule_time' => 'Jadwal tidak tersedia.',
        ]);
        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_student_can_book_one_hour_inside_a_two_hour_slot(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);

        $response = $this->submitBooking($mentor, [
            'schedule_time' => '2026-10-12T02:30:00+00:00',
            'duration_hours' => 1,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'schedule_time' => '2026-10-12 02:30:00',
            'end_time' => '2026-10-12 03:30:00',
        ]);
    }

    public function test_legacy_slot_without_type_is_treated_as_free(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00'],
        ]);

        $response = $this->submitBooking($mentor);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'is_free_session' => true,
            'price_snapshot' => '0.00',
        ]);
    }

    public function test_student_cannot_book_inside_a_session_that_contains_the_requested_interval(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);
        $existingStudent = User::factory()->create();
        MentoringSession::query()->create([
            'student_id' => $existingStudent->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => '2026-10-12 01:00:00',
            'end_time' => '2026-10-12 05:00:00',
            'duration_hours' => 4,
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $response = $this->submitBooking($mentor);

        $response->assertSessionHasErrors([
            'schedule_time' => 'Slot ini baru saja dibooking pengguna lain, silakan pilih slot lain.',
        ]);
        $this->assertDatabaseCount('mentoring_sessions', 1);
    }

    public function test_slot_day_is_resolved_using_asia_jakarta_timezone(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'selasa', 'start' => '00:00', 'end' => '02:00', 'type' => 'gratis', 'price' => null],
        ]);

        $response = $this->submitBooking($mentor, [
            'schedule_time' => '2026-10-12T17:30:00+00:00',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'schedule_time' => '2026-10-12 17:30:00',
            'is_free_session' => true,
        ]);
    }

    public function test_booking_schedule_renders_mentor_and_busy_sessions_without_student_data(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);
        $mentor->forceFill([
            'bank_name' => 'Bank Contoh',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Nama Mentor',
        ])->save();
        $this->travelTo('2026-10-11 00:00:00');
        $student = User::factory()->create();
        MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => '2026-10-12 02:00:00',
            'end_time' => '2026-10-12 03:00:00',
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingSchedule', false)
                ->where('mentor.id', $mentor->id)
                ->where('mentor.name', $mentor->name)
                ->where('mentor.expertise', 'Web Development')
                ->has('busy_sessions', 1)
                ->where('busy_sessions.0.schedule_time', '2026-10-12T02:00:00.000000Z')
                ->where('busy_sessions.0.end_time', '2026-10-12T03:00:00.000000Z')
                ->missing('busy_sessions.0.student_id')
                ->missing('busy_sessions.0.student')
                ->missing('mentor.bank_name')
                ->missing('mentor.bank_account_number')
                ->missing('mentor.bank_account_holder')
                ->missing('busy_sessions.0.bank_name')
                ->missing('busy_sessions.0.bank_account_number')
                ->missing('busy_sessions.0.bank_account_holder')
                ->where('booking_window.from', '2026-10-11')
                ->where('booking_window.until', '2026-10-21')
                ->etc());
    }

    public function test_student_bookings_do_not_expose_mentor_bank_details(): void
    {
        $student = User::factory()->create();
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);
        $mentor->forceFill([
            'bank_name' => 'Bank Contoh',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Nama Mentor',
        ])->save();
        MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => '2026-10-12 02:00:00',
            'end_time' => '2026-10-12 03:00:00',
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/MyBookings', false)
                ->missing('bookings.0.mentor.bank_name')
                ->missing('bookings.0.mentor.bank_account_number')
                ->missing('bookings.0.mentor.bank_account_holder')
                ->etc());
    }

    public function test_booking_schedule_normalizes_legacy_slots_as_free(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00'],
        ]);

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingSchedule', false)
                ->where('mentor.availability_schedule.0.type', 'gratis')
                ->where('mentor.availability_schedule.0.price', null)
                ->etc());
    }

    public function test_booking_schedule_returns_404_for_user_without_mentor_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.schedule', ['mentor' => $user->id]))
            ->assertNotFound();
    }

    public function test_booking_confirmation_for_self_returns_403(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);

        $this->actingAs($mentor)
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 1,
            ]))
            ->assertForbidden();
    }

    public function test_booking_confirmation_shows_server_calculated_free_summary(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);
        $mentor->forceFill([
            'bank_name' => null,
            'bank_account_number' => null,
            'bank_account_holder' => null,
        ])->save();
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 1,
            ]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingConfirm', false)
                ->where('mentor.id', $mentor->id)
                ->where('summary.date', '2026-10-12')
                ->where('summary.start', '09:00')
                ->where('summary.end', '10:00')
                ->where('summary.duration_hours', 1)
                ->where('summary.is_free_session', true)
                ->where('summary.price_per_hour', 0)
                ->where('summary.total_price', 0)
                ->where('summary.dp_amount', 0)
                ->where('payment_account', null)
                ->etc());
    }

    public function test_booking_confirmation_shows_two_hour_paid_summary_with_half_dp(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '12:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 2,
            ]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingConfirm', false)
                ->where('summary.date', '2026-10-12')
                ->where('summary.start', '09:00')
                ->where('summary.end', '11:00')
                ->where('summary.duration_hours', 2)
                ->where('summary.is_free_session', false)
                ->where('summary.price_per_hour', 50000)
                ->where('summary.total_price', 100000)
                ->where('summary.dp_amount', 50000)
                ->where('payment_account', [
                    'bank_name' => 'Bank Contoh',
                    'account_number' => '1234567890',
                    'account_holder' => 'Nama Mentor',
                ])
                ->etc());
    }

    public function test_booking_confirmation_accepts_two_hours_covered_by_separate_paid_slots(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'berbayar', 'price' => 50000],
            ['day' => 'senin', 'start' => '10:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 2,
            ]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingConfirm', false)
                ->where('summary.duration_hours', 2)
                ->where('summary.price_per_hour', 50000)
                ->where('summary.total_price', 100000)
                ->where('summary.dp_amount', 50000)
                ->etc());
    }

    public function test_booking_confirmation_sums_different_hourly_prices_and_returns_null_average(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'berbayar', 'price' => 50000],
            ['day' => 'senin', 'start' => '10:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 60000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 2,
            ]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingConfirm', false)
                ->where('summary.price_per_hour', null)
                ->where('summary.total_price', 110000)
                ->where('summary.dp_amount', 55000)
                ->etc());
    }

    public function test_booking_confirmation_uses_the_first_slot_covering_each_hour(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'berbayar', 'price' => 60000],
            ['day' => 'senin', 'start' => '10:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 70000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 2,
            ]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingConfirm', false)
                ->where('summary.price_per_hour', 50000)
                ->where('summary.total_price', 100000)
                ->etc());
    }

    public function test_booking_confirmation_rejects_three_hour_duration(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '12:00', 'type' => 'gratis', 'price' => null],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 3,
            ]))
            ->assertRedirect(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertSessionHasErrors([
                'schedule_time' => 'Durasi maksimal 2 jam.',
            ]);
    }

    public function test_booking_confirmation_rejects_hours_with_a_gap_in_availability(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'gratis', 'price' => null],
            ['day' => 'senin', 'start' => '11:00', 'end' => '12:00', 'type' => 'gratis', 'price' => null],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 2,
            ]))
            ->assertRedirect(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertSessionHasErrors([
                'schedule_time' => 'Jadwal tidak tersedia.',
            ]);
    }

    public function test_booking_confirmation_rejects_mixed_free_and_paid_hours(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'gratis', 'price' => null],
            ['day' => 'senin', 'start' => '10:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 2,
            ]))
            ->assertRedirect(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertSessionHasErrors([
                'schedule_time' => 'Jam yang dipilih harus bertipe sama (semua gratis atau semua berbayar).',
            ]);
    }

    public function test_booking_confirmation_redirects_when_paid_mentor_has_no_bank_account(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $mentor->forceFill([
            'bank_name' => null,
            'bank_account_number' => null,
            'bank_account_holder' => null,
        ])->save();
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 1,
            ]))
            ->assertRedirect(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertSessionHasErrors([
                'schedule_time' => 'Mentor belum mengisi rekening untuk menerima DP.',
            ]);
    }

    public function test_booking_confirmation_redirects_when_paid_mentor_bank_account_is_incomplete(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $mentor->forceFill([
            'bank_name' => 'Bank Contoh',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => '  ',
        ])->save();
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 1,
            ]))
            ->assertRedirect(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertSessionHasErrors([
                'schedule_time' => 'Mentor belum mengisi rekening untuk menerima DP.',
            ]);
    }

    public function test_booking_confirmation_rounds_odd_paid_dp_up_to_an_integer(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'berbayar', 'price' => 1001],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 1,
            ]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingConfirm', false)
                ->where('summary.total_price', 1001)
                ->where('summary.dp_amount', 501)
                ->etc());
    }

    public function test_booking_confirmation_accepts_1500_on_the_tenth_day_in_jakarta(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'rabu', 'start' => '15:00', 'end' => '16:00', 'type' => 'gratis', 'price' => null],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-21',
                'start' => '15:00',
                'duration_hours' => 1,
            ]))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/BookingConfirm', false)
                ->where('summary.date', '2026-10-21')
                ->where('summary.start', '15:00')
                ->etc());
    }

    public function test_booking_confirmation_rejects_booking_on_the_eleventh_day(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'kamis', 'start' => '15:00', 'end' => '16:00', 'type' => 'gratis', 'price' => null],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-22',
                'start' => '15:00',
                'duration_hours' => 1,
            ]))
            ->assertRedirect(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertSessionHasErrors([
                'schedule_time' => 'Jadwal booking hanya dapat dipilih maksimal 10 hari ke depan.',
            ]);
    }

    public function test_booking_confirmation_redirects_with_error_when_time_is_outside_availability(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '11:00',
                'duration_hours' => 1,
            ]))
            ->assertRedirect(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertSessionHasErrors(['schedule_time' => 'Jadwal tidak tersedia.']);
    }

    public function test_booking_confirmation_redirects_with_error_when_slot_is_busy(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);
        $this->travelTo('2026-10-11 00:00:00');
        MentoringSession::query()->create([
            'student_id' => User::factory()->create()->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => '2026-10-12 02:00:00',
            'end_time' => '2026-10-12 03:00:00',
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $this->actingAs(User::factory()->create())
            ->get(route('student.booking.confirm', [
                'mentor' => $mentor->id,
                'date' => '2026-10-12',
                'start' => '09:00',
                'duration_hours' => 1,
            ]))
            ->assertRedirect(route('student.booking.schedule', ['mentor' => $mentor->id]))
            ->assertSessionHasErrors([
                'schedule_time' => 'Slot ini baru saja dibooking pengguna lain, silakan pilih slot lain.',
            ]);
    }

    public function test_store_rejects_booking_more_than_ten_days_ahead(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'kamis', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->submitBooking($mentor, [
            'schedule_time' => '2026-10-22T02:00:00+00:00',
        ])->assertSessionHasErrors([
            'schedule_time' => 'Jadwal booking hanya dapat dipilih maksimal 10 hari ke depan.',
        ]);

        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_store_accepts_1500_on_the_tenth_day_in_jakarta(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'rabu', 'start' => '15:00', 'end' => '16:00', 'type' => 'gratis', 'price' => null],
        ]);
        $this->travelTo('2026-10-11 00:00:00');

        $this->submitBooking($mentor, [
            'schedule_time' => '2026-10-21T15:00:00+07:00',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'schedule_time' => '2026-10-21 08:00:00',
        ]);
    }

    public function test_store_rejects_schedule_time_without_an_iso8601_offset(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ]);

        $this->submitBooking($mentor, [
            'schedule_time' => '2026-10-12T09:00:00',
        ])->assertSessionHasErrors([
            'schedule_time' => 'Jadwal booking harus menggunakan format ISO 8601 dengan zona waktu.',
        ]);
    }

    public function test_store_rejects_pdf_payment_proof(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');
        Storage::fake('public');

        $this->submitBooking($mentor, [
            'payment_dp_proof' => UploadedFile::fake()->create('payment.pdf', 10, 'application/pdf'),
        ])->assertSessionHasErrors('payment_dp_proof');

        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_store_accepts_png_payment_proof(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');
        Storage::fake('public');

        $this->submitBooking($mentor, [
            'payment_dp_proof' => UploadedFile::fake()->image('payment.png'),
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'payment_dp_status' => 'menunggu_verifikasi',
        ]);
    }

    public function test_store_accepts_two_hours_covered_by_separate_paid_slots(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'berbayar', 'price' => 50000],
            ['day' => 'senin', 'start' => '10:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');
        Storage::fake('public');

        $this->submitBooking($mentor, [
            'duration_hours' => 2,
            'payment_dp_proof' => UploadedFile::fake()->image('payment.png'),
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'duration_hours' => 2,
            'price_snapshot' => '100000.00',
        ]);
    }

    public function test_store_sums_different_hourly_prices_for_the_price_snapshot(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'berbayar', 'price' => 50000],
            ['day' => 'senin', 'start' => '10:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 60000],
        ]);
        $this->travelTo('2026-10-11 00:00:00');
        Storage::fake('public');

        $this->submitBooking($mentor, [
            'duration_hours' => 2,
            'payment_dp_proof' => UploadedFile::fake()->image('payment.png'),
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'duration_hours' => 2,
            'price_snapshot' => '110000.00',
        ]);
    }

    public function test_store_rejects_three_hour_duration(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '12:00', 'type' => 'gratis', 'price' => null],
        ]);

        $this->submitBooking($mentor, [
            'duration_hours' => 3,
        ])->assertSessionHasErrors([
            'duration_hours' => 'Durasi maksimal 2 jam.',
        ]);

        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_store_rejects_hours_with_a_gap_in_availability(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'gratis', 'price' => null],
            ['day' => 'senin', 'start' => '11:00', 'end' => '12:00', 'type' => 'gratis', 'price' => null],
        ]);

        $this->submitBooking($mentor, [
            'duration_hours' => 2,
        ])->assertSessionHasErrors([
            'schedule_time' => 'Jadwal tidak tersedia.',
        ]);

        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_store_rejects_mixed_free_and_paid_hours(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '10:00', 'type' => 'gratis', 'price' => null],
            ['day' => 'senin', 'start' => '10:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);

        $this->submitBooking($mentor, [
            'duration_hours' => 2,
        ])->assertSessionHasErrors([
            'schedule_time' => 'Jam yang dipilih harus bertipe sama (semua gratis atau semua berbayar).',
        ]);

        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    public function test_store_rejects_paid_booking_when_mentor_has_no_bank_account(): void
    {
        [$mentor] = $this->createMentorWithAvailability([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'berbayar', 'price' => 50000],
        ]);
        $mentor->forceFill([
            'bank_name' => null,
            'bank_account_number' => null,
            'bank_account_holder' => null,
        ])->save();
        $this->travelTo('2026-10-11 00:00:00');
        Storage::fake('public');

        $this->submitBooking($mentor, [
            'payment_dp_proof' => UploadedFile::fake()->image('payment.png'),
        ])->assertSessionHasErrors([
            'schedule_time' => 'Mentor belum mengisi rekening untuk menerima DP.',
        ]);

        $this->assertDatabaseMissing('mentoring_sessions', [
            'mentor_id' => $mentor->id,
        ]);
    }

    /**
     * @param  array<int, array<string, int|string|null>>  $availability
     * @return array{0: User, 1: MentorProfile}
     */
    private function createMentorWithAvailability(array $availability): array
    {
        $this->travelTo('2026-10-04 00:00:00');

        $mentor = User::factory()->create();
        if (collect($availability)->contains(
            fn (array $slot): bool => ($slot['type'] ?? 'gratis') === 'berbayar',
        )) {
            $mentor->forceFill([
                'bank_name' => 'Bank Contoh',
                'bank_account_number' => '1234567890',
                'bank_account_holder' => 'Nama Mentor',
            ])->save();
        }

        $mentorProfile = MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'price_per_session' => 999999,
            'availability_schedule' => $availability,
        ]);

        return [$mentor, $mentorProfile];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function submitBooking(User $mentor, array $overrides = []): TestResponse
    {
        $student = User::factory()->create();
        $payload = array_merge([
            'mentor_id' => $mentor->id,
            'schedule_time' => '2026-10-12T02:00:00+00:00',
            'duration_hours' => 1,
            'notes_from_student' => 'Mohon bimbingan.',
        ], $overrides);

        return $this->actingAs($student)->post(route('booking.store'), $payload);
    }
}
