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
    Schema::create('mentor_certificates', function (Blueprint $table) {
        $table->id();

        $table->foreignId('mentor_profile_id')
            ->constrained('mentor_profiles')
            ->cascadeOnDelete();

        $table->string('file_path');
        $table->string('file_name');

        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('mentor_certificates');
}
};
