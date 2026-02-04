import React, { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';

// Toast Notification Component
const ToastNotification = ({ type = 'success', message, onClose, duration = 4000 }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
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
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            progress: 'bg-emerald-500',
        },
        error: {
            bg: 'bg-red-50 border border-red-200',
            text: 'text-red-800',
            icon: (
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            ),
            progress: 'bg-red-500',
        },
    };

    const style = styles[type] || styles.success;

    return (
        <div className="fixed top-6 right-6 z-[1000] animate-slide-in">
            <div className={`${style.bg} rounded-sm shadow-lg min-w-[320px] max-w-md overflow-hidden`}>
                <div className="p-3">
                    <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                            {style.icon}
                        </div>
                        <div className="flex-1">
                            <p className={`text-xs font-black uppercase tracking-tighter ${style.text}`}>
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsVisible(false);
                                setTimeout(onClose, 300);
                            }}
                            className="flex-shrink-0 ml-3 p-0.5 rounded-sm hover:bg-black/5 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

// Suffix options for dropdown
const suffixOptions = [
    { value: '', label: 'NONE' },
    { value: 'Jr.', label: 'JR.' },
    { value: 'Sr.', label: 'SR.' },
    { value: 'II', label: 'II' },
    { value: 'III', label: 'III' },
    { value: 'IV', label: 'IV' },
    { value: 'V', label: 'V' },
];

export default function UpdateDriverModal({ isOpen, onClose, driver, vehicles = [] }) {
    const { flash } = usePage().props;
    const [notification, setNotification] = useState(null);

    const { data, setData, patch, processing, errors, reset } = useForm({
        firstname: '',
        middlename: '',
        lastname: '',
        suffix: '', // Added suffix field
        contact: '',
        email: '',
        status: 'active',
        vehicle_id: '',
    });

    // Show flash messages as notifications
    useEffect(() => {
        if (isOpen && (flash?.success || flash?.error)) {
            setNotification({
                type: flash.success ? 'success' : 'error',
                message: flash.success || flash.error
            });
        }
    }, [isOpen, flash]);

    // Sync form data when the selected driver changes
    useEffect(() => {
        if (driver) {
            setData({
                firstname: driver.firstname || '',
                middlename: driver.middlename || '',
                lastname: driver.lastname || '',
                suffix: driver.suffix || '', // Added suffix field
                contact: driver.contact || '',
                email: driver.email || '',
                status: driver.status || 'active',
                vehicle_id: driver.vehicle_id || '',
            });
        }
    }, [driver]);

    const submit = (e) => {
        e.preventDefault();
        patch(route('drivers.update', driver.id), {
            onSuccess: () => {
                setNotification({
                    type: 'success',
                    message: 'DRIVER REGISTRY UPDATED • CHANGES COMMITTED'
                });
                setTimeout(() => {
                    onClose();
                    reset();
                    setNotification(null);
                }, 1500);
            },
            onError: () => {
                setNotification({
                    type: 'error',
                    message: 'REGISTRY UPDATE FAILED • VERIFY INPUT FIELDS'
                });
            },
            preserveScroll: true,
        });
    };

    const ErrorMsg = ({ message }) => (
        message ? <div className="text-red-600 text-[9px] mt-1 font-black uppercase italic tracking-tighter">{message}</div> : null
    );

    const closeNotification = () => {
        setNotification(null);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Toast Notification */}
            {notification && (
                <ToastNotification
                    type={notification.type}
                    message={notification.message}
                    onClose={closeNotification}
                />
            )}

            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B4332]/90 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden border-t-4 border-[#A3C1AD]">
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="text-xl font-black text-[#1B4332] uppercase tracking-tighter leading-none">Modify Personnel</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">
                                    REF ID: {driver?.id?.toString().padStart(4, '0')} • REGISTRY UPDATE PROTOCOL
                                </p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            {/* Name Section - UPDATED with suffix */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">First Name <span className="text-red-600">*</span></label>
                                    <input 
                                        type="text" 
                                        value={data.firstname} 
                                        onChange={e => setData('firstname', e.target.value)} 
                                        className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-[#1B4332] focus:border-[#1B4332] uppercase" 
                                        required 
                                    />
                                    <ErrorMsg message={errors.firstname} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Last Name <span className="text-red-600">*</span></label>
                                    <input 
                                        type="text" 
                                        value={data.lastname} 
                                        onChange={e => setData('lastname', e.target.value)} 
                                        className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-[#1B4332] focus:border-[#1B4332] uppercase" 
                                        required 
                                    />
                                    <ErrorMsg message={errors.lastname} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                        Suffix <span className="text-gray-400 text-[8px]">(Optional)</span>
                                    </label>
                                    <select 
                                        value={data.suffix} 
                                        onChange={e => setData('suffix', e.target.value)} 
                                        className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-[#1B4332] focus:border-[#1B4332] uppercase bg-gray-50"
                                    >
                                        {suffixOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ErrorMsg message={errors.suffix} />
                                </div>
                            </div>

                            {/* Middle Name Field */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                    Middle Name <span className="text-gray-400 text-[8px]">(Optional)</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={data.middlename} 
                                    onChange={e => setData('middlename', e.target.value)} 
                                    className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-[#1B4332] focus:border-[#1B4332] uppercase" 
                                    placeholder="MIDDLE NAME" 
                                />
                                <ErrorMsg message={errors.middlename} />
                            </div>

                            {/* Vehicle Assignment Dropdown */}
                            <div className="border-t border-gray-100 pt-4">
                                <label className="block text-[10px] font-black text-[#1B4332] uppercase tracking-widest mb-1">Assigned Unit (Plate & Model)</label>
                                <select 
                                    value={data.vehicle_id} 
                                    onChange={e => setData('vehicle_id', e.target.value)} 
                                    className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-[#1B4332] focus:border-[#1B4332] uppercase bg-gray-50"
                                >
                                    <option value="">-- UNASSIGNED / NO VEHICLE --</option>
                                    {vehicles.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.label} {v.status === 'on_trip' ? '• [ON TRIP]' : '• [AVAILABLE]'}
                                        </option>
                                    ))}
                                </select>
                                <ErrorMsg message={errors.vehicle_id} />
                            </div>

                            {/* Optional Fields */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact Number <span className="text-gray-400 text-[8px]">(Optional)</span></label>
                                        <input 
                                            type="text" 
                                            value={data.contact} 
                                            onChange={e => setData('contact', e.target.value)} 
                                            className="w-full border-gray-200 rounded-sm font-mono font-bold text-sm focus:ring-[#1B4332] focus:border-[#1B4332]" 
                                            placeholder="09XXXXXXXXX" 
                                        />
                                        <ErrorMsg message={errors.contact} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status <span className="text-red-600">*</span></label>
                                        <select 
                                            value={data.status} 
                                            onChange={e => setData('status', e.target.value)} 
                                            className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-[#1B4332] focus:border-[#1B4332] uppercase"
                                        >
                                            <option value="active">Active</option>
                                            <option value="standby">Standby</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                        <ErrorMsg message={errors.status} />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Address <span className="text-gray-400 text-[8px]">(Optional)</span></label>
                                    <input 
                                        type="email" 
                                        value={data.email} 
                                        onChange={e => setData('email', e.target.value)} 
                                        className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-[#1B4332] focus:border-[#1B4332]" 
                                        placeholder="operator@example.com" 
                                    />
                                    <ErrorMsg message={errors.email} />
                                </div>
                            </div>

                            {/* Note about optional fields */}
                            <div className="bg-gray-50 border-l-4 border-gray-300 p-3 mt-4">
                                <div className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                    </svg>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-tight">
                                        Note: Fields marked with <span className="text-red-600">*</span> are required. 
                                        Middle name, suffix, contact, and email are optional fields.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 flex flex-col space-y-3">
                                <button 
                                    type="submit" 
                                    disabled={processing} 
                                    className="w-full bg-[#1B4332] text-[#A3C1AD] py-3.5 rounded-sm font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                                >
                                    {processing ? 'SYNCHRONIZING REGISTRY...' : 'COMMIT CHANGES TO REGISTRY'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={onClose} 
                                    className="w-full text-gray-400 py-2 font-black uppercase text-[9px] tracking-[0.2em] hover:text-gray-600 transition-colors"
                                >
                                    ABORT PROTOCOL
                                </button>
                            </div>

                            {/* Submission Status Indicator */}
                            {processing && (
                                <div className="border-t border-gray-100 pt-4 mt-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-3 w-3 text-[#1B4332]" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="text-[8px] font-black text-[#1B4332] uppercase tracking-widest">
                                            PROCESSING REGISTRY UPDATE...
                                        </span>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}