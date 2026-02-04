import { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import RegisterDriverModal from './Partials/RegisterDriverModal';
import UpdateDriverModal from './Partials/UpdateDriverModal';

export default function Driver({ auth, drivers = { data: [], links: [], current_page: 1, last_page: 1 }, vehicles = [] }) {
    // Modal States
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewDetailsId, setViewDetailsId] = useState(null);
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize current page from props
    useEffect(() => {
        setCurrentPage(drivers.current_page || 1);
    }, [drivers.current_page]);

    // Handler for opening the Update Modal
    const handleUpdateClick = (driver) => {
        setSelectedDriver(driver);
        setIsUpdateOpen(true);
    };

    // Handler for toggling details view
    const toggleDetails = (driverId) => {
        setViewDetailsId(viewDetailsId === driverId ? null : driverId);
    };

    // Extract driver data from paginated response
    const driversList = drivers.data || [];

    // Filter logic including Plate Number search
    const filteredDrivers = useMemo(() => {
        return driversList.filter(driver => {
            const fullName = `${driver.firstname} ${driver.middlename || ''} ${driver.lastname}`.toLowerCase();
            const plateNumber = driver.vehicle?.plate_number?.toLowerCase() || '';
            
            const matchesSearch = 
                fullName.includes(searchTerm.toLowerCase()) ||
                plateNumber.includes(searchTerm.toLowerCase()) ||
                (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [driversList, searchTerm, filterStatus]);

    // Paginate filtered results
    const paginatedDrivers = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredDrivers.slice(startIndex, endIndex);
    }, [filteredDrivers, currentPage, pageSize]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= Math.ceil(filteredDrivers.length / pageSize)) {
            setCurrentPage(page);
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Handle server-side pagination
    const handleServerPagination = (url) => {
        if (url) {
            setIsLoading(true);
            router.get(url, {}, {
                preserveState: true,
                onFinish: () => setIsLoading(false),
            });
        }
    };

    // Calculate pagination info
    const totalPages = Math.ceil(filteredDrivers.length / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, filteredDrivers.length);

    const stats = {
        total: driversList.length,
        active: driversList.filter(d => d.status === 'active').length,
        standby: driversList.filter(d => d.status === 'standby').length,
    };

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            standby: 'bg-amber-100 text-amber-700 border-amber-200',
        };
        return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const getStatusDot = (status) => {
        const colors = {
            active: 'bg-emerald-500',
            standby: 'bg-amber-500',
        };
        return colors[status] || 'bg-slate-500';
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const totalDisplayPages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(totalDisplayPages / 2));
        let endPage = startPage + totalDisplayPages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - totalDisplayPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <AuthenticatedLayout 
            user={auth.user}
            header={
                <div className="flex items-center justify-between w-full">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            Driver Registry
                        </h2>
                        <p className="text-sm text-[#A3C1AD]/90 font-medium mt-1">
                            Manage and monitor your personnel effectively
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Driver Registry" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
                * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
                .font-mono { font-family: 'JetBrains Mono', monospace; }
                @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
                .stagger-1 { animation-delay: 0.05s; }
                .stagger-2 { animation-delay: 0.1s; }
                .stagger-3 { animation-delay: 0.15s; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>

            <RegisterDriverModal 
                isOpen={isRegisterOpen} 
                onClose={() => setIsRegisterOpen(false)} 
                vehicles={vehicles}
            />
            
            {selectedDriver && (
                <UpdateDriverModal 
                    key={selectedDriver.id}
                    isOpen={isUpdateOpen} 
                    onClose={() => { setIsUpdateOpen(false); setSelectedDriver(null); }} 
                    driver={selectedDriver} 
                    vehicles={vehicles}
                />
            )}

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    {/* Enhanced Stats Grid with Animation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-[#1B4332] to-[#2d5a45] p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-[#A3C1AD] uppercase tracking-wider">
                                    Total Drivers
                                </p>
                                <svg className="w-5 h-5 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 4a4 4 0 100 8 4 4 0 100-8zM6 8a6 6 0 1112 0A6 6 0 016 8zm2 10a3 3 0 00-3 3 1 1 0 11-2 0 5 5 0 015-5h8a5 5 0 015 5 1 1 0 11-2 0 3 3 0 00-3-3H8z"/>
                                </svg>
                            </div>
                            <p className="text-5xl font-bold text-white mb-2">{stats.total}</p>
                            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                <div className="bg-white/30 h-full w-full"></div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-emerald-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                                <svg className="w-5 h-5 text-emerald-600/20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <p className="text-4xl font-bold text-emerald-700 mb-1">{stats.active}</p>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active</p>
                            <div className="mt-3 w-full bg-emerald-50 h-1 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${(stats.active / stats.total) * 100 || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-amber-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                <svg className="w-5 h-5 text-amber-600/20" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <p className="text-4xl font-bold text-amber-700 mb-1">{stats.standby}</p>
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Standby</p>
                            <div className="mt-3 w-full bg-amber-50 h-1 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full" style={{ width: `${(stats.standby / stats.total) * 100 || 0}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Controls Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-lg">
                        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Quick Search & Filter
                                </label>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative group">
                                            <input 
                                                type="text"
                                                placeholder="Search by name, email, or plate number..."
                                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-all shadow-sm"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4332] transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                                Status
                                            </label>
                                            <select 
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="active">Active</option>
                                                <option value="standby">Standby</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                                Show
                                            </label>
                                            <select 
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-all cursor-pointer shadow-sm"
                                            >
                                                <option value="5">5 per page</option>
                                                <option value="10">10 per page</option>
                                                <option value="20">20 per page</option>
                                                <option value="50">50 per page</option>
                                            </select>
                                        </div>

                                        <div className="flex items-end">
                                            <button 
                                                onClick={() => setIsRegisterOpen(true)}
                                                className="h-[46px] bg-gradient-to-r from-[#1B4332] to-[#2d5a45] hover:from-[#2d5a45] hover:to-[#1B4332] text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center space-x-2 whitespace-nowrap"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                                                </svg>
                                                <span>Register Driver</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Count */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-sm text-slate-600">
                                Showing <span className="font-semibold text-[#1B4332]">{filteredDrivers.length}</span> drivers 
                                {searchTerm && (
                                    <span> for "<span className="font-semibold text-[#1B4332]">{searchTerm}</span>"</span>
                                )}
                                {filterStatus !== 'all' && (
                                    <span> with status "<span className="font-semibold text-[#1B4332]">{filterStatus}</span>"</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200 p-8 mb-6 shadow-sm flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332] mb-4"></div>
                                <p className="text-slate-600 font-medium">Loading drivers...</p>
                            </div>
                        </div>
                    )}

                    {/* Driver Cards */}
                    <div className="space-y-4 mb-8">
                        {paginatedDrivers.length > 0 ? (
                            paginatedDrivers.map((driver, idx) => (
                                <div key={driver.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-slate-300 animate-slide-in stagger-${Math.min(idx + 1, 3)}`}>
                                    {/* Main Row */}
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                            {/* Driver Info */}
                                            <div className="flex items-center space-x-4 flex-1">
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-[#1B4332] to-[#2d5a45] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                                                        {driver.firstname[0]}{driver.lastname[0]}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${getStatusDot(driver.status)}`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-bold text-slate-900">
                                                            {driver.firstname} {driver.middlename && driver.middlename + ' '}{driver.lastname  + ' '}{driver.suffix }
                                                        </h3>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(driver.status)}`}>
                                                            <span className={`w-2 h-2 rounded-full mr-1.5 ${getStatusDot(driver.status)}`}></span>
                                                            {driver.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                                        <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded">
                                                            ID: {driver.id.toString().padStart(4, '0')}
                                                        </span>
                                                        {driver.email && (
                                                            <span className="text-xs text-slate-600 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                                                </svg>
                                                                {driver.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vehicle Assignment */}
                                            <div className="flex items-center justify-between lg:justify-end gap-6">
                                                <div className="text-left min-w-[180px]">
                                                    <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V3H9v2H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                                                        </svg>
                                                        Assigned Vehicle
                                                    </p>
                                                    {driver.vehicle ? (
                                                        <div className="bg-slate-50 p-3 rounded-lg">
                                                            <p className="font-mono text-base font-bold text-slate-900">{driver.vehicle.plate_number}</p>
                                                            <p className="text-xs text-slate-600">
                                                                {driver.vehicle.vehicle_type?.vehicle_type_name || 'Generic Vehicle'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                            <p className="text-sm font-medium text-amber-700 italic">No vehicle assigned</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center space-x-2">
                                                    <button 
                                                        onClick={() => toggleDetails(driver.id)}
                                                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all hover:scale-105 active:scale-95"
                                                        title="View details"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                        </svg>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateClick(driver)}
                                                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-[#1B4332] hover:text-white transition-all hover:scale-105 active:scale-95"
                                                        title="Edit driver"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                        </svg>
                                                    </button>
                                                    <button 
                                                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all hover:scale-105 active:scale-95"
                                                        title="Delete driver"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {viewDetailsId === driver.id && (
                                        <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                                                {/* Contact Information */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                        </svg>
                                                        Contact Information
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Email</p>
                                                            <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                                {driver.email || <span className="text-slate-400 italic">Not provided</span>}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Phone</p>
                                                            <p className="text-sm font-medium text-slate-900 font-mono flex items-center gap-2">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.4-.1-.8 0-1.1.2l-2.2 2.2c-2.8-1.5-5.2-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1.1-.3-1.1-.5-2.3-.5-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z"/>
                                                                </svg>
                                                                {driver.contact || <span className="text-slate-400 italic">Not provided</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Address */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                        </svg>
                                                        Address
                                                    </h4>
                                                    <p className="text-sm font-medium text-slate-900 leading-relaxed">
                                                        {driver.address || <span className="text-slate-400 italic">Not provided</span>}
                                                    </p>
                                                </div>

                                                {/* Additional Info */}
                                                <div className="bg-white p-4 rounded-xl border border-slate-100">
                                                    <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                                                        </svg>
                                                        Additional Information
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">License Type</p>
                                                            <p className="text-sm font-medium text-slate-900">
                                                                {driver.license || <span className="text-slate-400 italic">Not specified</span>}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Registration Date</p>
                                                            <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h10v2H7zm0 4h7v2H7z"/>
                                                                </svg>
                                                                {driver.created_at ? new Date(driver.created_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                }) : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                                    </svg>
                                </div>
                                <p className="text-slate-600 font-semibold text-base mb-2">
                                    No drivers found
                                </p>
                                <p className="text-slate-500 text-sm max-w-md mx-auto">
                                    {searchTerm || filterStatus !== 'all' 
                                        ? "Try adjusting your search or filter criteria"
                                        : "No drivers are currently registered. Add your first driver to get started."}
                                </p>
                                {!searchTerm && filterStatus === 'all' && (
                                    <button 
                                        onClick={() => setIsRegisterOpen(true)}
                                        className="mt-6 bg-[#1B4332] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#2d5a45] transition-colors inline-flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                                        </svg>
                                        Register First Driver
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Enhanced Pagination */}
                    {(filteredDrivers.length > 0 || drivers.links?.length > 3) && (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                {/* Items info */}
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span>Showing</span>
                                    <span className="font-semibold text-[#1B4332]">{startItem}-{endItem}</span>
                                    <span>of</span>
                                    <span className="font-semibold text-[#1B4332]">{filteredDrivers.length}</span>
                                    <span>drivers</span>
                                    {filteredDrivers.length !== driversList.length && (
                                        <span className="text-xs text-slate-400">
                                            (filtered from {driversList.length} total)
                                        </span>
                                    )}
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center gap-2">
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`p-2.5 rounded-xl transition-all ${
                                            currentPage === 1
                                                ? 'text-slate-300 cursor-not-allowed'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-[#1B4332] active:scale-95'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                                        </svg>
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1">
                                        {getPageNumbers().map((pageNum) => (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`min-w-[40px] h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                                                    currentPage === pageNum
                                                        ? 'bg-[#1B4332] text-white shadow-md'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#1B4332]'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`p-2.5 rounded-xl transition-all ${
                                            currentPage === totalPages
                                                ? 'text-slate-300 cursor-not-allowed'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-[#1B4332] active:scale-95'
                                        }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                        </svg>
                                    </button>

                                    {/* Page Size Selector */}
                                    <div className="ml-4 pl-4 border-l border-slate-200">
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-all cursor-pointer"
                                        >
                                            <option value="5">5 per page</option>
                                            <option value="10">10 per page</option>
                                            <option value="20">20 per page</option>
                                            <option value="50">50 per page</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Server-side Pagination (if available) */}
                            {drivers.links && drivers.links.length > 3 && (
                                <>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 mb-2">Server-side navigation:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {drivers.links.map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    preserveScroll
                                                    className={`min-w-[40px] h-9 flex items-center justify-center px-3 rounded-lg text-sm font-semibold transition-all ${
                                                        link.active
                                                            ? 'bg-[#1B4332] text-white shadow-sm'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}