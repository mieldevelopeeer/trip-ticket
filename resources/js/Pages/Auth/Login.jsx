import { useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <GuestLayout>
            <Head title="User Login" />

            {/* Logistics Branding Header with Dark Green */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1B4332]/10 rounded-full mb-4">
                    <svg className="w-8 h-8 text-[#1B4332]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Trip Ticketing System</h1>
               
            </div>

            {status && <div className="mb-4 font-medium text-sm text-green-600 text-center">{status}</div>}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="user_id" value="User ID" />
                    <TextInput
                        id="user_id"
                        type="text"
                        name="user_id"
                        value={data.user_id}
                        className="mt-1 block w-full border-gray-300 focus:border-[#1B4332] focus:ring-[#1B4332] rounded-lg shadow-sm"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('user_id', e.target.value)}
                        placeholder="Enter your User ID"
                    />
                    <InputError message={errors.user_id} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full border-gray-300 focus:border-[#1B4332] focus:ring-[#1B4332] rounded-lg shadow-sm"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="text-[#1B4332] focus:ring-[#1B4332]"
                        />
                        <span className="ms-2 text-sm text-gray-600">Remember this device</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-[#1B4332] hover:text-[#2D6A4F] font-semibold underline"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <div className="pt-2">
                    <PrimaryButton 
                        className="w-full justify-center py-3 bg-[#1B4332] hover:bg-[#2D6A4F] active:bg-[#081C15] text-white font-bold rounded-lg transition-all" 
                        disabled={processing}
                    >
                        {processing ? 'Authorizing...' : 'SIGN IN'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}