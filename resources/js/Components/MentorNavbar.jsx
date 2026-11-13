import React, { useState, useRef, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import NotificationBell from "./NotificationBell";
import { mentorNavTokens } from "./ui/tokens";

function getInitials(name) {
    if (!name) return "M";
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "M"
    );
}

export default function MentorNavbar({
    active,
    mentorName,
    mentorProfile,
    role = "Mentor",
}) {
    const { url } = usePage();
    const { auth } = usePage().props;
    const user = auth?.user;

    const displayName =
        mentorName ||
        mentorProfile?.user?.name ||
        user?.name ||
        "Mentor Pathway";
    const displayRole = mentorProfile?.expertise || role || "Mentor";
    const photo = user?.profile_photo_url || user?.photo_path;
    const initials = getInitials(displayName);

    const [showingDropdown, setShowingDropdown] = useState(false);
    const [showingMobileNav, setShowingMobileNav] = useState(false);
    const dropdownRef = useRef(null);

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
            }
        }

        if (showingDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showingDropdown]);

    const isCurrent = (name) => {
        try {
            return typeof route === "function" && route().current(name);
        } catch {
            return false;
        }
    };

    const isOverviewActive =
        active === "overview" ||
        isCurrent("mentor.dashboard") ||
        url === "/mentor/dashboard" ||
        url.startsWith("/mentor/dashboard");

    const isJourneyActive =
        active === "journeys" ||
        isCurrent("journeys.*") ||
        url === "/journeys" ||
        url.startsWith("/journeys");

    return (
        <header
            className="sticky top-0 z-40 shadow-md"
            style={{ backgroundColor: mentorNavTokens.bg }}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                {/* 1. Logo Pathway + badge MENTOR */}
                <Link
                    href={route("mentor.dashboard")}
                    className="flex shrink-0 items-center space-x-2.5 focus:outline-none"
                >
                    <img
                        src="/images/pathwayIcon.png"
                        alt="Pathway Logo"
                        className="h-9 w-auto"
                    />
                    <span className="text-xl font-bold tracking-tight text-white">
                        Pathway
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
                        MENTOR
                    </span>
                </Link>

                {/* 2, 3, 4: Navigasi Desktop / Tablet */}
                <nav
                    aria-label="Navigasi mentor"
                    className="hidden items-center space-x-1 overflow-x-auto whitespace-nowrap text-sm md:flex"
                >
                    {/* 2. Overview */}
                    <Link
                        href={route("mentor.dashboard")}
                        aria-current={isOverviewActive ? "page" : undefined}
                        style={{
                            backgroundColor: isOverviewActive
                                ? mentorNavTokens.activeBg
                                : undefined,
                            color: isOverviewActive
                                ? mentorNavTokens.activeText
                                : undefined,
                        }}
                        className={`rounded-full px-4 py-2 whitespace-nowrap transition ${
                            isOverviewActive
                                ? "font-bold shadow-xs"
                                : "font-medium text-white/85 hover:bg-white/10"
                        }`}
                    >
                        Overview
                    </Link>

                    {/* 3. Sharing Journey */}
                    <Link
                        href={route("journeys.index")}
                        aria-current={isJourneyActive ? "page" : undefined}
                        style={{
                            backgroundColor: isJourneyActive
                                ? mentorNavTokens.activeBg
                                : undefined,
                            color: isJourneyActive
                                ? mentorNavTokens.activeText
                                : undefined,
                        }}
                        className={`rounded-full px-4 py-2 whitespace-nowrap transition ${
                            isJourneyActive
                                ? "font-bold shadow-xs"
                                : "font-medium text-white/85 hover:bg-white/10"
                        }`}
                    >
                        Sharing Journey
                    </Link>

                    {/* 4. Reward Mentor (Nonaktif) */}
                    <span
                        aria-disabled="true"
                        className="cursor-not-allowed select-none rounded-full px-4 py-2 text-sm font-medium text-white/40 whitespace-nowrap"
                        title="Route belum tersedia"
                    >
                        Reward Mentor
                    </span>
                </nav>

                {/* Bagian Kanan: Kotak Pencarian, Lonceng Notifikasi, Profil, Toggle Mobile */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* 5. Kotak pencarian visual */}
                    <div className="relative hidden lg:block w-48 xl:w-60">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg
                                className="h-4 w-4 text-white/70"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari mentee, jadwal, topik..."
                            aria-label="Cari mentee, jadwal, topik"
                            className="w-full rounded-md border border-white/20 bg-black/10 py-1.5 pl-9 pr-3 text-xs text-white placeholder-white/60 focus:border-white focus:outline-none"
                        />
                    </div>

                    {/* 6. Lonceng notifikasi */}
                    <NotificationBell />

                    {/* 7. Menu profil di kanan */}
                    <div
                        ref={dropdownRef}
                        className="relative ml-1 border-l border-white/20 pl-3"
                    >
                        <button
                            type="button"
                            onClick={() => setShowingDropdown(!showingDropdown)}
                            aria-expanded={showingDropdown}
                            className="flex items-center space-x-3 focus:outline-none"
                        >
                            <div className="hidden text-right leading-tight md:block">
                                <p className="max-w-[140px] truncate text-sm font-bold text-white">
                                    {displayName}
                                </p>
                                <p
                                    className="max-w-[140px] truncate text-[10px] text-white/70"
                                    title={displayRole}
                                >
                                    {displayRole}
                                </p>
                            </div>

                            {photo ? (
                                <img
                                    src={photo}
                                    alt="Foto profil"
                                    className="h-9 w-9 rounded-full bg-[#6b9bc3] object-cover transition hover:ring-2 hover:ring-white/50"
                                />
                            ) : initials ? (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5ECDD] text-xs font-bold text-[#34443D] shadow-sm transition hover:ring-2 hover:ring-white/50">
                                    {initials}
                                </div>
                            ) : (
                                <img
                                    src="/images/bwa.webp"
                                    alt="Foto profil"
                                    className="h-9 w-9 rounded-full bg-[#6b9bc3] object-cover transition hover:ring-2 hover:ring-white/50"
                                />
                            )}
                        </button>

                        {/* Dropdown profil popup melayang */}
                        {showingDropdown && (
                            <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-md border border-gray-100 bg-white py-1 shadow-lg">
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

                    {/* Tombol menu responsif / hamburger */}
                    <button
                        type="button"
                        onClick={() => setShowingMobileNav(!showingMobileNav)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white md:hidden focus:outline-none"
                        aria-label="Toggle navigation menu"
                    >
                        <svg
                            className="h-6 w-6"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            {showingMobileNav ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Menu Navigasi Layar Kecil (Mobile / Tablet Collapsible) */}
            {showingMobileNav && (
                <div className="border-t border-white/15 px-4 py-3 md:hidden space-y-3">
                    <div className="relative w-full">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg
                                className="h-4 w-4 text-white/70"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari mentee, jadwal, topik..."
                            aria-label="Cari mentee, jadwal, topik"
                            className="w-full rounded-md border border-white/20 bg-black/10 py-1.5 pl-9 pr-3 text-xs text-white placeholder-white/60 focus:border-white focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col space-y-1">
                        <Link
                            href={route("mentor.dashboard")}
                            style={{
                                backgroundColor: isOverviewActive
                                    ? mentorNavTokens.activeBg
                                    : undefined,
                                color: isOverviewActive
                                    ? mentorNavTokens.activeText
                                    : undefined,
                            }}
                            className={`rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                                isOverviewActive
                                    ? "font-bold shadow-xs"
                                    : "font-medium text-white/85 hover:bg-white/10"
                            }`}
                        >
                            Overview
                        </Link>

                        <Link
                            href={route("journeys.index")}
                            style={{
                                backgroundColor: isJourneyActive
                                    ? mentorNavTokens.activeBg
                                    : undefined,
                                color: isJourneyActive
                                    ? mentorNavTokens.activeText
                                    : undefined,
                            }}
                            className={`rounded-lg px-3 py-2 text-sm whitespace-nowrap transition ${
                                isJourneyActive
                                    ? "font-bold shadow-xs"
                                    : "font-medium text-white/85 hover:bg-white/10"
                            }`}
                        >
                            Sharing Journey
                        </Link>

                        <span
                            className="cursor-not-allowed select-none rounded-lg px-3 py-2 text-sm font-medium text-white/40 whitespace-nowrap"
                            title="Route belum tersedia"
                        >
                            Reward Mentor
                        </span>
                    </div>
                </div>
            )}
        </header>
    );
}
