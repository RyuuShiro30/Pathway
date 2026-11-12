import React, { useState } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";

export default function MentorIndex({ mentors, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || "");
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [modalAction, setModalAction] = useState(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        reason: "",
        note: "",
    });

    const handleFilter = (status) => {
        router.get("/admin/mentors", { status, search }, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get("/admin/mentors", { status: filters.status, search }, { preserveState: true });
    };

    const handleVerify = (mentorId, verificationStatus) => {
        router.patch(`/admin/mentors/${mentorId}/verify`, {
            verification_status: verificationStatus,
        });
    };

    const openActionModal = (mentor, action) => {
        reset();
        setSelectedMentor(mentor);
        setModalAction(action);
    };

    const submitAction = (e) => {
        e.preventDefault();
        if (!selectedMentor) return;

        const endpoint =
            modalAction === "suspend"
                ? `/admin/mentors/${selectedMentor.id}/suspend`
                : `/admin/mentors/${selectedMentor.id}/unsuspend`;

        post(endpoint, {
            onSuccess: () => {
                setSelectedMentor(null);
                setModalAction(null);
                reset();
            },
        });
    };

    const statusTabs = [
        { key: "semua", label: "Semua Mentor" },
        { key: "pending", label: "Perlu Verifikasi" },
        { key: "approved", label: "Terverifikasi" },
        { key: "suspended", label: "Disuspend" },
    ];

    return (
        <AdminLayout>
            <Head title="Kelola Mentor" />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Kelola Mentor</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Verifikasi pengajuan mentor serta kelola status suspend akun mentor.
                        </p>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleFilter(tab.key)}
                                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                                        filters.status === tab.key
                                            ? "bg-[#6594B1] text-white shadow-sm"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, email, bidang..."
                                className="rounded-xl border-slate-200 text-sm focus:border-[#6594B1] focus:ring-[#6594B1]"
                            />
                            <button
                                type="submit"
                                className="rounded-xl bg-[#6594B1] px-4 py-2 text-sm font-medium text-white hover:bg-[#557F99]"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Mentor</th>
                                    <th className="px-6 py-4">Keahlian</th>
                                    <th className="px-6 py-4">Tarif / Sesi</th>
                                    <th className="px-6 py-4">Verifikasi</th>
                                    <th className="px-6 py-4">Status Akun</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mentors.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                                            Data mentor tidak ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    mentors.map((mentor) => (
                                        <tr key={mentor.id} className="hover:bg-slate-50/70">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">{mentor.name}</p>
                                                <p className="text-xs text-slate-400">{mentor.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-700">{mentor.expertise || "-"}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                Rp {Number(mentor.price_per_session || 0).toLocaleString("id-ID")}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                                        mentor.verification_status === "approved"
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : mentor.verification_status === "pending"
                                                            ? "bg-amber-50 text-amber-700"
                                                            : "bg-red-50 text-red-700"
                                                    }`}
                                                >
                                                    {mentor.verification_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {mentor.is_suspended ? (
                                                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                                        Disuspend
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                        Aktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {mentor.verification_status === "pending" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerify(mentor.id, "approved")}
                                                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                        >
                                                            ACC
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVerify(mentor.id, "rejected")}
                                                            className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                                                        >
                                                            Tolak
                                                        </button>
                                                    </>
                                                )}

                                                {mentor.is_suspended ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openActionModal(mentor, "unsuspend")}
                                                        className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                                    >
                                                        Cabut Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => openActionModal(mentor, "suspend")}
                                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                                                    >
                                                        Suspend
                                                    </button>
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

            {selectedMentor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form
                        onSubmit={submitAction}
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <h3 className="text-lg font-bold text-slate-900">
                            {modalAction === "suspend"
                                ? `Suspend Mentor: ${selectedMentor.name}`
                                : `Cabut Suspend: ${selectedMentor.name}`}
                        </h3>

                        {modalAction === "suspend" && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700">
                                    Alasan Suspend <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.reason}
                                    onChange={(e) => setData("reason", e.target.value)}
                                    placeholder="Contoh: Pelanggaran SOP refund / tidak mengembalikan DP"
                                    className="mt-1 w-full rounded-xl border-slate-300 text-sm focus:border-[#6594B1] focus:ring-[#6594B1]"
                                />
                                {errors.reason && (
                                    <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
                                )}
                            </div>
                        )}

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700">
                                Catatan Tambahan (Opsional)
                            </label>
                            <textarea
                                rows="3"
                                value={data.note}
                                onChange={(e) => setData("note", e.target.value)}
                                className="mt-1 w-full rounded-xl border-slate-300 text-sm focus:border-[#6594B1] focus:ring-[#6594B1]"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedMentor(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                                    modalAction === "suspend"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                }`}
                            >
                                {processing ? "Memproses..." : "Konfirmasi"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}