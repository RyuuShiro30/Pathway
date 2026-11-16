import React, { useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Button from "@/Components/ui/Button";
import Badge from "@/Components/ui/Badge";
import Card from "@/Components/ui/Card";

export default function NoShowReportShow({ report }) {
    const { flash, errors: pageErrors } = usePage().props;
    const [clientError, setClientError] = useState("");

    const isDecided =
        report.status === "berlaku" ||
        report.status === "ditolak" ||
        report.status === "tidak_berlaku" ||
        Boolean(report.decided_at);

    const isWaitingResponse = report.status === "menunggu_respons";
    const isDisputed = report.status === "disanggah";

    const isMenteeReported = report.reported_role === "student";

    const { data, setData, patch, processing, errors } = useForm({
        decision: "valid",
        admin_note: report.admin_note || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedNote = (data.admin_note || "").trim();
        if (trimmedNote.length < 5) {
            setClientError("Catatan keputusan wajib diisi minimal 5 karakter.");
            return;
        }
        setClientError("");

        const actionText =
            data.decision === "valid"
                ? "MENYETUJUI laporan (laporan valid & terapkan sanksi)"
                : "MENOLAK laporan (tanpa sanksi)";

        const confirmed = window.confirm(
            `Apakah Anda yakin ingin ${actionText}?\n\nTindakan ini akan menetapkan status laporan dan sanksi terkait secara permanen.`
        );

        if (!confirmed) {
            return;
        }

        patch(`/admin/no-show-reports/${report.id}/decide`);
    };

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
            <Head title={`Laporan No-Show #${report.id}`} />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <Link
                                href="/admin/no-show-reports"
                                className="text-sm font-medium text-[#6594B1] hover:underline"
                            >
                                ← Kembali ke Daftar Laporan No-Show
                            </Link>
                            <h1 className="mt-1 text-2xl font-bold text-slate-900">
                                Pemeriksaan Laporan No-Show — Laporan #{report.id}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {getStatusBadge(report.status)}
                            {report.session?.mentor?.email && (
                                <Link
                                    href={`/admin/mentors?search=${encodeURIComponent(
                                        report.session.mentor.email
                                    )}`}
                                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                                >
                                    Profil Mentor ↗
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {(flash?.error || pageErrors?.report || pageErrors?.session) && (
                        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
                            {flash?.error || pageErrors?.report || pageErrors?.session}
                        </div>
                    )}

                    {/* Ringkasan Sesi & Pihak Terlibat */}
                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Detail Sesi */}
                        <Card className="p-6">
                            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                                Detail Sesi Mentoring #{report.session_id}
                            </h2>
                            <dl className="mt-4 space-y-2.5 text-sm">
                                <div className="flex items-center justify-between">
                                    <dt className="text-slate-500">Status Sesi</dt>
                                    <dd className="font-semibold text-slate-800 capitalize">
                                        {report.session?.status ?? "-"}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Jadwal Sesi</dt>
                                    <dd className="font-medium text-slate-800">
                                        {report.session?.schedule_time ?? "-"}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Tipe Sesi</dt>
                                    <dd className="font-medium text-slate-800">
                                        {report.session?.is_free_session ? "Sesi Gratis" : "Sesi Berbayar"}
                                    </dd>
                                </div>
                                {!report.session?.is_free_session && (
                                    <>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Nominal DP (50%)</dt>
                                            <dd className="font-bold text-slate-900">
                                                Rp {Number(report.session?.dp_amount ?? 0).toLocaleString("id-ID")}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Status Pembayaran DP</dt>
                                            <dd className="font-medium text-slate-800 capitalize">
                                                {report.session?.payment_dp_status ?? "-"}
                                            </dd>
                                        </div>
                                        {report.session?.refund_status && (
                                            <div className="flex justify-between">
                                                <dt className="text-slate-500">Status Refund</dt>
                                                <dd className="font-medium text-amber-600 capitalize">
                                                    {report.session.refund_status}
                                                </dd>
                                            </div>
                                        )}
                                    </>
                                )}
                            </dl>
                        </Card>

                        {/* Pihak Terlibat */}
                        <Card className="p-6">
                            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                                Pihak Terlibat & Linimasa
                            </h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <dt className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                            Pelapor
                                        </dt>
                                        <dd className="font-semibold text-slate-800 mt-0.5">
                                            {report.reporter?.name ?? "Tidak Diketahui"}
                                        </dd>
                                        <dd className="text-xs text-slate-400">
                                            {report.reporter?.email ?? "-"}
                                        </dd>
                                    </div>
                                    <div className="mt-1">
                                        {getRoleBadge(report.reporter_role)}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 flex items-start justify-between">
                                    <div>
                                        <dt className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                            Terlapor (Diduga No-Show)
                                        </dt>
                                        <dd className="font-semibold text-slate-800 mt-0.5">
                                            {report.reported_user?.name ?? "Tidak Diketahui"}
                                        </dd>
                                        <dd className="text-xs text-slate-400">
                                            {report.reported_user?.email ?? "-"}
                                        </dd>
                                    </div>
                                    <div className="mt-1">
                                        {getRoleBadge(report.reported_role)}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Laporan Diajukan:</span>
                                        <span className="font-medium text-slate-700">
                                            {report.created_at ?? "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Batas Waktu Respons:</span>
                                        <span className="font-medium text-amber-700">
                                            {report.respond_deadline ?? "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Waktu Ditanggapi:</span>
                                        <span className="font-medium text-slate-700">
                                            {report.responded_at ?? "Belum ada tanggapan"}
                                        </span>
                                    </div>
                                </div>
                            </dl>
                        </Card>
                    </div>

                    {/* Bukti & Keterangan Kedua Belah Pihak */}
                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* 1. Keterangan & Bukti Pelapor */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">
                                        1. Bukti & Laporan Pelapor
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Diajukan oleh {report.reporter?.name} (
                                        {report.reporter_role === "student" ? "Mentee" : "Mentor"})
                                    </p>
                                </div>
                                {getRoleBadge(report.reporter_role)}
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Keterangan Pelapor
                                </label>
                                <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-800 whitespace-pre-line">
                                    {report.reporter_note || "Tidak ada catatan pelapor."}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Screenshot Bukti Ketidakhadiran
                                </label>
                                {report.evidence_url ? (
                                    <div className="mt-2">
                                        <a
                                            href={report.evidence_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block group"
                                        >
                                            <img
                                                src={report.evidence_url}
                                                alt="Bukti Screenshot Pelapor"
                                                className="max-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain transition group-hover:opacity-95"
                                            />
                                            <p className="mt-2 text-center text-xs text-[#6594B1] group-hover:underline">
                                                Buka gambar ukuran penuh ↗
                                            </p>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="mt-2 flex h-48 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                                        Tidak ada bukti gambar terunggah
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* 2. Sanggahan & Bukti Terlapor */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">
                                        2. Sanggahan Terlapor
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Oleh {report.reported_user?.name} (
                                        {report.reported_role === "student" ? "Mentee" : "Mentor"})
                                    </p>
                                </div>
                                {getRoleBadge(report.reported_role)}
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Keterangan Sanggahan
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        {report.responded_at ? `Ditanggapi: ${report.responded_at}` : ""}
                                    </span>
                                </div>
                                <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-800 whitespace-pre-line">
                                    {report.response_note ||
                                        (isWaitingResponse
                                            ? "Terlapor belum memberikan sanggahan (menunggu respons)."
                                            : "Terlapor tidak memberikan sanggahan.")}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Screenshot Bukti Sanggahan
                                </label>
                                {report.response_evidence_url ? (
                                    <div className="mt-2">
                                        <a
                                            href={report.response_evidence_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block group"
                                        >
                                            <img
                                                src={report.response_evidence_url}
                                                alt="Bukti Sanggahan Terlapor"
                                                className="max-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain transition group-hover:opacity-95"
                                            />
                                            <p className="mt-2 text-center text-xs text-[#6594B1] group-hover:underline">
                                                Buka gambar ukuran penuh ↗
                                            </p>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="mt-2 flex h-48 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                                        {isWaitingResponse
                                            ? "Menunggu sanggahan dari terlapor"
                                            : "Terlapor tidak menyertakan bukti gambar"}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Section Keputusan: Form Aktif vs Ringkasan Hasil Keputusan */}
                    {isDecided ? (
                        <Card className="p-6">
                            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Hasil Keputusan Admin
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Laporan ini telah diputuskan dan ditutup. Form keputusan dinonaktifkan.
                                    </p>
                                </div>
                                <div>{getStatusBadge(report.status)}</div>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div
                                    className={`rounded-xl border p-4 ${
                                        report.status === "berlaku"
                                            ? "border-emerald-200 bg-emerald-50/70"
                                            : "border-slate-200 bg-slate-50/70"
                                    }`}
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Hasil Keputusan
                                    </p>
                                    <p
                                        className={`mt-1 text-base font-bold ${
                                            report.status === "berlaku"
                                                ? "text-emerald-800"
                                                : "text-slate-800"
                                        }`}
                                    >
                                        {report.status === "berlaku"
                                            ? "Laporan Valid (Sanksi Diterapkan)"
                                            : report.status === "ditolak"
                                            ? "Laporan Ditolak (Tanpa Sanksi)"
                                            : `Status: ${report.status}`}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {report.status === "berlaku"
                                            ? isMenteeReported
                                                ? "Sanksi diterapkan: Sesi dibatalkan otomatis dan DP mentee hangus."
                                                : "Sanksi diterapkan: Sesi dibatalkan otomatis dan mentor wajib mengembalikan refund DP ke mentee."
                                            : "Laporan ditolak, tidak ada pembatalan sanksi pada sesi mentoring."}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Informasi Peninjau
                                    </p>
                                    <div className="mt-1.5 space-y-1 text-xs text-slate-700">
                                        <p>
                                            <span className="text-slate-500">Diputuskan Oleh:</span>{" "}
                                            <strong className="text-slate-800">
                                                {report.decided_by?.name ?? "Admin"}
                                            </strong>
                                            {report.decided_by?.email && (
                                                <span className="text-slate-400">
                                                    {" "}
                                                    ({report.decided_by.email})
                                                </span>
                                            )}
                                        </p>
                                        <p>
                                            <span className="text-slate-500">Waktu Keputusan:</span>{" "}
                                            <span className="font-medium text-slate-800">
                                                {report.decided_at ?? report.finalized_at ?? "-"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Catatan Keputusan Admin
                                </label>
                                <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-line">
                                    {report.admin_note || "Tidak ada catatan admin."}
                                </div>
                            </div>
                        </Card>
                    ) : isDisputed ? (
                        <Card className="p-6">
                            <form onSubmit={handleSubmit}>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Penetapan Keputusan Admin
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Bandingkan bukti screenshot pelapor dan sanggahan terlapor di atas sebelum menetapkan keputusan.
                                    </p>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Pilihan 1: Valid */}
                                    <label
                                        className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                                            data.decision === "valid"
                                                ? "border-emerald-500 bg-emerald-50/60"
                                                : "border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-start">
                                            <input
                                                type="radio"
                                                name="decision"
                                                value="valid"
                                                checked={data.decision === "valid"}
                                                onChange={(e) => setData("decision", e.target.value)}
                                                className="mt-0.5 mr-3 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <div>
                                                <span className="font-bold text-emerald-800">
                                                    Laporan valid (terapkan sanksi)
                                                </span>
                                                <div className="mt-2 text-xs text-slate-600 space-y-1">
                                                    <p className="font-medium text-slate-700">Dampak Sanksi:</p>
                                                    {isMenteeReported ? (
                                                        <p className="text-rose-700">
                                                            • <strong>Mentee no-show</strong>: Sesi dibatalkan otomatis dan <strong>DP hangus</strong> (tidak ada pengembalian dana).
                                                        </p>
                                                    ) : (
                                                        <p className="text-amber-800">
                                                            • <strong>Mentor no-show</strong>: Sesi dibatalkan otomatis dan <strong>wajib refund DP</strong> kepada mentee (batas waktu 48 jam).
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-slate-500">
                                                        Status laporan berubah menjadi <strong>Berlaku</strong>.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Pilihan 2: Tolak */}
                                    <label
                                        className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                                            data.decision === "ditolak"
                                                ? "border-rose-500 bg-rose-50/60"
                                                : "border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-start">
                                            <input
                                                type="radio"
                                                name="decision"
                                                value="ditolak"
                                                checked={data.decision === "ditolak"}
                                                onChange={(e) => setData("decision", e.target.value)}
                                                className="mt-0.5 mr-3 text-rose-600 focus:ring-rose-500"
                                            />
                                            <div>
                                                <span className="font-bold text-rose-800">
                                                    Tolak laporan (tanpa sanksi)
                                                </span>
                                                <div className="mt-2 text-xs text-slate-600 space-y-1">
                                                    <p className="font-medium text-slate-700">Dampak Keputusan:</p>
                                                    <p>
                                                        • Sanggahan terlapor diterima / bukti pelapor tidak mencukupi.
                                                    </p>
                                                    <p>
                                                        • <strong>Tanpa sanksi</strong>: Sesi mentoring tidak dikenakan sanksi no-show.
                                                    </p>
                                                    <p className="text-[11px] text-slate-500">
                                                        Status laporan berubah menjadi <strong>Ditolak</strong>.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="mt-5">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Catatan Keputusan Admin <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Wajib diisi minimal 5 karakter sebagai penjelasan alasan penetapan keputusan.
                                    </p>
                                    <textarea
                                        rows="3"
                                        value={data.admin_note}
                                        onChange={(e) => {
                                            setData("admin_note", e.target.value);
                                            if (clientError && e.target.value.trim().length >= 5) {
                                                setClientError("");
                                            }
                                        }}
                                        placeholder="Tuliskan pertimbangan admin terhadap bukti dan sanggahan yang diajukan (minimal 5 karakter)..."
                                        className="mt-1.5 w-full rounded-xl border-slate-300 text-sm focus:border-[#6594B1] focus:ring-[#6594B1]"
                                    />
                                    {(clientError || errors.admin_note) && (
                                        <p className="mt-1 text-xs font-medium text-red-600">
                                            {clientError || errors.admin_note}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        disabled={processing}
                                    >
                                        {processing ? "Menyimpan Keputusan..." : "Simpan Keputusan"}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    ) : (
                        <Card className="p-6">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⏳</span>
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">
                                        Menunggu Tanggapan Terlapor
                                    </h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Laporan ini berstatus <strong>Menunggu Respons</strong>. Pihak terlapor diberi kesempatan menyanggah hingga{" "}
                                        <strong className="text-amber-700">{report.respond_deadline ?? "24 jam"}</strong>.
                                        Admin baru dapat mengambil keputusan setelah laporan disanggah atau setelah batas waktu terlewati.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
