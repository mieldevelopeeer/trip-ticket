import { useForm } from '@inertiajs/react';
import Select from 'react-select';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function RegisterDriverModal({ isOpen, onClose }) {
    const [vehicles, setVehicles] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [animate, setAnimate] = useState(false);

    // Suffix options for dropdown
    const suffixOptions = [
        { value: '', label: 'None' },
        { value: 'Jr.', label: 'Jr.' },
        { value: 'Sr.', label: 'Sr.' },
        { value: 'II', label: 'II' },
        { value: 'III', label: 'III' },
        { value: 'IV', label: 'IV' },
        { value: 'V', label: 'V' },
    ];

    // Initial Form State - Added suffix field
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        firstname: '',
        middlename: '',
        lastname: '',
        suffix: '', // Added suffix field
        address: '',
        contact: '',
        email: '',
        status: 'active',
        vehicle_id: null,
    });

    // Fetch available vehicles
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setAnimate(true), 10);
            setLoadingVehicles(true);
            axios.get(route('drivers.fetch-plates'))
                .then(response => {
                    setVehicles(response.data);
                    setLoadingVehicles(false);
                })
                .catch(error => {
                    console.error("Protocol Error: Vehicle list unavailable", error);
                    setLoadingVehicles(false);
                });
        } else {
            setAnimate(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Component Logic
    const vehicleOptions = vehicles.map(v => ({
        value: v.id,
        label: `${v.plate_number} ${v.model ? `(${v.model})` : ''}`,
    }));

    const customStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: '0.75rem',
            borderColor: state.isFocused ? '#1B4332' : '#E2E8F0',
            borderWidth: '1px',
            fontSize: '14px',
            fontWeight: '500',
            minHeight: '42px',
            boxShadow: 'none',
            '&:hover': { borderColor: '#1B4332' }
        }),
        placeholder: (base) => ({ ...base, color: '#94A3B8', fontSize: '14px' }),
        singleValue: (base) => ({ ...base, color: '#1E293B' }),
    };

    // Simpler styles for the suffix dropdown (native select)
    const suffixDropdownStyles = {
        control: "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all cursor-pointer",
    };

    const showPopup = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    // FORM SUBMISSION HANDLER
    const submit = (e) => {
        e.preventDefault();
        
        post(route('drivers.store'), {
            preserveScroll: true,
            onSuccess: () => {
                showPopup('Driver Registered Successfully', 'success');
                setTimeout(() => {
                    reset();
                    clearErrors();
                    onClose();
                }, 1000);
            },
            onError: (err) => {
                console.error("Submission failed:", err);
                showPopup('Registration Failed', 'error');
            }
        });
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ease-out ${animate ? 'bg-black/50 backdrop-blur-sm' : 'bg-transparent backdrop-blur-0'}`}>
            <div className={`bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-500 transform ${animate ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
                
                {/* Toast Notification */}
                <div className={`absolute top-0 left-0 right-0 py-3 text-center text-sm font-semibold z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.message}
                </div>

                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">Register Driver</h3>
                            <p className="text-sm text-slate-500 mt-1">Add new driver to the system</p>
                        </div>
                        <button 
                            onClick={() => { reset(); clearErrors(); onClose(); }} 
                            className="text-slate-400 hover:text-red-600 transition-colors focus:outline-none"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Name Section - Updated with suffix */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={data.firstname}
                                    onChange={e => setData('firstname', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all ${errors.firstname ? 'border-red-500' : 'border-slate-200'}`} 
                                    placeholder="Juan"
                                    required
                                />
                                {errors.firstname && <p className="text-red-500 text-xs mt-1 font-medium">{errors.firstname}</p>}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Middle Name
                                </label>
                                <input 
                                    type="text" 
                                    value={data.middlename}
                                    onChange={e => setData('middlename', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all" 
                                    placeholder="Santos"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    value={data.lastname}
                                    onChange={e => setData('lastname', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all ${errors.lastname ? 'border-red-500' : 'border-slate-200'}`} 
                                    placeholder="Dela Cruz"
                                    required
                                />
                                {errors.lastname && <p className="text-red-500 text-xs mt-1 font-medium">{errors.lastname}</p>}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Suffix
                                </label>
                                <select 
                                    value={data.suffix}
                                    onChange={e => setData('suffix', e.target.value)}
                                    className={suffixDropdownStyles.control}
                                >
                                    {suffixOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.suffix && <p className="text-red-500 text-xs mt-1 font-medium">{errors.suffix}</p>}
                            </div>
                        </div>

                        {/* Vehicle & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Assigned Vehicle
                                </label>
                                <Select
                                    options={vehicleOptions}
                                    isClearable
                                    isSearchable
                                    isLoading={loadingVehicles}
                                    placeholder={loadingVehicles ? "Loading vehicles..." : "Select vehicle..."}
                                    styles={customStyles}
                                    value={vehicleOptions.find(opt => opt.value === data.vehicle_id) || null}
                                    onChange={(selected) => setData('vehicle_id', selected ? selected.value : null)}
                                />
                                {errors.vehicle_id && <p className="text-red-500 text-xs mt-1 font-medium">{errors.vehicle_id}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all cursor-pointer"
                                >   
                                    <option value="active">Active</option>
                                    <option value="standby">Standby</option>
                                </select>
                            </div>
                        </div>

                        {/* Contact & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Contact Number
                                </label>
                                <input 
                                    type="text" 
                                    value={data.contact}
                                    onChange={e => setData('contact', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all" 
                                    placeholder="09XXXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Email Address
                                </label>
                                <input 
                                    type="email" 
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-slate-200'}`} 
                                    placeholder="driver@example.com"
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Residential Address
                            </label>
                            <input 
                                type="text" 
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all" 
                                placeholder="Street, Barangay, City"
                            />
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex flex-col space-y-3">
                            <button 
                                type="submit" 
                                disabled={processing}
                                className="relative w-full bg-[#1B4332] hover:bg-[#2d5a45] text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className={processing ? 'opacity-0' : 'opacity-100'}>
                                    Register Driver
                                </span>
                                {processing && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </button>
                            <button 
                                type="button"
                                onClick={() => { reset(); clearErrors(); onClose(); }} 
                                className="w-full text-slate-500 hover:text-slate-700 py-2 font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}