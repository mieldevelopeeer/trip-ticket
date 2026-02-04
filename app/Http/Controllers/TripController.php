<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Trip;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\DepartmentCode;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TripController extends Controller
{
    public function index()
    {
        return Inertia::render('Trips/Trip', [
            'trips' => Trip::with(['driver', 'vehicle.vehicleType'])
                ->orderBy('created_at', 'desc')
                ->get(),
            'drivers' => Driver::orderBy('lastname', 'asc')->get(),
            'vehicles' => Vehicle::with('vehicleType')
                ->get(),
                'departments' => DepartmentCode::orderBy('code', 'asc')->get(['code', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tickNo'          => 'required|string|unique:trip_tbl,tickNo',
            'vehicle_id'      => 'required|exists:vehicles,id',
            'driver_id'       => 'required|exists:driver_tbl,id',
            'passenger'       => 'required|string|max:255',
            'place'           => 'nullable|string|max:255',
            'purpose'         => 'nullable|string|max:255',
            'chargetoproject' => 'nullable|string|max:255',
            'fuel_type'       => 'nullable|string',
            'liters'          => 'nullable|numeric|min:0',
            'trip_start'      => 'nullable|date',
            'trip_end'        => 'nullable|date|after_or_equal:trip_start',
            'status'          => 'nullable|string|in:booked,on trip, finished',
            'plate_number'    => 'nullable|string',
        ], [
            // Custom error messages
            'tickNo.unique' => 'This ticket number has already been used. Please refresh and try again.',
            'vehicle_id.required' => 'Please select a vehicle.',
            'vehicle_id.exists' => 'The selected vehicle is not available.',
            'driver_id.required' => 'Please select a driver.',
            'driver_id.exists' => 'The selected driver does not exist.',
            'passenger.required' => 'Passenger name is required.',
            'liters.min' => 'Liters must be a positive number.',
            'trip_end.after_or_equal' => 'Trip end time must be after or equal to start time.',
            'status.in' => 'Invalid status value.',
        ]);

        try {
            $trip = DB::transaction(function () use ($validated) {
                // Create the trip
                $trip = Trip::create($validated);
                
                // Update vehicle status to on trip
                Vehicle::where('id', $validated['vehicle_id'])
                    ->update(['status' => 'on trip']);
                
                return $trip;
            });

            return redirect()->back()->with('success', 'Dispatch Authorized: ' . $trip->tickNo);
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create trip. Please try again.'])
                ->withInput();
        }
    }

    public function update(Request $request, Trip $trip)
    {
        $validated = $request->validate([
            'tickNo'          => 'required|string|unique:trips,tickNo,' . $trip->id,
            'vehicle_id'      => 'required|exists:vehicles,id',
            'driver_id'       => 'required|exists:driver_tbl,id',
            'passenger'       => 'required|string|max:255',
            'place'           => 'nullable|string|max:255',
            'purpose'         => 'nullable|string|max:255',
            'chargetoproject' => 'nullable|string|max:255',
            'fuel_type'       => 'nullable|string',
            'liters'          => 'nullable|numeric|min:0',
            'trip_start'      => 'nullable|date',
            'trip_end'        => 'nullable|date|after_or_equal:trip_start',
            'status'          => 'nullable|string|in:booked, on trip,finished',
            'plate_number'    => 'nullable|string',
        ], [
            'tickNo.unique' => 'This ticket number has already been used.',
            'vehicle_id.required' => 'Please select a vehicle.',
            'driver_id.required' => 'Please select a driver.',
            'passenger.required' => 'Passenger name is required.',
            'trip_end.after_or_equal' => 'Trip end time must be after or equal to start time.',
        ]);

        try {
            DB::transaction(function () use ($trip, $validated) {
                // If vehicle changed and old vehicle was on trip, make it available
                if ($trip->vehicle_id !== $validated['vehicle_id'] && $trip->status === 'on trip') {
                    Vehicle::where('id', $trip->vehicle_id)
                        ->update(['status' => 'available']);
                    
                    // Set new vehicle to on trip
                    Vehicle::where('id', $validated['vehicle_id'])
                        ->update(['status' => 'on trip']);
                }

                // If status changed to finished, make vehicle available
                if ($validated['status'] === 'finished' && $trip->status !== 'finished') {
                    Vehicle::where('id', $validated['vehicle_id'])
                        ->update(['status' => 'available']);
                }

                // Update the trip
                $trip->update($validated);
            });

            return redirect()->back()->with('success', 'Trip updated successfully: ' . $trip->tickNo);
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update trip. Please try again.'])
                ->withInput();
        }
    }

     // New function to update trip status only
    public function updateStatus(Request $request, Trip $trip)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:booked,on trip,finished',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            DB::transaction(function () use ($trip, $validated) {
                $oldStatus = $trip->status;
                $newStatus = $validated['status'];
                
                // Update vehicle status based on status change
                if ($oldStatus !== $newStatus) {
                    if ($oldStatus === 'on trip' && $newStatus !== 'on trip') {
                        // Trip is no longer "on trip", make vehicle available
                        Vehicle::where('id', $trip->vehicle_id)
                            ->update(['status' => 'available']);
                    } elseif ($oldStatus !== 'on trip' && $newStatus === 'on trip') {
                        // Trip is now "on trip", set vehicle to on trip
                        Vehicle::where('id', $trip->vehicle_id)
                            ->update(['status' => 'on trip']);
                    }
                }

                // Update the trip status and notes
                $trip->update([
                    'status' => $newStatus,
                    'notes' => $validated['notes'] ?? $trip->notes,
                    'trip_end' => $newStatus === 'finished' ? now() : $trip->trip_end,
                ]);
            });

            $statusMessages = [
                'booked' => 'Trip status updated to booked',
                'on trip' => 'Trip status updated to On Trip',
                'finished' => 'Trip marked as Finished and vehicle made available',
            ];

            return redirect()->back()->with('success',      
                $statusMessages[$validated['status']] . ': ' . $trip->tickNo
            );
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update trip status. Please try again.'])
                ->withInput();
        }
    }


    public function destroy(Trip $trip)
    {
        try {
            DB::transaction(function () use ($trip) {
                // If trip is on trip status, make vehicle available
                if ($trip->status === 'on trip') {
                    Vehicle::where('id', $trip->vehicle_id)
                        ->update(['status' => 'available']);
                }
                
                $trip->delete();
            });

            return redirect()->back()->with('success', 'Trip deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete trip.']);
        }
    }
}