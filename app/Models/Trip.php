<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trip extends Model
{
    use HasFactory;

    protected $table = 'trip_tbl';

    protected $fillable = [
        'vehicle_id',
        'driver_id',
        'fuel_type',
        'liters',
        'trip_start',
        'trip_end',
        'purpose',
        'passenger',
        'chargetoproject',
        'status',
        'place',
        'tickNo',
    ];

    protected $casts = [
        'trip_start' => 'datetime',
        'trip_end'   => 'datetime',     // ← fixed typo (removed trailing space)
        'liters'     => 'float',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    // ────────────────────────────────────────────────
    //  Remove this — a Trip should NOT have many Trips
    // ────────────────────────────────────────────────
    // public function trips() { ... }  ← DELETE THIS

    // Optional useful scopes
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['booked', 'on trip', 'in_progress']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}