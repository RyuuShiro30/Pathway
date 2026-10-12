<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\MentorProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MentorProfileSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'lili@example.com'],
            [
                'name' => 'lili',
                'password' => Hash::make('password'),
            ]
        );

        MentorProfile::create([
            'user_id' => $user->id,
            'expertise' => 'Web Development',
            'bio' => 'Mentor berpengalaman 5 tahun di bidang web development.',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'avg_rating' => 4.8,
            'is_available' => true,
            'availability_schedule' => [
                ['day' => 'senin', 'start' => '09:00', 'end' => '11:00'],
                ['day' => 'senin', 'start' => '10:00', 'end' => '12:00'],
            ],
        ]);

        $this->command->info('Data dummy: user mentor "lili" dan MentorProfile berhasil dibuat.');
    }
}