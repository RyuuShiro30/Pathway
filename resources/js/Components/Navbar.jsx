import React, { useState } from "react";
import { usePage, Link } from "@inertiajs/react";

const MENU = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard" },
    { key: "courses", label: "Course", href: "/courses" },
    { key: "mentor", label: "Mentor", href: "/mentors" },
    { key: "jadwal", label: "Jadwal Saya", href: "#" },
    { key: "forum", label: "Forum", href: "#" },
    { key: "sharing", label: "Sharing Journey", href: "/journeys" },
    { key: "jadi-mentor", label: "Jadi Mentor", href: "/mentor/become" },
];

export default function Navbar({ active = "dashboard" }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const [showingDropdown, setShowingDropdown] = useState(false);

    return (
        <nav className="flex items-center justify-between bg-[#6594B1] px-6 py-3 shadow-md">
            {/* Logo dan nama Pathway */}
            <Link href="/dashboard" className="flex items-center space-x-3">
                <img
                    src="/images/pathwayIcon.png"
                    alt="Pathway Logo"
                    className="h-11 w-auto"
                />

                <span className="text-xl font-bold tracking-wide text-white">
                    Pathway
                </span>
            </Link>

            {/* Menu navigasi */}
            <div className="hidden items-center space-x-1 text-sm text-slate-200 lg:flex">
                {MENU.map((item) => {
                    const isActive = item.key === active;

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`rounded-full px-4 py-2 transition ${
                                isActive
                                    ? "bg-[#95d56b] font-bold text-slate-900 shadow-sm"
                                    : "font-medium hover:bg-white/10"
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            {/* Pencarian dan profil pengguna */}
            <div className="flex items-center space-x-3">
                <div className="relative hidden md:block">
                    <input
                        type="text"
                        placeholder="Cari mentor, topik..."
                        className="w-64 rounded-md border border-white/20 bg-black/10 py-1.5 pl-4 pr-10 text-sm text-white placeholder-white/60 focus:border-[#95d56b] focus:outline-none focus:ring-1 focus:ring-[#95d56b]"
                    />
                </div>

                <div className="relative ml-2 flex items-center space-x-3 border-l border-white/20 pl-2">
                    <button
                        type="button"
                        onClick={() => setShowingDropdown(!showingDropdown)}
                        aria-expanded={showingDropdown}
                        className="flex items-center space-x-3 focus:outline-none"
                    >
                        <div className="hidden text-right leading-tight md:block">
                            <p className="text-sm font-bold text-white">
                                {user?.name ?? "Triska R."}
                            </p>

                            <p className="text-[10px] text-white/70">
                                Student Portal
                            </p>
                        </div>

                        <img
                            src={user?.profile_photo_url ?? "/images/bwa.webp"}
                            alt="Foto profil"
                            className="h-9 w-9 rounded-full bg-[#6b9bc3] object-cover transition hover:ring-2 hover:ring-white/50"
                        />
                    </button>

                    {/* Dropdown profil */}
                    {showingDropdown && (
                        <div className="absolute right-0 top-12 z-50 w-48 rounded-md border border-gray-100 bg-white py-1 shadow-lg">
                            <Link
                                href={route("profile.edit")}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                Edit Profil
                            </Link>

                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
