import React, { useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Button from "@/Components/ui/Button";
import Badge from "@/Components/ui/Badge";
import EmptyState from "@/Components/ui/EmptyState";

export default function RefundReportIndex({ reports = [], currentStatus = "dilaporkan", counts = {} }) {
    const { flash, errors } = usePage().props;
    const [processingId, setProcessingId] = useState(null);

    const tabs = [
        { key: "dilaporkan", label: `Perlu Ditinjau (${counts?.dilaporkan ?? 0})` },
        { key: "menunggu_konfirmasi", label: `Menunggu Konfirmasi (${counts?.menunggu_konfirmasi ?? 0})` },
        { key: "menunggu", label: `Menunggu Upload Ulang (${counts?.menunggu ?? 0})` },
        { key: "selesai", label: `Selesai (${counts?.selesai ?? 0})` },
        { key: "semua", label: "Semua" },
    ];

    const getStatusBadge = (status) => {
        if (status === "dilaporkan") {
            return (
                <Badge variant="danger" size="md" className="capitalize">
                    {status}
                </Badge>
            );
        }
        if (status === "menunggu_konfirmasi") {
            return (
                <Badge variant="primary" size="md">
                    Menunggu Konfirmasi
                </Badge>
            );
        }
        if (status === "menunggu") {
            return (
                <Badge variant="warning" size="md" className="capitalize">
                    {status}
                </Badge>
            );
        }
        return (
            <Badge variant="success" size="md" className="capitalize">
                {status}
            </Badge>
        );
    };

    const handleRemind = (sessionId) => {
        setProcessingId(sessionId);
        router.post(
            `/admin/refund-reports/${sessionId}/remind`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            }
        );
    };

    return (
        <AdminLayout>
            <Head title="Laporan Refund" />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Pemeriksaan Laporan Refund
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Verifikasi bukti DP, slip transfer refund mentor, dan rekening tujuan mentee.
                            </p>
                        </div>

                        <Link
                            href="/admin/dashboard"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                        >
                            ← Kembali ke Dasbor
                        </Link>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {(flash?.error || errors?.session) && (
                        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
                            {flash?.error || errors?.session}
                        </div>
                    )}

                    <div className="mb-6 flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        "/admin/refund-reports",
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
                                    <th className="px-6 py-4">ID Sesi</th>
                                    <th className="px-6 py-4">Mentee</th>
                                    <th className="px-6 py-4">Mentor</th>
                                    <th className="px-6 py-4">Nominal DP</th>
                                    <th className="px-6 py-4">Status Refund</th>
                                    <th className="px-6 py-4">Batas Waktu</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12">
                                            <EmptyState message="Tidak ada data laporan refund pada kategori ini." />
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70">
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                #{item.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">{item.student.name}</p>
                                                <p className="text-xs text-slate-400">{item.student.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">{item.mentor.name}</p>
                                                <p className="text-xs text-slate-400">{item.mentor.email}</p>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                Rp {Number(item.dp_amount).toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(item.refund_status)}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {item.refund_status === "menunggu_konfirmasi" ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">
                                                            {item.remaining_time ? `Sisa: ${item.remaining_time}` : "-"}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400">
                                                            Auto-konfirmasi 48 jam
                                                        </span>
                                                    </div>
                                                ) : (
                                                    item.refund_deadline ?? "-"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.refund_status === "menunggu_konfirmasi" && (
                                                        item.can_remind ? (
                                                            <Button
                                                                type="button"
                                                                variant="primary"
                                                                size="xs"
                                                                onClick={() => handleRemind(item.id)}
                                                                disabled={processingId === item.id}
                                                            >
                                                                {processingId === item.id ? "Mengirim..." : "Ingatkan Mentee"}
                                                            </Button>
                                                        ) : (
                                                            <div className="inline-flex flex-col items-end">
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="xs"
                                                                    disabled
                                                                    title="Pengingat sudah dikirim dalam 24 jam terakhir"
                                                                >
                                                                    Ingatkan Mentee
                                                                </Button>
                                                                <span className="mt-0.5 text-[10px] font-medium text-amber-600">
                                                                    Belum 24 jam
                                                                </span>
                                                            </div>
                                                        )
                                                    )}

                                                    <Button
                                                        href={`/admin/refund-reports/${item.id}`}
                                                        variant="secondary"
                                                        size="xs"
                                                    >
                                                        Periksa Bukti →
                                                    </Button>
                                                </div>
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
