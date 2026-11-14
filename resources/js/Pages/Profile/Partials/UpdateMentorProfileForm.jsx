import { useForm } from "@inertiajs/react";
import { useState } from "react";

const platforms = [
    "GitHub",
    "LinkedIn",
    "Website",
    "Behance",
    "Figma",
    "Instagram",
    "Lainnya",
];

const inputClass =
    "mt-2 block w-full rounded-lg border border-[#DCE5EA] bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20";

const labelClass = "block text-sm font-medium text-slate-700";

export default function UpdateMentorProfileForm({
    mentorProfile,
    className = "",
}) {
    const [openPortfolioIndex, setOpenPortfolioIndex] = useState(null);

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

        if (openPortfolioIndex === index) {
            setOpenPortfolioIndex(null);
        } else if (openPortfolioIndex > index) {
            setOpenPortfolioIndex(openPortfolioIndex - 1);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route("profile.mentor.update"));
    };

    return (
        <section
            className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${className}`}
        >
            {/* Header */}
            <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E6EFF4] text-[#6594B1]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 20h9"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
                            />
                        </svg>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Profil Profesional
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Kelola informasi keahlian dan pengalaman
                            profesionalmu.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-7">
                {/* Keahlian */}
                <div>
                    <label htmlFor="expertise" className={labelClass}>
                        Bidang Keahlian
                    </label>

                    <input
                        id="expertise"
                        type="text"
                        value={data.expertise}
                        onChange={(e) => setData("expertise", e.target.value)}
                        className={inputClass}
                        placeholder="Contoh: Web Development"
                    />

                    {errors.expertise && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.expertise}
                        </p>
                    )}
                </div>

                {/* Bio */}
                <div>
                    <label htmlFor="bio" className={labelClass}>
                        Bio Profesional
                    </label>

                    <textarea
                        id="bio"
                        rows="5"
                        value={data.bio}
                        onChange={(e) => setData("bio", e.target.value)}
                        className={`${inputClass} resize-y`}
                        placeholder="Ceritakan pengalaman, keahlian, dan hal yang bisa kamu bantu..."
                    />

                    {errors.bio && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.bio}
                        </p>
                    )}
                </div>

                {/* Portofolio */}
                <div className="border-t border-slate-100 pt-7">
                    {/* Header Portofolio */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-slate-800">
                                Portofolio
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Tampilkan karya dan akun profesionalmu.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={addPortfolio}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#E6EFF4] px-4 py-2.5 text-sm font-medium text-[#6594B1] transition hover:bg-[#d7e7ef]"
                        >
                            <span className="text-lg leading-none">+</span>
                            Tambah Link
                        </button>
                    </div>

                    {/* Daftar Portofolio */}
                    <div className="mt-5 space-y-3">
                        {data.portfolios.map((portfolio, index) => {
                            const isOpen = openPortfolioIndex === index;

                            return (
                                <div
                                    key={portfolio.id ?? `new-${index}`}
                                    className="overflow-hidden rounded-xl border border-[#DCE5EA] bg-[#F8FAFB]"
                                >
                                    {/* Header Accordion */}
                                    <div className="flex items-center justify-between gap-3 p-4">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenPortfolioIndex(
                                                    isOpen ? null : index,
                                                )
                                            }
                                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                        >
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E6EFF4] text-xs font-semibold text-[#6594B1]">
                                                {index + 1}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <h4 className="truncate text-sm font-semibold text-slate-700">
                                                    {portfolio.title ||
                                                        `Portofolio ${index + 1}`}
                                                </h4>

                                                <p className="mt-1 truncate text-xs text-slate-500">
                                                    {portfolio.platform ||
                                                        "Pilih platform"}
                                                    {portfolio.url
                                                        ? ` · ${portfolio.url}`
                                                        : ""}
                                                </p>
                                            </div>

                                            <svg
                                                className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 ${
                                                    isOpen ? "rotate-180" : ""
                                                }`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removePortfolio(index)
                                            }
                                            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
                                        >
                                            Hapus
                                        </button>
                                    </div>

                                    {/* Isi Accordion */}
                                    {isOpen && (
                                        <div className="space-y-4 border-t border-[#DCE5EA] bg-white p-4">
                                            {/* Platform */}
                                            <div>
                                                <label className={labelClass}>
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
                                                    className={inputClass}
                                                >
                                                    {platforms.map(
                                                        (platform) => (
                                                            <option
                                                                key={platform}
                                                                value={platform}
                                                            >
                                                                {platform}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>

                                                {errors[
                                                    `portfolios.${index}.platform`
                                                ] && (
                                                    <p className="mt-2 text-sm text-red-600">
                                                        {
                                                            errors[
                                                                `portfolios.${index}.platform`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Judul */}
                                            <div>
                                                <label className={labelClass}>
                                                    Judul Portofolio
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
                                                    className={inputClass}
                                                    placeholder="Contoh: Proyek Website E-Commerce"
                                                />

                                                {errors[
                                                    `portfolios.${index}.title`
                                                ] && (
                                                    <p className="mt-2 text-sm text-red-600">
                                                        {
                                                            errors[
                                                                `portfolios.${index}.title`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* URL */}
                                            <div>
                                                <label className={labelClass}>
                                                    URL Portofolio
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
                                                    className={inputClass}
                                                    placeholder="https://..."
                                                />

                                                {errors[
                                                    `portfolios.${index}.url`
                                                ] && (
                                                    <p className="mt-2 text-sm text-red-600">
                                                        {
                                                            errors[
                                                                `portfolios.${index}.url`
                                                            ]
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Jika belum ada portofolio */}
                        {data.portfolios.length === 0 && (
                            <div className="rounded-xl border border-dashed border-[#C8D8E1] bg-[#F8FAFB] px-5 py-10 text-center">
                                <p className="text-sm font-medium text-slate-600">
                                    Belum ada portofolio
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    Klik Tambah Link untuk menambahkan
                                    portofolio.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tombol Simpan */}
                <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-[#6594B1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>

                    {recentlySuccessful && (
                        <p className="flex items-center gap-2 text-sm font-medium text-[#5C6F2B]">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF5E1]">
                                ✓
                            </span>
                            Profil berhasil disimpan.
                        </p>
                    )}
                </div>
            </form>
        </section>
    );
}
