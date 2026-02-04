import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import VehicleModal from './Partials/VehicleModal';

export default function Vehicle({ auth, vehicles, vehicleTypes = [] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [expandedType, setExpandedType] = useState(null);

    const typeData = vehicles.data || [];

    const openModal = (vehicle = null, parentType = null) => {
        if (vehicle && parentType) {
            setSelectedVehicle({
                ...vehicle,
                vehicle_type: parentType 
            });
        } else {
            setSelectedVehicle(null);
        }
        setIsModalOpen(true);
    };

    const filteredTypes = typeData.filter(t => 
        t.vehicle_type_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vehicles?.some(v => v.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalFleet = typeData.reduce((acc, type) => acc + (type.vehicles?.length || 0), 0);
    const availableCount = typeData.reduce((acc, type) => acc + (type.vehicles?.filter(v => v.status === 'available').length || 0), 0);
    const deployedCount = typeData.reduce((acc, type) => acc + (type.vehicles?.filter(v => v.status === 'on trip').length || 0), 0);

    return (
        <AuthenticatedLayout
         user={auth.user}

>
            <Head title="Vehicle Registry" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
                
                * {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                .font-mono {
                    font-family: 'JetBrains Mono', 'Courier New', monospace;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 100px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-slide-in {
                    animation: slideIn 0.4s ease-out forwards;
                }
                
                .stagger-1 { animation-delay: 0.05s; }
                .stagger-2 { animation-delay: 0.1s; }
                .stagger-3 { animation-delay: 0.15s; }
            `}</style>

            <div className="h-[calc(100vh-80px)] bg-slate-50 flex flex-col lg:flex-row overflow-hidden">
                {/* --- SIDEBAR --- */}
                <aside className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm">
                    {/* Search */}
                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                            Search Fleet
                        </label>
                        <div className="relative group">
                            <input 
                                type="text"
                                placeholder="Search by model, category, or plate..."
                                className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="flex-1 space-y-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Fleet Overview
                        </p>
                        
                        <div className="space-y-3">
                            {/* Total Fleet */}
                            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 rounded-2xl shadow-lg shadow-emerald-900/20">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                                <div className="relative">
                                    <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">
                                        Total Fleet
                                    </p>
                                    <div className="flex items-baseline justify-between mt-2">
                                        <h4 className="text-5xl font-bold text-white tracking-tight">
                                            {totalFleet}
                                        </h4>
                                        <span className="text-xs font-semibold text-emerald-200 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                                            VEHICLES
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <svg className="w-4 h-4 text-emerald-600/30" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                        </svg>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-700">
                                        {availableCount}
                                    </p>
                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mt-1">
                                        Available
                                    </p>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <svg className="w-4 h-4 text-blue-600/30" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                        </svg>
                                    </div>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {deployedCount}
                                    </p>
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mt-1">
                                        On Trip
                                    </p>
                                </div>
                            </div>

                            {/* Utilization Rate */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                        Utilization
                                    </p>
                                    <span className="text-sm font-bold text-slate-900">
                                        {totalFleet > 0 ? Math.round((deployedCount / totalFleet) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${totalFleet > 0 ? (deployedCount / totalFleet) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={() => openModal()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all active:scale-[0.98] mt-6 flex items-center justify-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        <span>Register New Vehicle</span>
                    </button>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
                    {/* Header */}
                    <div className="p-8 pb-6 border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    Vehicle Fleet
                                </h1>
                                <p className="text-sm text-slate-500 font-medium mt-1">
                                    Manage and monitor your fleet by vehicle type and category
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm">
                                <span className="text-slate-500 font-medium">
                                    {filteredTypes.length} {filteredTypes.length === 1 ? 'type' : 'types'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Types List */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 custom-scrollbar">
                        {filteredTypes.length > 0 ? (
                            filteredTypes.map((type, idx) => (
                                <div 
                                    key={type.id} 
                                    className={`bg-white rounded-2xl border border-slate-200 transition-all duration-300 hover:shadow-md animate-slide-in stagger-${Math.min(idx + 1, 3)} ${
                                        expandedType === type.id ? 'ring-2 ring-emerald-500 shadow-lg' : ''
                                    }`}
                                >
                                    {/* Type Header */}
                                    <div className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex items-center space-x-5">
                                                {/* Count Badge */}
                                                <div className="relative flex-shrink-0">
                                                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-xl flex flex-col items-center justify-center border border-slate-300/50 shadow-sm">
                                                        <span className="text-xs font-semibold text-slate-500 uppercase leading-none">
                                                            Unit/s
                                                        </span>
                                                        <span className="text-2xl font-bold text-slate-900 leading-none mt-1">
                                                            {type.vehicles?.length || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Type Info */}
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                                        {type.vehicle_type_name}
                                                    </h3>
                                                    <div className="flex items-center space-x-2 mt-1.5">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                                                            {type.category}
                                                        </span>
                                                        <span className="text-slate-400">•</span>
                                                        <span className="text-xs font-medium text-slate-500">
                                                            Fleet Asset
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expand Button */}
                                            <button 
                                                onClick={() => setExpandedType(expandedType === type.id ? null : type.id)}
                                                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                                    expandedType === type.id 
                                                        ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700' 
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                            >
                                                {expandedType === type.id ? (
                                                    <span className="flex items-center space-x-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/>
                                                        </svg>
                                                        <span>Hide Vehicles</span>
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center space-x-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                                                        </svg>
                                                        <span>View Vehicles</span>
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Vehicle List */}
                                    {expandedType === type.id && (
                                        <div className="px-6 pb-6 border-t border-slate-100">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                                                {type.vehicles?.map((v) => (
                                                    <div 
                                                        key={v.id} 
                                                        className="group bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                {/* Plate Number */}
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <div className="w-1 h-5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                                                                    <span className="text-base font-mono font-bold text-slate-900 tracking-tight truncate">
                                                                        {v.plate_number}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* Status Badge */}
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                                                    v.status === 'available' 
                                                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                                                        : v.status === 'on_trip' 
                                                                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                                        v.status === 'available' 
                                                                            ? 'bg-emerald-500' 
                                                                            : v.status === 'on_trip' 
                                                                            ? 'bg-blue-500 animate-pulse' 
                                                                            : 'bg-amber-500'
                                                                    }`}></span>
                                                                    {v.status.replace('_', ' ').toUpperCase()}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Action Buttons */}
                                                            <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                                <button 
                                                                    onClick={() => openModal(v, type)}
                                                                    className="p-2 bg-white text-slate-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors border border-slate-200 hover:border-emerald-300 shadow-sm"
                                                                    title="Edit vehicle"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                                                    </svg>
                                                                </button>
                                                                <button 
                                                                    className="p-2 bg-white text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-200 hover:border-red-300 shadow-sm"
                                                                    title="Delete vehicle"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border-2 border-dashed border-slate-300">
                                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                                </svg>
                                <p className="text-slate-400 font-semibold text-sm">
                                    No vehicles found matching your search
                                </p>
                                <p className="text-slate-400 text-xs mt-1">
                                    Try adjusting your search terms
                                </p>
                            </div>
                        )}
                    </div>

                    {/* --- PAGINATION --- */}
                    <div className="bg-white border-t border-slate-200 p-5">
                        <div className="flex justify-center items-center gap-2">
                            {vehicles.links.map((link, index) => (
                                <Link 
                                    key={index} 
                                    href={link.url} 
                                    className={`min-w-[40px] h-10 flex items-center justify-center px-4 rounded-lg text-sm font-semibold transition-all ${
                                        link.active 
                                            ? 'bg-emerald-600 text-white shadow-md' 
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`} 
                                    dangerouslySetInnerHTML={{ __html: link.label }} 
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            <VehicleModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                vehicle={selectedVehicle} 
                vehicleTypes={vehicleTypes} 
            />
        </AuthenticatedLayout>
    );
}