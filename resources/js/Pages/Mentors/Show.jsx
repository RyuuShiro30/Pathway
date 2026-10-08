import React from "react";

export default function Show({ mentor }) {
    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <div className="mx-auto max-w-4xl px-6">
                {/* Tombol kembali */}
                <a
                    href="/mentors"
                    className="text-sm text-gray-600 hover:underline"
                >
                    ← Kembali ke Direktori Mentor
                </a>

                {/* Profil Mentor */}
                <div className="mt-4 rounded-lg bg-white p-8 shadow">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">
                                {mentor.user.name}
                            </h1>

                            <p className="mt-2 text-gray-600">
                                {mentor.expertise}
                            </p>
                        </div>

                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                            Terverifikasi
                        </span>
                    </div>

                    {/* Tentang Mentor */}
                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Tentang Mentor
                        </h2>

                        <p className="mt-2 leading-relaxed text-gray-700">
                            {mentor.bio || "Belum ada bio mentor."}
                        </p>
                    </div>

                    {/* Informasi Mentoring */}
                    <div className="mt-8 border-t pt-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Informasi Mentoring
                        </h2>

                        <div className="mt-4 space-y-3 text-gray-700">
                            <p>
                                <strong>Rating:</strong> ⭐ {mentor.avg_rating}
                            </p>

                            <p>
                                <strong>Jenis Mentoring:</strong>{" "}
                                {mentor.mentor_type === "free"
                                    ? "Gratis"
                                    : "Berbayar"}
                            </p>

                            {mentor.mentor_type === "paid" && (
                                <p>
                                    <strong>Harga per sesi:</strong> Rp
                                    {Number(
                                        mentor.price_per_session,
                                    ).toLocaleString("id-ID")}
                                </p>
                            )}

                            <p>
                                <strong>Ketersediaan:</strong>{" "}
                                {mentor.is_available
                                    ? "Tersedia"
                                    : "Tidak tersedia"}
                            </p>
                        </div>
                    </div>

                    {/* Portfolio */}
                    <div className="mt-8 border-t pt-6">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Portfolio
                        </h2>

                        {mentor.portfolio_url ? (
                            <a
                                href={mentor.portfolio_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-block text-blue-600 hover:underline"
                            >
                                Lihat Portfolio →
                            </a>
                        ) : (
                            <p className="mt-2 text-gray-600">
                                Belum ada portfolio.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
