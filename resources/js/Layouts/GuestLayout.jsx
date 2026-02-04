import { Link } from '@inertiajs/react';

export default function Guest({ children }) {
    return (
        // Changed bg-gray-100 to a deep, dark forest green (#081C15)
        <div className="min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-[#081C15]">
            <div className="transition-transform duration-500 hover:scale-105">
                <Link href="/">
                    <span className="text-4xl font-black tracking-tighter text-white uppercase italic">
                        TRIP<span className="text-[#2D6A4F] font-light">TIX</span>
                    </span>
                </Link>
            </div>

            {/* Added a thicker shadow and a top border in Dark Green (#1B4332) */}
            <div className="w-full sm:max-w-md mt-6 px-8 py-10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden sm:rounded-2xl border-t-8 border-[#1B4332]">
                {children}
            </div>

            {/* Subtle footer for professional touch */}
            <div className="mt-8 text-[#2D6A4F] text-[10px] uppercase tracking-[0.2em] font-bold">
       
            </div>
        </div>
    );
}