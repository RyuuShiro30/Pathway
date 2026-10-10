import React, { useState } from "react";
import { useForm } from "@inertiajs/react";

export default function Index({
    mentors,
    search,
    expertise,
    expertises,
    availability,
    mentorType,
    minPrice,
    maxPrice,
    minRating,
}) {
    const { data, setData, get } = useForm({
        search: search || "",
        expertise: expertise || "",
        availability: availability || "",
        mentor_type: mentorType || "",
        min_price: minPrice || "",
        max_price: maxPrice || "",
        min_rating: minRating || "",
    });

    const [showPriceFilter, setShowPriceFilter] = useState(false);

    // Menjalankan pencarian dan filter
    const handleSearch = (e) => {
        e.preventDefault();

        get("/mentors", {
            preserveState: true,
        });
    };

    // Menerapkan filter harga
    const handleApplyPrice = () => {
        setShowPriceFilter(false);

        get("/mentors", {
            preserveState: true,
        });
    };

    // Menghapus semua pencarian dan filter
    const handleReset = () => {
        setData({
            search: "",
            expertise: "",
            availability: "",
            mentor_type: "",
            min_price: "",
            max_price: "",
            min_rating: "",
        });

        setShowPriceFilter(false);

        get("/mentors", {
            preserveState: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <div className="mx-auto max-w-7xl px-6">
                {/* Judul halaman */}
                <h1 className="text-3xl font-bold text-gray-800">
                    Direktori Mentor
                </h1>

                <p className="mt-2 text-gray-600">
                    Temukan mentor yang sesuai dengan kebutuhan belajar kamu.
                </p>

                {/* Form pencarian dan filter */}
                <form
                    onSubmit={handleSearch}
                    className="mt-6 flex flex-wrap gap-3"
                >
                    {/* Pencarian nama */}
                    <input
                        type="text"
                        value={data.search}
                        onChange={(e) => setData("search", e.target.value)}
                        placeholder="Cari nama mentor..."
                        className="min-w-[220px] flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-gray-500 focus:outline-none"
                    />

                    {/* Filter expertise */}
                    <select
                        value={data.expertise}
                        onChange={(e) => setData("expertise", e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-gray-500 focus:outline-none"
                    >
                        <option value="">Semua Expertise</option>

                        {expertises.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    {/* Filter ketersediaan */}
                    <select
                        value={data.availability}
                        onChange={(e) =>
                            setData("availability", e.target.value)
                        }
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-gray-500 focus:outline-none"
                    >
                        <option value="">Semua Status</option>
                        <option value="1">Tersedia</option>
                        <option value="0">Tidak tersedia</option>
                    </select>

                    {/* Filter jenis mentoring */}
                    <select
                        value={data.mentor_type}
                        onChange={(e) => setData("mentor_type", e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-gray-500 focus:outline-none"
                    >
                        <option value="">Semua Jenis</option>
                        <option value="free">Gratis</option>
                        <option value="paid">Berbayar</option>
                    </select>

                    {/* Filter harga */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPriceFilter(!showPriceFilter)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                            Harga {showPriceFilter ? "▲" : "▼"}
                        </button>

                        {showPriceFilter && (
                            <div className="absolute left-0 top-full z-10 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                                <p className="mb-3 font-medium text-gray-800">
                                    Rentang Harga
                                </p>

                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.min_price}
                                        onChange={(e) =>
                                            setData("min_price", e.target.value)
                                        }
                                        placeholder="Minimum"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        value={data.max_price}
                                        onChange={(e) =>
                                            setData("max_price", e.target.value)
                                        }
                                        placeholder="Maksimum"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleApplyPrice}
                                    className="mt-3 w-full rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                                >
                                    Terapkan
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filter Rating */}
                    <select
                        value={data.min_rating}
                        onClick={() => setShowPriceFilter(false)}
                        onChange={(e) => setData("min_rating", e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-gray-500 focus:outline-none"
                    >
                        <option value="">Semua Rating</option>
                        <option value="1">⭐ ≥ 1.00</option>
                        <option value="2">⭐ ≥ 2.00</option>
                        <option value="3">⭐ ≥ 3.00</option>
                        <option value="4">⭐ ≥ 4.00</option>
                        <option value="5">⭐ 5.00</option>
                    </select>

                    {/* Tombol cari */}
                    <button
                        type="submit"
                        className="rounded-lg bg-gray-800 px-6 py-2 text-white hover:bg-gray-700"
                    >
                        Cari
                    </button>

                    {/* Tombol reset */}
                    <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-100"
                    >
                        Reset
                    </button>
                </form>

                {/* Daftar mentor */}
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {mentors.length > 0 ? (
                        mentors.map((mentor) => (
                            <div
                                key={mentor.id}
                                className="rounded-lg bg-white p-6 shadow"
                            >
                                {/* Nama mentor */}
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {mentor.user.name}
                                </h2>

                                {/* Expertise */}
                                <p className="mt-2 text-sm text-gray-600">
                                    {mentor.expertise}
                                </p>

                                {/* Bio */}
                                <p className="mt-4 text-gray-700">
                                    {mentor.bio || "Belum ada bio mentor."}
                                </p>

                                {/* Informasi mentor */}
                                <div className="mt-4 space-y-1">
                                    <p>
                                        <strong>Rating:</strong> ⭐{" "}
                                        {mentor.avg_rating}
                                        {Number(mentor.avg_rating) === 0 && (
                                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                                Mentor Baru
                                            </span>
                                        )}
                                    </p>

                                    <p>
                                        <strong>Mentoring:</strong>{" "}
                                        {mentor.mentor_type === "free"
                                            ? "Gratis"
                                            : `Rp${Number(
                                                  mentor.price_per_session,
                                              ).toLocaleString(
                                                  "id-ID",
                                              )} / sesi`}
                                    </p>

                                    <p>
                                        <strong>Status:</strong>{" "}
                                        {mentor.is_available
                                            ? "Tersedia"
                                            : "Tidak tersedia"}
                                    </p>
                                </div>

                                {/* Tombol menuju detail mentor */}
                                <div className="mt-6">
                                    <a
                                        href={`/mentors/${mentor.id}`}
                                        className="inline-block rounded-lg bg-gray-800 px-5 py-2 text-white hover:bg-gray-700"
                                    >
                                        Lihat Profil
                                    </a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full rounded-lg bg-white p-6 text-center text-gray-600">
                            Mentor tidak ditemukan.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
