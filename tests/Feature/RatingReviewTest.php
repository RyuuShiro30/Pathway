<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\Review;
use App\Models\User;
use App\Notifications\SessionEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RatingReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_review_waits_for_moderation_before_showing_on_mentor_profile(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $profile = $this->createMentorProfile($mentor);
        $session = $this->createSession($student, $mentor, 'selesai');

        $this->actingAs($student)
            ->post(route('reviews.store', $session->id), [
                'rating' => 5,
                'feedback' => 'Mentor sangat membantu.',
            ])
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('success', 'Ulasan berhasil dikirim dan menunggu moderasi admin.');

        $this->assertDatabaseHas('reviews', [
            'session_id' => $session->id,
            'rating' => 5,
            'status' => Review::STATUS_MENUNGGU,
        ]);

        $this->assertSame('0.00', $profile->fresh()->avg_rating);

        $this->get(route('mentors.show', $profile->id))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mentors/Show')
                ->where('mentor.reviews_count', 0)
                ->where('mentor.avg_rating', fn ($value) => (float) $value === 0.0)
                ->has('mentor.reviews', 0));
    }

    public function test_review_is_blocked_until_session_is_completed(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $this->createMentorProfile($mentor);
        $session = $this->createSession($student, $mentor, 'berlangsung');

        $this->actingAs($student)
            ->get(route('reviews.create', $session->id))
            ->assertNotFound();

        $this->actingAs($student)
            ->post(route('reviews.store', $session->id), [
                'rating' => 5,
            ])
            ->assertNotFound();

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_rating_outside_one_to_five_is_rejected(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $this->createMentorProfile($mentor);
        $session = $this->createSession($student, $mentor, 'selesai');

        foreach ([0, 6, null] as $rating) {
            $this->actingAs($student)
                ->post(route('reviews.store', $session->id), [
                    'rating' => $rating,
                ])
                ->assertSessionHasErrors('rating');
        }

        $this->assertDatabaseCount('reviews', 0);
    }

    public function test_review_cannot_be_submitted_twice_for_the_same_session(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $this->createMentorProfile($mentor);
        $session = $this->createSession($student, $mentor, 'selesai');

        Review::query()->create([
            'session_id' => $session->id,
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'rating' => 4,
            'status' => Review::STATUS_DISETUJUI,
        ]);

        $this->actingAs($student)
            ->post(route('reviews.store', $session->id), [
                'rating' => 5,
            ])
            ->assertSessionHas('error', 'Sesi ini sudah memiliki ulasan.');

        $this->assertDatabaseCount('reviews', 1);
    }

    public function test_admin_moderation_controls_published_reviews_and_average_rating(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $profile = $this->createMentorProfile($mentor);

        $fiveStar = $this->createReview($student, $mentor, 5);
        $threeStar = $this->createReview($student, $mentor, 3);
        $oneStar = $this->createReview($student, $mentor, 1);

        $this->actingAs($admin)
            ->patch(route('admin.reviews.approve', $fiveStar->id))
            ->assertSessionHas('success');

        $this->actingAs($admin)
            ->patch(route('admin.reviews.approve', $threeStar->id))
            ->assertSessionHas('success');

        $this->assertSame('4.00', $profile->fresh()->avg_rating);

        $this->get(route('mentors.show', $profile->id))
            ->assertInertia(fn (Assert $page) => $page
                ->where('mentor.reviews_count', 2)
                ->where('mentor.avg_rating', fn ($value) => (float) $value === 4.0)
                ->has('mentor.reviews', 2));

        $this->actingAs($admin)
            ->patch(route('admin.reviews.reject', $oneStar->id), [
                'moderation_note' => 'Ulasan tidak pantas.',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('reviews', [
            'id' => $oneStar->id,
            'status' => Review::STATUS_DITOLAK,
            'moderation_note' => 'Ulasan tidak pantas.',
        ]);

        $this->assertSame('4.00', $profile->fresh()->avg_rating);

        $this->actingAs($admin)
            ->patch(route('admin.reviews.reject', $threeStar->id))
            ->assertSessionHas('success');

        $this->assertSame('5.00', $profile->fresh()->avg_rating);

        $this->get(route('mentors.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mentors/Index')
                ->where('mentors.data.0.reviews_count', 1)
                ->where('mentors.data.0.avg_rating', fn ($value) => (float) $value === 5.0));
    }

    public function test_non_admin_cannot_moderate_reviews(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $review = $this->createReview($student, $mentor, 2);

        $this->actingAs($student)
            ->patch(route('admin.reviews.approve', $review->id))
            ->assertNotFound();

        $this->assertSame(Review::STATUS_MENUNGGU, $review->fresh()->status);
    }

    public function test_auto_rate_gives_five_stars_after_seven_days_without_review(): void
    {
        $this->travelTo(Carbon::parse('2026-11-20 12:00:00'));

        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $profile = $this->createMentorProfile($mentor);

        $oldSession = $this->createSession($student, $mentor, 'selesai', now()->subDays(8));
        $recentSession = $this->createSession($student, $mentor, 'selesai', now()->subDays(2));
        $reviewedSession = $this->createSession($student, $mentor, 'selesai', now()->subDays(10));

        Review::query()->create([
            'session_id' => $reviewedSession->id,
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'rating' => 3,
            'status' => Review::STATUS_DISETUJUI,
        ]);

        $this->artisan('reviews:auto-rate')->assertSuccessful();

        $this->assertDatabaseHas('reviews', [
            'session_id' => $oldSession->id,
            'rating' => 5,
            'feedback' => null,
            'status' => Review::STATUS_DISETUJUI,
        ]);

        $this->assertDatabaseMissing('reviews', [
            'session_id' => $recentSession->id,
        ]);

        $this->assertDatabaseCount('reviews', 2);
        $this->assertSame('4.00', $profile->fresh()->avg_rating);

        $this->artisan('reviews:auto-rate')->assertSuccessful();
        $this->assertDatabaseCount('reviews', 2);
    }

    public function test_consecutive_one_star_reviews_flag_mentor_for_admin(): void
    {
        $this->travelTo(Carbon::parse('2026-11-20 12:00:00'));

        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();

        $flaggedMentor = User::factory()->mentor()->create();
        $this->createMentorProfile($flaggedMentor);

        foreach ([3, 2, 1] as $daysAgo) {
            Review::query()->forceCreate([
                'session_id' => $this->createSession($student, $flaggedMentor, 'selesai')->id,
                'student_id' => $student->id,
                'mentor_id' => $flaggedMentor->id,
                'rating' => 1,
                'status' => Review::STATUS_DISETUJUI,
                'created_at' => now()->subDays($daysAgo),
                'updated_at' => now()->subDays($daysAgo),
            ]);
        }

        $recoveringMentor = User::factory()->mentor()->create();
        $this->createMentorProfile($recoveringMentor);

        foreach ([[3, 1], [2, 1], [1, 5]] as [$daysAgo, $rating]) {
            Review::query()->forceCreate([
                'session_id' => $this->createSession($student, $recoveringMentor, 'selesai')->id,
                'student_id' => $student->id,
                'mentor_id' => $recoveringMentor->id,
                'rating' => $rating,
                'status' => Review::STATUS_DISETUJUI,
                'created_at' => now()->subDays($daysAgo),
                'updated_at' => now()->subDays($daysAgo),
            ]);
        }

        $this->actingAs($admin)
            ->get(route('admin.reviews.index', ['status' => 'disetujui']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Review/Index')
                ->has('flaggedMentors', 1)
                ->where('flaggedMentors.0.id', $flaggedMentor->id));

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('reviewQueue.flagged_mentors', 1)
                ->where('reviewQueue.pending_reviews', 0));
    }

    public function test_completing_session_sends_pending_review_notification(): void
    {
        Storage::fake('local');
        Notification::fake();

        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $this->createMentorProfile($mentor);
        $session = $this->createSession($student, $mentor, 'berlangsung');

        $this->actingAs($mentor)
            ->patch(route('mentor.session.complete', $session->id), [
                'proof_file' => UploadedFile::fake()->image('proof.jpg'),
            ])
            ->assertSessionHasNoErrors();

        Notification::assertSentTo(
            $student,
            SessionEvent::class,
            function (SessionEvent $notification) use ($student, $session): bool {
                $data = $notification->toArray($student);

                return str_starts_with($data['message'], 'Menunggu Ulasan')
                    && $data['url'] === '/sessions/'.$session->id.'/review';
            }
        );
    }

    private function createMentorProfile(User $mentor): MentorProfile
    {
        return MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);
    }

    private function createSession(
        User $student,
        User $mentor,
        string $status,
        ?Carbon $endTime = null,
    ): MentoringSession {
        $endTime ??= now()->addHour();

        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => $status,
            'schedule_time' => $endTime->copy()->subHour(),
            'end_time' => $endTime,
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);
    }

    private function createReview(User $student, User $mentor, int $rating): Review
    {
        $session = $this->createSession($student, $mentor, 'selesai');

        return Review::query()->create([
            'session_id' => $session->id,
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'rating' => $rating,
            'status' => Review::STATUS_MENUNGGU,
        ]);
    }
}
