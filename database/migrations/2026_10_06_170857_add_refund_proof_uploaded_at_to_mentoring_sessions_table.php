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
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->timestamp('refund_proof_uploaded_at')->nullable()->after('refund_status');
        });
    }

    public function down(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->dropColumn('refund_proof_uploaded_at');
        });
    }
};
