import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';

export default function VehicleModal({ isOpen, onClose, vehicle, vehicleTypes = [] }) {
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [animate, setAnimate] = useState(false);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        vehicle_type_name: '',
        category: '',
        plate_numbers: [''], 
        status: 'available',
        quantity: 1,
    });

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setAnimate(true), 10);
            
            if (vehicle) {
                // EDIT MODE: Correctly mapping the parent type details
                setData({
                    // If your Laravel model uses 'vehicle_type' relationship, use vehicle.vehicle_type
                    // If it uses 'type', use vehicle.type
                    vehicle_type_name: vehicle.vehicle_type?.vehicle_type_name || vehicle.type?.vehicle_type_name || '',
                    category: vehicle.vehicle_type?.category || vehicle.type?.category || '',
                    plate_numbers: [vehicle.plate_number],
                    status: vehicle.status || 'available',
                    quantity: 1,
                });
            } else {
                // CREATE MODE: Reset to blank
                reset();
            }
        } else {
            setAnimate(false);
        }
    }, [isOpen, vehicle]);

    const handleQuantityChange = (val) => {
        if (vehicle) return; // Prevent quantity changes during individual unit edits
        
        const qty = Math.max(1, parseInt(val) || 1);
        let newPlates = [...data.plate_numbers];
        
        if (qty > newPlates.length) {
            const diff = qty - newPlates.length;
            newPlates = [...newPlates, ...Array(diff).fill('')];
        } else {
            newPlates = newPlates.slice(0, qty);
        }
        
        setData(d => ({ ...d, quantity: qty, plate_numbers: newPlates }));
    };

    const handlePlateChange = (index, value) => {
        const newPlates = [...data.plate_numbers];
        newPlates[index] = value.toUpperCase();
        setData('plate_numbers', newPlates);
    };

    if (!isOpen) return null;

    const showPopup = (message, type) => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const submit = (e) => {
        e.preventDefault();
        // Determine if we use PATCH (update) or POST (store)
        if (vehicle) {
            patch(route('vehicles.update', vehicle.id), {
                onSuccess: () => {
                    showPopup('Asset Updated Successfully', 'success');
                    setTimeout(() => { reset(); onClose(); }, 1000);
                },
                onError: () => showPopup('Update Failed', 'error'),
            });
        } else {
            post(route('vehicles.store'), {
                onSuccess: () => {
                    showPopup('Batch Registered Successfully', 'success');
                    setTimeout(() => { reset(); onClose(); }, 1000);
                },
                onError: () => showPopup('Registration Failed', 'error'),
            });
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ease-out ${animate ? 'bg-[#1B4332]/90 backdrop-blur-sm' : 'bg-transparent backdrop-blur-0'}`}>
            <div className={`bg-white w-full max-w-md rounded-sm shadow-2xl overflow-hidden border-t-4 border-[#A3C1AD] relative transition-all duration-500 transform ${animate ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
                
                <div className={`absolute top-0 left-0 right-0 py-3 text-center text-[10px] font-black uppercase tracking-widest z-50 transition-all duration-300 transform ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.message}
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-xl font-black text-[#1B4332] uppercase tracking-tighter leading-none">
                                {vehicle ? 'Modify Asset' : 'Bulk Registration'}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">
                                {vehicle ? `Editing Plate: ${vehicle.plate_number}` : 'Fleet Management • Opol Hub'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-300 hover:text-red-600 transition-all hover:rotate-90">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Model / Type</label>
                                <input list="vehicle-models" type="text" value={data.vehicle_type_name} onChange={e => setData('vehicle_type_name', e.target.value)} className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-2 focus:ring-[#1B4332] uppercase" placeholder="E.G. HILUX" required />
                                <datalist id="vehicle-models">
                                    {vehicleTypes.map((type) => <option key={type.id} value={type.vehicle_type_name} />)}
                                </datalist>
                                {errors.vehicle_type_name && <div className="text-red-500 text-[9px] font-bold mt-1 uppercase">{errors.vehicle_type_name}</div>}
                            </div>
                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</label>
                                <input type="text" value={data.category} onChange={e => setData('category', e.target.value)} className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-2 focus:ring-[#1B4332] uppercase" placeholder="SUV / TRUCK" required />
                                {errors.category && <div className="text-red-500 text-[9px] font-bold mt-1 uppercase">{errors.category}</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Qty</label>
                                <input 
                                    type="number" 
                                    value={data.quantity} 
                                    onChange={e => handleQuantityChange(e.target.value)} 
                                    disabled={!!vehicle}
                                    className={`w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-2 focus:ring-[#1B4332] ${vehicle ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`} 
                                    required 
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
                                <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full border-gray-200 rounded-sm font-bold text-sm focus:ring-2 focus:ring-[#1B4332] uppercase cursor-pointer">
                                    <option value="available" className="text-emerald-600 font-bold">● Available</option>
                                    <option value="on_trip" className="text-blue-600 font-bold">● On Active Trip</option>
                                    <option value="maintenance" className="text-orange-600 font-bold">● Maintenance</option>
                                    <option value="unavailable" className="text-red-600 font-bold">● Unavailable</option>
                                </select>
                            </div>
                        </div>

                        <div className="group border-t border-gray-100 pt-4">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                {vehicle ? 'Plate Number' : `Assign Plate Numbers (${data.plate_numbers.length})`}
                            </label>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {data.plate_numbers.map((plate, index) => (
                                    <div key={index} className="flex items-center space-x-2 animate-in fade-in slide-in-from-left-2">
                                        <span className="text-[10px] font-bold text-gray-300 w-6">#{index + 1}</span>
                                        <input 
                                            type="text" 
                                            value={plate} 
                                            onChange={e => handlePlateChange(index, e.target.value)}
                                            className="flex-1 border-gray-200 rounded-sm font-mono font-bold text-sm focus:ring-2 focus:ring-[#A3C1AD] uppercase placeholder:text-gray-200"
                                            placeholder="PLATE NO."
                                            required
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Detailed Error handling for nested array validation */}
                            {Object.keys(errors).map((key) => {
                                if (key.startsWith('plate_numbers')) {
                                    return <div key={key} className="text-red-500 text-[9px] mt-1 font-bold uppercase">{errors[key]}</div>;
                                }
                                return null;
                            })}
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={processing} className="relative w-full bg-[#1B4332] text-[#A3C1AD] py-4 rounded-sm font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-70">
                                <span className={processing ? 'opacity-0' : 'opacity-100'}>
                                    {vehicle ? 'Confirm Update' : `Register ${data.quantity} Fleet Unit(s)`}
                                </span>
                                {processing && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-[#A3C1AD] border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}