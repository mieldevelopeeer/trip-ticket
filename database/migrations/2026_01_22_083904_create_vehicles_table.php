<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Define the Model/Type (e.g., Toyota Hilux, SUV)
        Schema::create('vehicle_types', function (Blueprint $table) {
            $table->id();
            $table->string('vehicle_type_name'); // e.g., Toyota Hilux
            $table->string('category');          // e.g., SUV, Sedan, Pickup
            $table->integer('total_quantity')->default(0);
            $table->timestamps();
        });

        // 2. Define the individual units (where the status lives)
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            // Connects back to the name/category
            $table->foreignId('vehicle_type_id')->constrained('vehicle_types')->onDelete('cascade');
            
            // Unique identification for the search plate select
            $table->string('plate_number')->unique(); 
            
            // This allows 1 to be 'on_trip' and 2 to be 'available'
            $table->string('status')->default('available'); 
                
            $table->index(['status', 'vehicle_type_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
        Schema::dropIfExists('vehicle_types');
    }
};