<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MentorCompleteSessionPointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Notification::fake();
    }

    public function test_mentor_receives_100_points_after_completing_a_free_session(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createSession($student, $mentor, true);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.complete', $session->id),
            [
                'proof_file' => UploadedFile::fake()->image('proof.jpg'),
                'notes_from_mentor' => 'Sesi mentoring berhasil diselesaikan.',
            ],
        );

        $response->assertRedirect(route('mentor.dashboard'));
        $response->assertSessionHas('success', 'Sesi berhasil diselesaikan');

        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'selesai',
        ]);

        $this->assertDatabaseHas('point_transactions', [
            'user_id' => $mentor->id,
            'amount' => 100,
            'transaction_type' => 'earned_mentoring',
            'related_id' => $session->id,
        ]);

        $this->assertDatabaseMissing('point_transactions', [
            'user_id' => $student->id,
            'transaction_type' => 'earned_mentoring',
            'related_id' => $session->id,
        ]);
    }

    public function test_paid_session_does_not_award_points(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.complete', $session->id),
            [
                'proof_file' => UploadedFile::fake()->image('proof.jpg'),
                'notes_from_mentor' => 'Sesi berbayar selesai.',
            ],
        );

        $response->assertRedirect(route('mentor.dashboard'));

        $this->assertDatabaseMissing('point_transactions', [
            'user_id' => $mentor->id,
            'transaction_type' => 'earned_mentoring',
            'related_id' => $session->id,
        ]);
    }

    public function test_another_mentor_cannot_complete_a_session_they_do_not_own(): void
    {
        $owner = $this->createMentor();
        $anotherMentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createSession($student, $owner, true);

        $response = $this->actingAs($anotherMentor)->patch(
            route('mentor.session.complete', $session->id),
            [
                'proof_file' => UploadedFile::fake()->image('proof.jpg'),
            ],
        );

        $response->assertNotFound();

        $this->assertDatabaseMissing('point_transactions', [
            'user_id' => $owner->id,
            'transaction_type' => 'earned_mentoring',
            'related_id' => $session->id,
        ]);
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->mentor()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        return $mentor;
    }

    private function createSession(
        User $student,
        User $mentor,
        bool $isFreeSession,
    ): MentoringSession {
        $scheduleTime = now()->addDays(3)->setTime(9, 0);

        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'berlangsung',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => $isFreeSession,
            'price_snapshot' => $isFreeSession ? 0 : 100000,
            'payment_dp_status' => 'belum_bayar',
            'payment_dp_proof' => null,
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ]);
    }
}
