<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\NoShowReported;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_sees_own_notifications(): void
    {
        $user = User::factory()->create();
        $user->notify(new NoShowReported('/bookings'));

        $this->actingAs($user)
            ->get(route('notifications.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Notifications/Index')
                ->has('notifications', 1)
                ->where('notifications.0.is_read', false));
    }

    public function test_reading_marks_as_read_and_redirects_to_url(): void
    {
        $user = User::factory()->create();
        $user->notify(new NoShowReported('/bookings'));
        $id = $user->notifications()->first()->id;

        $this->actingAs($user)
            ->patch(route('notifications.read', $id))
            ->assertRedirect('/bookings');

        $this->assertSame(0, $user->unreadNotifications()->count());
    }

    public function test_cannot_read_another_users_notification(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $owner->notify(new NoShowReported('/bookings'));
        $id = $owner->notifications()->first()->id;

        $this->actingAs($other)
            ->patch(route('notifications.read', $id))
            ->assertNotFound();

        $this->assertSame(1, $owner->unreadNotifications()->count());
    }

    public function test_read_all_marks_everything_as_read(): void
    {
        $user = User::factory()->create();
        $user->notify(new NoShowReported('/bookings'));
        $user->notify(new NoShowReported('/bookings'));

        $this->actingAs($user)
            ->patch(route('notifications.read-all'))
            ->assertRedirect(route('notifications.index'));

        $this->assertSame(0, $user->unreadNotifications()->count());
    }
}
