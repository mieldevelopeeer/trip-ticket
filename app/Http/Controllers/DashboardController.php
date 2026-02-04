<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Trip;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\VehicleType;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // Cache durations
    private const CACHE_TTL = 60; // 1 minute for real-time feel
    private const STATS_CACHE_KEY = 'dashboard_stats_';
    
    public function index()
    {
        // Get cached stats or compute fresh ones
        $dashboardData = Cache::remember($this->getCacheKey('main'), self::CACHE_TTL, function () {
            return $this->computeDashboardData();
        });
        
        return Inertia::render('Dashboard', $dashboardData);
    }
    
    private function computeDashboardData(): array
    {
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfYear = Carbon::now()->startOfYear();
        
        // Use single queries with conditional aggregates for efficiency
        $tripStats = $this->getTripStats($today, $startOfWeek, $startOfMonth, $startOfYear);
        $vehicleStats = $this->getVehicleStats();
        $driverStats = $this->getDriverStats();
        
        // Parallel data fetching for efficiency
        $data = [
            'tripStats' => $tripStats,
            'vehicleStats' => $vehicleStats,
            'driverStats' => $driverStats,
        ];
        
        // Get additional data in separate cache blocks
        $additionalData = Cache::remember($this->getCacheKey('additional'), self::CACHE_TTL, function () use ($startOfMonth) {
            return [
                'recentTrips' => $this->getRecentTrips(),
                'activeTrips' => $this->getActiveTrips(),
                'fuelStats' => $this->getFuelStats($startOfMonth),
                'monthlyTrends' => $this->getMonthlyTrends(),
                'topDestinations' => $this->getTopDestinations($startOfMonth),
                'topDrivers' => $this->getTopDrivers($startOfMonth),
                'mostUsedVehicles' => $this->getMostUsedVehicles($startOfMonth),
                'projectStats' => $this->getProjectStats($startOfMonth),
                'alerts' => $this->getAlerts(),
            ];
        });
        
        return array_merge($data, $additionalData);
    }
    
    private function getTripStats($today, $startOfWeek, $startOfMonth, $startOfYear): array
    {
        // Single query with conditional counts
        $stats = Trip::selectRaw("
            COUNT(*) as total,
            COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as today,
            COUNT(CASE WHEN created_at >= ? THEN 1 END) as this_week,
            COUNT(CASE WHEN created_at >= ? THEN 1 END) as this_month,
            COUNT(CASE WHEN created_at >= ? THEN 1 END) as this_year,
            COUNT(CASE WHEN status = 'booked' THEN 1 END) as booked,
            COUNT(CASE WHEN status = 'on trip' THEN 1 END) as on_trip,
            COUNT(CASE WHEN status = 'finished' THEN 1 END) as finished,
            COUNT(CASE WHEN DATE(created_at) = ? AND status = 'finished' THEN 1 END) as completed_today
        ", [$today->toDateString(), $startOfWeek, $startOfMonth, $startOfYear, $today->toDateString()])
        ->first();
        
        return [
            'total'          => (int) ($stats->total ?? 0),
            'today'          => (int) ($stats->today ?? 0),
            'this_week'      => (int) ($stats->this_week ?? 0),
            'this_month'     => (int) ($stats->this_month ?? 0),
            'this_year'      => (int) ($stats->this_year ?? 0),
            'booked'         => (int) ($stats->booked ?? 0),
            'on_trip'        => (int) ($stats->on_trip ?? 0),
            'finished'       => (int) ($stats->finished ?? 0),
            'completed_today' => (int) ($stats->completed_today ?? 0),
        ];
    }
    
    private function getVehicleStats(): array
    {
        // Single query for vehicle counts with status aggregation
        $vehicleCounts = Vehicle::selectRaw("
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
            COUNT(CASE WHEN status = 'in_use' THEN 1 END) as in_use,
            COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
        ")->first();
        
        // Vehicle types with counts
        $vehicleTypes = VehicleType::select(['id', 'vehicle_type_name', 'category'])
            ->withCount('vehicles')
            ->get()
            ->map(fn($type) => [
                'id'       => $type->id,
                'name'     => $type->vehicle_type_name,
                'count'    => $type->vehicles_count,
                'category' => $type->category ?? 'Other',
            ]);
            
        return [
            'total'       => (int) ($vehicleCounts->total ?? 0),
            'available'   => (int) ($vehicleCounts->available ?? 0),
            'in_use'      => (int) ($vehicleCounts->in_use ?? 0),
            'maintenance' => (int) ($vehicleCounts->maintenance ?? 0),
            'by_type'     => $vehicleTypes,
        ];
    }
    
    private function getDriverStats(): array
    {
        // Single query for driver statistics
        $driverCounts = Driver::selectRaw("
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
            COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
        ")->first();
        
        // Drivers currently on trip
        $onTrip = Driver::whereHas('trips', function ($query) {
            $query->whereIn('status', ['booked', 'on trip'])
                  ->where(function($q) {
                      $q->whereNull('trip_end')
                        ->orWhere('trip_end', '>', now());
                  });
        })->count();
        
        return [
            'total'     => (int) ($driverCounts->total ?? 0),
            'active'    => (int) ($driverCounts->active ?? 0),
            'inactive'  => (int) ($driverCounts->inactive ?? 0),
            'on_trip'   => $onTrip,
        ];
    }
    
    private function getRecentTrips()
    {
        return Trip::with(['driver', 'vehicle.vehicleType'])
            ->select(['id', 'tickNo', 'driver_id', 'vehicle_id', 'place', 'status', 'created_at', 'trip_start', 'trip_end'])
            ->latest('created_at')
            ->take(10)
            ->get()
            ->map(function ($trip) {
                return $this->formatTripData($trip);
            });
    }
    
    private function getActiveTrips()
    {
        return Trip::with(['driver', 'vehicle.vehicleType'])
            ->whereIn('status', ['booked', 'on trip'])
            ->where(function($query) {
                $query->whereNull('trip_end')
                      ->orWhere('trip_end', '>', now());
            })
            ->select(['id', 'tickNo', 'driver_id', 'vehicle_id', 'place', 'status', 'created_at', 'trip_start', 'trip_end', 'liters'])
            ->latest('created_at')
            ->get()
            ->map(function ($trip) {
                return $this->formatTripData($trip);
            });
    }
    
    private function formatTripData($trip)
    {
        $duration = null;
        if ($trip->trip_start && $trip->trip_end) {
            $start = Carbon::parse($trip->trip_start);
            $end = Carbon::parse($trip->trip_end);
            $duration = $start->diff($end)->format('%H:%I');
        } elseif ($trip->trip_start) {
            $duration = Carbon::parse($trip->trip_start)->diffForHumans(now(), true);
        }
        
        return [
            'id'            => $trip->id,
            'tickNo'        => $trip->tickNo,
            'driver'        => $trip->driver ? [
                'id'   => $trip->driver->id,
                'name' => trim($trip->driver->firstname . ' ' . 
                              ($trip->driver->middlename ? $trip->driver->middlename . ' ' : '') . 
                              $trip->driver->lastname . 
                              ($trip->driver->suffix ? ' ' . $trip->driver->suffix : ''))
            ] : null,
            'vehicle'       => $trip->vehicle ? [
                'id'           => $trip->vehicle->id,
                'plate_number' => $trip->vehicle->plate_number,
                'model'        => $trip->vehicle->model,
                'type'         => $trip->vehicle->vehicleType?->vehicle_type_name ?? 'N/A',
            ] : null,
            'place'         => $trip->place,
            'status'        => $trip->status,
            'fuel_used'     => $trip->liters,
            'duration'      => $duration,
            'created_at'    => $trip->created_at->toDateTimeString(),
            'created_ago'   => $trip->created_at->diffForHumans(),
        ];
    }
    
    private function getFuelStats($startOfMonth)
    {
        $fuelData = Trip::whereBetween('created_at', [$startOfMonth, now()])
            ->whereNotNull('fuel_type')
            ->whereNotNull('liters')
            ->selectRaw('
                fuel_type,
                SUM(liters) as total_liters,
                COUNT(*) as trip_count
            ')
            ->groupBy('fuel_type')
            ->get();
            
        return [
            'total_liters' => (float) ($fuelData->sum('total_liters') ?? 0),
            'by_fuel_type' => $fuelData->map(function ($item) {
                return [
                    'fuel_type'    => $item->fuel_type,
                    'total_liters' => (float) ($item->total_liters ?? 0),
                    'trip_count'   => (int) ($item->trip_count ?? 0),
                ];
            }),
        ];
    }
    
    private function getMonthlyTrends()
    {
        return Cache::remember($this->getCacheKey('monthly_trends'), 300, function () {
            $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
            
            $trends = Trip::selectRaw('
                YEAR(created_at) as year,
                MONTH(created_at) as month,
                DATE_FORMAT(created_at, "%b %Y") as month_formatted,
                COUNT(*) as total_trips,
                SUM(CASE WHEN status = "finished" THEN 1 ELSE 0 END) as completed_trips
            ')
            ->where('created_at', '>=', $sixMonthsAgo)
            ->groupBy('year', 'month', 'month_formatted')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'month'     => $item->month_formatted,
                    'trips'     => (int) $item->total_trips,
                    'completed' => (int) $item->completed_trips,
                ];
            })
            ->toArray();
            
            // Ensure we have all 6 months, even if no trips
            $allMonths = [];
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $monthKey = $month->format('M Y');
                
                $existing = collect($trends)->firstWhere('month', $monthKey);
                
                $allMonths[] = $existing ?? [
                    'month'     => $monthKey,
                    'trips'     => 0,
                    'completed' => 0,
                ];
            }
            
            return $allMonths;
        });
    }
    
    private function getTopDestinations($startOfMonth)
    {
        return Trip::whereNotNull('place')
            ->whereBetween('created_at', [$startOfMonth, now()])
            ->select('place')
            ->selectRaw('COUNT(*) as trip_count, AVG(liters) as avg_fuel')
            ->groupBy('place')
            ->orderByDesc('trip_count')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'place'      => $item->place,
                    'trip_count' => (int) $item->trip_count,
                    'avg_fuel'   => (float) ($item->avg_fuel ?? 0),
                ];
            });
    }
    
    private function getTopDrivers($startOfMonth)
    {
        return Driver::withCount(['trips' => function ($query) use ($startOfMonth) {
            $query->whereBetween('created_at', [$startOfMonth, now()]);
        }])
        ->withSum(['trips' => function ($query) use ($startOfMonth) {
            $query->whereBetween('created_at', [$startOfMonth, now()]);
        }], 'liters')
        ->orderByDesc('trips_count')
        ->take(5)
        ->get()
        ->map(function ($driver) {
            return [
                'id'             => $driver->id,
                'name'           => trim($driver->firstname . ' ' . 
                                       ($driver->middlename ? $driver->middlename . ' ' : '') . 
                                       $driver->lastname . 
                                       ($driver->suffix ? ' ' . $driver->suffix : '')),
                'trip_count'     => (int) ($driver->trips_count ?? 0),
                'total_fuel'     => (float) ($driver->trips_sum_liters ?? 0),
                'license_number' => $driver->license_number ?? '—',
                'status'         => $driver->status,
            ];
        });
    }
    
    private function getMostUsedVehicles($startOfMonth)
    {
        return Vehicle::withCount(['trips' => function ($query) use ($startOfMonth) {
            $query->whereBetween('created_at', [$startOfMonth, now()]);
        }])
        ->with(['vehicleType'])
        ->orderByDesc('trips_count')
        ->take(5)
        ->get()
        ->map(function ($vehicle) {
            return [
                'id'           => $vehicle->id,
                'plate_number' => $vehicle->plate_number ?? '—',
                'model'        => $vehicle->model ?? '—',
                'type'         => $vehicle->vehicleType?->vehicle_type_name ?? 'N/A',
                'trip_count'   => (int) ($vehicle->trips_count ?? 0),
                'status'       => $vehicle->status ?? 'unknown',
                'category'     => $vehicle->vehicleType?->category ?? 'Unknown',
            ];
        });
    }
    
    private function getProjectStats($startOfMonth)
    {
        return Trip::whereNotNull('chargetoproject')
            ->whereBetween('created_at', [$startOfMonth, now()])
            ->select('chargetoproject')
            ->selectRaw('COUNT(*) as trip_count, SUM(liters) as total_fuel')
            ->groupBy('chargetoproject')
            ->orderByDesc('trip_count')
            ->get()
            ->map(function ($item) {
                return [
                    'project'     => $item->chargetoproject,
                    'trip_count'  => (int) $item->trip_count,
                    'total_fuel'  => (float) ($item->total_fuel ?? 0),
                ];
            });
    }
    
    private function getAlerts(): array
    {
        return Cache::remember($this->getCacheKey('alerts'), 30, function () {
            $activeTripCount = Trip::whereIn('status', ['booked', 'on trip'])
                ->where(function($query) {
                    $query->whereNull('trip_end')
                          ->orWhere('trip_end', '>', now());
                })
                ->count();
                
            return [
                'vehicles_in_maintenance' => Vehicle::where('status', 'maintenance')->count(),
                'active_trips'            => $activeTripCount,
                'drivers_on_trip'         => Driver::whereHas('trips', function ($query) {
                    $query->whereIn('status', ['booked', 'on trip'])
                          ->where(function($q) {
                              $q->whereNull('trip_end')
                                ->orWhere('trip_end', '>', now());
                          });
                })->count(),
                'overdue_trips'           => Trip::where('status', 'on trip')
                    ->where('trip_end', '<', now())
                    ->count(),
            ];
        });
    }
    
    // ─── Real-time updates ────────────────────────────────────────────────────
    public function getLiveUpdates(Request $request)
    {
        $request->validate([
            'last_update'  => 'nullable|date',
            'refresh_type' => 'nullable|in:full,partial',
        ]);
        
        $lastUpdate   = $request->input('last_update') ? Carbon::parse($request->input('last_update')) : null;
        $refreshType  = $request->input('refresh_type', 'partial');
        
        $response = [
            'timestamp'       => now()->toDateTimeString(),
            'refresh_needed'  => !$lastUpdate || $lastUpdate->diffInSeconds(now()) > 60,
        ];
        
        if ($refreshType === 'full') {
            $response['data'] = $this->computeDashboardData();
        } else {
            $response['updates'] = $this->getPartialUpdates($lastUpdate);
        }
        
        return response()->json($response);
    }

    private function getPartialUpdates($lastUpdate)
    {
        if (!$lastUpdate) {
            return [];
        }
        
        // Get new / changed trips since last update
        $newTrips = Trip::with(['driver', 'vehicle.vehicleType'])
            ->where(function($query) use ($lastUpdate) {
                $query->where('created_at', '>', $lastUpdate)
                      ->orWhere('updated_at', '>', $lastUpdate);
            })
            ->take(5)
            ->get()
            ->map(fn($trip) => $this->formatTripData($trip));
        
        // Get updated stats — keys match what Dashboard.jsx expects
        $stats = [
            'booked_trips'    => Trip::where('status', 'booked')->count(),
            'on_trip_trips'   => Trip::where('status', 'on trip')->count(),
            'trips_today'     => Trip::whereDate('created_at', Carbon::today())->count(),
        ];
        
        return [
            'new_trips' => $newTrips,
            'stats'     => $stats,
            'alerts'    => $this->getAlerts(),
        ];
    }
    
    // ─── Vehicle locations stub ───────────────────────────────────────────────
    // TODO: implement real GPS tracking when available
    public function getVehicleLocations()
    {
        $vehicles = Vehicle::where('status', 'in_use')
            ->with(['vehicleType'])
            ->get()
            ->map(fn($v) => [
                'id'           => $v->id,
                'plate_number' => $v->plate_number,
                'type'         => $v->vehicleType?->vehicle_type_name ?? 'N/A',
                'status'       => $v->status,
                // Placeholder — replace with real coordinates once GPS is integrated
                'latitude'     => null,
                'longitude'    => null,
            ]);

        return response()->json([
            'vehicles'  => $vehicles,
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    // ─── Misc endpoints ───────────────────────────────────────────────────────
    public function getTripStatsByDateRange(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);
        
        $start = Carbon::parse($request->start_date)->startOfDay();
        $end   = Carbon::parse($request->end_date)->endOfDay();
        
        $cacheKey = "trip_stats_{$start->timestamp}_{$end->timestamp}";
        
        return Cache::remember($cacheKey, 300, function () use ($start, $end) {
            $stats = Trip::whereBetween('created_at', [$start, $end])
                ->selectRaw("
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'booked'    THEN 1 END) as booked,
                    COUNT(CASE WHEN status = 'on trip'   THEN 1 END) as on_trip,
                    COUNT(CASE WHEN status = 'finished'  THEN 1 END) as finished,
                    SUM(liters) as total_fuel
                ")
                ->first();
                
            return response()->json([
                'total'      => (int)   ($stats->total      ?? 0),
                'booked'     => (int)   ($stats->booked     ?? 0),
                'on_trip'    => (int)   ($stats->on_trip    ?? 0),
                'finished'   => (int)   ($stats->finished   ?? 0),
                'total_fuel' => (float) ($stats->total_fuel ?? 0),
                'date_range' => $start->format('M d, Y') . ' - ' . $end->format('M d, Y'),
            ]);
        });
    }
    
    public function getQuickStats()
    {
        return Cache::remember($this->getCacheKey('quick_stats'), 30, function () {
            $today = Carbon::today();
            
            $stats = Trip::selectRaw("
                COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as trips_today,
                COUNT(CASE WHEN status IN ('booked', 'on trip') THEN 1 END) as active_trips
            ", [$today->toDateString()])
            ->first();
            
            return response()->json([
                'trips_today'        => (int) ($stats->trips_today  ?? 0),
                'active_trips'       => (int) ($stats->active_trips ?? 0),
                'available_vehicles' => Vehicle::where('status', 'available')->count(),
                'active_drivers'     => Driver::where('status', 'active')->count(),
                'timestamp'          => now()->toDateTimeString(),
            ]);
        });
    }
    
    public function getRecentActivity()
    {
        return Cache::remember($this->getCacheKey('recent_activity'), 60, function () {
            $items = Trip::with(['driver', 'vehicle'])
                ->select(['id', 'tickNo', 'driver_id', 'vehicle_id', 'place', 'status', 'created_at', 'updated_at'])
                ->latest('created_at')
                ->take(20)
                ->get()
                ->map(fn($trip) => [
                    'id'          => $trip->id,
                    'type'        => 'trip',
                    'action'      => $trip->created_at == $trip->updated_at ? 'created' : 'updated',
                    'description' => "Trip #{$trip->tickNo} to " . ($trip->place ?: 'Unknown destination'),
                    'driver'      => $trip->driver ? trim($trip->driver->firstname . ' ' . $trip->driver->lastname) : 'N/A',
                    'vehicle'     => $trip->vehicle?->plate_number ?? 'N/A',
                    'status'      => $trip->status,
                    'timestamp'   => $trip->updated_at->diffForHumans(),
                    'full_time'   => $trip->updated_at->toDateTimeString(),
                ]);
                
            return response()->json($items);
        });
    }
    
    public function clearCache()
    {
        Cache::forget($this->getCacheKey('main'));
        Cache::forget($this->getCacheKey('additional'));
        Cache::forget($this->getCacheKey('alerts'));
        Cache::forget($this->getCacheKey('quick_stats'));
        Cache::forget($this->getCacheKey('monthly_trends'));
        Cache::forget($this->getCacheKey('recent_activity'));
        
        return response()->json([
            'message'   => 'Dashboard cache cleared successfully',
            'timestamp' => now()->toDateTimeString(),
        ]);
    }
    
    public function refreshDashboard()
    {
        $this->clearCache();
        $data = $this->computeDashboardData();
        
        return response()->json([
            'message'   => 'Dashboard data refreshed successfully',
            'timestamp' => now()->toDateTimeString(),
            'data'      => array_keys($data),
        ]);
    }
    
    private function getCacheKey(string $type): string
    {
        return self::STATS_CACHE_KEY . $type . '_' . date('YmdH');
    }
    
    public function exportDashboardData(Request $request)
    {
        $format = $request->input('format', 'pdf');
        $data = $this->computeDashboardData();
        
        return response()->json([
            'message'  => 'Export feature ready',
            'format'   => $format,
            'data_available' => [
                'trips'          => $data['tripStats']['total']          ?? 0,
                'vehicles'       => $data['vehicleStats']['total']       ?? 0,
                'drivers'        => $data['driverStats']['total']        ?? 0,
                'monthly_trends' => count($data['monthlyTrends']         ?? []),
                'recent_trips'   => count($data['recentTrips']           ?? []),
            ],
            'export_time' => now()->toDateTimeString(),
        ]);
    }
    
    public function getDashboardSummary()
    {
        return Cache::remember($this->getCacheKey('summary'), 60, function () {
            $today = Carbon::today();
            $startOfMonth = Carbon::now()->startOfMonth();
            
            $tripStats = Trip::selectRaw("
                COUNT(CASE WHEN DATE(created_at) = ? THEN 1 END) as today,
                COUNT(CASE WHEN created_at >= ? THEN 1 END) as this_month,
                COUNT(CASE WHEN status IN ('booked', 'on trip') THEN 1 END) as active
            ", [$today->toDateString(), $startOfMonth])
            ->first();
            
            $vehicleStats = Vehicle::selectRaw("
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
                COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
            ")->first();
            
            return response()->json([
                'trips_today'                => (int) ($tripStats->today   ?? 0),
                'trips_month'                => (int) ($tripStats->this_month ?? 0),
                'active_trips'               => (int) ($tripStats->active  ?? 0),
                'available_vehicles'         => (int) ($vehicleStats->available    ?? 0),
                'vehicles_in_maintenance'    => (int) ($vehicleStats->maintenance  ?? 0),
                'total_vehicles'             => (int) ($vehicleStats->total        ?? 0),
                'timestamp'                  => now()->toDateTimeString(),
            ]);
        });
    }
}