import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Button from "@/Components/ui/Button";
import Badge from "@/Components/ui/Badge";
import Card from "@/Components/ui/Card";
import EmptyState from "@/Components/ui/EmptyState";

export default function NoShowReportIndex({
    reports = [],
    currentStatus = "disanggah",
    counts = {},
}) {
    const { flash, errors } = usePage().props;

    const totalAll =
        (counts?.disanggah ?? 0) +
        (counts?.berlaku ?? 0) +
        (counts?.ditolak ?? 0) +
        (counts?.menunggu_respons ?? 0) +
        (counts?.tidak_berlaku ?? 0);

    const tabs = [
        { key: "disanggah", label: `Disanggah (${counts?.disanggah ?? 0})` },
        { key: "berlaku", label: `Berlaku (${counts?.berlaku ?? 0})` },
        { key: "ditolak", label: `Ditolak (${counts?.ditolak ?? 0})` },
        { key: "semua", label: `Semua (${totalAll})` },
    ];

    const getStatusBadge = (status) => {
        switch (status) {
            case "disanggah":
                return (
                    <Badge variant="warningBold" size="md">
                        Disanggah
                    </Badge>
                );
            case "berlaku":
                return (
                    <Badge variant="danger" size="md">
                        Berlaku (Sanksi)
                    </Badge>
                );
            case "ditolak":
                return (
                    <Badge variant="neutral" size="md">
                        Ditolak
                    </Badge>
                );
            case "menunggu_respons":
                return (
                    <Badge variant="primary" size="md">
                        Menunggu Respons
                    </Badge>
                );
            case "tidak_berlaku":
                return (
                    <Badge variant="default" size="md">
                        Tidak Berlaku
                    </Badge>
                );
            default:
                return (
                    <Badge variant="default" size="md" className="capitalize">
                        {status}
                    </Badge>
                );
        }
    };

    const getRoleBadge = (role) => {
        if (role === "student") {
            return (
                <Badge variant="neutral" size="xs">
                    Mentee
                </Badge>
            );
        }
        if (role === "mentor") {
            return (
                <Badge variant="primary" size="xs">
                    Mentor
                </Badge>
            );
        }
        return (
            <Badge variant="default" size="xs">
                -
            </Badge>
        );
    };

    return (
        <AdminLayout>
            <Head title="Laporan No-Show" />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Pemeriksaan Laporan No-Show
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Tinjau laporan ketidakhadiran, bukti screenshot, sanggahan pihak terlapor, dan tetapkan keputusan sanksi.
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

                    {(flash?.error || errors?.report) && (
                        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
                            {flash?.error || errors?.report}
                        </div>
                    )}

                    <div className="mb-6 flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        "/admin/no-show-reports",
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

                    <Card className="overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">ID & Pelapor</th>
                                    <th className="px-6 py-4">Nama Terlapor</th>
                                    <th className="px-6 py-4">Peran Terlapor</th>
                                    <th className="px-6 py-4">Jadwal Sesi</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Waktu Laporan</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12">
                                            <EmptyState message="Tidak ada data laporan no-show pada kategori ini." />
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-900">
                                                        #{item.id}
                                                    </span>
                                                    {getRoleBadge(item.reporter_role)}
                                                </div>
                                                <p className="mt-1 font-medium text-slate-800">
                                                    {item.reporter?.name ?? "Tidak Diketahui"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {item.reporter?.email ?? "-"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {item.reported_user?.name ?? "Tidak Diketahui"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {item.reported_user?.email ?? "-"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(item.reported_role)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">
                                                <p className="font-medium">
                                                    {item.session?.schedule_time ?? "-"}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Sesi #{item.session_id}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(item.status)}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {item.created_at ?? "-"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    href={`/admin/no-show-reports/${item.id}`}
                                                    variant="secondary"
                                                    size="xs"
                                                >
                                                    Tinjau →
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
