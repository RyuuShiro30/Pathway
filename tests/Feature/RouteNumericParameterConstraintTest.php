<?php

namespace Tests\Feature;

use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RouteNumericParameterConstraintTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_numeric_parameters_return_404_not_500(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Backend',
        ]);
        $admin = User::factory()->admin()->create();

        // 1. /bookings/abc/cancel returns 404
        $this->actingAs($student)
            ->patch('/bookings/abc/cancel')
            ->assertNotFound();

        // 2. /mentor/session/abc returns 404
        $this->actingAs($mentor)
            ->get('/mentor/session/abc')
            ->assertNotFound();

        // 3. /admin/refund-reports/abc returns 404
        $this->actingAs($admin)
            ->get('/admin/refund-reports/abc')
            ->assertNotFound();
    }
}
