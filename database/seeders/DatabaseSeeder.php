<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Kunci akun admin utama agar selalu ada dengan role admin
        $admin = User::updateOrCreate(
            ['email' => 'pathway@admin.com'],
            [
                'name' => 'Pathway Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
        $admin->forceFill(['role' => 'admin'])->save();

        $testUser = User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'role' => 'student',
            ]
        );
        $testUser->forceFill(['role' => 'student'])->save();

        $this->call([
            MentorSeeder::class,
            MentorProfileSeeder::class,
            MentoringSessionSeeder::class,
            MentoringWorkflowSeeder::class,
            MenteeBankAccountSeeder::class,
            CourseSeeder::class,
            CourseMaterialSeeder::class,
        ]);
    }
}
