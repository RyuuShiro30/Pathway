<?php

namespace Tests\Feature;

use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use App\Models\User;
use App\Services\MentorSuspensionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentorSuspensionServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspend_creates_active_record_and_flags_profile(): void
    {
        $mentor = $this->createMentor();

        $suspension = $this->service()->suspend(
            $mentor->id,
            MentorSuspension::REASON_LATE_REFUND,
            null,
            'Refund lewat 48 jam',
        );

        $this->assertNotNull($suspension);
        $this->assertSame('refund_terlambat', $suspension->reason);
        $this->assertSame('Refund lewat 48 jam', $suspension->note);
        $this->assertNull($suspension->lifted_at);
        $this->assertNotNull($suspension->suspended_at);
        $this->assertTrue($this->service()->isSuspended($mentor->id));
        $this->assertTrue($this->profileOf($mentor)->is_suspended);
    }

    public function test_mentor_without_suspension_is_not_suspended(): void
    {
        $mentor = $this->createMentor();

        $this->assertFalse($this->service()->isSuspended($mentor->id));
        $this->assertFalse($this->profileOf($mentor)->is_suspended);
    }

    public function test_suspending_an_already_suspended_mentor_does_not_duplicate(): void
    {
        $mentor = $this->createMentor();

        $this->service()->suspend($mentor->id, MentorSuspension::REASON_NO_SHOW);
        $second = $this->service()->suspend($mentor->id, MentorSuspension::REASON_LATE_REFUND);

        $this->assertNull($second);
        $this->assertSame(1, MentorSuspension::query()->where('mentor_id', $mentor->id)->count());
    }

    public function test_lift_closes_suspension_and_clears_flag(): void
    {
        $mentor = $this->createMentor();
        $admin = User::factory()->create();

        $this->service()->suspend($mentor->id, MentorSuspension::REASON_NO_SHOW);

        $lifted = $this->service()->lift($mentor->id, $admin->id, 'Bukti sudah diperiksa');

        $this->assertSame(1, $lifted);
        $this->assertFalse($this->service()->isSuspended($mentor->id));
        $this->assertFalse($this->profileOf($mentor)->is_suspended);

        $record = MentorSuspension::query()->where('mentor_id', $mentor->id)->firstOrFail();

        $this->assertNotNull($record->lifted_at);
        $this->assertSame($admin->id, $record->lifted_by);
        $this->assertSame('Bukti sudah diperiksa', $record->lift_note);
    }

    public function test_lift_without_active_suspension_returns_zero(): void
    {
        $mentor = $this->createMentor();

        $this->assertSame(0, $this->service()->lift($mentor->id));
    }

    public function test_mentor_can_be_suspended_again_after_being_lifted(): void
    {
        $mentor = $this->createMentor();

        $this->service()->suspend($mentor->id, MentorSuspension::REASON_NO_SHOW);
        $this->service()->lift($mentor->id);

        $again = $this->service()->suspend($mentor->id, MentorSuspension::REASON_LATE_REFUND);

        $this->assertNotNull($again);
        $this->assertSame(2, MentorSuspension::query()->where('mentor_id', $mentor->id)->count());
        $this->assertTrue($this->profileOf($mentor)->is_suspended);
    }

    private function service(): MentorSuspensionService
    {
        return app(MentorSuspensionService::class);
    }

    private function profileOf(User $mentor): MentorProfile
    {
        return MentorProfile::query()->where('user_id', $mentor->id)->firstOrFail();
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
