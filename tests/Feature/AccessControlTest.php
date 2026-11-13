<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Mentee (student) yang mengakses /mentor/dashboard harus mendapat 403.
     */
    public function test_student_cannot_access_mentor_dashboard(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)
            ->get(route('mentor.dashboard'))
            ->assertForbidden();
    }

    /**
     * Mentee yang mengakses /admin/* harus mendapat 404.
     */
    public function test_student_cannot_access_admin_area(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student)
            ->get(route('admin.dashboard'))
            ->assertNotFound();
    }

    /**
     * Mentor yang mengakses /admin/* harus mendapat 404.
     */
    public function test_mentor_cannot_access_admin_area(): void
    {
        $mentor = User::factory()->mentor()->create();

        $this->actingAs($mentor)
            ->get(route('admin.dashboard'))
            ->assertNotFound();
    }

    /**
     * User biasa (student) di /transactions hanya melihat data miliknya sendiri,
     * bukan transaksi milik user lain.
     */
    public function test_student_transactions_are_scoped_to_own_records(): void
    {
        $student = User::factory()->student()->create();
        $mentor = User::factory()->mentor()->create();
        $otherStudent = User::factory()->student()->create();

        // Sesi milik $student
        MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'schedule_time' => now()->subDay(),
            'end_time' => now()->subDay()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        // Sesi milik $otherStudent (tidak boleh terlihat oleh $student)
        MentoringSession::query()->create([
            'student_id' => $otherStudent->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'schedule_time' => now()->subDay(),
            'end_time' => now()->subDay()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $response = $this->actingAs($student)
            ->get(route('transactions.index'))
            ->assertOk();

        $transactions = data_get($response->viewData('page'), 'props.transactions.data');

        $this->assertCount(1, $transactions);
        $this->assertSame($student->name, $transactions[0]['student_name']);
    }
}
