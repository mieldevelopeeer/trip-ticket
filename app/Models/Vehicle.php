<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use HasFactory;

    protected $table = 'vehicles';

    protected $fillable = [
        'model',
        'type',              // ← consider renaming to vehicle_type_id if it's a foreign key
        'plate_number',
        'status',
        // 'vehicle_type_id', // ← add this if it's not already in fillable
    ];

    /**
     * The trips this vehicle has been used for
     */
    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'vehicle_id');
        // If the foreign key in trip_tbl is named differently → change it:
        // return $this->hasMany(Trip::class, 'assigned_vehicle_id');
    }

    /**
     * The vehicle type this vehicle belongs to
     */
    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class, 'vehicle_type_id');
    }

    // Optional: useful scope/relation helpers
    public function activeTrips(): HasMany
    {
        return $this->trips()->whereIn('status', ['dispatched', 'in_progress']);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }
}