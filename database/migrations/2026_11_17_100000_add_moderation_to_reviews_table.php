<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->enum('status', ['menunggu', 'disetujui', 'ditolak'])
                ->default('menunggu')
                ->after('feedback');
            $table->text('moderation_note')
                ->nullable()
                ->after('status');
            $table->unique('session_id');
        });

        DB::table('reviews')->update(['status' => 'disetujui']);
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique(['session_id']);
            $table->dropColumn(['status', 'moderation_note']);
        });
    }
};
