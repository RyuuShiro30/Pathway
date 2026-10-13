import React, { useState } from "react";
import { usePage, Link } from "@inertiajs/react";

const MENU = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard" },
    { key: "courses", label: "Course", href: "/courses" },
    { key: "mentor", label: "Mentor", href: "/mentors" },
    { key: "jadwal", label: "Jadwal Saya", href: "#" },
    { key: "forum", label: "Forum", href: "#" },
    { key: "sharing", label: "Sharing Journey", href: "#" },
];

export default function Navbar({ active = "dashboard" }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [showingDropdown, setShowingDropdown] = useState(false);

    return (
        <nav className="bg-[#6594B1] px-6 py-3 flex justify-between items-center shadow-md">
            {/* Kiri: logo & brand */}
            <div className="flex items-center space-x-3">
                <img
                    src="/images/pathwayIcon.png"
                    alt="Pathway Logo"
                    className="h-11 w-auto"
                />
                <span className="text-xl font-bold tracking-wide text-white">
                    Pathway
                </span>
            </div>

            {/* Tengah: menu */}
            <div className="hidden lg:flex items-center space-x-1 text-sm text-slate-200">
                {MENU.map((item) => {
                    const isActive = item.key === active;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`px-4 py-2 rounded-full transition ${
                                isActive
                                    ? "bg-[#95d56b] text-slate-900 font-bold shadow-sm"
                                    : "font-medium hover:bg-white/10"
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* Kanan: pencarian & profil */}
            <div className="flex items-center space-x-3">
                <div className="hidden md:block relative">
                    <input
                        type="text"
                        placeholder="Cari mentor, topik..."
                        className="bg-black/10 border border-white/20 text-white placeholder-white/60 text-sm rounded-md pl-4 pr-10 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#95d56b] focus:border-[#95d56b] w-64"
                    />
                </div>

                <div className="relative flex items-center space-x-3 pl-2 border-l border-white/20 ml-2">
                    {/* Tombol Profil (Bisa diklik) */}
                    <button
                        onClick={() => setShowingDropdown(!showingDropdown)}
                        className="flex items-center space-x-3 focus:outline-none"
                    >
                        <div className="text-right hidden md:block leading-tight">
                            <p className="text-sm font-bold text-white">
                                {user?.name ?? "Triska R."}
                            </p>
                            <p className="text-[10px] text-white/70">
                                Student Portal
                            </p>
                        </div>
                        <img
                            src={user?.profile_photo_url ?? "/images/bwa.webp"}
                            alt="User"
                            className="w-9 h-9 rounded-full object-cover bg-[#6b9bc3] hover:ring-2 hover:ring-white/50 transition"
                        />
                    </button>

                    {/* Menu Dropdown (Muncul saat foto diklik) */}
                    {showingDropdown && (
                        <div className="absolute top-12 right-0 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                            <Link
                                href={route('profile.edit')}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Edit Profil
                            </Link>

                            {/* Tombol Logout wajib pakai method="post" */}
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                Keluar (Logout)
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}