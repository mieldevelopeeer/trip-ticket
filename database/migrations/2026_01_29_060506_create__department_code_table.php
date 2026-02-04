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
        Schema::create('depatment_code', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->timestamps();
        });
       DB::table('depatment_code')->insert([
    [
        'code' => '001',
        'name' => 'Motorpool',
        'created_at' => now(),
        'updated_at' => now(),
    ],
    [
        'code' => '002',
        'name' => 'MEO',
        'created_at' => now(),
        'updated_at' => now(),
    ],
]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('depatment_code');
    }
};
