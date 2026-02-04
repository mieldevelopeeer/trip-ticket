import React, { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

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
            icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600" />,
            progress: 'bg-emerald-500',
        },
        error: {
            bg: 'bg-red-50 border border-red-200',
            text: 'text-red-800',
            icon: <ExclamationCircleIcon className="w-5 h-5 text-red-600" />,
            progress: 'bg-red-500',
        },
    };

    const style = styles[type] || styles.success;

    return (
        <div className="fixed top-6 right-6 z-[60] animate-slide-in">
            <div className={`${style.bg} rounded-xl shadow-lg min-w-[320px] max-w-md overflow-hidden backdrop-blur-sm`}>
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
                            <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
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

export default function DeptCodeModal({ isOpen, onClose, department = null }) {
    const { flash } = usePage().props;
    const isEditing = !!department;
    
    const [notification, setNotification] = useState(null);

    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
    });

    // Show flash messages as notifications when modal opens
    useEffect(() => {
        if (isOpen && (flash?.success || flash?.error)) {
            setNotification({
                type: flash.success ? 'success' : 'error',
                message: flash.success || flash.error
            });
            
            // Clear the flash message after showing
            router.get(route('departments.index'), {}, {
                preserveState: true,
                preserveScroll: true,
                only: [],
            });
        }
    }, [isOpen, flash]);

    // Reset or populate form when modal opens
    useEffect(() => {
        if (isOpen) {
            clearErrors();
            
            if (department) {
                // Edit mode - populate with existing data
                const formattedCode = department.code ? department.code.toString().padStart(3, '0') : '';
                
                setData({
                    code: formattedCode,
                    name: department.name,
                });
            } else {
                // Add mode - reset form
                reset();
            }
        }
    }, [isOpen, department]);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            // Update existing department
            patch(route('departments.update', department.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setNotification({
                        type: 'success',
                        message: 'Department updated successfully!'
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
                        message: 'Failed to update department. Please check the form.'
                    });
                },
            });
        } else {
            // Create new department
            post(route('departments.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setNotification({
                        type: 'success',
                        message: 'Department created successfully!'
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
                        message: 'Failed to create department. Please check the form.'
                    });
                },
            });
        }
    };

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Close notification
    const closeNotification = () => {
        setNotification(null);
    };

    // Don't render if not open
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

            <div
                className="fixed inset-0 z-50 overflow-y-auto"
                aria-labelledby="modal-title"
                role="dialog"
                aria-modal="true"
            >
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm"
                    onClick={handleBackdropClick}
                />

                {/* Modal Container */}
                <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100">
                        
                        {/* Header */}
                        <div className={`bg-gradient-to-r px-6 py-4 ${
                            isEditing 
                                ? 'from-emerald-800 to-emerald-900' 
                                : 'from-emerald-800 to-emerald-900'
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        {isEditing ? (
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h3
                                            className="text-lg font-semibold text-white tracking-wide"
                                            id="modal-title"
                                        >
                                            {isEditing ? 'Edit Department' : 'Add New Department'}
                                        </h3>
                                        <p className="text-sm text-white/80 mt-0.5">
                                            {isEditing ? 'Update department details' : 'Create a new department record'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white"
                                >
                                    <span className="sr-only">Close</span>
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-6 space-y-6">
                                
                                {/* Department Code Input */}
                                <div>
                                    <label
                                        htmlFor="code"
                                        className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Department Code <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => {
                                                // Only allow digits and limit to 3 characters
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                                                setData('code', value);
                                            }}
                                            className={`w-full px-4 py-3 border rounded-lg font-mono text-lg tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                                errors.code
                                                    ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500'
                                                    : 'border-gray-300 text-gray-900 focus:ring-emerald-600 focus:border-emerald-600'
                                            }`}
                                            placeholder="001"
                                            maxLength={3}
                                            inputMode="numeric"
                                            pattern="[0-9]{3}"
                                            required
                                            autoFocus={!isEditing}
                                        />
                                        {/* Character Count Indicator */}
                                        <div className={`absolute right-3 top-3.5 text-xs font-mono ${
                                            data.code.length === 3 ? 'text-emerald-600' : 'text-gray-400'
                                        }`}>
                                            {data.code.length}/3
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Must be exactly 3 digits (e.g., 001, 002, 999)
                                    </p>
                                    {errors.code && (
                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600 flex items-center gap-2">
                                                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                                                {errors.code}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Department Name Input */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-semibold text-gray-700 mb-2"
                                    >
                                        Department Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 transition-all ${
                                            errors.name
                                                ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500'
                                                : 'border-gray-300 text-gray-900 focus:ring-emerald-600 focus:border-emerald-600'
                                        }`}
                                        placeholder="e.g., Human Resources Department"
                                        required
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Full official name of the department
                                    </p>
                                    {errors.name && (
                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600 flex items-center gap-2">
                                                <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                                                {errors.name}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Help Text / Warning */}
                                <div className={`border rounded-lg p-4 ${
                                    isEditing 
                                        ? 'bg-amber-50 border-amber-200' 
                                        : 'bg-blue-50 border-blue-200'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        {isEditing ? (
                                            <ExclamationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        <div className={`text-sm ${
                                            isEditing ? 'text-amber-800' : 'text-blue-800'
                                        }`}>
                                            <p className="font-semibold mb-1">
                                                {isEditing ? 'Important Note:' : 'Guidelines:'}
                                            </p>
                                            <p>
                                                {isEditing 
                                                    ? 'Changing department information may affect related records. Ensure all changes are accurate.'
                                                    : 'Department codes are unique identifiers. Choose a code that follows your organization\'s numbering system.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={processing}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 border border-emerald-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                                        </>
                                    ) : (
                                        <>
                                            {isEditing ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            )}
                                            <span>{isEditing ? 'Update Department' : 'Create Department'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}