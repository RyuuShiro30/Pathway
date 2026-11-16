import React, { useState, useRef, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import NotificationBell from "./NotificationBell";

const MENU = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard" },
    { key: "courses", label: "Course", href: "/courses" },
    { key: "jadwal", label: "Jadwal Saya", href: "/bookings" },
    { key: "mentor", label: "Mentor", href: "/mentors" },
    { key: "sharing", label: "Sharing Journey", href: "/journeys" },
    { key: "jadi-mentor", label: "Jadi Mentor", href: "/mentor/become" },
];

export default function Navbar({ active }) {
    const { url } = usePage();
    const { auth } = usePage().props;
    const user = auth?.user;

    const [showingDropdown, setShowingDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Tutup menu mobile otomatis saat berpindah halaman
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [url]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowingDropdown(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setShowingDropdown(false);
                setMobileMenuOpen(false);
            }
        }

        if (showingDropdown || mobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showingDropdown, mobileMenuOpen]);

    const isMentor = user?.role === "mentor";

    const menuItems = MENU.flatMap((item) => {
        if (item.key === "jadi-mentor") {
            if (isMentor) {
                return [
                    {
                        key: "portal-mentor",
                        label: "Portal Mentor",
                        href: "/mentor/dashboard",
                    },
                ];
            }
            return [item];
        }
        return [item];
    });

    const portalLabel =
        user?.role === "mentor"
            ? "Mentor Portal"
            : user?.role === "admin"
              ? "Admin Portal"
              : "Student Portal";

    return (
        <nav className="relative z-40 bg-[#6594B1] shadow-md">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
                {/* Logo dan nama Pathway */}
                <Link
                    href="/dashboard"
                    className="flex shrink-0 items-center space-x-3"
                >
                    <img
                        src="/images/pathwayIcon.png"
                        alt="Pathway Logo"
                        className="h-10 w-auto sm:h-11"
                    />

                    <span className="text-xl font-bold tracking-wide text-white">
                        Pathway
                    </span>
                </Link>

                {/* Menu navigasi desktop */}
                <div className="hidden items-center space-x-1 text-sm text-slate-200 lg:flex">
                    {menuItems.map((item) => {
                        const isActive =
                            active === item.key || url.startsWith(item.href);

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`whitespace-nowrap rounded-full px-4 py-2 transition ${
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

                {/* Pencarian, notifikasi, profil, dan tombol hamburger */}
                <div className="flex shrink-0 items-center space-x-2 sm:space-x-3">
                    <div className="relative hidden md:block">
                        <input
                            type="text"
                            placeholder="Cari mentor, topik..."
                            className="w-52 rounded-md border border-white/20 bg-black/10 py-1.5 pl-4 pr-10 text-sm text-white placeholder-white/60 focus:border-[#95d56b] focus:outline-none focus:ring-1 focus:ring-[#95d56b] xl:w-64"
                        />
                    </div>

                    {/* Lonceng notifikasi */}
                    {user && <NotificationBell />}

                    {/* Dropdown profil pengguna */}
                    <div
                        ref={dropdownRef}
                        className="relative flex items-center space-x-3 border-l border-white/20 pl-2 sm:pl-3"
                    >
                        <button
                            type="button"
                            onClick={() => setShowingDropdown(!showingDropdown)}
                            aria-expanded={showingDropdown}
                            className="flex items-center space-x-3 focus:outline-none"
                        >
                            <div className="hidden text-right leading-tight md:block">
                                <p className="text-sm font-bold text-white">
                                    {user?.name ?? "Pengguna"}
                                </p>

                                <p className="text-[10px] text-white/70">
                                    {portalLabel}
                                </p>
                            </div>

                            <img
                                src={
                                    user?.photo_path ??
                                    user?.profile_photo_url ??
                                    "/images/bwa.webp"
                                }
                                alt="Foto profil"
                                className="h-9 w-9 rounded-full bg-[#6b9bc3] object-cover transition hover:ring-2 hover:ring-white/50"
                            />
                        </button>

                        {showingDropdown && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-gray-100 bg-white py-1 shadow-lg">
                                <div className="border-b border-gray-100 px-4 py-2 md:hidden">
                                    <p className="truncate text-sm font-bold text-slate-800">
                                        {user?.name ?? "Pengguna"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {portalLabel}
                                    </p>
                                </div>

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

                    {/* Tombol Hamburger (muncul saat layar < 1024px / saat di-zoom) */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-expanded={mobileMenuOpen}
                        aria-label="Toggle menu navigasi"
                        className="inline-flex items-center justify-center rounded-lg p-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 lg:hidden"
                    >
                        {mobileMenuOpen ? (
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Panel Menu Mobile / Zoom */}
            {mobileMenuOpen && (
                <div className="border-t border-white/15 bg-[#5885A1] px-4 py-4 shadow-lg sm:px-6 lg:hidden">
                    {/* Kolom pencarian untuk layar < 768px */}
                    <div className="mb-3 md:hidden">
                        <input
                            type="text"
                            placeholder="Cari mentor, topik..."
                            className="w-full rounded-md border border-white/20 bg-black/10 px-4 py-2 text-sm text-white placeholder-white/60 focus:border-[#95d56b] focus:outline-none focus:ring-1 focus:ring-[#95d56b]"
                        />
                    </div>

                    {/* Daftar link menu */}
                    <div className="flex flex-col space-y-1.5">
                        {menuItems.map((item) => {
                            const isActive =
                                active === item.key ||
                                url.startsWith(item.href);

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-current={isActive ? "page" : undefined}
                                    className={`rounded-xl px-4 py-2.5 text-sm transition ${
                                        isActive
                                            ? "bg-[#95d56b] font-bold text-slate-900 shadow-sm"
                                            : "font-medium text-white hover:bg-white/10"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
}