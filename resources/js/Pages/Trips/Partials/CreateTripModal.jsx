import React, { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm, usePage } from '@inertiajs/react';
import Select from 'react-select';

// Close Icon
const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Error Notification
const ErrorNotification = ({ errors, onDismiss }) => {
    const messages = Object.values(errors).flat();
    if (messages.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-xl p-4">
                <div className="flex items-start">
                    <svg className="h-5 w-5 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                            Validation Error{messages.length > 1 ? 's' : ''}
                        </h3>
                        <ul className="mt-1 text-sm text-red-700 list-disc list-inside space-y-1">
                            {messages.map((msg, i) => <li key={i}>{msg}</li>)}
                        </ul>
                    </div>
                    <button onClick={onDismiss} className="ml-4 text-red-400 hover:text-red-600">
                        <CloseIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function CreateTripModal({ show, onClose, drivers = [], vehicles = [], trips = [] }) {
    const { departments = [] } = usePage().props; // Get departments from page props
    
    const { data, setData, post, processing, errors, reset } = useForm({
        tickNo: '',
        deptCode: departments.length > 0 ? departments[0].code : '001', // Set default from first department
        driver_id: '',
        vehicle_id: '',
        passenger: '',
        place: '',
        purpose: '',
        chargetoproject: '',
        fuel_type: '',
        liters: '',
        trip_start: '',
        trip_end: '',
        status: 'booked',
    });

    const [showErrorNotification, setShowErrorNotification] = useState(false);
    const [selectedVehicleStatus, setSelectedVehicleStatus] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);

    // Set initial department when departments are loaded
    useEffect(() => {
        if (departments.length > 0 && !selectedDepartment) {
            const defaultDept = departments[0];
            setSelectedDepartment(defaultDept);
            setData('deptCode', defaultDept.code);
        }
    }, [departments]);

    // Auto-generate ticket number based on selected department
    useEffect(() => {
        if (!show || !data.deptCode) return;

        const year = new Date().getFullYear();
        const prefix = `MEO-${year}-${data.deptCode}-`;

        const currentTrips = trips.filter(t => t.tickNo?.startsWith(prefix)) || [];

        let nextSeq = 1;
        if (currentTrips.length > 0) {
            const seqs = currentTrips
                .map(t => parseInt(t.tickNo.split('-').pop(), 10) || 0)
                .filter(n => n > 0);
            if (seqs.length) nextSeq = Math.max(...seqs) + 1;
        }

        const seqStr = nextSeq.toString().padStart(2, '0');
        setData('tickNo', `${prefix}${seqStr}`);
    }, [show, data.deptCode, trips]);

    // Error notification auto-dismiss
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setShowErrorNotification(true);
            const timer = setTimeout(() => setShowErrorNotification(false), 7000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

    const driverOptions = drivers.map(d => ({
        value: d.id,
        label: `${d.firstname} ${d.middlename || ''} ${d.lastname}`.trim(),
        status: d.status,
    }));

    // Show ALL vehicles + status indicator
    const vehicleOptions = vehicles.map(v => ({
        value: v.id,
        label: `${v.plate_number} — ${v.vehicle_type?.vehicle_type_name || v.model || 'Unknown'}`,
        status: v.status,
        raw: v,
    }));

    // Create department options for dropdown
    const departmentOptions = departments.map(dept => ({
        value: dept.code,
        label: `${dept.code} - ${dept.name}`,
        raw: dept,
    }));

    const handleVehicleChange = (option) => {
        if (!option) {
            setData(prev => ({ ...prev, vehicle_id: '', fuel_type: '' }));
            setSelectedVehicleStatus(null);
            return;
        }

        const vehicle = option.raw;
        setData(prev => ({
            ...prev,
            vehicle_id: vehicle.id,
            fuel_type: vehicle.vehicle_type?.category || vehicle.fuel_type || '',
        }));

        // Show current status of selected vehicle
        let statusText = '';
        let statusColor = '';

        switch (vehicle.status) {
            case 'available':
                statusText = 'Available';
                statusColor = 'text-emerald-600 bg-emerald-50';
                break;
            case 'on trip':
                statusText = 'Currently On Trip';
                statusColor = 'text-amber-600 bg-amber-50';
                break;
            case 'booked':
                statusText = 'Booked / Reserved';
                statusColor = 'text-red-600 bg-red-50';
                break;
            default:
                statusText = `Status: ${vehicle.status || 'Unknown'}`;
                statusColor = 'text-gray-600 bg-gray-100';
        }

        setSelectedVehicleStatus({ text: statusText, color: statusColor });
    };

    const handleDepartmentChange = (option) => {
        if (!option) {
            // Reset to first department if nothing selected
            if (departments.length > 0) {
                const defaultDept = departments[0];
                setSelectedDepartment(defaultDept);
                setData('deptCode', defaultDept.code);
            }
            return;
        }

        setSelectedDepartment(option.raw);
        setData('deptCode', option.value);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('trips.store'), {
            onSuccess: () => {
                reset();
                setSelectedVehicleStatus(null);
                onClose();
                setShowErrorNotification(false);
            },
        });
    };

    const FieldLabel = ({ children }) => (
        <label className="text-[11px] font-black uppercase tracking-wider text-[#1B4332] mb-2 block">
            {children}
        </label>
    );

    const inputBase = "w-full bg-gray-50 border border-gray-200 rounded py-2.5 px-4 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#1B4332]/30 focus:border-[#1B4332] transition-all placeholder:text-gray-400";

    const getInputClass = (field) => `${inputBase} ${errors[field] ? 'border-red-400 bg-red-50/60' : ''}`;

    // Department select styles
    const departmentSelectStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: errors.deptCode ? '#fef2f2' : '#f9fafb',
            borderColor: state.isFocused ? '#1B4332' : (errors.deptCode ? '#ef4444' : '#d1d5db'),
            borderRadius: '0.375rem',
            boxShadow: 'none',
            minHeight: '42px',
            fontSize: '0.875rem',
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#1B4332' : state.isFocused ? '#f0fdf4' : 'white',
            color: state.isSelected ? 'white' : '#111827',
            fontSize: '0.875rem',
            padding: '10px 12px',
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            zIndex: 9999,
        }),
        singleValue: (base) => ({
            ...base,
            color: '#1B4332',
            fontWeight: '500',
        }),
    };

    // Create custom styles for other select fields
    const getSelectStyles = (fieldName) => ({
        control: (base, state) => ({
            ...base,
            backgroundColor: errors[fieldName] ? '#fef2f2' : '#f9fafb',
            borderColor: state.isFocused ? '#1B4332' : (errors[fieldName] ? '#ef4444' : '#d1d5db'),
            borderRadius: '0.375rem',
            boxShadow: 'none',
            minHeight: '42px',
            fontSize: '0.875rem',
            '&:hover': {
                borderColor: errors[fieldName] ? '#ef4444' : '#1B4332',
            },
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#1B4332' : state.isFocused ? '#f0fdf4' : 'white',
            color: state.isSelected ? 'white' : '#111827',
            fontSize: '0.875rem',
            padding: '10px 12px',
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            zIndex: 9999,
        }),
    });

    const renderDepartmentOption = (option) => {
        const dept = option.raw;
        return (
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-900">{dept.code}</span>
                    <span className="text-gray-700">-</span>
                    <span className="font-medium text-gray-900">{dept.name}</span>
                </div>
            </div>
        );
    };

    return (
        <>
            {showErrorNotification && (
                <ErrorNotification errors={errors} onDismiss={() => setShowErrorNotification(false)} />
            )}

            <Modal show={show} onClose={onClose} maxWidth="2xl">
                <div className="fixed inset-0 bg-[#081c15]/70 backdrop-blur-sm -z-10" aria-hidden="true" />

                <form onSubmit={submit} className="bg-white shadow-2xl flex flex-col max-h-[92vh] rounded-xl overflow-hidden relative z-10">
                    {/* Header */}
                    <div className="bg-[#1B4332] px-8 py-5 flex justify-between items-center shrink-0">
                        <div>
                            <span className="text-[9px] font-black tracking-[0.35em] text-[#A3C1AD] uppercase opacity-80">Security Protocol</span>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mt-0.5">
                                Dispatch Manifest
                            </h3>
                        </div>
                        <button type="button" onClick={onClose} className="text-[#A3C1AD] hover:text-white">
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Form Body */}
                    <div className="p-8 overflow-y-auto space-y-7">
                        {/* Ticket Number */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-10 bg-blue-500/70"></div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Identification</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <FieldLabel>Official Ticket Number</FieldLabel>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full font-mono text-lg font-bold text-blue-700 bg-blue-50/40 border-2 border-blue-300 rounded py-3 px-4 cursor-not-allowed"
                                            value={data.tickNo}
                                            readOnly
                                            disabled
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <svg className="w-5 h-5 text-blue-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <FieldLabel>Department Code</FieldLabel>
                                    {departments.length > 0 ? (
                                        <>
                                            <Select
                                                options={departmentOptions}
                                                styles={departmentSelectStyles}
                                                value={departmentOptions.find(opt => opt.value === data.deptCode) || null}
                                                onChange={handleDepartmentChange}
                                                placeholder="Select department..."
                                                formatOptionLabel={renderDepartmentOption}
                                                isClearable={false}
                                                isSearchable
                                            />
                                            {selectedDepartment && (
                                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        <span className="font-medium">{selectedDepartment.name}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                                            Loading departments...
                                        </div>
                                    )}
                                    {errors.deptCode && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.deptCode}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Resources – Vehicle & Driver */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-10 bg-[#1B4332]/70"></div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Resources</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <FieldLabel>Vehicle Unit (All statuses shown)</FieldLabel>
                                    <Select
                                        options={vehicleOptions}
                                        styles={getSelectStyles('vehicle_id')}
                                        value={vehicleOptions.find(opt => opt.value === data.vehicle_id) || null}
                                        onChange={handleVehicleChange}
                                        placeholder="Select vehicle..."
                                        isClearable
                                        isSearchable
                                    />
                                    {errors.vehicle_id && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.vehicle_id}</p>}

                                    {/* Show current status of selected vehicle */}
                                    {selectedVehicleStatus && (
                                        <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedVehicleStatus.color}`}>
                                            <span className="w-2 h-2 rounded-full bg-current mr-1.5"></span>
                                            {selectedVehicleStatus.text}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <FieldLabel>Assigned Driver</FieldLabel>
                                    <Select
                                        options={driverOptions}
                                        styles={getSelectStyles('driver_id')}
                                        value={driverOptions.find(opt => opt.value === data.driver_id) || null}
                                        onChange={opt => setData('driver_id', opt ? opt.value : '')}
                                        placeholder="Select driver..."
                                        isClearable
                                        isSearchable
                                    />
                                    {errors.driver_id && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.driver_id}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Mission Logistics */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-10 bg-[#A3C1AD]/70"></div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Mission Logistics</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <FieldLabel>Authorized Passenger</FieldLabel>
                                    <input
                                        type="text"
                                        className={getInputClass('passenger')}
                                        value={data.passenger}
                                        onChange={e => setData('passenger', e.target.value)}
                                    />
                                    {errors.passenger && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.passenger}</p>}
                                </div>

                                <div>
                                    <FieldLabel>Destination (Place)</FieldLabel>
                                    <input
                                        type="text"
                                        className={getInputClass('place')}
                                        value={data.place}
                                        onChange={e => setData('place', e.target.value)}
                                    />
                                    {errors.place && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.place}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <FieldLabel>Project Charge Code</FieldLabel>
                                    <input
                                        type="text"
                                        className={getInputClass('chargetoproject')}
                                        value={data.chargetoproject}
                                        onChange={e => setData('chargetoproject', e.target.value)}
                                    />
                                    {errors.chargetoproject && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.chargetoproject}</p>}
                                </div>

                                <div className="col-span-full">
                                    <FieldLabel>Mission Purpose</FieldLabel>
                                    <textarea
                                        className={`${getInputClass('purpose')} resize-none`}
                                        rows={2}
                                        value={data.purpose}
                                        onChange={e => setData('purpose', e.target.value)}
                                        placeholder="Brief description of mission objective..."
                                    />
                                    {errors.purpose && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.purpose}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Operational Data */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-10 bg-orange-500/60"></div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Operational Data</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div>
                                    <FieldLabel>Fuel Type</FieldLabel>
                                    <input
                                        type="text"
                                        className={getInputClass('fuel_type')}
                                        value={data.fuel_type}
                                        onChange={e => setData('fuel_type', e.target.value)}
                                        placeholder="Diesel / Gasoline / etc."
                                    />
                                    {errors.fuel_type && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.fuel_type}</p>}
                                </div>

                                <div>
                                    <FieldLabel>Liters Allocated</FieldLabel>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className={getInputClass('liters')}
                                        value={data.liters}
                                        onChange={e => setData('liters', e.target.value)}
                                    />
                                    {errors.liters && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.liters}</p>}
                                </div>

                                <div>
                                    <FieldLabel>Initial Status</FieldLabel>
                                    <select className={getInputClass('status')} value={data.status} onChange={e => setData('status', e.target.value)}>
                                        <option value="booked">Booked</option>
                                        <option value="on trip">On Trip</option>
                                        <option value="finished">Finished</option>
                                    </select>
                                    {errors.status && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.status}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <FieldLabel>Estimated Time of Departure (ETD)</FieldLabel>
                                    <input
                                        type="datetime-local"
                                        className={getInputClass('trip_start')}
                                        value={data.trip_start}
                                        onChange={e => setData('trip_start', e.target.value)}
                                    />
                                    {errors.trip_start && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.trip_start}</p>}
                                </div>

                                <div>
                                    <FieldLabel>Estimated Time of Arrival (ETA)</FieldLabel>
                                    <input
                                        type="datetime-local"
                                        className={getInputClass('trip_end')}
                                        value={data.trip_end}
                                        onChange={e => setData('trip_end', e.target.value)}
                                    />
                                    {errors.trip_end && <p className="text-red-600 text-xs mt-1.5 font-medium">{errors.trip_end}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-8 py-5 border-t border-gray-200 flex flex-col sm:flex-row-reverse gap-4 shrink-0">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-[#1B4332] text-white px-10 py-3.5 rounded-lg font-bold uppercase text-sm shadow-md disabled:opacity-50 hover:bg-[#2d5a47] transition-colors"
                        >
                            {processing ? 'Authorizing...' : 'Authorize Dispatch'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3.5 text-sm font-bold text-gray-500 uppercase hover:text-red-700 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            <style>{`
                @keyframes slide-in {
                    from { transform: translateX(120%); opacity: 0; }
                    to   { transform: translateX(0);    opacity: 1; }
                }
                .animate-slide-in { animation: slide-in 0.4s ease-out; }
            `}</style>
        </>
    );
}