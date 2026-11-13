<?php

namespace Tests\Feature;

use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Contracts\Provider as SocialiteProvider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Tests\TestCase;

class RoleBasedRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_redirects_to_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'email' => $admin->email,
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($admin);
        $response->assertRedirect(route('admin.dashboard'));
    }

    public function test_mentor_login_redirects_to_mentor_dashboard(): void
    {
        $mentor = User::factory()->mentor()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'email' => $mentor->email,
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($mentor);
        $response->assertRedirect(route('mentor.dashboard'));
    }

    public function test_student_login_redirects_to_dashboard(): void
    {
        $student = User::factory()->student()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->post('/login', [
            'email' => $student->email,
            'password' => 'password123',
        ]);

        $this->assertAuthenticatedAs($student);
        $response->assertRedirect(route('dashboard'));
    }

    public function test_authenticated_admin_visiting_login_redirects_to_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/login');

        $response->assertRedirect('/admin/dashboard');
    }

    public function test_authenticated_mentor_visiting_login_redirects_to_mentor_dashboard(): void
    {
        $mentor = User::factory()->mentor()->create();

        $response = $this->actingAs($mentor)->get('/login');

        $response->assertRedirect('/mentor/dashboard');
    }

    public function test_authenticated_student_visiting_login_redirects_to_dashboard(): void
    {
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student)->get('/login');

        $response->assertRedirect('/dashboard');
    }

    public function test_google_callback_redirects_admin_to_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create([
            'google_id' => 'admin-google-id',
        ]);

        $this->mockSocialiteUser($admin->email, 'admin-google-id', $admin->name);

        $response = $this->get('/auth/google/callback');

        $this->assertAuthenticatedAs($admin);
        $response->assertRedirect(route('admin.dashboard'));
    }

    public function test_google_callback_redirects_mentor_to_mentor_dashboard(): void
    {
        $mentor = User::factory()->mentor()->create([
            'google_id' => 'mentor-google-id',
        ]);

        $this->mockSocialiteUser($mentor->email, 'mentor-google-id', $mentor->name);

        $response = $this->get('/auth/google/callback');

        $this->assertAuthenticatedAs($mentor);
        $response->assertRedirect(route('mentor.dashboard'));
    }

    public function test_google_callback_redirects_student_to_dashboard(): void
    {
        $student = User::factory()->student()->create([
            'google_id' => 'student-google-id',
        ]);

        $this->mockSocialiteUser($student->email, 'student-google-id', $student->name);

        $response = $this->get('/auth/google/callback');

        $this->assertAuthenticatedAs($student);
        $response->assertRedirect(route('dashboard'));
    }

    public function test_admin_accessing_dashboard_redirects_to_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/dashboard');

        $response->assertRedirect(route('admin.dashboard'));
    }

    public function test_admin_accessing_bookings_redirects_to_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/bookings');

        $response->assertRedirect(route('admin.dashboard'));
    }

    public function test_admin_accessing_mentor_dashboard_redirects_to_admin_dashboard(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/mentor/dashboard');

        $response->assertRedirect(route('admin.dashboard'));
    }

    public function test_mentor_accessing_dashboard_redirects_to_mentor_dashboard(): void
    {
        $mentor = User::factory()->mentor()->create();

        $response = $this->actingAs($mentor)->get('/dashboard');

        $response->assertRedirect(route('mentor.dashboard'));
    }

    public function test_mentor_can_access_bookings(): void
    {
        $mentor = User::factory()->mentor()->create();

        $response = $this->actingAs($mentor)->get('/bookings');

        $response->assertOk();
    }

    public function test_mentor_can_access_mentor_dashboard(): void
    {
        $mentor = User::factory()->mentor()->create();
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/room',
        ]);

        $response = $this->actingAs($mentor)->get('/mentor/dashboard');

        $response->assertOk();
    }

    public function test_student_can_access_dashboard(): void
    {
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student)->get('/dashboard');

        $response->assertOk();
    }

    public function test_student_can_access_bookings(): void
    {
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student)->get('/bookings');

        $response->assertOk();
    }

    public function test_student_cannot_access_mentor_dashboard(): void
    {
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student)->get('/mentor/dashboard');

        $response->assertForbidden();
    }

    public function test_handle_inertia_requests_shares_role_without_leaking_sensitive_data(): void
    {
        $student = User::factory()->student()->create([
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Secret Student',
        ]);

        $response = $this->actingAs($student)->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id', $student->id)
                ->where('auth.user.name', $student->name)
                ->where('auth.user.email', $student->email)
                ->where('auth.user.role', 'student')
                ->missing('auth.user.bank_name')
                ->missing('auth.user.bank_account_number')
                ->missing('auth.user.bank_account_holder')
                ->missing('auth.user.password')
            );
    }

    private function mockSocialiteUser(string $email, string $googleId, string $name): void
    {
        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn($googleId);
        $socialiteUser->shouldReceive('getEmail')->andReturn($email);
        $socialiteUser->shouldReceive('getName')->andReturn($name);

        $provider = Mockery::mock(SocialiteProvider::class);
        $provider->shouldReceive('user')->andReturn($socialiteUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);
    }
}

