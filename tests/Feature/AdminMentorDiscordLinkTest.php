<?php

namespace Tests\Feature;

use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminMentorDiscordLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentors_page_exposes_discord_room_link(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentorProfile();

        $this->actingAs($admin)
            ->get(route('admin.mentors.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Mentor/Index', false)
                ->where('mentors.0.id', $mentor->id)
                ->where('mentors.0.discord_room_link', 'https://discord.gg/mentor-room'));
    }

    public function test_mentors_page_marks_missing_discord_room_link(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentorProfile();

        $mentor->update(['discord_room_link' => null]);

        $this->actingAs($admin)
            ->get(route('admin.mentors.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('mentors.0.discord_room_link', null));
    }

    public function test_admin_can_save_discord_room_link(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentorProfile();

        $response = $this->actingAs($admin)
            ->patch(route('admin.mentors.discord', $mentor->id), [
                'discord_room_link' => 'https://discord.gg/room-mentor',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Link room Discord mentor berhasil disimpan.');
        $this->assertSame('https://discord.gg/room-mentor', $mentor->fresh()->discord_room_link);
    }

    public function test_admin_can_replace_existing_discord_room_link(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentorProfile();

        $this->actingAs($admin)
            ->patch(route('admin.mentors.discord', $mentor->id), [
                'discord_room_link' => 'https://discord.com/invite/room-baru',
            ]);

        $this->assertSame('https://discord.com/invite/room-baru', $mentor->fresh()->discord_room_link);
    }

    public function test_discord_room_link_is_required(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentorProfile();

        $response = $this->actingAs($admin)
            ->patch(route('admin.mentors.discord', $mentor->id), [
                'discord_room_link' => '',
            ]);

        $response->assertSessionHasErrors([
            'discord_room_link' => 'Link room Discord wajib diisi.',
        ]);
        $this->assertSame('https://discord.gg/mentor-room', $mentor->fresh()->discord_room_link);
    }

    public function test_non_discord_link_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentorProfile();

        $response = $this->actingAs($admin)
            ->patch(route('admin.mentors.discord', $mentor->id), [
                'discord_room_link' => 'https://zoom.us/j/123456789',
            ]);

        $response->assertSessionHasErrors([
            'discord_room_link' => 'Format link tidak valid. Gunakan tautan invite Discord, contoh: https://discord.gg/room-mentor.',
        ]);
        $this->assertSame('https://discord.gg/mentor-room', $mentor->fresh()->discord_room_link);
    }

    public function test_discord_room_link_max_length_is_reported(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentorProfile();

        $response = $this->actingAs($admin)
            ->patch(route('admin.mentors.discord', $mentor->id), [
                'discord_room_link' => 'https://discord.gg/'.str_repeat('a', 250),
            ]);

        $response->assertSessionHasErrors([
            'discord_room_link' => 'Link room Discord maksimal 255 karakter.',
        ]);
    }

    public function test_non_admin_cannot_save_discord_room_link(): void
    {
        $student = User::factory()->student()->create();
        $mentor = $this->createMentorProfile();

        $this->patch(route('admin.mentors.discord', $mentor->id), [
            'discord_room_link' => 'https://discord.gg/room-mentor',
        ])->assertRedirect(route('admin.login'));

        $this->actingAs($student)
            ->patch(route('admin.mentors.discord', $mentor->id), [
                'discord_room_link' => 'https://discord.gg/room-mentor',
            ])
            ->assertNotFound();

        $this->assertSame('https://discord.gg/mentor-room', $mentor->fresh()->discord_room_link);
    }

    private function createMentorProfile(): MentorProfile
    {
        $mentor = User::factory()->mentor()->create();

        return MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);
    }
}
