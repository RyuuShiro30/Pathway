
import React from "react";

export default function Show({ mentor }) {
    const reviews = mentor.reviews || [];
    const averageRating = Number(mentor.avg_rating || 0);
    const reviewCount = Number(mentor.reviews_count || reviews.length);

    return (
        <div className="min-h-screen bg-[#F6F4EF] py-10">
            <div className="mx-auto w-full px-6 md:px-12 xl:px-28">
                <a
                    href="/mentors"
                    className="inline-flex items-center text-sm font-medium text-[#6F7A73] transition hover:text-[#6594B1]"
                >
                    ← Kembali ke Direktori Mentor
                </a>

                <div className="mt-5 rounded-[16px] border border-[#E8E5DD] bg-white p-7 shadow-sm">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#E6EFF4] text-2xl font-bold text-[#6594B1]">
                                {mentor.user?.name?.charAt(0).toUpperCase() || "M"}
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-[#26302B]">
                                    {mentor.user?.name || "Mentor"}
                                </h1>

                                <p className="mt-1 text-sm text-[#6F7A73]">
                                    {mentor.expertise}
                                </p>

                                <p className="mt-2 text-sm font-semibold text-[#6F7A73]">
                                    ⭐ {averageRating.toFixed(1)} · {reviewCount} ulasan
                                </p>
                            </div>
                        </div>

                        <span className="inline-flex w-fit items-center rounded-full bg-[#EAF5E1] px-3.5 py-2 text-sm font-semibold text-[#5C6F2B]">
                            ✓ Terverifikasi
                        </span>
                    </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-5">
                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-[#26302B]">
                                Tentang Mentor
                            </h2>

                            <p className="mt-3 text-sm leading-7 text-[#6F7A73]">
                                {mentor.bio || "Belum ada bio mentor."}
                            </p>
                        </div>

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

                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-[#26302B]">
                                Sertifikat / Bukti Pengalaman
                            </h2>

                            <div className="mt-4 space-y-2">
                                {mentor.certificates?.length > 0 ? (
                                    mentor.certificates.map((certificate) => (
                                        <div
                                            key={certificate.id}
                                            className="flex items-center justify-between gap-3 rounded-[7px] bg-[#F4F3EE] px-3 py-2"
                                        >
                                            <p className="truncate text-sm font-semibold text-[#26302B]">
                                                {certificate.file_name}
                                            </p>

                                            <a
                                                href={`/storage/${certificate.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="shrink-0 rounded-[6px] border border-[#E8E5DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#26302B] transition hover:bg-[#6594B1] hover:text-white"
                                            >
                                                Lihat Sertifikat
                                            </a>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-[12px] bg-[#F4F3EE] p-4">
                                        <p className="text-sm text-[#6F7A73]">
                                            Belum ada sertifikat atau bukti pengalaman.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[#26302B]">
                                        Review Mentor
                                    </h2>

                                    <p className="mt-1 text-sm text-[#6F7A73]">
                                        Ulasan dari mahasiswa yang telah mengikuti mentoring.
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <p className="text-xl font-bold text-[#26302B]">
                                        ⭐ {averageRating.toFixed(1)} / 5
                                    </p>
                                    <p className="text-xs text-[#6F7A73]">
                                        {reviewCount} ulasan
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                {reviews.length > 0 ? (
                                    reviews.map((review) => (
                                        <div
                                            key={review.id}
                                            className="rounded-[12px] border border-[#E8E5DD] bg-[#FAF9F6] p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E6EFF4] font-bold text-[#6594B1]">
                                                        {review.student?.name
                                                            ?.charAt(0)
                                                            .toUpperCase() || "M"}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-semibold text-[#26302B]">
                                                            {review.student?.name || "Mahasiswa"}
                                                        </p>

                                                        <p className="text-xs text-[#6F7A73]">
                                                            {review.created_at
                                                                ? new Date(
                                                                      review.created_at
                                                                  ).toLocaleDateString("id-ID", {
                                                                      day: "numeric",
                                                                      month: "long",
                                                                      year: "numeric",
                                                                  })
                                                                : ""}
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="shrink-0 text-sm font-semibold text-[#8A6D20]">
                                                    {"★".repeat(
                                                        Math.min(
                                                            5,
                                                            Math.max(
                                                                0,
                                                                Number(review.rating) || 0
                                                            )
                                                        )
                                                    )}
                                                    {"☆".repeat(
                                                        5 -
                                                            Math.min(
                                                                5,
                                                                Math.max(
                                                                    0,
                                                                    Number(review.rating) || 0
                                                                )
                                                            )
                                                    )}
                                                </p>
                                            </div>

                                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#6F7A73]">
                                                {review.feedback || "Tidak ada komentar tertulis."}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-[12px] bg-[#F4F3EE] p-5">
                                        <p className="text-sm text-[#6F7A73]">
                                            Belum ada review untuk mentor ini. Setelah mahasiswa menyelesaikan sesi dan mengirimkan ulasan, ulasan akan tampil di sini.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="rounded-[16px] border border-[#E8E5DD] bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-[#26302B]">
                                Informasi Mentoring
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-[#6F7A73]">
                                        Rating
                                    </p>

                                    <p className="mt-1 text-base font-semibold text-[#26302B]">
                                        ⭐ {averageRating.toFixed(1)} / 5 ({reviewCount} ulasan)
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-[#6F7A73]">
                                        Jenis Mentoring
                                    </p>

                                    <p className="mt-1 text-base font-semibold text-[#26302B]">
                                        {mentor.mentor_type === "free" ? "Gratis" : "Berbayar"}
                                    </p>
                                </div>

                                {mentor.mentor_type === "paid" && (
                                    <div>
                                        <p className="text-xs font-medium text-[#6F7A73]">
                                            Harga per sesi
                                        </p>

                                        <p className="mt-1 text-lg font-bold text-[#26302B]">
                                            Rp
                                            {Number(
                                                mentor.price_per_session
                                            ).toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                )}

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
                                        {mentor.is_available ? "Tersedia" : "Tidak tersedia"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-[#E8E5DD] pt-6">
                                <a
                                    href={`/mentors/${mentor.user_id}/booking`}
                                    className="flex w-full items-center justify-center rounded-[10px] bg-[#6594B1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#557F99]"
                                >
                                    Pilih Mentor
                                </a>

                                <p className="mt-3 text-center text-xs leading-5 text-[#6F7A73]">
                                    Pilih mentor untuk melanjutkan ke proses mentoring.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
