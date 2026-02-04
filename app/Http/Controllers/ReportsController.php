<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Trip;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\VehicleType;
use Carbon\Carbon;

class ReportsController extends Controller
{
    /**
     * Display the comprehensive operations report with filters
     */
public function index(Request $request)
{
    $today        = Carbon::today();
    $startOfMonth = Carbon::now()->startOfMonth();
    $startOfYear  = Carbon::now()->startOfYear();

    // ─── Pagination ───────────────────────────────────────────────────────
    $perPage = $request->input('per_page', 15);
    $perPage = in_array($perPage, [10, 15, 25, 50, 100]) ? (int)$perPage : 15;

    // ─── Filters ──────────────────────────────────────────────────────────
    $dateFrom     = $request->input('date_from');
    $dateTo       = $request->input('date_to');
    $status       = $request->input('status', 'all');
    $driver       = $request->input('driver');
    $vehicle      = $request->input('vehicle');
    $search       = $request->input('search');
    $ticketPrefix = $request->input('ticket_prefix');

    // ─── Main trips query ─────────────────────────────────────────────────
    $tripsQuery = Trip::with(['driver', 'vehicle.vehicleType'])
        ->orderBy('created_at', 'desc');

    // Apply filters
    if ($dateFrom) $tripsQuery->whereDate('created_at', '>=', $dateFrom);
    if ($dateTo)   $tripsQuery->whereDate('created_at', '<=', $dateTo);

    if ($status && $status !== 'all') {
        $tripsQuery->where('status', $status);
    }

    if ($driver)  $tripsQuery->where('driver_id', $driver);
    if ($vehicle) $tripsQuery->where('vehicle_id', $vehicle);

    if ($search) {
        $tripsQuery->where(function ($q) use ($search) {
            $q->where('tickNo', 'LIKE', "%{$search}%")
              ->orWhere('place', 'LIKE', "%{$search}%")
              ->orWhere('purpose', 'LIKE', "%{$search}%")
              ->orWhere('passenger', 'LIKE', "%{$search}%")
              ->orWhereHas('driver', fn($sq) =>
                  $sq->where('firstname', 'LIKE', "%{$search}%")
                     ->orWhere('lastname', 'LIKE', "%{$search}%")
              )
              ->orWhereHas('vehicle', fn($sq) =>
                  $sq->where('plate_number', 'LIKE', "%{$search}%")
              );
        });
    }

    if ($ticketPrefix) {
        $tripsQuery->where('tickNo', 'like', $ticketPrefix . '%');
    }

   $availablePrefixes = (clone $tripsQuery)
    ->selectRaw('DISTINCT LPAD(id, 3, "0") as prefix')
    ->reorder()
    ->orderBy('prefix', 'asc')
    ->pluck('prefix')
    ->values()
    ->toArray();

    // ─── Paginated trips ──────────────────────────────────────────────────
    $trips = $tripsQuery->paginate($perPage)->withQueryString();

    // ─── Statistics ───────────────────────────────────────────────────────
    $tripStats = [
        'total'       => Trip::count(),
        'today'       => Trip::whereDate('created_at', $today)->count(),
        'this_month'  => Trip::whereBetween('created_at', [$startOfMonth, now()])->count(),
        'this_year'   => Trip::whereBetween('created_at', [$startOfYear, now()])->count(),
        'dispatched'  => Trip::where('status', 'dispatched')->count(),
        'in_progress' => Trip::where('status', 'in_progress')->count(),
        'completed'   => Trip::where('status', 'completed')->count(),
        'on_trip'     => Trip::where('status', 'on trip')->count(),
        'finished'    => Trip::where('status', 'finished')->count(),
    ];

    $vehicleStats = [
        'total'       => Vehicle::count(),
        'available'   => Vehicle::where('status', 'available')->count(),
        'on_trip'     => Vehicle::where('status', 'on trip')->count(),
        'maintenance' => Vehicle::where('status', 'maintenance')->count(),
        'by_type'     => VehicleType::withCount('vehicles')
            ->get()
            ->map(fn($type) => [
                'name'     => $type->vehicle_type_name,
                'count'    => $type->vehicles_count,
                'category' => $type->category ?? 'Other',
            ]),
    ];

    $driverStats = [
        'total'     => Driver::count(),
        'active'    => Driver::where('status', 'active')->count(),
        'inactive'  => Driver::where('status', 'inactive')->count(),
        'on_trip'   => Driver::whereHas('trips', fn($q) => 
            $q->whereIn('status', ['dispatched', 'in_progress', 'on trip'])
        )->count(),
    ];

    $fuelQuery = Trip::whereNotNull('liters');
    
    if ($dateFrom && $dateTo) {
        $fuelQuery->whereBetween('created_at', [$dateFrom, $dateTo]);
    } else {
        $fuelQuery->whereBetween('created_at', [$startOfMonth, now()]);
    }

    $fuelStats = [
        'total_liters' => (float) ($fuelQuery->sum('liters') ?? 0),
        'by_fuel_type' => (clone $fuelQuery)
            ->whereNotNull('fuel_type')
            ->selectRaw('fuel_type, SUM(liters) as total_liters, COUNT(*) as trip_count')
            ->groupBy('fuel_type')
            ->get(),
    ];

    $monthlyTrends = collect(range(11, 0))->map(function ($i) {
        $month = Carbon::now()->subMonths($i);
        return [
            'month'     => $month->format('M Y'),
            'trips'     => Trip::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count(),
            'completed' => Trip::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->whereIn('status', ['completed', 'finished'])
                ->count(),
        ];
    })->toArray();

    $destinationQuery = Trip::whereNotNull('place');
    
    if ($dateFrom && $dateTo) {
        $destinationQuery->whereBetween('created_at', [$dateFrom, $dateTo]);
    } else {
        $destinationQuery->whereBetween('created_at', [$startOfMonth, now()]);
    }

    $topDestinations = $destinationQuery
        ->selectRaw('place, COUNT(*) as trip_count')
        ->groupBy('place')
        ->orderByDesc('trip_count')
        ->take(10)
        ->get();

    $topDrivers = Driver::withCount(['trips' => function ($q) use ($dateFrom, $dateTo, $startOfMonth) {
            if ($dateFrom && $dateTo) {
                $q->whereBetween('created_at', [$dateFrom, $dateTo]);
            } else {
                $q->whereBetween('created_at', [$startOfMonth, now()]);
            }
        }])
        ->having('trips_count', '>', 0)
        ->orderByDesc('trips_count')
        ->take(10)
        ->get()
        ->map(fn($driver) => [
            'id'             => $driver->id,
            'name'           => trim($driver->firstname . ' ' . $driver->lastname),
            'license_number' => $driver->license_number ?? '—',
            'trip_count'     => $driver->trips_count ?? 0,
        ]);

    $mostUsedVehicles = Vehicle::withCount(['trips' => function ($q) use ($dateFrom, $dateTo, $startOfMonth) {
            if ($dateFrom && $dateTo) {
                $q->whereBetween('created_at', [$dateFrom, $dateTo]);
            } else {
                $q->whereBetween('created_at', [$startOfMonth, now()]);
            }
        }])
        ->with('vehicleType')
        ->having('trips_count', '>', 0)
        ->orderByDesc('trips_count')
        ->take(10)
        ->get()
        ->map(fn($vehicle) => [
            'id'           => $vehicle->id,
            'plate_number' => $vehicle->plate_number ?? '—',
            'model'        => $vehicle->model ?? '—',
            'type'         => $vehicle->vehicleType?->vehicle_type_name ?? 'N/A',
            'trip_count'   => $vehicle->trips_count ?? 0,
        ]);

    $projectQuery = Trip::whereNotNull('chargetoproject');
    
    if ($dateFrom && $dateTo) {
        $projectQuery->whereBetween('created_at', [$dateFrom, $dateTo]);
    } else {
        $projectQuery->whereBetween('created_at', [$startOfMonth, now()]);
    }

    $projectStats = $projectQuery
        ->selectRaw('chargetoproject, COUNT(*) as trip_count')
        ->groupBy('chargetoproject')
        ->orderByDesc('trip_count')
        ->get();

    // ─── Return ────────────────────────────────────────────────────────────
    return Inertia::render('Reports/Report', [
        'trips'             => $trips,
        'availablePrefixes' => $availablePrefixes,
        'filters'           => [
            'date_from'     => $dateFrom,
            'date_to'       => $dateTo,
            'status'        => $status,
            'driver'        => $driver,
            'vehicle'       => $vehicle,
            'search'        => $search,
            'ticket_prefix' => $ticketPrefix,
            'per_page'      => $perPage,
        ],
        'tripStats'         => $tripStats,
        'vehicleStats'      => $vehicleStats,
        'driverStats'       => $driverStats,
        'fuelStats'         => $fuelStats,
        'monthlyTrends'     => $monthlyTrends,
        'topDestinations'   => $topDestinations,
        'topDrivers'        => $topDrivers,
        'mostUsedVehicles'  => $mostUsedVehicles,
        'projectStats'      => $projectStats,
        'generatedAt'       => now()->toDateTimeString(),
    ]);
}
    /**
     * Export report data (PDF/Excel)
     */
    public function export(Request $request)
    {
        $format = $request->input('format', 'pdf');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $status = $request->input('status', 'all');

        // Build query with filters
        $tripsQuery = Trip::with(['driver', 'vehicle.vehicleType'])
            ->orderBy('created_at', 'desc');

        if ($dateFrom) {
            $tripsQuery->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $tripsQuery->whereDate('created_at', '<=', $dateTo);
        }
        if ($status && $status !== 'all') {
            $tripsQuery->where('status', $status);
        }

        $trips = $tripsQuery->get();

        // For now, return JSON (implement actual PDF/Excel export using libraries)
        if ($format === 'pdf') {
            // TODO: Implement PDF export using DomPDF or similar
            // Example: return PDF::loadView('reports.pdf', compact('trips'))->download('report.pdf');
            return response()->json([
                'message' => 'PDF export not yet implemented',
                'trips_count' => $trips->count(),
            ]);
        }

        if ($format === 'excel') {
            // TODO: Implement Excel export using Maatwebsite/Excel
            // Example: return Excel::download(new TripsExport($trips), 'report.xlsx');
            return response()->json([
                'message' => 'Excel export not yet implemented',
                'trips_count' => $trips->count(),
            ]);
        }

        return response()->json([
            'message' => 'Invalid format',
        ], 400);
    }
}