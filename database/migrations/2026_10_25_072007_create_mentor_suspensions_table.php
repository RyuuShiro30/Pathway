<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentor_suspensions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentor_id')->constrained('users')->cascadeOnDelete();
            $table->string('reason');
            $table->foreignId('session_id')->nullable()->constrained('mentoring_sessions')->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamp('suspended_at');
            $table->timestamp('lifted_at')->nullable();
            $table->foreignId('lifted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('lift_note')->nullable();
            $table->timestamps();

            $table->index(['mentor_id', 'lifted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_suspensions');
    }
};
