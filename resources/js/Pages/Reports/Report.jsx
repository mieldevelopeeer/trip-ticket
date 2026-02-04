import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function Report({
  auth,
  tripStats = {},
  vehicleStats = {},
  driverStats = {},
  fuelStats = {},
  monthlyTrends = [],
  topDestinations = [],
  topDrivers = [],
  mostUsedVehicles = [],
  projectStats = [],
  filters = {},
  trips,                    // paginated data from Laravel
  availablePrefixes = [],   // dynamic ticket prefixes
}) {
  const {
    data: displayTrips = [],
    current_page = 1,
    last_page = 1,
    per_page = 15,
    total = 0,
    from = 0,
    to = 0,
  } = trips || {};

  const [dateFrom, setDateFrom] = useState(filters.date_from || '');
  const [dateTo, setDateTo] = useState(filters.date_to || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [driverFilter, setDriverFilter] = useState(filters.driver || '');
  const [vehicleFilter, setVehicleFilter] = useState(filters.vehicle || '');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [ticketPrefix, setTicketPrefix] = useState(filters.ticket_prefix || '');

  const [isLandscape, setIsLandscape] = useState(false);

  const applyFilters = (newPage = 1) => {
    router.get(route('reports.index'), {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      driver: driverFilter || undefined,
      vehicle: vehicleFilter || undefined,
      search: searchTerm.trim() || undefined,
      ticket_prefix: ticketPrefix || undefined,
      page: newPage,
      per_page: per_page,
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    setDriverFilter('');
    setVehicleFilter('');
    setSearchTerm('');
    setTicketPrefix('');
    router.get(route('reports.index'));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= last_page) {
      applyFilters(newPage);
    }
  };

  const generatePaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(last_page, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="px-2 text-slate-400">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            i === current_page ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < last_page) {
      if (endPage < last_page - 1) {
        buttons.push(<span key="ellipsis2" className="px-2 text-slate-400">...</span>);
      }
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(last_page)}
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
        >
          {last_page}
        </button>
      );
    }

    return buttons;
  };

  const handlePrint = () => window.print();

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Operations Report" />

      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', system-ui, sans-serif; }
          @media print {
            body * { visibility: hidden; }
            #print-content, #print-content * { visibility: visible; }
            #print-content { position: absolute; left: 0; top: 0; width: 100%; }
            @page { size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'}; margin: ${isLandscape ? '10mm 12mm' : '12mm 10mm'}; }
            .no-print { display: none !important; }
          }
        `
      }} />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-16 print:bg-white">
        <div className="max-w-[1800px] mx-auto px-5 sm:px-6 lg:px-8 py-10">

          {/* Header + Controls */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Operations Report</h1>
                <p className="text-sm text-slate-600 mt-1.5">ME0 • {new Date().toLocaleString()}</p>
              </div>

              <div className="flex flex-wrap items-center gap-5 print:hidden">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                  <span className="text-sm font-medium text-slate-600">Print Orientation:</span>
                  <div className="inline-flex rounded-full bg-slate-100 p-0.5">
                    <button
                      onClick={() => setIsLandscape(false)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                        !isLandscape ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      onClick={() => setIsLandscape(true)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                        isLandscape ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-full transition shadow-sm"
                >
                  Print
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Total Trips</p>
              <p className="text-3xl font-bold text-slate-900">{tripStats.total || 0}</p>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Trips This Month</p>
              <p className="text-3xl font-bold text-emerald-700">{tripStats.this_month || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Current period</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Active Drivers</p>
              <p className="text-3xl font-bold text-blue-700">{driverStats.active || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Currently available</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Fuel Used (Month)</p>
              <p className="text-3xl font-bold text-amber-700">
                {Number(fuelStats.total_liters ?? 0).toFixed(1)} L
              </p>
              <p className="text-xs text-slate-500 mt-1">Total consumption</p>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-10 print:hidden">
            <h2 className="text-lg font-bold text-slate-900 mb-5">Filters & Search</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="booked">Booked</option>
                  <option value="on trip">On Trip</option>
                  <option value="finished">Finished</option>
                </select>
              </div>

             

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search driver, vehicle, ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={() => applyFilters(1)}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Master List Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-10">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Master Trip List</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Showing {from || 0} to {to || displayTrips.length} of {total || displayTrips.length} trips
                    {per_page && <span className="text-slate-500"> (Page {current_page} of {last_page})</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 font-medium">Show:</span>
                  <select
                    value={per_page}
                    onChange={(e) => {
                      router.get(route('reports.index'), {
                        ...filters,
                        ticket_prefix: ticketPrefix || undefined,
                        per_page: e.target.value,
                        page: 1,
                      }, {
                        preserveState: true,
                        preserveScroll: true,
                      });
                    }}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="10">10</option>
                    <option value="15">15</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Ticket No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Driver Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Vehicle Model
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Plate Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Destination
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Fuel Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Liters
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-xs">
                  {displayTrips.length > 0 ? (
                    displayTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-mono font-semibold text-blue-700 text-xs">
                            {trip.tickNo || `#${String(trip.id).padStart(5, '0')}`}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-7 h-7 bg-emerald-100 rounded-md flex items-center justify-center">
                              <svg className="w-3.5 h-3.5 text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {trip.driver?.firstname || ''} {trip.driver?.lastname || 'N/A'} {trip.driver?.suffix}
                              </p>
                              {trip.driver?.license_number && (
                                <p className="text-[11px] text-slate-500 font-mono">
                                  {trip.driver.license_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="font-semibold text-slate-900">
                            {trip.vehicle?.vehicle_type?.vehicle_type_name || trip.vehicle?.model || 'N/A'}
                          </p>
                          {trip.vehicle?.vehicle_type?.category && (
                            <p className="text-[11px] text-slate-500">
                              {trip.vehicle.vehicle_type.category}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="font-mono font-semibold text-slate-900 text-xs">
                            {trip.vehicle?.plate_number || 'N/A'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-1.5 max-w-xs">
                            <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-slate-800 line-clamp-2">
                              {trip.place || 'N/A'}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {trip.fuel_type ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                              {trip.fuel_type.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {trip.liters ? (
                            <span className="font-semibold text-amber-700">
                              {Number(trip.liters).toFixed(1)} L
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            trip.status === 'completed' || trip.status === 'finished'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            trip.status === 'in_progress' || trip.status === 'on trip'
                              ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            trip.status === 'dispatched'
                              ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              trip.status === 'completed' || trip.status === 'finished' ? 'bg-emerald-500' :
                              trip.status === 'in_progress' || trip.status === 'on trip' ? 'bg-blue-500 animate-pulse' :
                              trip.status === 'dispatched' ? 'bg-amber-500 animate-pulse' :
                              'bg-slate-400'
                            }`}></span>
                            {(trip.status || 'N/A').replace('_', ' ').toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <p className="text-slate-900">
                            {formatDateTime(trip.created_at)}
                          </p>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-slate-900 font-semibold text-base mb-1">No trips found</p>
                          <p className="text-slate-500 text-xs">Try adjusting your filters or date range</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {displayTrips.length > 0 && total > per_page && (
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-slate-600">
                    Showing <span className="font-semibold">{from}</span> to <span className="font-semibold">{to}</span> of{' '}
                    <span className="font-semibold">{total}</span> results
                  </div>

                  <div className="flex items-center justify-center sm:justify-end gap-2">
                    <button
                      onClick={() => handlePageChange(current_page - 1)}
                      disabled={current_page === 1}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                        current_page === 1 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {generatePaginationButtons()}
                    </div>

                    <button
                      onClick={() => handlePageChange(current_page + 1)}
                      disabled={current_page === last_page}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                        current_page === last_page ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className="text-center text-sm text-slate-500 mt-12 pt-8 border-t border-slate-200 print:hidden">
            <p className="font-semibold text-slate-700">Opol Logistics Hub Operations Report</p>
            <p className="mt-1">Generated on {new Date().toLocaleString()} • Confidential</p>
          </div>
        </div>

        {/* Print content */}
        <div id="print-content" className="hidden print:block bg-white text-slate-800">
          <div className="px-8 py-6 text-[11px]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-300">
                  <th className="py-2 px-2 text-left font-bold">Ticket No</th>
                  <th className="py-2 px-2 text-left font-bold">Driver</th>
                  <th className="py-2 px-2 text-left font-bold">Vehicle</th>
                  <th className="py-2 px-2 text-left font-bold">Plate</th>
                  <th className="py-2 px-2 text-left font-bold">Destination</th>
                  <th className="py-2 px-2 text-left font-bold">Fuel</th>
                  <th className="py-2 px-2 text-left font-bold">Liters</th>
                  <th className="py-2 px-2 text-left font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayTrips.length > 0 ? (
                  displayTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td className="py-1.5 px-2 font-mono font-medium text-blue-700">
                        {trip.tickNo || `#${String(trip.id).padStart(5, '0')}`}
                      </td>
                      <td className="py-1.5 px-2">
                        {trip.driver?.firstname || ''} {trip.driver?.lastname || '—'} {trip.driver?.suffix}
                        {trip.driver?.license_number && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{trip.driver.license_number}</div>
                        )}
                      </td>
                      <td className="py-1.5 px-2">
                        {trip.vehicle?.vehicle_type?.vehicle_type_name || trip.vehicle?.model || '—'}
                      </td>
                      <td className="py-1.5 px-2 font-mono font-medium">
                        {trip.vehicle?.plate_number || '—'}
                      </td>
                      <td className="py-1.5 px-2 max-w-[160px] truncate">
                        {trip.place || '—'}
                      </td>
                      <td className="py-1.5 px-2">
                        {trip.fuel_type ? (
                          <span className="px-1.5 py-0.5 bg-orange-50 text-orange-800 rounded text-[10px] font-medium">
                            {trip.fuel_type.toUpperCase()}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-1.5 px-2 font-medium text-amber-700">
                        {trip.liters ? Number(trip.liters).toFixed(1) + ' L' : '—'}
                      </td>
                      <td className="py-1.5 px-2 text-slate-600">
                        {formatDateTime(trip.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500 text-[11px]">
                      No trips found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-8 pt-4 text-center text-[10px] text-slate-400 border-t border-slate-200">
              Opol Logistics Hub • Page {current_page} of {last_page} • Generated {new Date().toLocaleString('en-PH')} • Confidential
            </div>
          </div>
        </div>
          </div>
      </AuthenticatedLayout>
    );
  }