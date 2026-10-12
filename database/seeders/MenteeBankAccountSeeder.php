<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class MenteeBankAccountSeeder extends Seeder
{
    public function run(): void
    {
        $mentee = User::where('email', 'mentee@example.com')->first();

        if (!$mentee) {
            $this->command->error('User Budi (mentee@example.com) tidak ditemukan.');
            return;
        }

        $mentee->forceFill([
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Budi Mentee',
        ])->save();

        $this->command->info('Rekening dummy Budi berhasil disimpan.');
    }
}