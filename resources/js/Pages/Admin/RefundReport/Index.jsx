import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";

export default function RefundReportIndex({ reports, currentStatus, counts }) {
    const tabs = [
        { key: "dilaporkan", label: `Perlu Ditinjau (${counts.dilaporkan})` },
        { key: "menunggu", label: `Menunggu Upload Ulang (${counts.menunggu})` },
        { key: "selesai", label: `Selesai (${counts.selesai})` },
        { key: "semua", label: "Semua" },
    ];

    const badgeStyle = (status) => {
        if (status === "dilaporkan") return "bg-red-50 text-red-700 border-red-200";
        if (status === "menunggu") return "bg-amber-50 text-amber-700 border-amber-200";
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
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
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                            ← Kembali ke Dasbor
                        </Link>
                    </div>

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
                                        <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                                            Tidak ada data laporan refund pada kategori ini.
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
                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badgeStyle(
                                                        item.refund_status
                                                    )}`}
                                                >
                                                    {item.refund_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {item.refund_deadline ?? "-"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/admin/refund-reports/${item.id}`}
                                                    className="inline-flex items-center rounded-lg bg-[#6594B1] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#557F99]"
                                                >
                                                    Periksa Bukti →
                                                </Link>
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