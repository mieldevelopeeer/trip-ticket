<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory;

    protected $table = 'driver_tbl';

    protected $fillable = [
        'firstname',
        'middlename',
        'lastname',
        'suffix',
        'address',
        'contact',
        'email',
        'status',
        'vehicle_id',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute()
    {
        return trim("{$this->firstname} {$this->middlename} {$this->lastname}");
    }

    // ────────────────────────────────────────────────
    //  Add this relationship (this fixes your error)
    // ────────────────────────────────────────────────
    public function trips()
    {
        return $this->hasMany(Trip::class, 'driver_id');
        // If the foreign key column in trip_tbl has a different name (e.g. assigned_driver_id),
        // change it here like:
        // return $this->hasMany(Trip::class, 'assigned_driver_id');
    }

    // Optional: more specific scopes/relationships you might find useful
    public function activeTrips()
    {
        return $this->trips()->whereIn('status', ['dispatched', 'in_progress']);
    }

    public function completedTrips()
    {
        return $this->trips()->where('status', 'completed');
    }

    // ────────────────────────────────────────────────
    // Existing relationships
    // ────────────────────────────────────────────────
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    // This looks suspicious — drivers usually don't have vehicle_type_id
    // Did you mean this belongs on Vehicle instead?
    // If this is not used, consider removing it:
    public function vehicleType()
    {
        return $this->belongsTo(VehicleType::class, 'vehicle_type_id');
    }
}