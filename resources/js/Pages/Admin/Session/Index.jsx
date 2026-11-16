import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Badge from "@/Components/ui/Badge";
import EmptyState from "@/Components/ui/EmptyState";

export default function SessionIndex({
    sessions = [],
    currentStatus = "belum_selesai",
    counts = {},
}) {
    const { flash } = usePage().props;

    const tabs = [
        {
            key: "belum_selesai",
            label: `Belum Selesai (${counts?.belum_selesai ?? 0})`,
        },
        { key: "diajukan", label: `Diajukan (${counts?.diajukan ?? 0})` },
        {
            key: "dikonfirmasi",
            label: `Dikonfirmasi (${counts?.dikonfirmasi ?? 0})`,
        },
        {
            key: "berlangsung",
            label: `Berlangsung (${counts?.berlangsung ?? 0})`,
        },
        { key: "selesai", label: `Selesai (${counts?.selesai ?? 0})` },
        {
            key: "dibatalkan",
            label: `Dibatalkan (${counts?.dibatalkan ?? 0})`,
        },
        { key: "semua", label: `Semua (${counts?.semua ?? 0})` },
    ];

    const statusBadge = (status) => {
        const variants = {
            diajukan: "warning",
            dikonfirmasi: "primary",
            berlangsung: "purple",
            selesai: "success",
            dibatalkan: "neutral",
        };

        return (
            <Badge variant={variants[status] ?? "default"} size="md" className="capitalize">
                {status}
            </Badge>
        );
    };

    return (
        <AdminLayout>
            <Head title="Sesi Bimbingan" />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Sesi Bimbingan
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Pantau sesi yang masih berjalan atau sudah lewat
                                jadwal tetapi belum ditandai selesai.
                            </p>
                        </div>

                        <Link
                            href="/admin/dashboard"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            ← Kembali ke Dasbor
                        </Link>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    <div className="mb-6 flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        "/admin/sessions",
                                        { status: tab.key },
                                        { preserveState: true }
                                    )
                                }
                                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                                    currentStatus === tab.key
                                        ? "bg-[#6594B1] text-white shadow-sm"
                                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Jadwal</th>
                                    <th className="px-6 py-4">Mentor</th>
                                    <th className="px-6 py-4">Mentee</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Pembayaran</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10">
                                            <EmptyState message="Tidak ada sesi pada kategori ini." />
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-slate-50/70">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    Sesi #{session.id}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {session.schedule_time}
                                                    {" → "}
                                                    {session.end_time ?? "-"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {session.duration_hours} jam ·{" "}
                                                    {session.is_free_session
                                                        ? "Gratis"
                                                        : `Rp ${Number(session.price_snapshot || 0).toLocaleString("id-ID")}`}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {session.mentor.name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {session.mentor.email}
                                                </p>
                                                {session.mentor.is_suspended && (
                                                    <p className="mt-1 text-xs font-semibold text-rose-600">
                                                        Akun disuspend
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {session.student.name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {session.student.email}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {statusBadge(session.status)}
                                                    {session.is_overdue && (
                                                        <Badge
                                                            variant="dangerBold"
                                                            size="md"
                                                        >
                                                            Lewat Jadwal
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-slate-500">
                                                    DP:{" "}
                                                    <span className="font-medium capitalize text-slate-700">
                                                        {session.payment_dp_status ?? "-"}
                                                    </span>
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Refund:{" "}
                                                    <span className="font-medium capitalize text-slate-700">
                                                        {session.refund_status ?? "-"}
                                                    </span>
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
