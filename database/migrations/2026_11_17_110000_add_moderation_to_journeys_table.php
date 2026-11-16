<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journeys', function (Blueprint $table) {
            $table->text('moderation_note')->nullable()->after('status');
            $table->boolean('allow_comments')->default(true)->after('moderation_note');
        });

        DB::statement(
            'ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_status_check'
        );

        DB::statement(
            "ALTER TABLE journeys ADD CONSTRAINT journeys_status_check CHECK (status IN ('draft', 'menunggu', 'published', 'ditolak'))"
        );

        DB::statement(
            "ALTER TABLE journeys ALTER COLUMN status SET DEFAULT 'draft'"
        );
    }

    public function down(): void
    {
        DB::statement(
            'ALTER TABLE journeys DROP CONSTRAINT IF EXISTS journeys_status_check'
        );

        DB::table('journeys')
            ->whereIn('status', ['menunggu', 'ditolak'])
            ->update(['status' => 'draft']);

        DB::statement(
            "ALTER TABLE journeys ADD CONSTRAINT journeys_status_check CHECK (status IN ('draft', 'published'))"
        );

        DB::statement(
            "ALTER TABLE journeys ALTER COLUMN status SET DEFAULT 'published'"
        );

        Schema::table('journeys', function (Blueprint $table) {
            $table->dropColumn(['moderation_note', 'allow_comments']);
        });
    }
};
