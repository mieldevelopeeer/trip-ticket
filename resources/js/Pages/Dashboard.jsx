import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Dashboard({
  auth,
  tripStats: initialTripStats = {},
  vehicleStats: initialVehicleStats = {},
  driverStats: initialDriverStats = {},
  recentTrips: initialRecentTrips = [],
  activeTrips: initialActiveTrips = [],
  alerts: initialAlerts = {},
  fuelStats: initialFuelStats = {},
  monthlyTrends: initialMonthlyTrends = [],
  topDestinations: initialTopDestinations = [],
  topDrivers: initialTopDrivers = [],
  mostUsedVehicles: initialMostUsedVehicles = [],
  projectStats: initialProjectStats = []
}) {
  const { url } = usePage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [weather, setWeather] = useState({
    temp: null,
    condition: 'Loading...',
    icon: '⏳'
  });
  
  // State for all dashboard data
  const [dashboardData, setDashboardData] = useState({
    tripStats: initialTripStats,
    vehicleStats: initialVehicleStats,
    driverStats: initialDriverStats,
    recentTrips: initialRecentTrips,
    activeTrips: initialActiveTrips,
    alerts: initialAlerts,
    fuelStats: initialFuelStats,
    monthlyTrends: initialMonthlyTrends,
    topDestinations: initialTopDestinations,
    topDrivers: initialTopDrivers,
    mostUsedVehicles: initialMostUsedVehicles,
    projectStats: initialProjectStats
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const refreshIntervalRef = useRef(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize polling for real-time updates
  useEffect(() => {
    refreshIntervalRef.current = setInterval(() => {
      refreshDashboardData();
    }, 30000);

    const initialTimer = setTimeout(() => {
      refreshDashboardData();
    }, 5000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      clearTimeout(initialTimer);
    };
  }, []);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=8.52&longitude=124.58&current=temperature_2m,weather_code&timezone=Asia%2FManila'
        );
        if (!res.ok) throw new Error('Weather fetch failed');

        const data = await res.json();
        const temp = Math.round(data.current?.temperature_2m ?? 0);
        const code = data.current?.weather_code ?? 0;

        let condition = 'Unknown';
        let icon = '❓';

        if ([0, 1, 2].includes(code))         { condition = 'Clear'; icon = '☀️'; }
        else if ([3, 45, 48].includes(code))  { condition = 'Cloudy'; icon = '☁️'; }
        else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
          condition = 'Rain'; icon = '🌧️';
        } else if ([95, 96, 99].includes(code)) {
          condition = 'Thunderstorm'; icon = '⛈️';
        }

        setWeather({ temp, condition, icon });
      } catch (err) {
        console.error('Weather error:', err);
        setWeather({ temp: null, condition: 'Unavailable', icon: '⚠️' });
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshDashboardData = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
     // Construct the URL with parameters
const params = new URLSearchParams({
  last_update: lastUpdate.toISOString(),
  refresh_type: 'partial'
});

const response = await fetch(`/dashboard/live-updates?${params.toString()}`, {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    // Body is removed entirely
  }
});

      if (response.ok) {
        const data = await response.json();
        setLastUpdate(new Date());
        
        if (data.data) {
          // Full refresh — replace everything
          setDashboardData(prev => ({
            ...prev,
            ...data.data,
            tripStats:    data.data.tripStats    || prev.tripStats,
            vehicleStats: data.data.vehicleStats || prev.vehicleStats,
            driverStats:  data.data.driverStats  || prev.driverStats,
          }));
        } else if (data.updates) {
          // Partial update — merge new trips into the list
          if (data.updates.new_trips && data.updates.new_trips.length > 0) {
            setDashboardData(prev => ({
              ...prev,
              recentTrips: [...data.updates.new_trips, ...prev.recentTrips].slice(0, 10)
            }));
          }
          
          // Merge updated stat counts (keys match what the controller now returns)
          if (data.updates.stats) {
            setDashboardData(prev => ({
              ...prev,
              tripStats: {
                ...prev.tripStats,
                booked:     data.updates.stats.booked_trips  ?? prev.tripStats.booked,
                on_trip:    data.updates.stats.on_trip_trips ?? prev.tripStats.on_trip,
                today:      data.updates.stats.trips_today   ?? prev.tripStats.today,
              }
            }));
          }
          
          if (data.updates.alerts) {
            setDashboardData(prev => ({
              ...prev,
              alerts: data.updates.alerts
            }));
          }
        }
        
        if (data.updates?.new_trips?.length > 0) {
          showNotification(`Updated ${data.updates.new_trips.length} new trips`, 'info');
        }
      } else {
        console.error('Refresh failed:', response.status);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      showNotification('Failed to refresh dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, lastUpdate]);

  const showNotification = (message, type = 'info') => {
    toast[type](message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const forceFullRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/dashboard/live-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          refresh_type: 'full'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setDashboardData(data.data);
          setLastUpdate(new Date());
          showNotification('Dashboard fully refreshed', 'success');
        }
      }
    } catch (error) {
      console.error('Full refresh error:', error);
      showNotification('Failed to refresh dashboard', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  const dateString = currentTime.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'finished')  return 'bg-emerald-500';
    if (s === 'on trip')   return 'bg-amber-500';
    if (s === 'booked')    return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getVehicleStatusBadge = (status) => {
    const s = (status || 'unknown').toLowerCase();
    let classes = 'bg-gray-100 text-gray-700';
    let label = 'Unknown';

    if (s === 'available') {
      classes = 'bg-emerald-100 text-emerald-800';
      label = 'Available';
    } else if (['in_use', 'on_trip', 'booked'].includes(s)) {
      classes = 'bg-blue-100 text-blue-800';
      label = 'On Trip';
    } else if (s === 'maintenance') {
      classes = 'bg-amber-100 text-amber-800';
      label = 'Maintenance';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${classes}`}>
        {label}
      </span>
    );
  };

  const COLORS = ['#1B4332', '#2d5a45', '#3f6d58', '#5a8a76', '#7aa894'];

  const fuelChartData = dashboardData.fuelStats.by_fuel_type?.map(item => ({
    name: item.fuel_type || 'Unknown',
    value: Number(item.total_liters) || 0
  })) || [];

  // Active = booked + on trip  (matches the two live statuses)
  const activeTripsCount = (dashboardData.tripStats.booked || 0) + (dashboardData.tripStats.on_trip || 0);
  
  // Safe monthly trends with fallback
  const safeMonthlyTrends = dashboardData.monthlyTrends && dashboardData.monthlyTrends.length > 0 
    ? dashboardData.monthlyTrends 
    : Array.from({ length: 6 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - (5 - i));
        return {
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          trips: 0,
          completed: 0
        };
      });

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white tracking-tight">
                Operations Dashboard
              </h2>
              <p className="text-xs text-[#A3C1AD]/80 mt-0.5">
                Opol Logistics Hub • {auth.user.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-xs text-white/80">
                {isLoading ? 'Updating...' : 'Live'}
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[#A3C1AD]/80">{dateString}</p>
              <p className="text-lg font-semibold text-white tabular-nums mt-0.5">
                {timeString}
              </p>
            </div>
            <button
              onClick={forceFullRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      }
    >
      <Head title="Dashboard" />
      <ToastContainer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; }
        .recharts-wrapper {
          font-family: 'Inter', sans-serif;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Connection Status Bar */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Real-time Updates Active</p>
                <p className="text-xs text-blue-600">Auto-refreshing every 30 seconds • Last update: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600">
                Next update in: {30 - (Math.floor((new Date() - lastUpdate) / 1000) % 30)}s
              </span>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Trips */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Trips</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {activeTripsCount}
              </p>
              <div className="mt-2 text-xs text-slate-500 flex gap-3">
                <span className="inline-flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Booked: {dashboardData.tripStats.booked || 0}
                </span>
                <span className="inline-flex items-center gap-1">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  On Trip: {dashboardData.tripStats.on_trip || 0}
                </span>
              </div>
            </div>

            {/* Active Drivers */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active Drivers</p>
              <div className="flex items-baseline mt-1">
                <p className="text-2xl font-semibold text-slate-900">{dashboardData.driverStats.on_trip || 0}</p>
                <span className="text-sm text-slate-500 ml-2">/ {dashboardData.driverStats.active || 0} total</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Inactive: {dashboardData.driverStats.inactive || 0}
              </div>
            </div>

            {/* Available Vehicles */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-500">Live</span>
                </div>
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Available Vehicles</p>
              <p className="text-2xl font-semibold text-emerald-700 mt-1">
                {dashboardData.vehicleStats.available || 0}
              </p>
              <div className="mt-2 text-xs text-slate-500 flex gap-3">
                <span>Total: {dashboardData.vehicleStats.total || 0}</span>
                <span>In Use: {dashboardData.vehicleStats.in_use || 0}</span>
                <span className="text-amber-600">Maintenance: {dashboardData.vehicleStats.maintenance || 0}</span>
              </div>
            </div>

            {/* Today's Trips */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-xl shadow-lg p-5 text-white hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-emerald-200 text-sm font-medium">
                  Today
                </div>
              </div>
              <p className="text-xs font-medium text-emerald-200 uppercase tracking-wide">Trips Today</p>
              <div className="flex items-baseline mt-1">
                <p className="text-2xl font-semibold">{dashboardData.tripStats.today || 0}</p>
                <span className="text-emerald-200 text-sm ml-2">
                  Finished: {dashboardData.tripStats.completed_today || 0}
                </span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-1.5">
                  <div 
                    className="bg-white h-1.5 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${dashboardData.tripStats.total ? Math.min(100, ((dashboardData.tripStats.today || 0) / dashboardData.tripStats.total * 100)) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-slate-800">Recent Activity</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-500">Live</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={refreshDashboardData}
                    disabled={isLoading}
                    className="text-sm text-emerald-700 hover:text-emerald-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh Now'}
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {dashboardData.recentTrips && dashboardData.recentTrips.length > 0 ? (
                  dashboardData.recentTrips.map((trip, index) => (
                    <div key={`${trip.id}-${index}`} className="px-6 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getStatusColor(trip.status)}`} />
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              Trip #{trip.tickNo || '—'} • {trip.status || 'Unknown'}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {trip.driver?.name || trip.driver?.full_name || '—'} • {trip.vehicle?.plate_number || '—'}
                            </p>
                            {trip.place && (
                              <p className="text-xs text-slate-500 mt-1">
                                To: {trip.place}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {trip.created_at ? new Date(trip.created_at).toLocaleTimeString([], {
                              hour: '2-digit', minute: '2-digit'
                            }) : 'Just now'}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">
                            {trip.created_at ? new Date(trip.created_at).toLocaleDateString([], {
                              month: 'short', day: 'numeric'
                            }) : 'Today'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-slate-400 text-sm">
                    No recent activity
                  </div>
                )}
              </div>
              {dashboardData.recentTrips && dashboardData.recentTrips.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between">
                  <span>Showing {dashboardData.recentTrips.length} most recent trips</span>
                  <span>Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Alerts & Hub Info */}
            <div className="space-y-6">
              {/* Alerts Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-800">Alerts & Notifications</h3>
                  {dashboardData.alerts && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {Object.values(dashboardData.alerts).reduce((a, b) => a + (b || 0), 0)} Active
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {dashboardData.alerts?.vehicles_in_maintenance > 0 && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-800">Vehicles in Maintenance</p>
                          <p className="text-xs text-amber-600">{dashboardData.alerts.vehicles_in_maintenance} vehicle(s)</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dashboardData.alerts?.active_trips > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">Active Trips</p>
                          <p className="text-xs text-blue-600">{dashboardData.alerts.active_trips} trip(s) in progress</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {dashboardData.alerts?.overdue_trips > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-800">Overdue Trips</p>
                          <p className="text-xs text-red-600">{dashboardData.alerts.overdue_trips} trip(s) overdue</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(!dashboardData.alerts || Object.values(dashboardData.alerts).every(v => !v || v === 0)) && (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      No active alerts
                    </div>
                  )}
                </div>
              </div>

              {/* Hub Info */}
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-xl shadow-lg p-5 text-white">
                <h3 className="text-sm font-semibold text-emerald-100 uppercase tracking-wider mb-4">
                  Hub Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-emerald-200/80 uppercase text-xs font-medium mb-1">Dispatcher</p>
                    <p className="font-medium">{auth.user.name || '—'}</p>
                    <p className="text-emerald-200/70 text-xs mt-0.5">ID: {auth.user.id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-emerald-200/80 uppercase text-xs font-medium mb-1">Location</p>
                    <p className="font-medium">Opol, Misamis Oriental</p>
                  </div>
                  <div>
                    <p className="text-emerald-200/80 uppercase text-xs font-medium mb-1">Weather</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{weather.icon}</span>
                      <div>
                        <p className="font-medium">{weather.condition}</p>
                        {weather.temp !== null && (
                          <p className="text-emerald-200/70 text-xs">{weather.temp}°C</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnalyticsModal(true)}
                  className="w-full mt-6 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Full Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Trends */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4">Monthly Trip Trends</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safeMonthlyTrends} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      width={40}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '8px', 
                        border: '1px solid #e5e7eb',
                        fontSize: '12px'
                      }}
                      formatter={(value) => [value, 'Trips']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="trips" 
                      stroke="#1B4332" 
                      strokeWidth={2} 
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Total Trips" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#2d5a45" 
                      strokeWidth={2} 
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Finished" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fuel Consumption */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">Fuel Consumption</h3>
                <div className="text-sm text-slate-600">
                  Total: <span className="font-semibold text-emerald-700">
                    {Number(dashboardData.fuelStats.total_liters ?? 0).toFixed(1)} L
                  </span>
                </div>
              </div>
              <div style={{ width: '100%', height: 300 }}>
                {fuelChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fuelChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {fuelChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(1)} L`, 'Amount']}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <p className="text-sm">No fuel data this month</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Drivers */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">Top Drivers (This Month)</h3>
                <span className="text-xs text-emerald-700 font-medium">
                  Updated: Today
                </span>
              </div>
              {dashboardData.topDrivers && dashboardData.topDrivers.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.topDrivers.map((driver, index) => (
                    <div key={driver.id || index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-semibold text-sm">
                            {driver.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{driver.name || 'Unknown Driver'}</p>
                          <p className="text-xs text-slate-500">
                            {driver.license_number || 'No license'} • {driver.total_fuel ? `${driver.total_fuel.toFixed(1)}L fuel` : '0L fuel'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-700">{driver.trip_count || 0} trips</p>
                        <p className="text-xs text-slate-500">{driver.status || 'Active'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No driver data available
                </div>
              )}
            </div>

            {/* Most Used Vehicles */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">Most Used Vehicles</h3>
                <span className="text-xs text-blue-700 font-medium">
                  This Month
                </span>
              </div>
              {dashboardData.mostUsedVehicles && dashboardData.mostUsedVehicles.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.mostUsedVehicles.map((v, index) => (
                    <div key={v.id || index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 font-semibold">
                            {v.plate_number?.slice(-4) || 'N/A'}
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{v.plate_number || 'Unknown Vehicle'}</p>
                          <p className="text-xs text-slate-600">{v.model || '—'} • {v.type || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold text-blue-700">{v.trip_count || 0} trips</p>
                          <p className="text-xs text-slate-500">{v.category || '—'}</p>
                        </div>
                        {getVehicleStatusBadge(v.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No vehicle usage data
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-2xl font-semibold text-slate-900">{dashboardData.tripStats.today || 0}</p>
                <p className="text-xs font-medium text-slate-600 mt-1.5 uppercase tracking-wide">Trips Today</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{dashboardData.vehicleStats.available || 0}</p>
                <p className="text-xs font-medium text-slate-600 mt-1.5 uppercase tracking-wide">Available Vehicles</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {Number(dashboardData.fuelStats.total_liters ?? 0).toFixed(0)} L
                </p>
                <p className="text-xs font-medium text-slate-600 mt-1.5 uppercase tracking-wide">Fuel Used (Month)</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">
                  {dashboardData.topDestinations?.[0]?.trip_count || 0}
                </p>
                <p className="text-xs font-medium text-slate-600 mt-1.5 uppercase tracking-wide">Top Destination Trips</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAnalyticsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Analytics Overview</h2>
                <p className="text-sm text-slate-600 mt-1">Real-time operational insights</p>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl leading-none p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-sm font-medium text-slate-600">Trips This Month</p>
                  <p className="text-3xl font-semibold text-emerald-700 mt-1">{dashboardData.tripStats.this_month || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-sm font-medium text-slate-600">Active Drivers</p>
                  <p className="text-3xl font-semibold text-slate-900 mt-1">{dashboardData.driverStats.active || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-sm font-medium text-slate-600">Fuel Used</p>
                  <p className="text-3xl font-semibold text-amber-700 mt-1">
                    {Number(dashboardData.fuelStats.total_liters ?? 0).toFixed(1)} L
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <p className="text-sm font-medium text-slate-600">Available Vehicles</p>
                  <p className="text-3xl font-semibold text-slate-900 mt-1">{dashboardData.vehicleStats.available || 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Trends */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">Monthly Trip Trends</h3>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={safeMonthlyTrends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                        <Line type="monotone" dataKey="trips" stroke="#1B4332" strokeWidth={2} dot={false} name="Total Trips" />
                        <Line type="monotone" dataKey="completed" stroke="#2d5a45" strokeWidth={2} dot={false} name="Finished" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fuel by Type */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">Fuel by Type</h3>
                  <div style={{ width: '100%', height: 320 }}>
                    {fuelChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={fuelChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {fuelChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value.toFixed(1)} L`} />
                          <Legend verticalAlign="bottom" height={40} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        No fuel data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}