<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mentor_portfolios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentor_profile_id')
                ->constrained('mentor_profiles')
                ->cascadeOnDelete();
            $table->string('platform');
            $table->string('title');
            $table->text('url');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_portfolios');
    }
};