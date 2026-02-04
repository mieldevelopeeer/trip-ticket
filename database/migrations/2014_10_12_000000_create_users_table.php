<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('user_id')->unique(); // Add this for Driver Login
        $table->string('name');
        $table->string('email')->nullable()->unique(); // Changed to nullable
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->rememberToken();
        $table->timestamps();
    });
    DB::table('users')->insert([
        'user_id' => 'ADMIN-01',
        'name' => 'System User',
        'email' => '',
        'password' => Hash::make('password123'),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
