<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class MyBookingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_only_sees_their_own_bookings_and_safe_mentor_details(): void
    {
        $student = User::factory()->create();
        $otherStudent = User::factory()->create();
        [$mentor] = $this->createMentor();
        $ownBooking = $this->createBooking($student, $mentor);
        $this->createBooking($otherStudent, $mentor);

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/MyBookings', false)
                ->has('bookings', 1)
                ->where('bookings.0.id', $ownBooking->id)
                ->where('bookings.0.mentor.id', $mentor->id)
                ->where('bookings.0.mentor.name', $mentor->name)
                ->where('bookings.0.mentor.expertise', 'Web Development')
                ->missing('bookings.0.student_id')
                ->missing('bookings.0.payment_dp_proof')
                ->missing('bookings.0.proof_file')
                ->missing('bookings.0.notes_from_mentor')
                ->missing('bookings.0.refund_proof')
                ->etc());
    }

    public function test_bookings_are_sorted_newest_first_and_discord_is_only_shared_for_active_sessions(): void
    {
        $student = User::factory()->create();
        [$mentor] = $this->createMentor();
        $pending = $this->createBooking(
            $student,
            $mentor,
            'diajukan',
            '2026-10-12 02:00:00',
            ['discord_link' => 'https://example.test/pending'],
        );
        $confirmed = $this->createBooking(
            $student,
            $mentor,
            'dikonfirmasi',
            '2026-10-13 02:00:00',
            ['discord_link' => 'https://example.test/confirmed'],
        );
        $ongoing = $this->createBooking(
            $student,
            $mentor,
            'berlangsung',
            '2026-10-14 02:00:00',
            ['discord_link' => 'https://example.test/ongoing'],
        );
        $completed = $this->createBooking(
            $student,
            $mentor,
            'selesai',
            '2026-10-15 02:00:00',
            ['discord_link' => 'https://example.test/completed'],
        );
        $cancelled = $this->createBooking(
            $student,
            $mentor,
            'dibatalkan',
            '2026-10-16 02:00:00',
            ['discord_link' => 'https://example.test/cancelled'],
        );

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/MyBookings', false)
                ->has('bookings', 5)
                ->where('bookings.0.id', $cancelled->id)
                ->where('bookings.1.id', $completed->id)
                ->where('bookings.2.id', $ongoing->id)
                ->where('bookings.2.discord_link', 'https://example.test/ongoing')
                ->where('bookings.3.id', $confirmed->id)
                ->where('bookings.3.discord_link', 'https://example.test/confirmed')
                ->where('bookings.4.id', $pending->id)
                ->where('bookings.4.discord_link', null)
                ->where('bookings.1.discord_link', null)
                ->where('bookings.0.discord_link', null)
                ->etc());
    }

    public function test_booking_stats_are_calculated_from_all_of_the_students_sessions(): void
    {
        $student = User::factory()->create();
        $otherStudent = User::factory()->create();
        [$mentor] = $this->createMentor();
        $this->createBooking($student, $mentor, 'diajukan', '2026-10-12 02:00:00');
        $this->createBooking($student, $mentor, 'dikonfirmasi', '2026-10-13 02:00:00');
        $this->createBooking($student, $mentor, 'selesai', '2026-10-14 02:00:00', [
            'duration_hours' => 2,
        ]);
        $this->createBooking($student, $mentor, 'selesai', '2026-10-15 02:00:00', [
            'duration_hours' => 3,
        ]);
        $this->createBooking($student, $mentor, 'dibatalkan', '2026-10-16 02:00:00', [
            'duration_hours' => 4,
        ]);
        $this->createBooking($otherStudent, $mentor, 'selesai', '2026-10-17 02:00:00', [
            'duration_hours' => 20,
        ]);

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/MyBookings', false)
                ->where('stats.total', 5)
                ->where('stats.menunggu_konfirmasi', 1)
                ->where('stats.siap_datang', 1)
                ->where('stats.jam_mentoring', 5)
                ->etc());
    }

    public function test_student_booking_list_is_limited_to_the_100_newest_sessions(): void
    {
        $student = User::factory()->create();
        [$mentor] = $this->createMentor();

        for ($index = 0; $index < 101; $index++) {
            $this->createBooking(
                $student,
                $mentor,
                'diajukan',
                now()->addDays($index)->format('Y-m-d H:i:s'),
            );
        }

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/MyBookings', false)
                ->has('bookings', 100)
                ->where('stats.total', 101)
                ->etc());
    }

    public function test_guest_is_redirected_to_login_from_student_booking_list(): void
    {
        $this->get(route('student.bookings.index'))
            ->assertRedirect(route('login'));
    }

    public function test_successful_booking_redirects_to_student_booking_list(): void
    {
        $this->travelTo('2026-10-11 00:00:00');
        $student = User::factory()->create();
        [$mentor] = $this->createMentor([
            [
                'day' => 'senin',
                'start' => '09:00',
                'end' => '10:00',
                'type' => 'gratis',
                'price' => null,
            ],
        ]);

        $this->actingAs($student)
            ->post(route('booking.store'), [
                'mentor_id' => $mentor->id,
                'schedule_time' => '2026-10-12T02:00:00+00:00',
                'duration_hours' => 1,
            ])
            ->assertRedirect(route('student.bookings.index'))
            ->assertSessionHas('success', 'Booking berhasil diajukan, menunggu konfirmasi mentor.');
    }

    public function test_refund_proof_path_and_uploaded_at_are_exposed_only_when_awaiting_refund_confirmation(): void
    {
        $student = User::factory()->create();
        [$mentor] = $this->createMentor();
        $mentor->update([
            'email' => 'mentor@example.test',
            'bank_name' => 'BCA',
            'bank_account_number' => '987654321',
            'bank_account_holder' => 'Mentor Rahasia',
        ]);

        $awaitingSession = $this->createBooking($student, $mentor, 'dibatalkan', '2026-10-15 02:00:00', [
            'refund_status' => 'menunggu_konfirmasi',
            'refund_proof' => 'refund-proofs/receipt.pdf',
            'refund_proof_uploaded_at' => '2026-10-14 15:30:00',
        ]);

        $waitingSession = $this->createBooking($student, $mentor, 'dibatalkan', '2026-10-14 02:00:00', [
            'refund_status' => 'menunggu',
            'refund_proof' => 'refund-proofs/receipt2.pdf',
            'refund_proof_uploaded_at' => '2026-10-13 15:30:00',
        ]);

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Student/MyBookings', false)
                ->where('bookings.0.id', $awaitingSession->id)
                ->where('bookings.0.refund_proof_path', 'refund-proofs/receipt.pdf')
                ->where('bookings.0.refund_proof_uploaded_at', '2026-10-14T15:30:00.000000Z')
                ->where('bookings.1.id', $waitingSession->id)
                ->where('bookings.1.refund_proof_path', null)
                ->where('bookings.1.refund_proof_uploaded_at', null)
                ->missing('bookings.0.mentor.email')
                ->missing('bookings.0.mentor.bank_name')
                ->missing('bookings.0.mentor.bank_account_number')
                ->missing('bookings.0.mentor.bank_account_holder')
                ->missing('bookings.1.mentor.email')
                ->missing('bookings.1.mentor.bank_name')
                ->missing('bookings.1.mentor.bank_account_number')
                ->missing('bookings.1.mentor.bank_account_holder')
                ->etc());
    }

    /**
     * @param  array<int, array<string, int|string|null>>  $availability
     * @return array{0: User, 1: MentorProfile}
     */
    private function createMentor(array $availability = []): array
    {
        $mentor = User::factory()->create();
        $profile = MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'availability_schedule' => $availability,
        ]);

        return [$mentor, $profile];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createBooking(
        User $student,
        User $mentor,
        string $status = 'diajukan',
        string $scheduleTime = '2026-10-12 02:00:00',
        array $overrides = [],
    ): MentoringSession {
        return MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => $status,
            'schedule_time' => $scheduleTime,
            'end_time' => date('Y-m-d H:i:s', strtotime($scheduleTime.' +1 hour')),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
            'discord_link' => null,
        ], $overrides));
    }
}
