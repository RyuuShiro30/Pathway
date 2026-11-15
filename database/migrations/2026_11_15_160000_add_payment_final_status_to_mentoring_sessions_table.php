<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->string('payment_final_status')->default('tidak_berlaku')->after('payment_final_proof');
            $table->timestamp('payment_final_reminded_at')->nullable()->after('payment_final_status');
        });

        // Backfill data lama: sesi gratis -> tidak_berlaku, sesi berbayar -> belum_dibayar
        DB::table('mentoring_sessions')
            ->where('is_free_session', true)
            ->update(['payment_final_status' => 'tidak_berlaku']);

        DB::table('mentoring_sessions')
            ->where('is_free_session', false)
            ->update(['payment_final_status' => 'belum_dibayar']);
    }

    public function down(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'payment_final_status',
                'payment_final_reminded_at',
            ]);
        });
    }
};

