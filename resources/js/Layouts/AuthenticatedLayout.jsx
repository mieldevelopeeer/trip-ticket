import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link } from '@inertiajs/react';

export default function Authenticated({ header, children }) {
    const { auth } = usePage().props;
    const user = auth?.user ?? null;

    // Safe fallbacks to prevent crashes
    const userName = user?.name ?? 'User';
    const userId = user?.user_id ?? '—';

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
            `}</style>

            <nav className="bg-[#1B4332] border-b border-[#1B4332]/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-14">
                        <div className="flex items-center">
                            {/* Logo */}
                            <div className="shrink-0 flex items-center">
                                <Link href={route('dashboard')} className="flex items-center space-x-2">
                                    <span className="text-lg font-bold tracking-tight text-white">
                                        TripTix
                                    </span>
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden sm:flex sm:items-center sm:ml-8 space-x-1">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                    className="px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    <span className={route().current('dashboard') ? 'text-[#A3C1AD]' : 'text-white/70 hover:text-white'}>
                                        Dashboard
                                    </span>
                                </NavLink>

                                <NavLink
                                    href={route('trips.index')}
                                    active={route().current('trips.*')}
                                    className="px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    <span className={route().current('trips.*') ? 'text-[#A3C1AD]' : 'text-white/70 hover:text-white'}>
                                        Trips
                                    </span>
                                </NavLink>

                                <NavLink
                                    href={route('drivers.index')}
                                    active={route().current('drivers.*')}
                                    className="px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    <span className={route().current('drivers.*') ? 'text-[#A3C1AD]' : 'text-white/70 hover:text-white'}>
                                        Drivers
                                    </span>
                                </NavLink>

                                <NavLink
                                    href={route('vehicles.index')}
                                    active={route().current('vehicles.*')}
                                    className="px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    <span className={route().current('vehicles.*') ? 'text-[#A3C1AD]' : 'text-white/70 hover:text-white'}>
                                        Vehicles
                                    </span>
                                </NavLink>

                                <NavLink
                                    href={route('departments.index')}
                                    active={route().current('departments.*')}
                                    className="px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    <span className={route().current('departments.*') ? 'text-[#A3C1AD]' : 'text-white/70 hover:text-white'}>
                                        Offices
                                    </span>
                                </NavLink>

                                <NavLink
                                    href={route('reports.index')}
                                    active={route().current('reports.*')}
                                    className="px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    <span className={route().current('reports.*') ? 'text-[#A3C1AD]' : 'text-white/70 hover:text-white'}>
                                        Logs
                                    </span>
                                </NavLink>
                            </div>
                        </div>

                        {/* Desktop User Dropdown */}
                        <div className="hidden sm:flex sm:items-center">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button
                                        type="button"
                                        className="flex items-center space-x-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
                                    >
                                        <span>{userName}</span>
                                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-sm font-medium text-slate-900">{userName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{userId}</p>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-red-600 w-full text-left"
                                    >
                                        Logout
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>

                        {/* Mobile Hamburger */}
                        <div className="flex items-center sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown(prev => !prev)}
                                className="inline-flex items-center justify-center p-2 text-white/70 hover:text-white transition-colors"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`${showingNavigationDropdown ? 'block' : 'hidden'} sm:hidden border-t border-white/10 bg-[#1B4332]`}>
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>
                            <span className={route().current('dashboard') ? 'text-[#A3C1AD]' : 'text-white/70'}>
                                Dashboard
                            </span>
                        </ResponsiveNavLink>

                        <ResponsiveNavLink href={route('trips.index')} active={route().current('trips.*')}>
                            <span className={route().current('trips.*') ? 'text-[#A3C1AD]' : 'text-white/70'}>
                                Trips
                            </span>
                        </ResponsiveNavLink>

                        <ResponsiveNavLink href={route('drivers.index')} active={route().current('drivers.*')}>
                            <span className={route().current('drivers.*') ? 'text-[#A3C1AD]' : 'text-white/70'}>
                                Drivers
                            </span>
                        </ResponsiveNavLink>

                        <ResponsiveNavLink href={route('vehicles.index')} active={route().current('vehicles.*')}>
                            <span className={route().current('vehicles.*') ? 'text-[#A3C1AD]' : 'text-white/70'}>
                                Vehicles
                            </span>
                        </ResponsiveNavLink>

                        <ResponsiveNavLink href={route('departments.index')} active={route().current('departments.*')}>
                            <span className={route().current('departments.*') ? 'text-[#A3C1AD]' : 'text-white/70'}>
                                Offices
                            </span>
                        </ResponsiveNavLink>

                        <ResponsiveNavLink href={route('reports.index')} active={route().current('reports.*')}>
                            <span className={route().current('reports.*') ? 'text-[#A3C1AD]' : 'text-white/70'}>
                                Logs
                            </span>
                        </ResponsiveNavLink>
                    </div>

                    {/* Mobile User Section */}
                    <div className="pt-4 pb-3 border-t border-white/10">
                        <div className="px-4 mb-3">
                            <div className="font-medium text-white">{userName}</div>
                            <div className="text-sm text-white/60">{userId}</div>
                        </div>

                        <div className="space-y-1 px-4">
                            <ResponsiveNavLink href={route('profile.edit')} className="px-3 py-2 text-sm font-medium text-white/70 block">
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="px-3 py-2 text-sm font-medium text-red-400 w-full text-left"
                            >
                                Logout
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header (if provided) */}
            {header && (
                <header className="bg-gradient-to-r from-[#1B4332] to-[#2d5a45]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}