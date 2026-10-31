import React from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";

export default function Dashboard({ statistics, reviewQueue, monitoring }) {
    return (
        <AdminLayout>
            <Head title="Dashboard Admin" />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-7xl">
                    {/* ==================== HEADER ==================== */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Kelola dan pantau aktivitas platform Pathway.
                        </p>
                    </div>

                    {/* ==================== WELCOME ==================== */}
                    <div className="mb-7 rounded-2xl bg-[#6594B1] p-6 text-white shadow-sm">
                        <p className="text-sm text-white/80">Admin Panel</p>

                        <h2 className="mt-1 text-2xl font-bold">
                            Selamat datang, Admin
                        </h2>

                        <p className="mt-1 text-sm text-white/80">
                            Berikut ringkasan aktivitas platform Pathway saat
                            ini.
                        </p>
                    </div>

                    {/* ==================== STATISTIK UTAMA ==================== */}
                    <section className="mb-7">
                        <SectionTitle
                            title="Statistik Utama"
                            description="Ringkasan data utama platform."
                            label="Overview"
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Total Pengguna"
                                value={statistics.total_users}
                                icon={<UsersIcon />}
                            />

                            <StatCard
                                title="Total Mentor"
                                value={statistics.total_mentors}
                                icon={<MentorIcon />}
                            />

                            <StatCard
                                title="Total Course"
                                value={statistics.total_courses}
                                icon={<BookIcon />}
                            />

                            <StatCard
                                title="Total Sesi Mentoring"
                                value={statistics.total_sessions}
                                icon={<CalendarIcon />}
                            />
                        </div>
                    </section>

                    {/* ==================== ANTREAN PERLU DITINJAU ==================== */}
                    <section className="mb-7">
                        <SectionTitle
                            title="Antrean Perlu Ditinjau"
                            description="Aktivitas yang membutuhkan perhatian admin."
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <ReviewCard
                                title="Pengajuan / Verifikasi Mentor"
                                description="Menunggu proses verifikasi"
                                value={reviewQueue.pending_mentors}
                                icon={<MentorIcon />}
                            />

                            <ReviewCard
                                title="Laporan Refund"
                                description="Laporan yang perlu ditinjau"
                                value={reviewQueue.refund_reports}
                                icon={<ReceiptIcon />}
                            />

                            <ReviewCard
                                title="Sanggahan No-show"
                                description="Sanggahan yang perlu ditinjau"
                                value={reviewQueue.no_show_disputes}
                                icon={<WarningIcon />}
                            />
                        </div>
                    </section>

                    {/* ==================== MONITORING ==================== */}
                    <section>
                        <SectionTitle
                            title="Monitoring"
                            description="Kondisi terkini platform."
                            label="Current Status"
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <MonitorCard
                                title="Mentor Tidak Disuspend"
                                value={monitoring.active_mentors}
                                icon={<ShieldIcon />}
                                iconStyle="bg-emerald-50 text-emerald-600"
                            />

                            <MonitorCard
                                title="Mentor Disuspend"
                                value={monitoring.suspended_mentors}
                                icon={<WarningIcon />}
                                iconStyle="bg-red-50 text-red-500"
                            />

                            <MonitorCard
                                title="Rata-rata Rating Mentor"
                                value={monitoring.average_rating}
                                icon={<StarIcon />}
                                iconStyle="bg-amber-50 text-amber-500"
                            />

                            <MonitorCard
                                title="Poin Beredar"
                                value={monitoring.points_circulating}
                                icon={<PointIcon />}
                                iconStyle="bg-[#6594B1]/10 text-[#6594B1]"
                            />
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}

/* =========================================================
   SECTION TITLE
   ========================================================= */

function SectionTitle({ title, description, label }) {
    return (
        <div className="mb-4 flex items-end justify-between">
            <div>
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>

                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>

            {label && (
                <span className="text-xs font-medium text-slate-400">
                    {label}
                </span>
            )}
        </div>
    );
}

/* =========================================================
   STATISTIK CARD
   ========================================================= */

function StatCard({ title, value, icon }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-3 text-2xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6594B1]/10 text-[#6594B1]">
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   ANTREAN CARD
   ========================================================= */

function ReviewCard({ title, description, value, icon }) {
    return (
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6594B1]/10 text-[#6594B1]">
                        {icon}
                    </div>

                    <div>
                        <p className="text-sm font-semibold leading-5 text-slate-800">
                            {title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            {description}
                        </p>
                    </div>
                </div>

                <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-slate-100 px-2 text-sm font-bold text-slate-700">
                    {value}
                </span>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#557F99]"
                >
                    Lihat Detail
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}

/* =========================================================
   MONITORING CARD
   ========================================================= */

function MonitorCard({ title, value, icon, iconStyle }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}
            >
                {icon}
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>

            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

/* =========================================================
   ICONS
   ========================================================= */

function UsersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            />

            <circle cx="9" cy="7" r="4" />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            />
        </svg>
    );
}

function MentorIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <circle cx="12" cy="8" r="4" />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 21a8 8 0 0 1 16 0"
            />
        </svg>
    );
}

function BookIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
            />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <rect x="3" y="4" width="18" height="17" rx="2" />

            <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    );
}

function ReceiptIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"
            />

            <path strokeLinecap="round" d="M9 7h6M9 11h6M9 15h4" />
        </svg>
    );
}

function WarningIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3 2.5 20h19L12 3Z"
            />

            <path strokeLinecap="round" d="M12 9v4M12 17h.01" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9 12 2 2 4-4"
            />
        </svg>
    );
}

function StarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"
            />
        </svg>
    );
}

function PointIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
        >
            <circle cx="12" cy="12" r="8" />

            <path strokeLinecap="round" d="M12 8v8M9.5 10h4a2 2 0 0 1 0 4h-4" />
        </svg>
    );
}
