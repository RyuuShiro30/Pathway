<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
        public function up(): void
    {
        DB::statement('ALTER TABLE mentoring_sessions ALTER COLUMN status DROP DEFAULT');
        DB::statement('ALTER TABLE mentoring_sessions ALTER COLUMN status TYPE VARCHAR(255) USING status::text');
        DB::statement("ALTER TABLE mentoring_sessions ALTER COLUMN status SET DEFAULT 'diajukan'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE mentoring_sessions ALTER COLUMN status DROP DEFAULT");
        DB::statement("ALTER TABLE mentoring_sessions ALTER COLUMN status TYPE VARCHAR(255)");
        DB::statement("ALTER TABLE mentoring_sessions ALTER COLUMN status SET DEFAULT 'pending'");
    }
};
