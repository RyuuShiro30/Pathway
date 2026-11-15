import React, { useState } from "react";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Button from "@/Components/ui/Button";
import Badge from "@/Components/ui/Badge";

export default function RefundReportShow({ report }) {
    const { flash, errors: pageErrors } = usePage().props;
    const [isReminding, setIsReminding] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        decision: "valid",
        admin_note: report.refund_admin_note || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(`/admin/refund-reports/${report.id}/decide`);
    };

    const handleRemind = () => {
        setIsReminding(true);
        router.post(
            `/admin/refund-reports/${report.id}/remind`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsReminding(false),
            }
        );
    };

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

    return (
        <AdminLayout>
            <Head title={`Periksa Refund #${report.id}`} />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <Link
                                href="/admin/refund-reports"
                                className="text-sm font-medium text-[#6594B1] hover:underline"
                            >
                                ← Kembali ke Daftar Laporan Refund
                            </Link>
                            <h1 className="mt-1 text-2xl font-bold text-slate-900">
                                Pemeriksaan Laporan Refund — Sesi #{report.id}
                            </h1>
                        </div>

                        <Link
                            href={`/admin/mentors?search=${encodeURIComponent(report.mentor.email)}`}
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                        >
                            Kelola / Suspend Mentor (Tindakan Terpisah) ↗
                        </Link>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {(flash?.error || pageErrors?.session) && (
                        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
                            {flash?.error || pageErrors?.session}
                        </div>
                    )}

                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-base font-bold text-slate-800">
                                Informasi Sesi & Pembatalan
                            </h2>
                            <dl className="mt-4 space-y-2.5 text-sm">
                                <div className="flex items-center justify-between">
                                    <dt className="text-slate-500">Status Refund Saat Ini</dt>
                                    <dd>{getStatusBadge(report.refund_status)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Jadwal Sesi</dt>
                                    <dd className="font-medium text-slate-800">{report.schedule_time}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Nominal DP (50%)</dt>
                                    <dd className="font-bold text-slate-900">
                                        Rp {Number(report.dp_amount).toLocaleString("id-ID")}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Mentor</dt>
                                    <dd className="font-medium text-slate-800">{report.mentor.name}</dd>
                                </div>
                                {report.refund_deadline && (
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Batas Waktu Refund</dt>
                                        <dd className="font-semibold text-amber-600">{report.refund_deadline}</dd>
                                    </div>
                                )}
                                {report.refund_status === "menunggu_konfirmasi" && (
                                    <>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Bukti Diunggah</dt>
                                            <dd className="font-medium text-slate-800">
                                                {report.refund_proof_uploaded_at ?? "-"}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Sisa Waktu Auto-Konfirmasi</dt>
                                            <dd className="font-semibold text-sky-700">
                                                {report.remaining_time ?? "-"}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-slate-500">Pengingat Terakhir</dt>
                                            <dd className="text-slate-700">
                                                {report.refund_reminded_at ?? "Belum pernah diingatkan"}
                                            </dd>
                                        </div>
                                    </>
                                )}
                                <div className="border-t border-slate-100 pt-2">
                                    <dt className="text-slate-500">Alasan Pembatalan</dt>
                                    <dd className="mt-1 text-slate-700">{report.cancellation_reason || "-"}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-base font-bold text-slate-800">
                                Rekening Tujuan Refund (Mentee)
                            </h2>
                            <dl className="mt-4 space-y-2.5 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Nama Mentee</dt>
                                    <dd className="font-medium text-slate-800">{report.student.name}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Bank Tujuan</dt>
                                    <dd className="font-semibold text-slate-800">{report.student.bank_name}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Nomor Rekening</dt>
                                    <dd className="font-mono font-bold text-slate-900">
                                        {report.student.bank_account_number}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Atas Nama</dt>
                                    <dd className="font-medium text-slate-800">{report.student.bank_account_name}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-3 text-base font-bold text-slate-800">
                                1. Bukti Transfer DP (Mentee)
                            </h3>
                            {report.payment_dp_proof ? (
                                <a href={report.payment_dp_proof} target="_blank" rel="noreferrer">
                                    <img
                                        src={report.payment_dp_proof}
                                        alt="Bukti DP"
                                        className="max-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                                    />
                                    <p className="mt-2 text-center text-xs text-[#6594B1] hover:underline">
                                        Klik gambar untuk memperbesar ↗
                                    </p>
                                </a>
                            ) : (
                                <div className="flex h-48 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                                    Tidak ada bukti DP terunggah
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="mb-3 text-base font-bold text-slate-800">
                                2. Slip Transfer Refund (Mentor)
                            </h3>
                            {report.refund_proof ? (
                                <a href={report.refund_proof} target="_blank" rel="noreferrer">
                                    <img
                                        src={report.refund_proof}
                                        alt="Slip Refund"
                                        className="max-h-80 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain"
                                    />
                                    <p className="mt-2 text-center text-xs text-[#6594B1] hover:underline">
                                        Klik gambar untuk memperbesar ↗
                                    </p>
                                </a>
                            ) : (
                                <div className="flex h-48 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                                    Mentor belum mengunggah slip refund
                                </div>
                            )}
                        </div>
                    </div>

                    {report.refund_status === "menunggu_konfirmasi" ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Pengingat Konfirmasi Mentee
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Mentor telah mengunggah bukti refund DP dan sedang menunggu konfirmasi dari mentee.
                                        Sistem akan menyelesaikan refund secara otomatis jika tidak ada respons setelah 48 jam.
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-6 text-xs">
                                        <div>
                                            <span className="text-slate-500">Sisa Waktu Auto-Konfirmasi:</span>{" "}
                                            <span className="font-bold text-slate-800">
                                                {report.remaining_time ?? "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Pengingat Terakhir:</span>{" "}
                                            <span className="font-medium text-slate-700">
                                                {report.refund_reminded_at ?? "Belum pernah diingatkan"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0">
                                    {report.can_remind ? (
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="md"
                                            onClick={handleRemind}
                                            disabled={isReminding}
                                        >
                                            {isReminding ? "Mengirim Pengingat..." : "Ingatkan Mentee"}
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="md"
                                                disabled
                                                title="Pengingat sudah dikirim dalam 24 jam terakhir"
                                            >
                                                Ingatkan Mentee
                                            </Button>
                                            <span className="mt-1 text-xs font-medium text-amber-600">
                                                Belum 24 jam sejak pengingat terakhir
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : report.refund_status === "dilaporkan" ? (
                        <form
                            onSubmit={handleSubmit}
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <h2 className="text-lg font-bold text-slate-900">
                                Penetapan Keputusan Admin
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                SOP: Jika bukti valid, transaksi dinyatakan selesai. Jika bermasalah, status dikembalikan menjadi menunggu dengan batas waktu baru 48 jam.
                            </p>

                            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <label
                                    className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                                        data.decision === "valid"
                                            ? "border-emerald-500 bg-emerald-50/60"
                                            : "border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="decision"
                                        value="valid"
                                        checked={data.decision === "valid"}
                                        onChange={(e) => setData("decision", e.target.value)}
                                        className="mr-2 text-emerald-600"
                                    />
                                    <span className="font-bold text-emerald-800">
                                        Bukti Valid — Selesaikan Transaksi
                                    </span>
                                    <p className="mt-1 pl-5 text-xs text-slate-600">
                                        Nominal dan rekening tujuan sesuai. Status refund diubah menjadi <strong>selesai</strong>.
                                    </p>
                                </label>

                                <label
                                    className={`cursor-pointer rounded-xl border-2 p-4 transition ${
                                        data.decision === "bermasalah"
                                            ? "border-amber-500 bg-amber-50/60"
                                            : "border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="decision"
                                        value="bermasalah"
                                        checked={data.decision === "bermasalah"}
                                        onChange={(e) => setData("decision", e.target.value)}
                                        className="mr-2 text-amber-600"
                                    />
                                    <span className="font-bold text-amber-800">
                                        Bukti Bermasalah — Kembalikan ke Menunggu (+48 Jam)
                                    </span>
                                    <p className="mt-1 pl-5 text-xs text-slate-600">
                                        Slip buram/nominal kurang/rekening salah. Mentor diberi batas waktu baru <strong>48 jam</strong>.
                                    </p>
                                </label>
                            </div>

                            <div className="mt-5">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Catatan Keputusan Admin <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows="3"
                                    value={data.admin_note}
                                    onChange={(e) => setData("admin_note", e.target.value)}
                                    placeholder="Tuliskan hasil pemeriksaan bukti DP, slip refund, dan kesesuaian rekening..."
                                    className="mt-1.5 w-full rounded-xl border-slate-300 text-sm focus:border-[#6594B1] focus:ring-[#6594B1]"
                                />
                                {errors.admin_note && (
                                    <p className="mt-1 text-xs text-red-600">{errors.admin_note}</p>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    disabled={processing}
                                >
                                    {processing ? "Menyimpan..." : "Simpan Keputusan"}
                                </Button>
                            </div>
                        </form>
                    ) : null}
                </div>
            </div>
        </AdminLayout>
    );
}
