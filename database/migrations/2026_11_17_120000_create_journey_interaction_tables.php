<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journey_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journey_id')->constrained('journeys')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['journey_id', 'user_id']);
        });

        Schema::create('journey_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journey_id')->constrained('journeys')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['journey_id', 'user_id']);
        });

        Schema::create('journey_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journey_id')->constrained('journeys')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('journey_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journey_id')->constrained('journeys')->cascadeOnDelete();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->text('reason');
            $table->string('status', 20)->default('menunggu');
            $table->timestamps();

            $table->unique(['journey_id', 'reporter_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journey_reports');
        Schema::dropIfExists('journey_comments');
        Schema::dropIfExists('journey_bookmarks');
        Schema::dropIfExists('journey_likes');
    }
};
