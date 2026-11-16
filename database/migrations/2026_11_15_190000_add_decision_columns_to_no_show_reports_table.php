<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('no_show_reports', function (Blueprint $table) {
            $table->text('admin_note')->nullable()->after('finalized_at');
            $table->foreignId('decided_by')->nullable()->after('admin_note')->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable()->after('decided_by');
        });
    }

    public function down(): void
    {
        Schema::table('no_show_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('decided_by');
            $table->dropColumn(['admin_note', 'decided_at']);
        });
    }
};
