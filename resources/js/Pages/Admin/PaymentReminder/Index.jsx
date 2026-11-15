import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import EmptyState from "@/Components/ui/EmptyState";

export default function PaymentReminderIndex({
    reminders = [],
    counts = {},
    canRemindCount = 0,
}) {
    const { flash } = usePage().props;
    const [processingId, setProcessingId] = useState(null);
    const [isProcessingAll, setIsProcessingAll] = useState(false);

    const handleRemind = (sessionId) => {
        setProcessingId(sessionId);
        router.post(
            `/admin/payment-reminders/${sessionId}/remind`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            }
        );
    };

    const handleRemindAll = () => {
        if (canRemindCount === 0) return;

        const confirmed = window.confirm(
            `Kirim notifikasi pengingat pelunasan ke ${canRemindCount} mentee yang memenuhi syarat?`
        );

        if (confirmed) {
            setIsProcessingAll(true);
            router.post(
                "/admin/payment-reminders/remind-all",
                {},
                {
                    preserveScroll: true,
                    onFinish: () => setIsProcessingAll(false),
                }
            );
        }
    };

    const statusBadge = (status) => {
        if (status === "ditolak") {
            return (
                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 capitalize">
                    Ditolak
                </span>
            );
        }
        return (
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 capitalize">
                Belum Dibayar
            </span>
        );
    };

    return (
        <AdminLayout>
            <Head title="Pengingat Pelunasan" />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Pengingat Pelunasan
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Pantau pelunasan sisa 50% biaya sesi dan kirimkan notifikasi pengingat ke mentee.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleRemindAll}
                                disabled={canRemindCount === 0 || isProcessingAll}
                                className="inline-flex items-center rounded-xl bg-[#6594B1] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#557F99] transition disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isProcessingAll
                                    ? "Mengirim ke Semua..."
                                    : `Kirim ke Semua (${canRemindCount})`}
                            </button>

                            <Link
                                href="/admin/dashboard"
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                            >
                                ← Kembali ke Dasbor
                            </Link>
                        </div>
                    </div>

                    {/* Flash Message */}
                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {/* Ringkasan Jumlah */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Total Sesi Belum Lunas
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {counts?.total ?? reminders.length}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Sesi berlangsung / selesai
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                                Siap Diingatkan
                            </p>
                            <p className="mt-2 text-2xl font-bold text-emerald-800">
                                {canRemindCount}
                            </p>
                            <p className="mt-1 text-xs text-emerald-600">
                                Melewati jeda 24 jam
                            </p>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                                Belum Dibayar
                            </p>
                            <p className="mt-2 text-2xl font-bold text-amber-800">
                                {counts?.belum_dibayar ?? 0}
                            </p>
                            <p className="mt-1 text-xs text-amber-600">
                                Menunggu inisiatif murid
                            </p>
                        </div>

                        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
                                Pelunasan Ditolak
                            </p>
                            <p className="mt-2 text-2xl font-bold text-red-800">
                                {counts?.ditolak ?? 0}
                            </p>
                            <p className="mt-1 text-xs text-red-600">
                                Menunggu upload ulang bukti
                            </p>
                        </div>
                    </div>

                    {/* Tabel Daftar Pengingat */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">ID Sesi</th>
                                    <th className="px-6 py-4">Murid</th>
                                    <th className="px-6 py-4">Mentor</th>
                                    <th className="px-6 py-4">Jadwal Sesi</th>
                                    <th className="px-6 py-4">Sisa Pelunasan</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Terakhir Diingatkan</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reminders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12">
                                            <EmptyState
                                                message="Tidak ada sesi mentoring yang membutuhkan pengingat pelunasan."
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    reminders.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70">
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                #{item.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {item.student.name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {item.student.email}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {item.mentor.name}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {item.mentor.email}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600">
                                                {item.schedule_time ?? "-"}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                Rp {Number(item.final_amount).toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-6 py-4">
                                                {statusBadge(item.payment_final_status)}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {item.payment_final_reminded_at ?? "Belum pernah"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {item.can_remind ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemind(item.id)}
                                                        disabled={processingId === item.id}
                                                        className="inline-flex items-center rounded-lg bg-[#6594B1] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#557F99] transition disabled:opacity-50"
                                                    >
                                                        {processingId === item.id
                                                            ? "Mengirim..."
                                                            : "Kirim Pengingat"}
                                                    </button>
                                                ) : (
                                                    <div className="inline-flex flex-col items-end">
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="inline-flex cursor-not-allowed items-center rounded-lg bg-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-400"
                                                            title="Pengingat sudah dikirim dalam 24 jam terakhir"
                                                        >
                                                            Kirim Pengingat
                                                        </button>
                                                        <span className="mt-1 text-[11px] font-medium text-amber-600">
                                                            Belum 24 jam
                                                        </span>
                                                    </div>
                                                )}
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

