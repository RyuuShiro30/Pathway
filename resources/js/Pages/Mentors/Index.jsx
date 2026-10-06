import React from "react";

export default function Index({ mentors }) {
    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <div className="mx-auto max-w-7xl px-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    Direktori Mentor
                </h1>

                <p className="mt-2 text-gray-600">
                    Temukan mentor yang sesuai dengan kebutuhan belajar kamu.
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {mentors.map((mentor) => (
                        <div
                            key={mentor.id}
                            className="rounded-lg bg-white p-6 shadow"
                        >
                            <h2 className="text-xl font-semibold text-gray-800">
                                {mentor.user.name}
                            </h2>

                            <p className="mt-2 text-sm text-gray-600">
                                {mentor.expertise}
                            </p>

                            <p className="mt-4 text-gray-700">{mentor.bio}</p>

                            <div className="mt-4">
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
                                          ).toLocaleString("id-ID")} / sesi`}
                                </p>

                                <p>
                                    <strong>Status:</strong>{" "}
                                    {mentor.is_available
                                        ? "Tersedia"
                                        : "Tidak tersedia"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
