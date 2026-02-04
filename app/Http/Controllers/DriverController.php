<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Driver;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DriverController extends Controller
{
    public function index()
    {
        // Fetch drivers with the nested relationship
        $drivers = Driver::with(['vehicle.vehicleType'])->latest()->paginate(10);
        
        // Fetch all vehicle units for the dropdown
        $vehicles = Vehicle::with('vehicleType')->get()->map(function($unit) {
            return [
                'id' => $unit->id,
                // Combines Plate (e.g. ABC 123) and Type (e.g. Toyota Hilux)
                'label' => "{$unit->plate_number} — {$unit->vehicleType->vehicle_type_name}",
                'status' => $unit->status // So we can see if it's 'available' or 'on_trip'
            ];
        });

        return Inertia::render('Drivers/Driver', [
            'drivers' => $drivers,
            'vehicles' => $vehicles
        ]);
    }   
    
    public function fetchVehicleplate()
    {
        try {
            // We join with vehicle_types to get the 'vehicle_type_name' (which acts as the model)
            $vehicles = Vehicle::join('vehicle_types', 'vehicles.vehicle_type_id', '=', 'vehicle_types.id')
                ->select(
                    'vehicles.id', 
                    'vehicles.plate_number', 
                    'vehicle_types.vehicle_type_name as model' // Rename it to 'model' for your frontend
                )
                ->where('vehicles.status', 'available') // Optional: only show available units
                ->get();
                
            return response()->json($vehicles);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        // 1. Validate the incoming request - Added 'suffix' field
        $validated = $request->validate([
            'firstname'  => 'required|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'lastname'   => 'required|string|max:255',
            'suffix'     => 'nullable|string|max:10', // Added suffix validation
            'address'    => 'nullable|string',
            'contact'    => 'nullable|string|max:20',
            'email'      => 'nullable|email|unique:driver_tbl,email', // Changed from 'drivers' to 'driver_tbl'
            'status'     => 'required|in:active,standby',
            'vehicle_id' => 'nullable|exists:vehicles,id',   // still validated if provided
        ]);

        try {
            DB::transaction(function () use ($validated) {
                // Create the driver (vehicle_id is optional → will be null if not sent)
                $driver = Driver::create($validated);

                // 2. Only update vehicle if vehicle_id was provided
                if ($validated['vehicle_id']) {
                    Vehicle::where('id', $validated['vehicle_id'])
                        ->update(['status' => 'active']);   // or 'on_trip' / 'in_use' — your choice
                }
            });

            // Success message — slightly different depending on vehicle assignment
            $message = $validated['vehicle_id']
                ? 'Operator registered successfully and assigned to vehicle.'
                : 'Operator registered successfully (no vehicle assigned).';

            return redirect()->back()->with('success', $message);

        } catch (\Exception $e) {
            // Better error message for user
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to register operator. Please try again.']);
        }
    }

    public function update(Request $request, Driver $driver)
    {
        // 1. Validate - Added 'suffix' field
        $validated = $request->validate([
            'firstname'  => ['required', 'string', 'max:255'],
            'middlename' => ['nullable', 'string', 'max:255'],
            'lastname'   => ['required', 'string', 'max:255'],
            'suffix'     => ['nullable', 'string', 'max:10'], // Added suffix validation
            'contact'    => ['nullable', 'string', 'min:10', 'max:20'],
            'email'      => [
                'nullable', 
                'email', 
                // Explicitly referencing 'driver_tbl' and the primary key 'id'
                Rule::unique('driver_tbl', 'email')->ignore($driver->id, 'id')
            ],
            'status'     => ['required', Rule::in(['active', 'standby', 'suspended'])],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
        ]);

        try {
            DB::transaction(function () use ($driver, $validated) {
                // Save the old vehicle_id before update
                $oldVehicleId = $driver->vehicle_id;
                
                // Update the driver
                $driver->update($validated);
                
                // If vehicle was changed, update vehicle statuses
                if ($oldVehicleId != $validated['vehicle_id']) {
                    // Set old vehicle to available if it exists
                    if ($oldVehicleId) {
                        Vehicle::where('id', $oldVehicleId)
                            ->update(['status' => 'available']);
                    }
                    
                    // Set new vehicle to active if assigned
                    if ($validated['vehicle_id']) {
                        Vehicle::where('id', $validated['vehicle_id'])
                            ->update(['status' => 'active']);
                    }
                }
            });

            return redirect()->back()->with('success', "Personnel [{$driver->lastname}] registry updated.");

        } catch (\Exception $e) {
            // Log the error so you can see it in storage/logs/laravel.log
            \Log::error("Registry Update Failed: " . $e->getMessage());

            return redirect()->back()->withErrors([
                'email' => 'System error: ' . $e->getMessage() // Shows the real error for debugging
            ]);
        }
    }
}