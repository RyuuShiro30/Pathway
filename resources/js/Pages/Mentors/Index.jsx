import React from "react";
import { useForm } from "@inertiajs/react";

export default function Index({
    mentors,
    search,
    expertise,
    expertises,
    availability,
    mentorType,
}) {
    const { data, setData, get } = useForm({
        search: search || "",
        expertise: expertise || "",
        availability: availability || "",
        mentor_type: mentorType || "",
    });

    const handleSearch = (e) => {
        e.preventDefault();

        get("/mentors", {
            preserveState: true,
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <div className="mx-auto max-w-7xl px-6">
                {/* Judul */}
                <h1 className="text-3xl font-bold text-gray-800">
                    Direktori Mentor
                </h1>

                <p className="mt-2 text-gray-600">
                    Temukan mentor yang sesuai dengan kebutuhan belajar kamu.
                </p>

                {/* Filter */}
                <form
                    onSubmit={handleSearch}
                    className="mt-6 flex flex-wrap gap-3"
                >
                    {/* Pencarian Nama */}
                    <input
                        type="text"
                        value={data.search}
                        onChange={(e) => setData("search", e.target.value)}
                        placeholder="Cari nama mentor..."
                        className="min-w-[220px] flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-gray-500 focus:outline-none"
                    />

                    {/* Filter Expertise */}
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

                    {/* Filter Availability */}
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

                    {/* Filter Harga */}
                    <select
                        value={data.mentor_type}
                        onChange={(e) => setData("mentor_type", e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-gray-500 focus:outline-none"
                    >
                        <option value="">Semua Harga</option>
                        <option value="free">Gratis</option>
                        <option value="paid">Berbayar</option>
                    </select>

                    {/* Tombol Cari */}
                    <button
                        type="submit"
                        className="rounded-lg bg-gray-800 px-6 py-2 text-white hover:bg-gray-700"
                    >
                        Cari
                    </button>
                </form>

                {/* Daftar Mentor */}
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {mentors.length > 0 ? (
                        mentors.map((mentor) => (
                            <div
                                key={mentor.id}
                                className="rounded-lg bg-white p-6 shadow"
                            >
                                {/* Nama */}
                                <h2 className="text-xl font-semibold text-gray-800">
                                    {mentor.user.name}
                                </h2>

                                {/* Expertise */}
                                <p className="mt-2 text-sm text-gray-600">
                                    {mentor.expertise}
                                </p>

                                {/* Bio */}
                                <p className="mt-4 text-gray-700">
                                    {mentor.bio}
                                </p>

                                {/* Informasi Mentor */}
                                <div className="mt-4 space-y-1">
                                    <p>
                                        <strong>Rating:</strong> ⭐{" "}
                                        {mentor.avg_rating}
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
