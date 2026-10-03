<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\MentorProfile;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MentorProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('name', 'lili')->first();

        if (!$user) {
            $this->command->error('User "lili" tidak ditemukan. Register dulu lewat /register.');
            return;
        }

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
                ['day' => 'senin', 'start' => '10:00', 'end' => '12:00'],
                ['day' => 'rabu', 'start' => '14:00', 'end' => '16:00'],
            ],
        ]);

        $this->command->info('Data dummy MentorProfile berhasil dibuat.');
    }
}