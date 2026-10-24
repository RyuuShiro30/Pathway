<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FlashMessageSharingTest extends TestCase
{
    use RefreshDatabase;

    public function test_success_flash_message_is_shared_with_inertia_pages(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)
            ->withSession(['success' => 'Pengajuan berhasil dibatalkan.'])
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('flash.success', 'Pengajuan berhasil dibatalkan.'));
    }

    public function test_flash_success_is_null_when_there_is_no_message(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('flash.success', null));
    }
}
