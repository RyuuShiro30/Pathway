<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->string('proof_file')->nullable()->after('discord_link');
            $table->text('notes_from_mentor')->nullable()->after('proof_file');
        });
    }

    public function down(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->dropColumn(['proof_file', 'notes_from_mentor']);
        });
    }
};
