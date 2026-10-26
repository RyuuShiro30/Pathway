<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use App\Notifications\MentorSuspended;
use App\Services\MentorSuspensionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationTriggersTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspending_mentor_stores_database_notification(): void
    {
        $mentor = User::factory()->create();

        app(MentorSuspensionService::class)->suspend($mentor->id, 'refund_terlambat');

        $this->assertSame(1, $mentor->unreadNotifications()->count());
        $this->assertSame(
            MentorSuspended::class,
            $mentor->notifications()->first()->type,
        );
        $this->assertStringContainsString(
            'refund terlambat',
            $mentor->notifications()->first()->data['message'],
        );
    }

    public function test_unread_count_is_shared_to_pages(): void
    {
        $user = User::factory()->create();
        $user->notify(new MentorSuspended('manual'));

        $this->actingAs($user)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('notifications.unread_count', 1));
    }

    public function test_reported_user_gets_notified_when_no_show_is_reported(): void
    {
        $this->travelTo('2026-10-20 10:20:00');
        Storage::fake('local');

        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $start = Carbon::parse('2026-10-20 10:00:00');

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => $start,
            'end_time' => $start->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $this->actingAs($student)
            ->post(route('no-show.store', $session->id), [
                'evidence' => UploadedFile::fake()->image('bukti.png'),
                'reporter_note' => 'Mentor tidak hadir.',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, $mentor->unreadNotifications()->count());
        $this->assertSame(0, $student->unreadNotifications()->count());
    }
}
