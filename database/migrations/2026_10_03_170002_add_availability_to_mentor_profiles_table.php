<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentor_profiles', function (Blueprint $table) {
            $table->json('availability_schedule')->nullable()->after('is_available');
        });
    }

    public function down(): void
    {
        Schema::table('mentor_profiles', function (Blueprint $table) {
            $table->dropColumn('availability_schedule');
        });
    }
};
