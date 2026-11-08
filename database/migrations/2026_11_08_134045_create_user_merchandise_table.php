<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_merchandise', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('merchandise_id')
                ->constrained('merchandise_inventory')
                ->restrictOnDelete();

            $table->integer('quantity')->default(1);
            $table->integer('points_spent');

            $table->string('recipient_name');
            $table->string('phone_number');
            $table->text('shipping_address');

            $table->enum('shipping_status', [
                'menunggu',
                'diproses',
                'dikirim',
                'diterima',
            ])->default('menunggu');

            $table->string('tracking_number')->nullable();
            $table->timestamp('redeemed_at')->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_merchandise');
    }
};
