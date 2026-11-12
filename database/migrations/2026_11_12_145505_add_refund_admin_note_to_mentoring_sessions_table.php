<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->text('refund_admin_note')->nullable()->after('refund_proof_uploaded_at');
            $table->timestamp('refund_reviewed_at')->nullable()->after('refund_admin_note');
        });
    }

    public function down(): void
    {
        Schema::table('mentoring_sessions', function (Blueprint $table) {
            $table->dropColumn(['refund_admin_note', 'refund_reviewed_at']);
        });
    }
};