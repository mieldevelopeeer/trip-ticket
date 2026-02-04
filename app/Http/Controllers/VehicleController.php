<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use App\Models\VehicleType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str; // Added for string helpers
use Inertia\Inertia;

class VehicleController extends Controller
{
    public function index()
{
    // Paginate the Types instead of the individual Vehicles
    $vehicleTypesPaginated = VehicleType::with(['vehicles'])
        ->withCount('vehicles as total_quantity')
        ->latest()
        ->paginate(10);

    // This is still useful for the "Add New" dropdown in the modal
    $allTypes = VehicleType::all(['id', 'vehicle_type_name', 'category']);

    return Inertia::render('Vehicles/Vehicle', [
        'vehicles' => $vehicleTypesPaginated, // Keeping the key as 'vehicles' so React doesn't break
        'vehicleTypes' => $allTypes,
    ]);
}

    public function store(Request $request)
    {
        // 1. Validate the array of plate numbers
        $request->validate([
            'vehicle_type_name' => 'required|string',
            'category'          => 'required|string',
            'quantity'          => 'required|integer|min:1',
            'plate_numbers'     => 'required|array',
            'plate_numbers.*'   => 'required|string|distinct|unique:vehicles,plate_number',
            'status'            => 'required|string',
        ]);

        // 2. Use a Transaction for data integrity
        DB::transaction(function () use ($request) {
            
            // Get or Create the Model Type
            $type = VehicleType::firstOrCreate(
                ['vehicle_type_name' => strtoupper($request->vehicle_type_name)],
                ['category' => strtoupper($request->category)]
            );

            // 3. Loop through the array of plate numbers provided by the frontend
            foreach ($request->plate_numbers as $plate) {
                $type->vehicles()->create([
                    'plate_number' => strtoupper($plate),
                    'status'       => $request->status,
                ]);
            }

            // 4. Sync the Total Count in the Type table
            $type->increment('total_quantity', (int) $request->quantity);
        });

        return redirect()->route('vehicles.index');
    }

    public function update(Request $request, Vehicle $vehicle)
{
    // 1. Fixed the syntax from .id to ->id
    // 2. Added strtoupper to validation to ensure consistency
    $request->validate([
        'vehicle_type_name' => 'required|string',
        'category'          => 'required|string',
        'plate_numbers'     => 'required|array|min:1',
        // The ignore ID needs to be $vehicle->id
        'plate_numbers.0'   => 'required|string|unique:vehicles,plate_number,' . $vehicle->id,
        'status'            => 'required|string',
    ]);

    \DB::transaction(function () use ($request, $vehicle) {
        // Find or create the type (using arrow syntax ->)
        $type = VehicleType::firstOrCreate(
            ['vehicle_type_name' => strtoupper($request->vehicle_type_name)],
            ['category' => strtoupper($request->category)]
        );

        // Update the vehicle (using arrow syntax ->)
        $vehicle->update([
            'vehicle_type_id' => $type->id,
            'plate_number'    => strtoupper($request->plate_numbers[0]),
            'status'          => $request->status,
        ]);
    });

    return redirect()->route('vehicles.index');
}
}