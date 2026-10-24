<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('no_show_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->unique()->constrained('mentoring_sessions')->cascadeOnDelete();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reported_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('menunggu_respons');
            $table->text('reporter_note')->nullable();
            $table->string('evidence_path');
            $table->timestamp('respond_deadline');
            $table->text('response_note')->nullable();
            $table->string('response_evidence_path')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('no_show_reports');
    }
};
