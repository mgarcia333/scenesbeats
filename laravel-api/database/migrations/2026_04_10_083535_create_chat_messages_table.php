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
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->string('room_id')->index(); // e.g. chat_1_2
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('content')->nullable();
            $table->string('type')->default('text'); // 'text' | 'gif' | 'movie' | 'song' | 'list'
            $table->string('gif_url')->nullable();
            
            // Media Sharing
            $table->string('item_id')->nullable();
            $table->string('item_type')->nullable();
            $table->string('item_title')->nullable();
            $table->string('item_image')->nullable();
            $table->string('item_subtitle')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
