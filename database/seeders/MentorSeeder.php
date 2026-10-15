<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MentorSeeder extends Seeder
{
    public function run(): void
    {
        $mentors = [
            [
                'name' => 'Andi Pratama',
                'email' => 'andi.mentor@pathway.test',
                'expertise' => 'Web Development',
                'bio' => 'Mentor yang berfokus pada pengembangan aplikasi web menggunakan Laravel dan teknologi web modern.',
                'portfolio_url' => 'https://github.com/andipratama',
                'mentor_type' => 'paid',
                'price_per_session' => 50000,
                'avg_rating' => 4.80,
                'is_available' => true,
            ],
            [
                'name' => 'Siti Rahma',
                'email' => 'siti.mentor@pathway.test',
                'expertise' => 'UI/UX Design',
                'bio' => 'Membantu mahasiswa memahami dasar UI/UX, wireframe, prototyping, dan user research.',
                'portfolio_url' => 'https://github.com/sitirahma',
                'mentor_type' => 'free',
                'price_per_session' => 0,
                'avg_rating' => 4.70,
                'is_available' => true,
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi.mentor@pathway.test',
                'expertise' => 'Mobile Development',
                'bio' => 'Berpengalaman dalam pengembangan aplikasi mobile menggunakan Flutter.',
                'portfolio_url' => 'https://github.com/budisantoso',
                'mentor_type' => 'paid',
                'price_per_session' => 75000,
                'avg_rating' => 4.90,
                'is_available' => false,
            ],
            [
                'name' => 'Rina Maharani',
                'email' => 'rina.mentor@pathway.test',
                'expertise' => 'Data Science',
                'bio' => 'Mentor yang membantu mempelajari Python, analisis data, dan dasar machine learning.',
                'portfolio_url' => 'https://github.com/rinamaharani',
                'mentor_type' => 'paid',
                'price_per_session' => 60000,
                'avg_rating' => 4.60,
                'is_available' => true,
            ],
            [
                'name' => 'Dimas Saputra',
                'email' => 'dimas.mentor@pathway.test',
                'expertise' => 'Database',
                'bio' => 'Membantu memahami database relational, SQL, PostgreSQL, dan perancangan database.',
                'portfolio_url' => 'https://github.com/dimassaputra',
                'mentor_type' => 'free',
                'price_per_session' => 0,
                'avg_rating' => 4.50,
                'is_available' => true,
            ],
        ];

        foreach ($mentors as $mentor) {
            $userId = DB::table('users')->insertGetId([
                'name' => $mentor['name'],
                'email' => $mentor['email'],
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('mentor_profiles')->insert([
                'user_id' => $userId,
                'expertise' => $mentor['expertise'],
                'bio' => $mentor['bio'],
                'portfolio_url' => $mentor['portfolio_url'],
                'verification_status' => 'verified',
                'mentor_type' => $mentor['mentor_type'],
                'price_per_session' => $mentor['price_per_session'],
                'avg_rating' => $mentor['avg_rating'],
                'is_available' => $mentor['is_available'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}