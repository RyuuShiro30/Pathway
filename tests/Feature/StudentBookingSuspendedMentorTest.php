<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use App\Models\User;
use App\Services\MentorSuspensionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentBookingSuspendedMentorTest extends TestCase
{
    use RefreshDatabase;

    private const MESSAGE = 'Mentor ini sedang tidak menerima booking baru.';

    public function test_student_cannot_create_booking_for_suspended_mentor(): void
    {
        $student = User::factory()->create();
        $mentor = $this->createMentor();

        app(MentorSuspensionService::class)->suspend(
            $mentor->id,
            MentorSuspension::REASON_LATE_REFUND,
        );

        $this->actingAs($student)
            ->post(route('booking.store'), $this->payload($mentor))
            ->assertSessionHasErrors(['schedule_time' => self::MESSAGE]);

        $this->assertSame(
            0,
            MentoringSession::query()->where('mentor_id', $mentor->id)->count(),
        );
    }

    public function test_confirm_page_redirects_back_for_suspended_mentor(): void
    {
        $student = User::factory()->create();
        $mentor = $this->createMentor();

        app(MentorSuspensionService::class)->suspend(
            $mentor->id,
            MentorSuspension::REASON_NO_SHOW,
        );

        $this->actingAs($student)
            ->get(route('student.booking.confirm', $mentor->id))
            ->assertStatus(302);
    }

    public function test_lifted_suspension_no_longer_blocks_booking_with_suspension_message(): void
    {
        $student = User::factory()->create();
        $mentor = $this->createMentor();

        $service = app(MentorSuspensionService::class);
        $service->suspend($mentor->id, MentorSuspension::REASON_NO_SHOW);
        $service->lift($mentor->id);

        $this->actingAs($student)
            ->post(route('booking.store'), $this->payload($mentor))
            ->assertSessionDoesntHaveErrors(['schedule_time' => self::MESSAGE]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(User $mentor): array
    {
        return [
            'mentor_id' => $mentor->id,
            'schedule_time' => now()->addDay()->format('Y-m-d\TH:i:sP'),
            'duration_hours' => 1,
        ];
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        return $mentor;
    }
}
