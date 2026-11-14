import React from "react";

export default function Show({ mentor }) {
    const reviews = mentor.reviews || [];
    const averageRating = Number(mentor.avg_rating || 0);
    const reviewCount = Number(mentor.reviews_count || reviews.length);

    const availabilitySchedule = Array.isArray(mentor.availability_schedule)
        ? mentor.availability_schedule
        : [];

    const dayNames = [
        "minggu",
        "senin",
        "selasa",
        "rabu",
        "kamis",
        "jumat",
        "sabtu",
    ];

    const validSchedule = availabilitySchedule.filter(
        (slot) =>
            dayNames.includes(String(slot.day).toLowerCase()) &&
            ["gratis", "berbayar"].includes(slot.type),
    );

    const hasFreeSlots = validSchedule.some((slot) => slot.type === "gratis");

    const paidPrices = validSchedule
        .filter((slot) => slot.type === "berbayar")
        .map((slot) => Number(slot.price))
        .filter((price) => Number.isFinite(price) && price > 0);

    const hasPaidSlots = paidPrices.length > 0;

    const mentoringType =
        hasFreeSlots && hasPaidSlots
            ? "Gratis & Berbayar"
            : hasFreeSlots
              ? "Gratis"
              : hasPaidSlots
                ? "Berbayar"
                : "Belum diatur";

    const minPaidPrice = hasPaidSlots ? Math.min(...paidPrices) : 0;
    const maxPaidPrice = hasPaidSlots ? Math.max(...paidPrices) : 0;

    const formatRupiah = (price) => Number(price).toLocaleString("id-ID");

    const priceLabel =
        minPaidPrice === maxPaidPrice
            ? `Rp ${formatRupiah(minPaidPrice)}`
            : `Rp ${formatRupiah(minPaidPrice)} - Rp ${formatRupiah(maxPaidPrice)}`;

    // Mencari jadwal terdekat berdasarkan hari dan jam saat ini
    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const upcomingSchedule = validSchedule
        .map((slot) => {
            const slotDay = dayNames.indexOf(String(slot.day).toLowerCase());

            const [hours, minutes] = String(slot.start).split(":").map(Number);

            const startMinutes = hours * 60 + minutes;
            const dayDistance = (slotDay - currentDay + 7) % 7;

            return {
                ...slot,
                dayDistance,
                startMinutes,
            };
        })
        .filter(
            (slot) =>
                slot.dayDistance > 0 || slot.startMinutes > currentMinutes,
        )
        .sort((a, b) => {
            if (a.dayDistance !== b.dayDistance) {
                return a.dayDistance - b.dayDistance;
            }

            return a.startMinutes - b.startMinutes;
        });

    const nearestDay =
        upcomingSchedule.length > 0
            ? dayNames[
                  upcomingSchedule[0].dayDistance === 0
                      ? currentDay
                      : (currentDay + upcomingSchedule[0].dayDistance) % 7
              ]
            : null;

    const nearestDayLabel = nearestDay
        ? nearestDay.charAt(0).toUpperCase() + nearestDay.slice(1)
        : null;

    const isMentorAvailable = upcomingSchedule.length > 0;

    const mentorName = mentor.user?.name || "Mentor";
    const mentorInitial = mentorName.charAt(0).toUpperCase();

    const renderStars = (rating, size = "h-5 w-5") => (
        <div className="flex items-center gap-1 leading-none">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`block ${size} shrink-0 ${
                        star <= Math.round(rating)
                            ? "text-[#E9B82E]"
                            : "text-[#DCE2E5]"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5z" />
                </svg>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F4F7F9] text-[#172033]">
            <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
                {/* BACK */}
                <a
                    href="/mentors"
                    className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-[#6594B1] transition hover:text-[#4F7F9B]"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.8"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Kembali ke Direktori Mentor
                </a>

                {/* HERO PROFILE */}
                <section className="mb-7 overflow-hidden rounded-2xl border border-[#C9DCE6] bg-[#E6EFF4] shadow-[0_3px_12px_rgba(38,65,80,0.08)]">
                    <div className="h-1.5 bg-[#6594B1]" />

                    <div className="p-6 lg:p-8">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                            {/* FOTO */}
                            <div className="flex-shrink-0">
                                {mentor.user?.photo_path ? (
                                    <img
                                        src={mentor.user.photo_path}
                                        alt={mentorName}
                                        className="h-32 w-32 rounded-2xl bg-white object-cover shadow-sm ring-4 ring-white"
                                    />
                                ) : (
                                    <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white text-4xl font-bold text-[#6594B1] shadow-sm ring-4 ring-white">
                                        {mentorInitial}
                                    </div>
                                )}
                            </div>

                            {/* PROFIL */}
                            <div className="min-w-0 flex-1">
                                {mentor.verification_status === "verified" && (
                                    <div className="mb-3">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF5E1] px-3 py-1.5 text-xs font-semibold text-[#5C6F2B]">
                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#91D06C] text-[#30451A]">
                                                <svg
                                                    className="h-2.5 w-2.5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="3"
                                                        d="M5 12l4 4L19 6"
                                                    />
                                                </svg>
                                            </span>
                                            Mentor Terverifikasi
                                        </span>
                                    </div>
                                )}

                                <h1 className="text-3xl font-bold tracking-tight text-[#172033]">
                                    {mentorName}
                                </h1>

                                <p className="mt-2 text-base font-medium text-[#6594B1]">
                                    {mentor.expertise || "Mentor"}
                                </p>

                                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5E6F7D]">
                                    Kenali profil mentor dan temukan bimbingan
                                    yang sesuai dengan kebutuhan belajarmu.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MAIN CONTENT */}
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
                    {/* LEFT COLUMN */}
                    <div className="space-y-7 lg:col-span-2">
                        {/* TENTANG MENTOR */}
                        <section className="rounded-2xl border border-[#D8E3E9] bg-white p-6 shadow-[0_2px_8px_rgba(38,65,80,0.06)]">
                            <div className="mb-5 flex items-start gap-4">
                                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#E6EFF4] text-[#6594B1]">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.8"
                                            d="M20 21a8 8 0 00-16 0M12 13a4 4 0 100-8 4 4 0 000 8z"
                                        />
                                    </svg>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#172033]">
                                        Tentang Mentor
                                    </h2>
                                    <p className="mt-1 text-sm text-[#7A8B99]">
                                        Informasi mengenai mentor
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl bg-[#F7FAFB] p-5">
                                <p className="leading-7 text-[#5E6F7D]">
                                    {mentor.bio ||
                                        "Mentor belum menambahkan informasi mengenai dirinya."}
                                </p>
                            </div>
                        </section>

                        {/* PORTFOLIO */}
                        <section className="rounded-2xl border border-[#DCE7ED] bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4F7] text-[#527F99]">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.8"
                                                d="M13.5 6.5l4-4a2.12 2.12 0 013 3l-4 4M10.5 17.5l-4 4a2.12 2.12 0 01-3-3l4-4M8 16l8-8"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <h2 className="font-bold text-[#263748]">
                                            Portfolio
                                        </h2>
                                        <p className="text-xs text-[#8495A1]">
                                            Karya dan profil profesional mentor
                                        </p>
                                    </div>
                                </div>

                                {mentor.portfolios?.length > 0 && (
                                    <span className="rounded-full bg-[#EEF4F7] px-3 py-1 text-xs font-semibold text-[#527F99]">
                                        {mentor.portfolios.length} Karya
                                    </span>
                                )}
                            </div>

                            {mentor.portfolios?.length > 0 ? (
                                <div className="divide-y divide-[#E8EEF2]">
                                    {mentor.portfolios.map((portfolio) => (
                                        <a
                                            key={portfolio.id}
                                            href={portfolio.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F8] text-[#527F99] transition group-hover:bg-[#E4EEF4]">
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="1.8"
                                                        d="M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.72M14 11a5 5 0 00-7.07 0l-3 3A5 5 0 0012 21.07l1.72-1.72"
                                                    />
                                                </svg>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-[#263748] group-hover:text-[#527F99]">
                                                    {portfolio.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-[#8495A1]">
                                                    {portfolio.platform}
                                                </p>
                                            </div>

                                            <svg
                                                className="h-4 w-4 shrink-0 text-[#91A8B7] transition group-hover:translate-x-1 group-hover:text-[#527F99]"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.8"
                                                    d="M7 17L17 7M7 7h10v10"
                                                />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="rounded-xl bg-[#F7F9FA] px-4 py-5 text-center text-sm text-[#8495A1]">
                                    Mentor belum menambahkan portfolio.
                                </p>
                            )}
                        </section>

                        {/* REVIEW */}
                        <section className="rounded-2xl border border-[#D8E3E9] bg-white p-6 shadow-[0_2px_8px_rgba(38,65,80,0.06)]">
                            <div className="mb-6 flex items-start gap-4">
                                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#F8EEF6] text-[#8A4A80]">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1.8"
                                            d="M21 11.5a8.38 8.38 0 01-9 8.5 8.7 8.7 0 01-4-.9L3 21l1.9-4.3A8.4 8.4 0 013 11.5 9 9 0 1121 11.5z"
                                        />
                                    </svg>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#172033]">
                                        Review Mentor
                                    </h2>
                                    <p className="mt-1 text-sm text-[#7A8B99]">
                                        Ulasan dari mahasiswa yang telah
                                        mengikuti mentoring.
                                    </p>
                                </div>
                            </div>

                            {/* RATING SUMMARY */}
                            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-[#E8E1C8] bg-[#FFFDF6] p-5">
                                    <p className="text-sm font-medium text-[#7A8B99]">
                                        Rating Rata-rata
                                    </p>

                                    <div className="mt-2 flex items-end gap-2">
                                        <span className="text-4xl font-bold text-[#172033]">
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <span className="mb-1 text-sm text-[#9AA7B1]">
                                            / 5
                                        </span>
                                    </div>

                                    <div className="mt-2">
                                        {renderStars(averageRating)}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#D9E8EE] bg-[#F5FAFC] p-5">
                                    <p className="text-sm font-medium text-[#7A8B99]">
                                        Total Review
                                    </p>
                                    <p className="mt-2 text-4xl font-bold text-[#172033]">
                                        {reviewCount}
                                    </p>
                                    <p className="mt-1 text-sm text-[#7A8B99]">
                                        ulasan mahasiswa
                                    </p>
                                </div>
                            </div>

                            {/* REVIEW LIST */}
                            {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((review, index) => {
                                        const studentName =
                                            review.student?.name ||
                                            review.user?.name ||
                                            "Mahasiswa";

                                        const rating = Number(
                                            review.rating || 0,
                                        );

                                        return (
                                            <div
                                                key={review.id || index}
                                                className="rounded-xl border border-[#D8E3E9] bg-white p-5 transition hover:border-[#B7CCD8]"
                                            >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#E6EFF4] font-semibold text-[#6594B1]">
                                                            {studentName
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-[#263748]">
                                                                {studentName}
                                                            </p>

                                                            {review.created_at && (
                                                                <p className="mt-0.5 text-xs text-[#9AA7B1]">
                                                                    {new Date(
                                                                        review.created_at,
                                                                    ).toLocaleDateString(
                                                                        "id-ID",
                                                                        {
                                                                            day: "numeric",
                                                                            month: "long",
                                                                            year: "numeric",
                                                                        },
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {renderStars(
                                                        rating,
                                                        "h-4 w-4",
                                                    )}
                                                </div>

                                                {review.feedback && (
                                                    <p className="mt-4 border-t border-[#EDF1F3] pt-4 text-sm leading-6 text-[#5E6F7D]">
                                                        {review.feedback}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-[#C9D7DF] bg-[#F7FAFB] p-8 text-center">
                                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#E6EFF4] text-[#6594B1]">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1.8"
                                                d="M21 11.5a8.38 8.38 0 01-9 8.5 8.7 8.7 0 01-4-.9L3 21l1.9-4.3A8.4 8.4 0 013 11.5 9 9 0 1121 11.5z"
                                            />
                                        </svg>
                                    </div>

                                    <p className="font-medium text-[#4C5F6D]">
                                        Belum ada review
                                    </p>
                                    <p className="mt-1 text-sm text-[#8998A3]">
                                        Belum ada mahasiswa yang memberikan
                                        ulasan untuk mentor ini.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-6 overflow-hidden rounded-2xl border border-[#C9DCE6] bg-white shadow-[0_3px_12px_rgba(38,65,80,0.09)]">
                            {/* HEADER */}
                            <div className="border-b border-[#C9DCE6] bg-[#E6EFF4] px-6 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6594B1] shadow-sm">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="9"
                                                strokeWidth="1.8"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeWidth="1.8"
                                                d="M12 11v5M12 8h.01"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-[#6594B1]">
                                            Detail Mentor
                                        </p>
                                        <h2 className="mt-0.5 text-xl font-bold text-[#172033]">
                                            Informasi Mentoring
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 pb-6">
                                {/* JENIS MENTORING */}
                                <div className="flex gap-4 border-b border-[#EDF1F3] py-5">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#E6EFF4] text-[#6594B1]">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <rect
                                                x="3"
                                                y="5"
                                                width="18"
                                                height="15"
                                                rx="2"
                                                strokeWidth="1.8"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeWidth="1.8"
                                                d="M8 5V3h8v2M3 10h18"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#91A0AA]">
                                            Jenis Mentoring
                                        </p>
                                        <p className="mt-1 font-semibold text-[#263748]">
                                            {mentoringType}
                                        </p>
                                    </div>
                                </div>

                                {/* HARGA MENTORING */}
                                {hasPaidSlots && (
                                    <div className="flex gap-4 border-b border-[#EDF1F3] py-5">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EAF5E1] text-[#5C6F2B]">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <rect
                                                    x="3"
                                                    y="5"
                                                    width="18"
                                                    height="14"
                                                    rx="2"
                                                    strokeWidth="1.8"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeWidth="1.8"
                                                    d="M3 9h18M16 15h2"
                                                />
                                            </svg>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-[#91A0AA]">
                                                Harga Mentoring
                                            </p>
                                            <p className="mt-1 text-lg font-bold text-[#263748]">
                                                {priceLabel}
                                            </p>
                                            <p className="text-xs text-[#7A8B99]">
                                                Per sesi berbayar
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* JADWAL TERDEKAT */}
                                <div className="flex gap-4 py-5">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#F0F1FA] text-[#6874A5]">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <rect
                                                x="3"
                                                y="5"
                                                width="18"
                                                height="16"
                                                rx="2"
                                                strokeWidth="1.8"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeWidth="1.8"
                                                d="M8 3v4M16 3v4M3 10h18"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-[#91A0AA]">
                                            Jadwal Terdekat
                                        </p>

                                        {isMentorAvailable ? (
                                            <>
                                                <p className="mt-1 font-semibold text-[#263748]">
                                                    {nearestDayLabel}
                                                </p>
                                                <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#EAF5E1] px-3 py-1.5 text-sm font-semibold text-[#5C6F2B]">
                                                    <span className="h-2 w-2 rounded-full bg-[#91D06C]" />
                                                    Tersedia
                                                </span>
                                            </>
                                        ) : (
                                            <p className="mt-1 text-sm font-semibold text-[#697983]">
                                                Belum ada jadwal tersedia
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* CTA */}
                                <div className="border-t border-[#EDF1F3] pt-5">
                                    {isMentorAvailable ? (
                                        <a
                                            href={`/mentors/${mentor.user_id}/booking`}
                                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#91D06C] px-5 py-3.5 text-sm font-bold text-[#30451A] shadow-sm transition hover:bg-[#86C761] hover:shadow-md"
                                        >
                                            Pilih Mentor
                                            <svg
                                                className="h-4 w-4 transition group-hover:translate-x-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="1.8"
                                                    d="M5 12h14m-6-6 6 6-6 6"
                                                />
                                            </svg>
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full cursor-not-allowed rounded-xl bg-[#E7ECEF] px-5 py-3.5 text-sm font-semibold text-[#82919A]"
                                        >
                                            Mentor Tidak Tersedia
                                        </button>
                                    )}

                                    <p className="mt-3 text-center text-xs leading-5 text-[#95A2AA]">
                                        Lihat jadwal ketersediaan selengkapnya
                                        setelah memilih mentor.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
