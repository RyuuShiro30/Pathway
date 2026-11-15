import { useState } from "react";
import { Link, usePage } from "@inertiajs/react";

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const { url } = usePage();
    const user = auth?.user;
    const [showingDropdown, setShowingDropdown] = useState(false);

    const isProfilePage = url?.startsWith("/profile");

    return (
        <div className="min-h-screen bg-[#F3F7F9]">
            {isProfilePage ? (
                <nav className="relative z-50 border-b border-white/20 bg-[#6594B1] shadow-md">
                    {" "}
                    <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Logo Pathway */}
                        <Link
                            href={route("dashboard")}
                            className="flex items-center gap-3 transition-opacity hover:opacity-90"
                        >
                            <img
                                src="/images/pathwayIcon.png"
                                alt="Pathway Logo"
                                className="h-10 w-auto"
                            />

                            <span className="text-xl font-bold tracking-wide text-white">
                                Pathway
                            </span>
                        </Link>

                        {/* Dropdown Profil */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowingDropdown((previous) => !previous)
                                }
                                aria-expanded={showingDropdown}
                                className="flex items-center rounded-full p-1 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
                            >
                                <img
                                    src={
                                        user?.photo_path ||
                                        user?.profile_photo_url ||
                                        "/images/bwa.webp"
                                    }
                                    alt="Foto profil"
                                    className="h-10 w-10 rounded-full border-2 border-white/70 bg-white object-cover"
                                />

                                <svg
                                    className="ml-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {showingDropdown && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Tutup menu"
                                        className="fixed inset-0 z-40 cursor-default"
                                        onClick={() =>
                                            setShowingDropdown(false)
                                        }
                                    />

                                    <div className="absolute right-0 z-50 mt-3 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-2 shadow-xl">
                                        <Link
                                            href={route("profile.edit")}
                                            onClick={() =>
                                                setShowingDropdown(false)
                                            }
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#E6EFF4] hover:text-[#6594B1]"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={1.8}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                />
                                            </svg>
                                            Profil Saya
                                        </Link>

                                        <div className="border-t border-slate-100" />

                                        <Link
                                            href={route("logout")}
                                            method="post"
                                            as="button"
                                            onClick={() =>
                                                setShowingDropdown(false)
                                            }
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={1.8}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 15l3-3m0 0l-3-3m3 3H9"
                                                />
                                            </svg>
                                            Logout
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </nav>
            ) : (
                // Navbar lama tetap dipertahankan untuk halaman lain.
                <nav className="border-b border-gray-100 bg-white">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href={route("dashboard")}>
                            <img
                                src="/images/pathwayIcon.png"
                                alt="Pathway"
                                className="h-10 w-auto"
                            />
                        </Link>

                        <Link
                            href={route("profile.edit")}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-100"
                        >
                            Profil
                        </Link>
                    </div>
                </nav>
            )}

            {header && (
                <header className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
