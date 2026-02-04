<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\DeptCodeController;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Route::get('/', function () {
//     return Inertia::render('Welcome', [
//         'canLogin' => Route::has('login'),
//         'canRegister' => Route::has('register'),
//         'laravelVersion' => Application::VERSION,
//         'phpVersion' => PHP_VERSION,
//     ]);
// });
Route::get('/', function () {
    return redirect()->route('login');
});
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    // Dashboard / My Trips
 
    
  Route::controller(DashboardController::class)->prefix('dashboard')->group(function () {
        Route::get('/',                'index')                  ->name('dashboard');
        Route::get('/quick-stats',     'getQuickStats')          ->name('quick-stats');
        Route::get('/recent-activity', 'getRecentActivity')      ->name('recent-activity');
        Route::get('/vehicle-locations','getVehicleLocations')   ->name('vehicle-locations');
        Route::get('/summary',         'getDashboardSummary')    ->name('summary');

        Route::get('/live-updates',        'getLiveUpdates')          ->name('live-updates');
        Route::post('/trip-stats-by-range', 'getTripStatsByDateRange')->name('trip-stats-range');
        Route::post('/clear-cache',         'clearCache')              ->name('clear-cache');
        Route::post('/refresh',             'refreshDashboard')        ->name('refresh');
        Route::post('/export',              'exportDashboardData')     ->name('export');
    });

    // Trip Management
    Route::controller(TripController::class)->group(function () {
        Route::get('/trips', 'index')->name('trips.index');
        Route::post('/trips', 'store')->name('trips.store');
        Route::patch('/trips/{trip}', 'update')->name('trips.update');
        Route::delete('/trips/{trip}', 'destroy')->name('trips.destroy');
    });
        
    Route::controller(DeptCodeController::class)->group(function () {
        Route::get('/departments', 'index')->name('departments.index');
        Route::post('/departments', 'store')->name('departments.store');
        Route::patch('/departments/{department}', 'update')->name('departments.update');
        Route::delete('/departments/{department}', 'destroy')->name('departments.destroy');
        Route::patch('/trips/{trip}/status', [TripController::class, 'updateStatus'])->name('trips.status');
    });

    // Driver Management Registry
  Route::controller(DriverController::class)->group(function () {
    Route::get('/drivers', 'index')->name('drivers.index');
    Route::post('/drivers', 'store')->name('drivers.store');
    Route::patch('/drivers/{driver}', 'update')->name('drivers.update');
    // The new route for your searchable dropdown
   Route::get('/drivers/fetch/vehicle-plates', 'fetchVehicleplate')->name('drivers.fetch-plates');
    
    // Route::delete('/drivers/{driver}', 'destroy')->name('drivers.destroy');
});

    // Vehicle Management
   Route::controller(VehicleController::class)->group(function () {
        Route::get('/vehicles', 'index')->name('vehicles.index');
        Route::post('/vehicles', 'store')->name('vehicles.store');
        Route::patch('/vehicles/{vehicle}', 'update')->name('vehicles.update');
        // Route::delete('/vehicles/{vehicle}', 'destroy')->name('vehicles.destroy');
    });
    // Reports & Analytics

    Route::controller(ReportsController::class)->group(function () {
        Route::get('/reports', 'index')->name('reports.index');
    });



    // Profile Management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
require __DIR__.'/auth.php';
