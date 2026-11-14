import { useForm } from "@inertiajs/react";

const platforms = [
    "GitHub",
    "LinkedIn",
    "Website",
    "Behance",
    "Figma",
    "Instagram",
    "Lainnya",
];

export default function UpdateMentorProfileForm({
    mentorProfile,
    className = "",
}) {
    const { data, setData, patch, processing, errors, recentlySuccessful } =
        useForm({
            expertise: mentorProfile?.expertise || "",
            bio: mentorProfile?.bio || "",
            portfolios: mentorProfile?.portfolios || [],
        });

    const addPortfolio = () => {
        setData("portfolios", [
            ...data.portfolios,
            {
                platform: "GitHub",
                title: "",
                url: "",
            },
        ]);
    };

    const updatePortfolio = (index, field, value) => {
        const updated = [...data.portfolios];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        setData("portfolios", updated);
    };

    const removePortfolio = (index) => {
        setData(
            "portfolios",
            data.portfolios.filter((_, i) => i !== index),
        );
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route("profile.mentor.update"));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profil Profesional
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    Lengkapi informasi profesional agar calon mentee mengenal
                    keahlian dan pengalamanmu.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <label
                        htmlFor="expertise"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Bidang Keahlian
                    </label>
                    <input
                        id="expertise"
                        type="text"
                        value={data.expertise}
                        onChange={(e) => setData("expertise", e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Contoh: Web Development"
                    />
                    {errors.expertise && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.expertise}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="bio"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Bio Profesional
                    </label>
                    <textarea
                        id="bio"
                        rows="5"
                        value={data.bio}
                        onChange={(e) => setData("bio", e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Ceritakan pengalaman, keahlian, dan hal yang bisa kamu bantu..."
                    />
                    {errors.bio && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.bio}
                        </p>
                    )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-medium text-gray-900">
                                Portofolio
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Tambahkan tautan karya atau profil
                                profesionalmu.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addPortfolio}
                            className="rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                            + Tambah Link
                        </button>
                    </div>

                    <div className="mt-4 space-y-4">
                        {data.portfolios.map((portfolio, index) => (
                            <div
                                key={portfolio.id ?? `new-${index}`}
                                className="rounded-lg border border-gray-200 p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-800">
                                        Portofolio {index + 1}
                                    </h4>

                                    <button
                                        type="button"
                                        onClick={() => removePortfolio(index)}
                                        className="text-sm text-red-600 hover:text-red-800"
                                    >
                                        Hapus
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Platform
                                    </label>
                                    <select
                                        value={portfolio.platform}
                                        onChange={(e) =>
                                            updatePortfolio(
                                                index,
                                                "platform",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    >
                                        {platforms.map((platform) => (
                                            <option
                                                key={platform}
                                                value={platform}
                                            >
                                                {platform}
                                            </option>
                                        ))}
                                    </select>
                                    {errors[`portfolios.${index}.platform`] && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {
                                                errors[
                                                    `portfolios.${index}.platform`
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Judul
                                    </label>
                                    <input
                                        type="text"
                                        value={portfolio.title}
                                        onChange={(e) =>
                                            updatePortfolio(
                                                index,
                                                "title",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="Contoh: Proyek Website E-Commerce"
                                    />
                                    {errors[`portfolios.${index}.title`] && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {
                                                errors[
                                                    `portfolios.${index}.title`
                                                ]
                                            }
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        URL
                                    </label>
                                    <input
                                        type="url"
                                        value={portfolio.url}
                                        onChange={(e) =>
                                            updatePortfolio(
                                                index,
                                                "url",
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        placeholder="https://..."
                                    />
                                    {errors[`portfolios.${index}.url`] && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors[`portfolios.${index}.url`]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {data.portfolios.length === 0 && (
                            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                                Belum ada portofolio. Klik Tambah Link untuk
                                menambahkan.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {processing ? "Menyimpan..." : "Simpan Profil"}
                    </button>

                    {recentlySuccessful && (
                        <p className="text-sm text-green-600">
                            Profil berhasil disimpan.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
