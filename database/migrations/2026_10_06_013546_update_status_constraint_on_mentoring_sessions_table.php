<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE mentoring_sessions DROP CONSTRAINT IF EXISTS mentoring_sessions_status_check');

        DB::statement("ALTER TABLE mentoring_sessions ADD CONSTRAINT mentoring_sessions_status_check 
            CHECK (status IN ('diajukan', 'dikonfirmasi', 'berlangsung', 'selesai', 'dibatalkan'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE mentoring_sessions DROP CONSTRAINT IF EXISTS mentoring_sessions_status_check');

        DB::statement("ALTER TABLE mentoring_sessions ADD CONSTRAINT mentoring_sessions_status_check 
            CHECK (status IN ('pending', 'confirmed', 'ongoing', 'completed', 'cancelled'))");
    }
};
