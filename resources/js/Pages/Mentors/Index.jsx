import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import Navbar from "@/Components/Navbar";

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
    const [openFilter, setOpenFilter] = useState(null);

    const handleSearch = (e) => {
        e.preventDefault();

        setOpenFilter(null);
        setShowPriceFilter(false);

        get("/mentors", {
            preserveState: true,
        });
    };

    const handleApplyPrice = () => {
        setShowPriceFilter(false);
        setOpenFilter(null);

        get("/mentors", {
            preserveState: true,
        });
    };

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
        setOpenFilter(null);

        get("/mentors", {
            preserveState: true,
        });
    };

    const toggleFilter = (filterName) => {
        setShowPriceFilter(false);

        setOpenFilter(openFilter === filterName ? null : filterName);
    };

    const togglePriceFilter = () => {
        setOpenFilter(null);

        setShowPriceFilter(!showPriceFilter);
    };

    return (
        <div className="min-h-screen bg-[#F6F4EF] text-[#26302B]">
            {/* Navbar */}
            <Navbar active="mentor" />

            {/* Main */}
            <main className="mx-auto flex max-w-7xl flex-col gap-7 px-2 py-10 md:py-11">
                {" "}
                {/* Header */}
                <header className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6594B1]">
                        Etalase Mentor / Direktori
                    </span>

                    <h1 className="text-3xl font-semibold tracking-tight text-[#26302B]">
                        Temukan Mentor
                    </h1>

                    <p className="text-sm text-[#6F7A73]">
                        Temukan mentor yang sesuai dengan bidang yang ingin kamu
                        pelajari.
                    </p>
                </header>
                {/* Search & Filter */}
                <section className="rounded-[14px] border border-[#E8E5DD] bg-white p-5 md:p-6">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col gap-4"
                    >
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={data.search}
                                onChange={(e) =>
                                    setData("search", e.target.value)
                                }
                                placeholder="Cari mentor atau keahlian..."
                                className="h-12 w-full rounded-[10px] border border-[#E8E5DD] bg-[#F4F3EE] px-4 text-sm text-[#26302B] outline-none transition placeholder:text-[#6F7A73] focus:border-[#6594B1]"
                            />
                        </div>

                        {/* Filter */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {/* Expertise */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F7A73]">
                                    Keahlian
                                </span>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleFilter("expertise")
                                        }
                                        className="flex h-11 w-full items-center justify-between rounded-[10px] border border-[#E8E5DD] bg-[#F4F3EE] px-3.5 text-left text-sm font-medium text-[#26302B] outline-none hover:bg-white"
                                    >
                                        <span>{data.expertise || "Semua"}</span>

                                        <span className="text-xs text-[#6F7A73]">
                                            {openFilter === "expertise"
                                                ? "⌃"
                                                : "⌄"}
                                        </span>
                                    </button>

                                    {openFilter === "expertise" && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-[10px] border border-[#E8E5DD] bg-white shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("expertise", "");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.expertise === ""
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                Semua
                                            </button>

                                            {expertises.map((item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => {
                                                        setData(
                                                            "expertise",
                                                            item,
                                                        );
                                                        setOpenFilter(null);
                                                    }}
                                                    className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                        data.expertise === item
                                                            ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                            : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                    }`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="relative flex flex-col gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F7A73]">
                                    Harga
                                </span>

                                <button
                                    type="button"
                                    onClick={togglePriceFilter}
                                    className="flex h-11 items-center justify-between rounded-[10px] border border-[#E8E5DD] bg-[#F4F3EE] px-3.5 text-left text-sm font-medium text-[#26302B]"
                                >
                                    <span>
                                        {data.min_price || data.max_price
                                            ? "Rentang harga"
                                            : "Semua"}
                                    </span>

                                    <span className="text-[#6F7A73]">
                                        {showPriceFilter ? "⌃" : "⌄"}
                                    </span>
                                </button>

                                {showPriceFilter && (
                                    <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[280px] rounded-[12px] border border-[#E8E5DD] bg-white p-4 shadow-lg">
                                        <p className="text-sm font-semibold text-[#26302B]">
                                            Rentang Harga
                                        </p>

                                        <div className="mt-3 flex gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={data.min_price}
                                                onChange={(e) =>
                                                    setData(
                                                        "min_price",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Minimum"
                                                className="h-10 w-full rounded-[10px] border border-[#E8E5DD] bg-[#F4F3EE] px-3 text-sm outline-none focus:border-[#6594B1]"
                                            />

                                            <input
                                                type="number"
                                                min="0"
                                                value={data.max_price}
                                                onChange={(e) =>
                                                    setData(
                                                        "max_price",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Maksimum"
                                                className="h-10 w-full rounded-[10px] border border-[#E8E5DD] bg-[#F4F3EE] px-3 text-sm outline-none focus:border-[#6594B1]"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleApplyPrice}
                                            className="mt-3 h-10 w-full rounded-lg bg-[#6594B1] px-4 text-sm font-semibold text-white hover:bg-[#56839F]"
                                        >
                                            Terapkan
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Rating */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F7A73]">
                                    Rating
                                </span>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => toggleFilter("rating")}
                                        className="flex h-11 w-full items-center justify-between rounded-[10px] border border-[#E8E5DD] bg-[#F4F3EE] px-3.5 text-left text-sm font-medium text-[#26302B] outline-none hover:bg-white"
                                    >
                                        <span>
                                            {data.min_rating === "4.5"
                                                ? "⭐ ≥ 4.5"
                                                : data.min_rating === "4"
                                                  ? "⭐ ≥ 4.0"
                                                  : data.min_rating === "3.5"
                                                    ? "⭐ ≥ 3.5"
                                                    : data.min_rating === "3"
                                                      ? "⭐ ≥ 3.0"
                                                      : data.min_rating ===
                                                          "2.5"
                                                        ? "⭐ ≥ 2.5"
                                                        : "Semua"}
                                        </span>

                                        <span className="text-xs text-[#6F7A73]">
                                            {openFilter === "rating"
                                                ? "⌃"
                                                : "⌄"}
                                        </span>
                                    </button>

                                    {openFilter === "rating" && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-[10px] border border-[#E8E5DD] bg-white shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("min_rating", "");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.min_rating === ""
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                Semua
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData(
                                                        "min_rating",
                                                        "4.5",
                                                    );
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.min_rating === "4.5"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                ⭐ ≥ 4.5
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("min_rating", "4");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.min_rating === "4"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                ⭐ ≥ 4.0
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData(
                                                        "min_rating",
                                                        "3.5",
                                                    );
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.min_rating === "3.5"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                ⭐ ≥ 3.5
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("min_rating", "3");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.min_rating === "3"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                ⭐ ≥ 3.0
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData(
                                                        "min_rating",
                                                        "2.5",
                                                    );
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.min_rating === "2.5"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                ⭐ ≥ 2.5
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F7A73]">
                                    Ketersediaan
                                </span>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleFilter("availability")
                                        }
                                        className="flex h-11 w-full items-center justify-between rounded-[10px] border border-[#E8E5DD] bg-[#F4F3EE] px-3.5 text-left text-sm font-medium text-[#26302B] outline-none hover:bg-white"
                                    >
                                        <span>
                                            {data.availability === "1"
                                                ? "Tersedia"
                                                : data.availability === "0"
                                                  ? "Tidak tersedia"
                                                  : "Semua"}
                                        </span>

                                        <span className="text-xs text-[#6F7A73]">
                                            {openFilter === "availability"
                                                ? "⌃"
                                                : "⌄"}
                                        </span>
                                    </button>

                                    {openFilter === "availability" && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-[10px] border border-[#E8E5DD] bg-white shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("availability", "");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.availability === ""
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                Semua
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData(
                                                        "availability",
                                                        "1",
                                                    );
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.availability === "1"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                Tersedia
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData(
                                                        "availability",
                                                        "0",
                                                    );
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.availability === "0"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                Tidak tersedia
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mentor Type */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F7A73]">
                                    Jenis Mentoring
                                </span>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleFilter("mentor_type")
                                        }
                                        className="flex h-11 w-full items-center justify-between rounded-[10px] border border-[#E8E5DD] bg-[#F4F3EE] px-3.5 text-left text-sm font-medium text-[#26302B] outline-none hover:bg-white"
                                    >
                                        <span>
                                            {data.mentor_type === "free"
                                                ? "Gratis"
                                                : data.mentor_type === "paid"
                                                  ? "Berbayar"
                                                  : "Semua"}
                                        </span>

                                        <span className="text-xs text-[#6F7A73]">
                                            {openFilter === "mentor_type"
                                                ? "⌃"
                                                : "⌄"}
                                        </span>
                                    </button>

                                    {openFilter === "mentor_type" && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-[10px] border border-[#E8E5DD] bg-white shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("mentor_type", "");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.mentor_type === ""
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                Semua
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData(
                                                        "mentor_type",
                                                        "free",
                                                    );
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.mentor_type === "free"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                Gratis
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData(
                                                        "mentor_type",
                                                        "paid",
                                                    );
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.mentor_type === "paid"
                                                        ? "bg-[#F4F3EE] font-semibold text-[#26302B]"
                                                        : "text-[#26302B] hover:bg-[#6594B1] hover:text-white"
                                                }`}
                                            >
                                                Berbayar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E8E5DD] pt-4">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="h-10 rounded-lg border border-[#E8E5DD] bg-white px-5 text-sm font-semibold text-[#26302B] hover:bg-[#F4F3EE]"
                            >
                                Hapus filter
                            </button>

                            <button
                                type="submit"
                                className="h-10 rounded-lg bg-[#6594B1] px-6 text-sm font-semibold text-white hover:bg-[#56839F]"
                            >
                                Cari Mentor
                            </button>
                        </div>
                    </form>
                </section>
                {/* Mentor List */}
                <section>
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6F7A73]">
                                Mentor Terverifikasi
                            </span>

                            <h2 className="mt-1 text-xl font-semibold text-[#26302B]">
                                Mentor Tersedia
                            </h2>
                        </div>

                        <span className="text-sm text-[#6F7A73]">
                            {mentors.length} mentor
                        </span>
                    </div>

                    {mentors.length > 0 ? (
                        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {mentors.map((mentor) => (
                                <article
                                    key={mentor.id}
                                    className="flex flex-col gap-4 rounded-[14px] border border-[#E8E5DD] bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    {/* Mentor Header */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#E6EFF4] text-lg font-semibold text-[#6594B1]">
                                            {mentor.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-base font-semibold text-[#26302B]">
                                                {mentor.user.name}
                                            </h3>

                                            <p className="mt-0.5 text-[13px] text-[#6594B1]">
                                                {mentor.expertise}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Verification */}
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF5E1] px-3 py-1 text-xs font-semibold text-[#5C6F2B]">
                                            ✓ Terverifikasi
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                                                mentor.is_available
                                                    ? "text-[#5C6F2B]"
                                                    : "text-[#6F7A73]"
                                            }`}
                                        >
                                            <span className="h-2 w-2 rounded-full bg-current" />

                                            {mentor.is_available
                                                ? "Tersedia"
                                                : "Tidak tersedia"}
                                        </span>
                                    </div>

                                    <div className="h-px bg-[#E8E5DD]" />

                                    {/* Rating & Price */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[#5C6F2B]">
                                                ⭐
                                            </span>

                                            <span className="font-medium text-[#26302B]">
                                                {mentor.avg_rating > 0
                                                    ? mentor.avg_rating
                                                    : "Baru"}
                                            </span>
                                        </div>

                                        {mentor.mentor_type === "free" ? (
                                            <span className="rounded-full bg-[#F8EEF6] px-3 py-1 text-[13px] font-semibold text-[#8A4A80]">
                                                Gratis
                                            </span>
                                        ) : (
                                            <span className="font-semibold text-[#26302B]">
                                                Rp
                                                {Number(
                                                    mentor.price_per_session,
                                                ).toLocaleString("id-ID")}
                                                <span className="font-normal text-[#6F7A73]">
                                                    {" "}
                                                    / sesi
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Button */}
                                    <a
                                        href={`/mentors/${mentor.id}`}
                                        className="mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-[#E6EFF4] text-sm font-semibold text-[#6594B1] transition hover:bg-[#D9E8EF]"
                                    >
                                        Lihat Profil
                                    </a>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-4 flex flex-col items-center rounded-[14px] border border-[#E8E5DD] bg-white px-6 py-14 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DDAED3] text-xl text-white">
                                ?
                            </div>

                            <h3 className="mt-3 text-lg font-semibold text-[#26302B]">
                                Mentor tidak ditemukan
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-[#6F7A73]">
                                Coba ubah kata pencarian atau hapus beberapa
                                filter untuk melihat mentor lainnya.
                            </p>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="mt-4 h-10 rounded-lg border border-[#E8E5DD] bg-white px-5 text-sm font-semibold text-[#26302B] hover:bg-[#F4F3EE]"
                            >
                                Hapus filter
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
