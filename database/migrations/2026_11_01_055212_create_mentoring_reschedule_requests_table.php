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
        Schema::create('mentoring_reschedule_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('session_id')
                ->constrained('mentoring_sessions')
                ->cascadeOnDelete();

            $table->string('requested_by', 20);
            $table->string('request_type', 30);

            $table->dateTime('old_schedule_time');
            $table->dateTime('old_end_time');

            $table->dateTime('new_schedule_time');
            $table->dateTime('new_end_time');

            $table->string('status', 20)
                ->default('menunggu_respons');

            $table->dateTime('respond_deadline');
            $table->dateTime('responded_at')->nullable();

            $table->text('rejection_reason')->nullable();

            // Digunakan ketika mentor menawarkan reschedule
            // sebagai alternatif proses refund.
            $table->dateTime('refund_paused_at')->nullable();

            $table->timestamps();

            $table->index(['session_id', 'status']);
            $table->index(['status', 'respond_deadline']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mentoring_reschedule_requests');
    }
};
