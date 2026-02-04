import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeptCodeModal from './Partials/DeptCodeModal';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DepartmentsIndex({ departments = [] }) {
    const { flash } = usePage().props;

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredDepartments = departments.filter(dept =>
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = () => {
        setSelectedDepartment(null);
        setIsModalOpen(true);
    };

    const handleEdit = (department) => {
        setSelectedDepartment(department);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (department) => {
        setDeleteConfirm(department);
    };

    const confirmDelete = () => {
        if (!deleteConfirm) return;

        setIsDeleting(true);
        router.delete(route('departments.destroy', deleteConfirm.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteConfirm(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const cancelDelete = () => {
        if (!isDeleting) {
            setDeleteConfirm(null);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDepartment(null);
    };

    return (
        <AuthenticatedLayout

        >
            <Head title="Department Management" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Flash messages */}
                    {flash?.success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 animate-fade-in">
                            <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-emerald-800">{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 animate-fade-in">
                            <svg className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-rose-800">{flash.error}</span>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-xl">
                                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Departments</p>
                                    <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 rounded-xl">
                                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Active Departments</p>
                                    <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-50 rounded-xl">
                                    <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Last Updated</p>
                                    <p className="text-2xl font-bold text-gray-900">Today</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Controls */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1 max-w-lg">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search departments..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {searchTerm && (
                                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                        {filteredDepartments.length} {filteredDepartments.length === 1 ? 'result' : 'results'}
                                    </div>
                                )}
                                <button
                                    onClick={handleAdd}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    <PlusIcon className="w-5 h-5" />
                                    <span>New Department</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Departments Table */}
                    <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
                        {filteredDepartments.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="mx-auto bg-gray-100 p-5 rounded-full w-20 h-20 flex items-center justify-center">
                                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="mt-4 text-lg font-medium text-gray-900">
                                    {searchTerm ? "No matching departments found" : "No departments yet"}
                                </h3>
                                <p className="mt-2 text-gray-500">
                                    {searchTerm
                                        ? "Try adjusting your search terms"
                                        : "Add your first department to get started"}
                                </p>
                                {!searchTerm && (
                                    <div className="mt-6">
                                        <button
                                            onClick={handleAdd}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
                                        >
                                            <PlusIcon className="w-5 h-5" />
                                            <span>Add Department</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Code
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Department Name
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredDepartments.map((dept) => (
                                            <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
                                                        {dept.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-gray-100 p-2 rounded-lg">
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                        </div>
                                                        <span className="font-medium text-gray-900">{dept.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button
                                                            onClick={() => handleEdit(dept)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                                                            title="Edit Department"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(dept)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors duration-200"
                                                            title="Delete Department"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Table Footer */}
                    {departments.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-600">
                            <div>
                                Showing {filteredDepartments.length} of {departments.length} departments
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Previous
                                </button>
                                <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    1
                                </button>
                                <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Department Modal */}
            <DeptCodeModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                department={selectedDepartment}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto"
                    aria-labelledby="delete-modal-title"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" />

                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative transform overflow-hidden rounded-xl bg-white shadow-xl transition-all sm:w-full sm:max-w-lg">
                            {/* Header */}
                            <div className="px-6 py-5 bg-red-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                                            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white" id="delete-modal-title">
                                            Confirm Department Deletion
                                        </h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={cancelDelete}
                                        disabled={isDeleting}
                                        className="rounded-lg p-1 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-6">
                                <div className="space-y-5">
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-800 font-medium">
                                            This action will permanently delete the department and cannot be undone.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                                                Department Details
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500 mb-1">Code</p>
                                                    <p className="font-medium">{deleteConfirm.code}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <p className="text-xs text-gray-500 mb-1">Name</p>
                                                    <p className="font-medium">{deleteConfirm.name}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-700">
                                            Are you sure you want to delete this department? This action cannot be reversed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-5 bg-gray-50 flex items-center justify-end gap-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <TrashIcon className="w-4 h-4" />
                                            <span>Delete Permanently</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
