<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
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

        $response->assertRedirect();
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
            'schedule_time' => '2026-10-12T04:00:00Z',
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
            'schedule_time' => '2026-10-13T02:00:00Z',
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
            'schedule_time' => '2026-10-12T03:30:00Z',
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
            'schedule_time' => '2026-10-12T02:30:00Z',
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
            'schedule_time' => '2026-10-12T17:30:00Z',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'mentor_id' => $mentor->id,
            'schedule_time' => '2026-10-12 17:30:00',
            'is_free_session' => true,
        ]);
    }

    /**
     * @param  array<int, array<string, int|string|null>>  $availability
     * @return array{0: User, 1: MentorProfile}
     */
    private function createMentorWithAvailability(array $availability): array
    {
        $this->travelTo('2026-10-01 00:00:00');

        $mentor = User::factory()->create();
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
            'schedule_time' => '2026-10-12T02:00:00Z',
            'duration_hours' => 1,
            'notes_from_student' => 'Mohon bimbingan.',
        ], $overrides);

        return $this->actingAs($student)->post(route('booking.store'), $payload);
    }
}
