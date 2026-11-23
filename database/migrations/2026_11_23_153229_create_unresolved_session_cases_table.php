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
        Schema::create('unresolved_session_cases', function (Blueprint $table) {
            $table->id();

            // Sesi mentoring yang sedang ditinjau
            $table->foreignId('mentoring_session_id')
                ->unique()
                ->constrained('mentoring_sessions')
                ->cascadeOnDelete();

            // Status penanganan kasus A5
            $table->string('status')->default('perlu_ditinjau');

            // Hasil keputusan admin
            $table->string('decision')->nullable();

            // Catatan admin
            $table->text('admin_note')->nullable();

            // Admin yang menangani kasus
            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Waktu peninjauan dan penyelesaian
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unresolved_session_cases');
    }
};