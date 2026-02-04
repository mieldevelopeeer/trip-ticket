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
        Schema::create('trip_tbl', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade'); //car to be used
            $table->foreignId('driver_id')->constrained('driver_tbl')->onDelete('cascade'); //driver name
            $table->string('fuel_type')->nullable(); //fuel type for the trip
            $table->integer('liters'); //liters consumed
            $table->dateTime('trip_start')->nullable();
            $table->dateTime('trip_end')->nullable();
            $table->string('purpose')->nullable(); //purpose of the trip
            $table->string('chargetoproject')->nullable(); //charge to project
            $table->string('status');
            $table->string('passenger'); //passenger name
            $table->string('place')->nullable(); //place of the trip
            $table->string('tickNo'); //ticket number
            $table->boolean ('is_confirmed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_tbl');
    }
};
