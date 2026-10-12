import React from "react";

export default function Show({ mentor }) {
    return (
        <div className="min-h-screen bg-[#F6F4EF] py-10">
            <div className="mx-auto w-full px-28">
                {/* Kembali */}
                <a
                    href="/mentors"
                    className="inline-flex items-center text-sm font-medium text-[#6F7A73] transition hover:text-[#6594B1]"
                >
                    ← Kembali ke Direktori Mentor
                </a>

                {/* Header Profil */}
                <div className="mt-5 rounded-[16px] border border-[#E8E5DD] bg-white p-7 shadow-sm">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#E6EFF4] text-2xl font-bold text-[#6594B1]">
                                {mentor.user.name?.charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-[#26302B]">
                                    {mentor.user.name}
                                </h1>

                                <p className="mt-1 text-sm text-[#6F7A73]">
                                    {mentor.expertise}
                                </p>
                            </div>
                        </div>

                        <span className="inline-flex w-fit items-center rounded-full bg-[#EAF5E1] px-3.5 py-2 text-sm font-semibold text-[#5C6F2B]">
                            ✓ Terverifikasi
                        </span>
                    </div>
                </div>

                {/* Isi Detail */}
                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
                    {/* Kolom Kiri */}
                    <div className="space-y-5">
                        {/* Tentang Mentor */}
                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-[#26302B]">
                                Tentang Mentor
                            </h2>

                            <p className="mt-3 text-sm leading-7 text-[#6F7A73]">
                                {mentor.bio || "Belum ada bio mentor."}
                            </p>
                        </div>

                        {/* Portfolio */}
                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-[#26302B]">
                                Portfolio
                            </h2>

                            {mentor.portfolio_url ? (
                                <a
                                    href={mentor.portfolio_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center rounded-[10px] bg-[#E6EFF4] px-4 py-2.5 text-sm font-semibold text-[#6594B1] transition hover:bg-[#6594B1] hover:text-white"
                                >
                                    Lihat Portfolio →
                                </a>
                            ) : (
                                <p className="mt-3 text-sm text-[#6F7A73]">
                                    Belum ada portfolio.
                                </p>
                            )}
                        </div>

                        {/* Sertifikat / Bukti Pengalaman */}
                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-[#26302B]">
                                Sertifikat / Bukti Pengalaman
                            </h2>

                            <div className="mt-2 space-y-2">
                                {mentor.certificates?.length > 0 ? (
                                    mentor.certificates.map((certificate) => (
                                        <div
                                            key={certificate.id}
                                            className="flex items-center justify-between gap-3 rounded-[7px] bg-[#F4F3EE] px-3 py-2"
                                        >
                                            <p className="truncate text-[10px] font-semibold text-[#26302B]">
                                                {certificate.file_name}
                                            </p>

                                            <a
                                                href={`/storage/${certificate.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 rounded-[6px] border border-[#E8E5DD] bg-white px-3 py-1.5 text-[9px] font-semibold text-[#26302B] transition hover:bg-[#6594B1] hover:text-white"
                                            >
                                                Lihat Sertifikat
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div className="mt-4 rounded-[12px] bg-[#F4F3EE] p-4">
                                        <p className="text-sm text-[#6F7A73]">
                                            Belum ada sertifikat atau bukti
                                            pengalaman.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Review Mentor */}
                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-[#26302B]">
                                    Review Mentor
                                </h2>

                                <span className="text-sm font-semibold text-[#6F7A73]">
                                    ⭐ {mentor.avg_rating}
                                </span>
                            </div>

                            <div className="mt-4 rounded-[12px] bg-[#F4F3EE] p-4">
                                <p className="text-sm text-[#6F7A73]">
                                    Belum ada review yang ditampilkan.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan */}
                    <div>
                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-[#26302B]">
                                Informasi Mentoring
                            </h2>

                            <div className="mt-5 space-y-4">
                                {/* Rating */}
                                <div>
                                    <p className="text-xs font-medium text-[#6F7A73]">
                                        Rating
                                    </p>
                                    <p className="mt-1 text-base font-semibold text-[#26302B]">
                                        ⭐ {mentor.avg_rating}
                                    </p>
                                </div>

                                {/* Jenis */}
                                <div>
                                    <p className="text-xs font-medium text-[#6F7A73]">
                                        Jenis Mentoring
                                    </p>
                                    <p className="mt-1 text-base font-semibold text-[#26302B]">
                                        {mentor.mentor_type === "free"
                                            ? "Gratis"
                                            : "Berbayar"}
                                    </p>
                                </div>

                                {/* Harga */}
                                {mentor.mentor_type === "paid" && (
                                    <div>
                                        <p className="text-xs font-medium text-[#6F7A73]">
                                            Harga per sesi
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-[#26302B]">
                                            Rp
                                            {Number(
                                                mentor.price_per_session,
                                            ).toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                )}

                                {/* Availability */}
                                <div>
                                    <p className="text-xs font-medium text-[#6F7A73]">
                                        Ketersediaan
                                    </p>

                                    <span
                                        className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                            mentor.is_available
                                                ? "bg-[#EAF5E1] text-[#5C6F2B]"
                                                : "bg-[#F8EEF6] text-[#8A4A80]"
                                        }`}
                                    >
                                        {mentor.is_available
                                            ? "Tersedia"
                                            : "Tidak tersedia"}
                                    </span>
                                </div>
                            </div>

                            {/* Pilih Mentor */}
                            <div className="mt-6 border-t border-[#E8E5DD] pt-6">
                                <button
                                    type="button"
                                    className="w-full rounded-[10px] bg-[#6594B1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#557F99]"
                                >
                                    Pilih Mentor
                                </button>

                                <p className="mt-3 text-center text-xs leading-5 text-[#6F7A73]">
                                    Pilih mentor untuk melanjutkan ke proses
                                    mentoring.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
