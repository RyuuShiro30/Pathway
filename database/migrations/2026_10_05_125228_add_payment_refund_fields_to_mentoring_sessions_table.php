<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->integer('duration_hours')->default(1)->after('end_time');
            $table->string('payment_dp_proof')->nullable()->after('duration_hours');
            $table->string('payment_dp_status')->default('belum_bayar')->after('payment_dp_proof');
            $table->string('payment_final_proof')->nullable()->after('payment_dp_status');
            $table->string('cancelled_by')->nullable()->after('payment_final_proof');
            $table->text('cancellation_reason')->nullable()->after('cancelled_by');
            $table->string('refund_proof')->nullable()->after('cancellation_reason');
            $table->string('refund_status')->default('tidak_berlaku')->after('refund_proof');
            $table->timestamp('refund_deadline')->nullable()->after('refund_status');
        });
    }

    public function down(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'duration_hours',
                'payment_dp_proof',
                'payment_dp_status',
                'payment_final_proof',
                'cancelled_by',
                'cancellation_reason',
                'refund_proof',
                'refund_status',
                'refund_deadline',
            ]);
        });
    }
};
