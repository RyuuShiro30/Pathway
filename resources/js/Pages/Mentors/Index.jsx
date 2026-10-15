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
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
            <Navbar active="mentor" />

            <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:py-11">
                {/* Header */}
                <header className="flex flex-col gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6594B1]">
                        Etalase Mentor / Direktori
                    </span>

                    <h1 className="text-3xl font-semibold tracking-tight text-slate-800 md:text-[32px]">
                        Temukan Mentor
                    </h1>

                    <p className="max-w-2xl text-sm leading-6 text-slate-500">
                        Temukan mentor yang sesuai dengan bidang yang ingin kamu
                        pelajari.
                    </p>
                </header>

                {/* Search & Filter */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md md:p-6">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col gap-5"
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
                                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/15"
                            />
                        </div>

                        {/* Filter */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {/* Expertise */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    Keahlian
                                </span>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleFilter("expertise")
                                        }
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-left text-sm font-medium text-slate-700 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/15"
                                    >
                                        <span>{data.expertise || "Semua"}</span>

                                        <span className="text-xs text-slate-400">
                                            {openFilter === "expertise"
                                                ? "⌃"
                                                : "⌄"}
                                        </span>
                                    </button>

                                    {openFilter === "expertise" && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("expertise", "");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.expertise === ""
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                            ? "bg-slate-50 font-semibold text-slate-800"
                                                            : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    Harga
                                </span>

                                <button
                                    type="button"
                                    onClick={togglePriceFilter}
                                    className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-left text-sm font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/15"
                                >
                                    <span>
                                        {data.min_price || data.max_price
                                            ? "Rentang harga"
                                            : "Semua"}
                                    </span>

                                    <span className="text-slate-400">
                                        {showPriceFilter ? "⌃" : "⌄"}
                                    </span>
                                </button>

                                {showPriceFilter && (
                                    <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[280px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                                        <p className="text-sm font-semibold text-slate-800">
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
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/15"
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
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/15"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleApplyPrice}
                                            className="mt-3 h-10 w-full rounded-lg bg-[#6594B1] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#56839F] hover:shadow-md"
                                        >
                                            Terapkan
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Rating */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    Rating
                                </span>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => toggleFilter("rating")}
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-left text-sm font-medium text-slate-700 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/15"
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

                                        <span className="text-xs text-slate-400">
                                            {openFilter === "rating"
                                                ? "⌃"
                                                : "⌄"}
                                        </span>
                                    </button>

                                    {openFilter === "rating" && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("min_rating", "");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.min_rating === ""
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    Ketersediaan
                                </span>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleFilter("availability")
                                        }
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-left text-sm font-medium text-slate-700 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/15"
                                    >
                                        <span>
                                            {data.availability === "1"
                                                ? "Tersedia"
                                                : data.availability === "0"
                                                  ? "Tidak tersedia"
                                                  : "Semua"}
                                        </span>

                                        <span className="text-xs text-slate-400">
                                            {openFilter === "availability"
                                                ? "⌃"
                                                : "⌄"}
                                        </span>
                                    </button>

                                    {openFilter === "availability" && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("availability", "");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.availability === ""
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    Jenis Mentoring
                                </span>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleFilter("mentor_type")
                                        }
                                        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-left text-sm font-medium text-slate-700 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/15"
                                    >
                                        <span>
                                            {data.mentor_type === "free"
                                                ? "Gratis"
                                                : data.mentor_type === "paid"
                                                  ? "Berbayar"
                                                  : "Semua"}
                                        </span>

                                        <span className="text-xs text-slate-400">
                                            {openFilter === "mentor_type"
                                                ? "⌃"
                                                : "⌄"}
                                        </span>
                                    </button>

                                    {openFilter === "mentor_type" && (
                                        <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setData("mentor_type", "");
                                                    setOpenFilter(null);
                                                }}
                                                className={`block w-full px-4 py-3 text-left text-sm transition ${
                                                    data.mentor_type === ""
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                                                        ? "bg-slate-50 font-semibold text-slate-800"
                                                        : "text-slate-700 hover:bg-[#E6EFF4] hover:text-[#6594B1]"
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
                        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                            >
                                Hapus filter
                            </button>

                            <button
                                type="submit"
                                className="h-10 rounded-lg bg-[#6594B1] px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#56839F] hover:shadow-md"
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
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Mentor Terverifikasi
                            </span>

                            <h2 className="mt-1 text-xl font-semibold text-slate-800">
                                Mentor Tersedia
                            </h2>
                        </div>

                        <span className="text-sm text-slate-500">
                            {mentors.length} mentor
                        </span>
                    </div>

                    {mentors.length > 0 ? (
                        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {mentors.map((mentor) => (
                                <article
                                    key={mentor.id}
                                    className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                                >
                                    {/* Mentor Header */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#E6EFF4] text-lg font-semibold text-[#6594B1] transition-transform duration-200 group-hover:scale-105">
                                            {mentor.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-base font-semibold text-slate-800">
                                                {mentor.user.name}
                                            </h3>

                                            <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-[#6594B1]">
                                                {mentor.expertise}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Verification & Availability */}
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF5E1] px-3 py-1 text-xs font-semibold text-[#5C6F2B]">
                                            ✓ Terverifikasi
                                        </span>

                                        <span
                                            className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                                                mentor.is_available
                                                    ? "text-[#5C6F2B]"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            <span className="h-2 w-2 rounded-full bg-current" />

                                            {mentor.is_available
                                                ? "Tersedia"
                                                : "Tidak tersedia"}
                                        </span>
                                    </div>

                                    <div className="h-px bg-slate-200" />

                                    {/* Rating & Price */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[#5C6F2B]">
                                                ⭐
                                            </span>

                                            <span className="font-medium text-slate-800">
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
                                            <span className="font-semibold text-slate-800">
                                                Rp{" "}
                                                {Number(
                                                    mentor.price_per_session,
                                                ).toLocaleString("id-ID")}
                                                <span className="font-normal text-slate-500">
                                                    {" "}
                                                    / sesi
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Button */}
                                    <a
                                        href={`/mentors/${mentor.id}`}
                                        className="mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-[#E6EFF4] text-sm font-semibold text-[#6594B1] shadow-sm transition-all duration-200 group-hover:bg-[#6594B1] group-hover:text-white hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        Lihat Profil
                                    </a>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-5 flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DDAED3] text-xl text-white shadow-sm">
                                ?
                            </div>

                            <h3 className="mt-3 text-lg font-semibold text-slate-800">
                                Mentor tidak ditemukan
                            </h3>

                            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                                Coba ubah kata pencarian atau hapus beberapa
                                filter untuk melihat mentor lainnya.
                            </p>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="mt-4 h-10 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
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
