import React, { useState } from 'react'; // ← FIXED: Added React import
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import CreateTripModal from './Partials/CreateTripModal';

// Toast Notification Component
const ToastNotification = ({ type = 'success', message, onClose, duration = 4000 }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    React.useEffect(() => {
        if (duration) {
            // Animate progress bar
            const interval = 50;
            const totalSteps = duration / interval;
            const decrement = 100 / totalSteps;
            
            const progressTimer = setInterval(() => {
                setProgress(prev => {
                    if (prev <= 0) {
                        clearInterval(progressTimer);
                        return 0;
                    }
                    return prev - decrement;
                });
            }, interval);

            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
            }, duration);

            return () => {
                clearTimeout(timer);
                clearInterval(progressTimer);
            };
        }
    }, [duration, onClose]);

    if (!isVisible) return null;

    const styles = {
        success: {
            bg: 'bg-emerald-50 border border-emerald-200',
            text: 'text-emerald-800',
            icon: (
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            progress: 'bg-emerald-500',
        },
        error: {
            bg: 'bg-red-50 border border-red-200',
            text: 'text-red-800',
            icon: (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            ),
            progress: 'bg-red-500',
        },
    };

    const style = styles[type] || styles.success;

    return (
        <div className="fixed top-6 right-6 z-[1000] animate-slide-in">
            <div className={`${style.bg} rounded-xl shadow-lg min-w-[320px] max-w-md overflow-hidden`}>
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            {style.icon}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${style.text}`}>
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsVisible(false);
                                setTimeout(onClose, 300);
                            }}
                            className="flex-shrink-0 ml-4 p-1 rounded-lg hover:bg-black/5 transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="h-0.5 bg-gray-200">
                    <div 
                        className={`h-full ${style.progress} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

// Status Update Modal Component
const StatusUpdateModal = ({ trip, isOpen, onClose, onUpdate }) => {
    const [selectedStatus, setSelectedStatus] = useState(trip?.status || 'booked');
    const [notes, setNotes] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        
        try {
            await onUpdate(trip.id, selectedStatus, notes);
            // Success is handled by parent component
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!isOpen || !trip) return null;

    const statusOptions = [
        { value: 'booked', label: 'Booked', color: 'bg-blue-100 text-blue-800' },
        { value: 'on trip', label: 'On Trip', color: 'bg-emerald-100 text-emerald-800' },
        { value: 'finished', label: 'Finished', color: 'bg-slate-100 text-slate-800' },
    ];

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Update Trip Status</h3>
                            <p className="text-sm text-emerald-100 mt-1">
                                Ticket: {trip.tickNo || `#${String(trip.id).padStart(5, '0')}`}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Current Status */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Current Status
                        </label>
                        <div className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                statusOptions.find(s => s.value === trip.status)?.color || 'bg-gray-100 text-gray-800'
                            }`}>
                                {statusOptions.find(s => s.value === trip.status)?.label || trip.status}
                            </div>
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </div>

                    {/* New Status */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Update to
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {statusOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedStatus === option.value
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={option.value}
                                        checked={selectedStatus === option.value}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <div className="flex-1">
                                        <span className="font-medium text-slate-900">{option.label}</span>
                                        {option.value === 'finished' && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Vehicle will be marked as available
                                            </p>
                                        )}
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${selectedStatus === option.value ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                </label>
                            ))}
                        </div>
                    </div>

                   

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUpdating}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating || selectedStatus === trip.status}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUpdating ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function Trip({ auth, drivers, vehicles, trips = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedRow, setExpandedRow] = useState(null);
    const [detailModalTrip, setDetailModalTrip] = useState(null);
    const [statusUpdateModal, setStatusUpdateModal] = useState({ isOpen: false, trip: null });
    const [notification, setNotification] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filter trips
    const filteredTrips = trips.filter(trip => {
        const driverFullName = trip.driver?.full_name || '';
        const driverFirstname = trip.driver?.firstname || '';
        const driverLastname = trip.driver?.lastname || '';
        const passenger = trip.passenger || '';
        const place = trip.place || '';
        const plateNumber = trip.vehicle?.plate_number || '';
        const vehicleModel = trip.vehicle?.model || '';
        const vehicleType = trip.vehicle?.type || '';
        const vehicleTypeName = trip.vehicle?.vehicle_type?.vehicle_type_name || '';
        const vehicleCategory = trip.vehicle?.vehicle_type?.category || '';
        const purpose = trip.purpose || '';
        const tickNo = trip.tickNo || '';

        const matchesSearch =
            driverFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driverFirstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driverLastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            passenger.toLowerCase().includes(searchTerm.toLowerCase()) ||
            place.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicleType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicleTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicleCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tickNo.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // Reset to page 1 whenever search or filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    // Pagination derivations
    const totalPages = Math.max(1, Math.ceil(filteredTrips.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedTrips = filteredTrips.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
    const startIndex = filteredTrips.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(safePage * ITEMS_PER_PAGE, filteredTrips.length);

    const getStatusConfig = (status) => {
        const configs = {
            booked: {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                border: 'border-blue-200',
                dot: 'bg-blue-500',
                animate: false
            },
            'on trip': {
                bg: 'bg-emerald-50',
                text: 'text-emerald-700',
                border: 'border-emerald-200',
                dot: 'bg-emerald-500',
                animate: true
            },
            finished: {
                bg: 'bg-slate-50',
                text: 'text-slate-600',
                border: 'border-slate-200',
                dot: 'bg-slate-400',
                animate: false
            },
        };
        return configs[status] || configs.booked;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return null;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diff = endDate - startDate;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const stats = {
        total: trips.length,
        booked: trips.filter(t => t.status === 'booked').length,
        on_trip: trips.filter(t => t.status === 'on trip').length,
        finished: trips.filter(t => t.status === 'finished').length,
    };

    const toggleRowExpansion = (tripId) => {
        setExpandedRow(expandedRow === tripId ? null : tripId);
    };

    const handleStatusUpdate = async (tripId, newStatus, notes = '') => {
        try {
            const response = await router.patch(route('trips.status', tripId), {
                status: newStatus,
                notes: notes
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setStatusUpdateModal({ isOpen: false, trip: null });
                    setNotification({
                        type: 'success',
                        message: `Trip status updated to ${newStatus} successfully!`
                    });
                },
                onError: (errors) => {
                    setNotification({
                        type: 'error',
                        message: errors.error || 'Failed to update status. Please try again.'
                    });
                }
            });
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Failed to update status. Please try again.'
            });
        }
    };

    const handleQuickStatusUpdate = (trip, action) => {
        if (action === 'start' && trip.status !== 'on trip') {
            handleStatusUpdate(trip.id, 'on trip', 'Trip started');
        } else if (action === 'finish' && trip.status !== 'finished') {
            handleStatusUpdate(trip.id, 'finished', 'Trip completed');
        }
    };

    const closeNotification = () => {
        setNotification(null);
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Trip Dispatch Management" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600;700&display=swap');
                
                * { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                .font-mono { font-family: 'Geist Mono', 'SF Mono', 'Monaco', 'Courier New', monospace; }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                @keyframes expandRow {
                    from { opacity: 0; max-height: 0; }
                    to { opacity: 1; max-height: 500px; }
                }

                @keyframes slide-in {
                    from { transform: translateX(120%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                
                .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-slide-in-right { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-expand-row { animation: expandRow 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-slide-in { animation: slide-in 0.4s ease-out; }
                
                .stagger-1 { animation-delay: 0.05s; }
                .stagger-2 { animation-delay: 0.1s; }
                .stagger-3 { animation-delay: 0.15s; }
                .stagger-4 { animation-delay: 0.2s; }

                .table-row-hover {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .table-row-hover:hover {
                    background: linear-gradient(to right, rgba(16, 185, 129, 0.03), rgba(16, 185, 129, 0));
                    transform: translateX(2px);
                }

                .expanded-row {
                    background: linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02));
                }
            `}</style>

            {/* Toast Notification */}
            {notification && (
                <ToastNotification
                    type={notification.type}
                    message={notification.message}
                    onClose={closeNotification}
                />
            )}

            {/* Status Update Modal */}
            {statusUpdateModal.isOpen && statusUpdateModal.trip && (
                <StatusUpdateModal
                    trip={statusUpdateModal.trip}
                    isOpen={statusUpdateModal.isOpen}
                    onClose={() => setStatusUpdateModal({ isOpen: false, trip: null })}
                    onUpdate={handleStatusUpdate}
                />
            )}

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header Section */}
                    <div className="mb-8 animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                                    Trip Dispatch Management
                                </h1>
                                <p className="text-sm text-slate-600 font-medium">
                                    Monitor and authorize vehicle dispatch operations
                                </p>
                            </div>

                            {/* Quick Stats */}
                            <div className="hidden lg:flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Trips</div>
                                </div>
                                <div className="w-px h-12 bg-slate-200"></div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-emerald-600">{stats.on_trip}</div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active</div>
                                </div>
                                <div className="w-px h-12 bg-slate-200"></div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-600">{stats.finished}</div>
                                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Completed</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm animate-fade-in-up stagger-1">
                        <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                            {/* Search */}
                            <div className="flex-1 max-w-lg">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                                    Search Trips
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 1115 0 7 7 0 0115 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search by ticket, driver, vehicle, destination..."
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Filter */}
                            <div className="w-full lg:w-56">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                                    Status Filter
                                </label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer hover:bg-slate-100"
                                >
                                    <option value="all">All Status</option>
                                    <option value="booked">Booked</option>
                                    <option value="on trip">On Trip</option>
                                    <option value="finished">Finished</option>
                                </select>
                            </div>

                            {/* Create Trip Button */}
                            <div className="w-full lg:w-auto">
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="group w-full lg:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5"
                                >
                                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Authorize New Trip</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Trips Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up stagger-2">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                        <th className="px-6 py-4 text-left w-12"></th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Ticket No
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Driver
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Passenger
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Vehicle
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Destination
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-left">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Status
                                            </span>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Actions
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedTrips.length > 0 ? (
                                        paginatedTrips.map((trip, idx) => {
                                            const statusConfig = getStatusConfig(trip.status || 'booked');
                                            const isExpanded = expandedRow === trip.id;

                                            return (
                                                <React.Fragment key={trip.id}>
                                                    <tr
                                                        className={`table-row-hover group animate-slide-in-right ${isExpanded ? 'expanded-row' : ''}`}
                                                        style={{ animationDelay: `${Math.min(idx * 0.05, 0.3)}s` }}
                                                    >
                                                        {/* Expand Button */}
                                                        <td className="px-5 py-3.5">
                                                            <button
                                                                onClick={() => toggleRowExpansion(trip.id)}
                                                                className="text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                                                            >
                                                                <svg
                                                                    className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </button>
                                                        </td>

                                                        {/* Ticket No */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-1 h-9 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full flex-shrink-0 shadow-sm"></div>
                                                                <span className="font-mono text-sm font-bold text-slate-900 tracking-tight">
                                                                    {trip.tickNo || `#${String(trip.id).padStart(5, '0')}`}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Driver */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg flex items-center justify-center ring-1 ring-emerald-200/50">
                                                                    <svg className="w-4 h-4 text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 leading-tight">
                                                                        {trip.driver?.lastname || 'N/A'}, {trip.driver?.firstname || ''} {trip.driver?.suffix}
                                                                    </p>
                                                                    {trip.driver?.license_number && (
                                                                        <p className="text-xs text-slate-500 font-mono mt-0.5 tracking-tight">
                                                                            Lic: {trip.driver.license_number}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Passenger */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-2">
                                                                {trip.passenger ? (
                                                                    <>
                                                                        <div className="flex-shrink-0 w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center ring-1 ring-slate-200/50">
                                                                            <svg className="w-3.5 h-3.5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                                                                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                            </svg>
                                                                        </div>
                                                                        <p className="text-sm font-medium text-slate-700 truncate max-w-[140px]" title={trip.passenger}>
                                                                            {trip.passenger}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-sm text-slate-400 font-medium">—</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Vehicle */}
                                                        <td className="px-5 py-3.5">
                                                            <div>
                                                                <p className="text-sm font-mono font-bold text-slate-900 tracking-tight">
                                                                    {trip.vehicle?.plate_number || 'N/A'}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                                                                    {trip.vehicle?.vehicle_type?.vehicle_type_name && (
                                                                        <span className="text-slate-600 font-medium">
                                                                            {trip.vehicle.vehicle_type.vehicle_type_name}
                                                                        </span>
                                                                    )}
                                                                    {trip.vehicle?.vehicle_type?.category && (
                                                                        <>
                                                                            <span className="text-slate-400">•</span>
                                                                            <span className="text-slate-500">
                                                                                {trip.vehicle.vehicle_type.category}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Destination */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-start gap-2">
                                                                <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                                </svg>
                                                                <p className="text-sm font-medium text-slate-800 truncate max-w-[160px]" title={trip.place || 'N/A'}>
                                                                    {trip.place || 'N/A'}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        {/* Status - Now Clickable */}
                                                        <td className="px-5 py-3.5">
                                                            <button
                                                                onClick={() => setStatusUpdateModal({ isOpen: true, trip })}
                                                                className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                                                                title="Click to update status"
                                                            >
                                                                <span className={`w-2 h-2 rounded-full mr-2 ${statusConfig.dot} ${statusConfig.animate ? 'animate-pulse' : ''}`}></span>
                                                                {(trip.status || 'booked').toUpperCase()}
                                                            </button>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {/* Quick Start Trip Button */}
                                                                {trip.status !== 'on trip' && trip.status !== 'finished' && (
                                                                    <button
                                                                        onClick={() => handleQuickStatusUpdate(trip, 'start')}
                                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"
                                                                        title="Start Trip"
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                    </button>
                                                                )}

                                                                {/* Quick Finish Trip Button */}
                                                                {trip.status === 'on trip' && (
                                                                    <button
                                                                        onClick={() => handleQuickStatusUpdate(trip, 'finish')}
                                                                        className="text-slate-600 hover:text-slate-700 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                                                                        title="Finish Trip"
                                                                    >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                    </button>
                                                                )}

                                                                {/* View Details Button */}
                                                                <button
                                                                    onClick={() => setDetailModalTrip(trip)}
                                                                    className="text-slate-400 hover:text-emerald-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </button>

                                                                {/* Status Update Button (Detailed) */}
                                                                <button
                                                                    onClick={() => setStatusUpdateModal({ isOpen: true, trip })}
                                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                                    title="Update Status"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Row Details */}
                                                    {isExpanded && (
                                                        <tr className="animate-expand-row">
                                                            <td colSpan="8" className="px-6 py-6 bg-gradient-to-r from-slate-50/50 to-white border-b border-slate-100">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-12">
                                                                    {/* Time Information */}
                                                                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                            </svg>
                                                                            <h4 className="font-bold text-slate-900 text-sm">Time Details</h4>
                                                                        </div>
                                                                        <div className="space-y-2.5">
                                                                            <div>
                                                                                <p className="text-xs text-slate-500 font-medium mb-1">Created</p>
                                                                                <p className="text-sm font-semibold text-slate-900">{formatDateTime(trip.created_at)}</p>
                                                                            </div>
                                                                            {trip.trip_start && (
                                                                                <div>
                                                                                    <p className="text-xs text-slate-500 font-medium mb-1">Trip Start</p>
                                                                                    <p className="text-sm font-semibold text-slate-900">{formatTime(trip.trip_start)}</p>
                                                                                </div>
                                                                            )}
                                                                            {trip.trip_end && (
                                                                                <div>
                                                                                    <p className="text-xs text-slate-500 font-medium mb-1">Trip End</p>
                                                                                    <p className="text-sm font-semibold text-slate-900">{formatTime(trip.trip_end)}</p>
                                                                                </div>
                                                                            )}
                                                                            {trip.trip_start && trip.trip_end && (
                                                                                <div>
                                                                                    <p className="text-xs text-slate-500 font-medium mb-1">Duration</p>
                                                                                    <p className="text-sm font-semibold text-emerald-600">
                                                                                        {calculateDuration(trip.trip_start, trip.trip_end)}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Trip Information */}
                                                                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                            <h4 className="font-bold text-slate-900 text-sm">Trip Information</h4>
                                                                        </div>
                                                                        <div className="space-y-2.5">
                                                                            <div>
                                                                                <p className="text-xs text-slate-500 font-medium mb-1">Project Charge</p>
                                                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                                                                    {trip.chargetoproject || 'GENERAL'}
                                                                                </span>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-slate-500 font-medium mb-1">Purpose</p>
                                                                                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                                                                                    {trip.purpose || 'Not specified'}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Fuel Information */}
                                                                    {(trip.fuel_type || trip.liters) && (
                                                                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                                                                            <div className="flex items-center gap-2 mb-3">
                                                                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                                                                                </svg>
                                                                                <h4 className="font-bold text-slate-900 text-sm">Fuel Details</h4>
                                                                            </div>
                                                                            <div className="space-y-2.5">
                                                                                {trip.fuel_type && (
                                                                                    <div>
                                                                                        <p className="text-xs text-slate-500 font-medium mb-1">Fuel Type</p>
                                                                                        <p className="text-sm font-semibold text-slate-900 uppercase">{trip.fuel_type}</p>
                                                                                    </div>
                                                                                )}
                                                                                {trip.liters && (
                                                                                    <div>
                                                                                        <p className="text-xs text-slate-500 font-medium mb-1">Liters</p>
                                                                                        <p className="text-sm font-semibold text-orange-600">{trip.liters} L</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
                                                        <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-slate-900 font-bold text-base mb-2">
                                                        No trips found
                                                    </p>
                                                    <p className="text-slate-500 text-sm font-medium">
                                                        Try adjusting your search criteria or filters
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer */}
                        {filteredTrips.length > 0 && (
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-6 py-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-slate-600 font-medium">Showing</span>
                                        <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                                            {startIndex}–{endIndex}
                                        </span>
                                        <span className="text-slate-600 font-medium">of</span>
                                        <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                                            {filteredTrips.length}
                                        </span>
                                        <span className="text-slate-600 font-medium">trips</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Dispatch Log Verified
                                        </span>
                                    </div>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-slate-200">
                                        {/* First Page */}
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={safePage === 1}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:shadow-none"
                                            title="First page"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        {/* Previous Page */}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={safePage === 1}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:shadow-none"
                                            title="Previous page"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        {/* Page Number Buttons */}
                                        {(() => {
                                            const pages = [];
                                            const maxVisible = 5;

                                            if (totalPages <= maxVisible + 2) {
                                                // Show all pages when total is small
                                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                                            } else if (safePage <= 3) {
                                                // Near the start
                                                pages.push(1, 2, 3, '...', totalPages);
                                            } else if (safePage >= totalPages - 2) {
                                                // Near the end
                                                pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                                            } else {
                                                // Middle
                                                pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
                                            }

                                            return pages.map((page, i) => {
                                                if (page === '...') {
                                                    return (
                                                        <span key={`ellipsis-${i}`} className="w-8 text-center text-slate-400 text-sm font-medium">
                                                            ···
                                                        </span>
                                                    );
                                                }
                                                const isActive = page === safePage;
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                                                            isActive
                                                                ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-900/20 border border-emerald-600'
                                                                : 'text-slate-600 hover:text-emerald-700 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            });
                                        })()}

                                        {/* Next Page */}
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={safePage === totalPages}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:shadow-none"
                                            title="Next page"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>

                                        {/* Last Page */}
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={safePage === totalPages}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:shadow-none"
                                            title="Last page"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7M5 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {detailModalTrip && (
                <div
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={() => setDetailModalTrip(null)}
                >
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-white">
                                    Trip #{String(detailModalTrip.tickNo || detailModalTrip.id).padStart(4, '0')}
                                </h2>
                            </div>
                            <button
                                onClick={() => setDetailModalTrip(null)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                            <div className="space-y-6">
                                {/* Personnel & Vehicle */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Driver */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Driver</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {detailModalTrip.driver?.full_name || 'N/A'}
                                        </p>
                                        {detailModalTrip.driver?.license_number && (
                                            <p className="text-xs text-slate-600 mt-0.5">
                                                {detailModalTrip.driver.license_number}
                                            </p>
                                        )}
                                    </div>

                                    {/* Passenger */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Passenger</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {detailModalTrip.passenger || '—'}
                                        </p>
                                    </div>

                                    {/* Vehicle */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Vehicle</p>
                                        <p className="text-sm font-mono font-bold text-slate-900">
                                            {detailModalTrip.vehicle?.plate_number || 'N/A'}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            {detailModalTrip.vehicle?.vehicle_type?.vehicle_type_name || '—'}
                                            {detailModalTrip.vehicle?.vehicle_type?.category &&
                                                ` • ${detailModalTrip.vehicle.vehicle_type.category}`}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
                                        {(() => {
                                            const statusConfig = getStatusConfig(detailModalTrip.status || 'booked');
                                            return (
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dot} ${statusConfig.animate ? 'animate-pulse' : ''}`}></span>
                                                    {(detailModalTrip.status || 'booked').toUpperCase()}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 my-6"></div>

                                {/* Trip Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Destination */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Destination</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {detailModalTrip.place || 'N/A'}
                                        </p>
                                    </div>

                                    {/* Project Charge */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Project</p>
                                        <p className="text-sm font-mono font-medium text-slate-900">
                                            {detailModalTrip.chargetoproject || 'GENERAL'}
                                        </p>
                                    </div>

                                    {/* Purpose */}
                                    <div className="col-span-full">
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Purpose</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">
                                            {detailModalTrip.purpose || 'Not specified'}
                                        </p>
                                    </div>
                                </div>

                                {/* Time & Fuel */}
                                {(detailModalTrip.trip_start || detailModalTrip.trip_end || detailModalTrip.fuel_type || detailModalTrip.liters) && (
                                    <>
                                        <div className="border-t border-slate-200 my-6"></div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            {detailModalTrip.trip_start && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Start</p>
                                                    <p className="text-xs text-slate-700">
                                                        {formatDateTime(detailModalTrip.trip_start)}
                                                    </p>
                                                </div>
                                            )}

                                            {detailModalTrip.trip_end && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">End</p>
                                                    <p className="text-xs text-slate-700">
                                                        {formatDateTime(detailModalTrip.trip_end)}
                                                    </p>
                                                </div>
                                            )}

                                            {detailModalTrip.fuel_type && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Fuel Type</p>
                                                    <p className="text-sm font-medium text-slate-900 uppercase">
                                                        {detailModalTrip.fuel_type}
                                                    </p>
                                                </div>
                                            )}

                                            {detailModalTrip.liters && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Liters</p>
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {detailModalTrip.liters} L
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setDetailModalTrip(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CreateTripModal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                drivers={drivers}
                vehicles={vehicles}
                trips={trips}
            />
        </AuthenticatedLayout>
    );
}