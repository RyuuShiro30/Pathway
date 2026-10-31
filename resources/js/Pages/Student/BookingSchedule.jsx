import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertBanner,
    Badge,
    Button,
    Card,
    EmptyState,
    themeTokens,
} from '@/Components/ui';

const weekdayByUtcDay = [
    'minggu',
    'senin',
    'selasa',
    'rabu',
    'kamis',
    'jumat',
    'sabtu',
];

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    timeZone: 'UTC',
});

const monthYearFormatter = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
});

const filters = [
    { value: 'semua', label: 'Semua' },
    { value: 'pagi', label: 'Pagi (09:00 - 12:00)' },
    { value: 'siang', label: 'Siang (13:00 - 16:00)' },
    { value: 'sore', label: 'Sore / Malam (17:00 - 21:00)' },
];

function getInitials(name) {
    if (!name) return 'M';
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'M'
    );
}

function parseDateParts(date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');

    if (!match) {
        return null;
    }

    return {
        year: Number(match[1]),
        month: Number(match[2]) - 1,
        day: Number(match[3]),
    };
}

function getWindowDates(from, until) {
    const start = parseDateParts(from);
    const end = parseDateParts(until);

    if (!start || !end) {
        return [];
    }

    const dates = [];
    const current = new Date(Date.UTC(start.year, start.month, start.day, 12));
    const final = Date.UTC(end.year, end.month, end.day, 12);

    while (current.getTime() <= final) {
        dates.push(current.toISOString().slice(0, 10));
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
}

function getWeekdayForDate(date) {
    const parts = parseDateParts(date);

    if (!parts) {
        return null;
    }

    return weekdayByUtcDay[
        new Date(Date.UTC(parts.year, parts.month, parts.day, 12)).getUTCDay()
    ];
}

function formatDate(date, formatter = dateFormatter) {
    const parts = parseDateParts(date);

    return parts
        ? formatter.format(
              new Date(Date.UTC(parts.year, parts.month, parts.day, 12)),
          )
        : '';
}

function timeToMinutes(time) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time ?? '');

    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function formatMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

function expandSlotsForDate(availabilitySchedule, date) {
    const weekday = getWeekdayForDate(date);

    if (!weekday || !Array.isArray(availabilitySchedule)) {
        return [];
    }

    const seenSegmentTimes = new Set();
    const segments = availabilitySchedule.flatMap((slot, slotIndex) => {
        if (
            String(slot?.day ?? '').toLowerCase() !== weekday ||
            !slot?.start ||
            !slot?.end
        ) {
            return [];
        }

        const start = timeToMinutes(slot.start);
        const end = timeToMinutes(slot.end);

        if (start === null || end === null || end <= start) {
            return [];
        }

        const type = slot.type === 'berbayar' ? 'berbayar' : 'gratis';
        const price =
            type === 'berbayar' && Number.isSafeInteger(Number(slot.price))
                ? Number(slot.price)
                : 0;
        const segments = [];

        for (
            let segmentStart = start;
            segmentStart + 60 <= end;
            segmentStart += 60
        ) {
            const segmentEnd = segmentStart + 60;
            const segmentKey = `${segmentStart}-${segmentEnd}`;

            if (seenSegmentTimes.has(segmentKey)) {
                continue;
            }

            seenSegmentTimes.add(segmentKey);

            segments.push({
                id: `${slotIndex}-${segmentStart}`,
                date,
                start: formatMinutes(segmentStart),
                end: formatMinutes(segmentEnd),
                startMinutes: segmentStart,
                type,
                price,
            });
        }

        return segments;
    });

    return segments.sort(
        (first, second) => first.startMinutes - second.startMinutes,
    );
}

function findCoveringAvailabilitySlot(availabilitySchedule, date, start, end) {
    const weekday = getWeekdayForDate(date);

    if (!weekday || !Array.isArray(availabilitySchedule)) {
        return null;
    }

    return (
        availabilitySchedule.find((slot) => {
            if (
                String(slot?.day ?? '').toLowerCase() !== weekday ||
                !slot?.start ||
                !slot?.end
            ) {
                return false;
            }

            const slotStart = timeToMinutes(slot.start);
            const slotEnd = timeToMinutes(slot.end);

            return (
                slotStart !== null &&
                slotEnd !== null &&
                slotStart <= start &&
                slotEnd >= end
            );
        }) ?? null
    );
}

function isContiguousSelection(segments) {
    return segments.every(
        (segment, index) =>
            index === 0 ||
            (segments[index - 1].date === segment.date &&
                segments[index - 1].startMinutes + 60 ===
                    segment.startMinutes),
    );
}

function canSelectRange(segments, date) {
    if (
        segments.length === 0 ||
        segments.length > 2 ||
        segments.some((segment) => segment.date !== date) ||
        !segments.every((segment) => segment.type === segments[0].type) ||
        !isContiguousSelection(segments)
    ) {
        return false;
    }

    return true;
}

function getSegmentUnavailableStatus(segment, busySessions, nowTimestamp) {
    const startInstant = new Date(
        `${segment.date}T${segment.start}:00+07:00`,
    ).getTime();
    const endInstant = new Date(
        `${segment.date}T${segment.end}:00+07:00`,
    ).getTime();
    const isBusy = busySessions.some((session) => {
        const busyStart = new Date(session.schedule_time).getTime();
        const busyEnd = new Date(session.end_time).getTime();

        return (
            Number.isFinite(busyStart) &&
            Number.isFinite(busyEnd) &&
            startInstant < busyEnd &&
            endInstant > busyStart
        );
    });

    if (isBusy) {
        return 'terisi';
    }

    return startInstant <= nowTimestamp ? 'lewat' : null;
}

function canExtendSelection(
    selectedSegments,
    segment,
    date,
    busySessions,
    nowTimestamp,
) {
    if (
        selectedSegments.length === 0 ||
        selectedSegments.length >= 2 ||
        selectedSegments.some(
            (item) =>
                item.date !== date ||
                getSegmentUnavailableStatus(item, busySessions, nowTimestamp),
        ) ||
        getSegmentUnavailableStatus(segment, busySessions, nowTimestamp)
    ) {
        return false;
    }

    const orderedSelection = [...selectedSegments].sort(
        (first, second) => first.startMinutes - second.startMinutes,
    );
    const isAdjacent =
        segment.end === orderedSelection[0].start ||
        segment.start === orderedSelection[orderedSelection.length - 1].end;

    if (!isAdjacent) {
        return false;
    }

    const candidate = [...orderedSelection, segment].sort(
        (first, second) => first.startMinutes - second.startMinutes,
    );

    return canSelectRange(candidate, date);
}

function getPriceForSelection(segments, availabilitySchedule, date) {
    return segments.map((segment) => {
        const coveringSlot = findCoveringAvailabilitySlot(
            availabilitySchedule,
            date,
            segment.startMinutes,
            segment.startMinutes + 60,
        );

        if ((coveringSlot?.type ?? 'gratis') !== 'berbayar') {
            return 0;
        }

        const price = Number(coveringSlot.price);

        return Number.isSafeInteger(price) ? price : 0;
    });
}

function getSegmentStatus(
    segment,
    {
        selectedIds,
        allSegments,
        busySessions,
        nowTimestamp,
    },
) {
    const unavailableStatus = getSegmentUnavailableStatus(
        segment,
        busySessions,
        nowTimestamp,
    );

    if (unavailableStatus) {
        return unavailableStatus;
    }

    if (selectedIds.includes(segment.id)) {
        return 'dipilih';
    }

    const selectedSegments = allSegments
        .filter((item) => selectedIds.includes(item.id))
        .sort((first, second) => first.startMinutes - second.startMinutes);

    return canExtendSelection(
        selectedSegments,
        segment,
        segment.date,
        busySessions,
        nowTimestamp,
    )
        ? 'bisa-ditambahkan'
        : 'tersedia';
}

function formatRupiah(value) {
    return `Rp ${rupiahFormatter.format(value)}`;
}

function getErrorMessage(error) {
    if (Array.isArray(error)) {
        return error.find(Boolean) ?? '';
    }

    return typeof error === 'string' ? error : '';
}

export default function BookingSchedule({
    mentor,
    busy_sessions: busySessions = [],
    booking_window: bookingWindow,
}) {
    const { auth, errors = {}, flash } = usePage().props;
    const availabilitySchedule = Array.isArray(
        mentor?.availability_schedule,
    )
        ? mentor.availability_schedule
        : [];
    const windowDates = useMemo(
        () => getWindowDates(bookingWindow?.from, bookingWindow?.until),
        [bookingWindow?.from, bookingWindow?.until],
    );
    const slotsByDate = useMemo(
        () =>
            Object.fromEntries(
                windowDates.map((date) => [
                    date,
                    expandSlotsForDate(availabilitySchedule, date),
                ]),
            ),
        [availabilitySchedule, windowDates],
    );
    const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
    const safeBusySessions = Array.isArray(busySessions) ? busySessions : [];
    const datesWithSlots = windowDates.filter(
        (date) => (slotsByDate[date] ?? []).length > 0,
    );
    const datesWithSelectableSlots = windowDates.filter((date) =>
        (slotsByDate[date] ?? []).some(
            (segment) =>
                getSegmentStatus(segment, {
                    selectedIds: [],
                    allSegments: slotsByDate[date] ?? [],
                    busySessions: safeBusySessions,
                    nowTimestamp,
                }) === 'tersedia',
        ),
    );
    const [selectedDate, setSelectedDate] = useState(
        () => datesWithSelectableSlots[0] ?? null,
    );
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeFilter, setActiveFilter] = useState('semua');
    const [isErrorDismissed, setIsErrorDismissed] = useState(false);
    const [isSuccessDismissed, setIsSuccessDismissed] = useState(false);
    const scheduleError = getErrorMessage(errors.schedule_time);
    const successMessage =
        typeof flash?.success === 'string' ? flash.success : '';
    const allSegments = selectedDate ? slotsByDate[selectedDate] ?? [] : [];
    const selectedSegments = allSegments
        .filter((segment) => selectedIds.includes(segment.id))
        .sort((first, second) => first.startMinutes - second.startMinutes);
    const visibleSegments = allSegments.filter((segment) => {
        if (activeFilter === 'pagi') {
            return segment.startMinutes < 12 * 60;
        }

        if (activeFilter === 'siang') {
            return (
                segment.startMinutes >= 12 * 60 &&
                segment.startMinutes < 17 * 60
            );
        }

        if (activeFilter === 'sore') {
            return segment.startMinutes >= 17 * 60;
        }

        return true;
    });
    const firstSelected = selectedSegments[0];
    const lastSelected = selectedSegments[selectedSegments.length - 1];
    const durationHours = selectedSegments.length;
    const isSelectionValid =
        canSelectRange(selectedSegments, selectedDate) &&
        selectedSegments.every(
            (segment) =>
                !getSegmentUnavailableStatus(
                    segment,
                    safeBusySessions,
                    nowTimestamp,
                ),
        );
    const hourlyPrices = getPriceForSelection(
        selectedSegments,
        availabilitySchedule,
        selectedDate,
    );
    const totalPrice = hourlyPrices.reduce((total, price) => total + price, 0);
    const isFreeSession = selectedSegments[0]?.type === 'gratis';
    const hasUniformHourlyPrice =
        hourlyPrices.length > 0 &&
        hourlyPrices.every((price) => price === hourlyPrices[0]);
    const pricePerHour = hasUniformHourlyPrice ? hourlyPrices[0] : null;
    const dpAmount = Math.ceil(totalPrice * 0.5);
    const studentName = auth?.user?.name || 'Siti Murid';
    const studentInitials = getInitials(studentName);
    const mentorInitials = getInitials(mentor?.name);
    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNowTimestamp(Date.now());
        }, 60_000);

        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        setIsErrorDismissed(false);
    }, [scheduleError]);

    useEffect(() => {
        setIsSuccessDismissed(false);
    }, [successMessage]);

    function selectDate(date) {
        setSelectedDate(date);
        setSelectedIds([]);
    }

    function toggleSegment(segment) {
        const currentSegments = allSegments
            .filter((item) => selectedIds.includes(item.id))
            .sort((first, second) => first.startMinutes - second.startMinutes);

        if (selectedIds.includes(segment.id)) {
            if (currentSegments.length === 1) {
                setSelectedIds([]);
                return;
            }

            if (
                segment.id === currentSegments[0].id ||
                segment.id === currentSegments[currentSegments.length - 1].id
            ) {
                setSelectedIds(
                    currentSegments
                        .filter((item) => item.id !== segment.id)
                        .map((item) => item.id),
                );
            }

            return;
        }

        if (currentSegments.length === 0) {
            setSelectedIds([segment.id]);
            return;
        }

        if (
            !canExtendSelection(
                currentSegments,
                segment,
                selectedDate,
                safeBusySessions,
                nowTimestamp,
            )
        ) {
            setSelectedIds([segment.id]);
            return;
        }

        setSelectedIds([
            ...currentSegments.map((item) => item.id),
            segment.id,
        ]);
    }

    function continueToConfirmation() {
        if (
            !firstSelected ||
            !selectedDate ||
            durationHours === 0 ||
            !isSelectionValid
        ) {
            return;
        }

        router.get(
            route('student.booking.confirm', mentor.id),
            {
                date: selectedDate,
                start: firstSelected.start,
                duration_hours: durationHours,
            },
            {
                preserveScroll: true,
            },
        );
    }

    const hasSlotsInWindow = datesWithSlots.length > 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#527D98]/20 selection:text-[#527D98]">
            <Head title="Pilih Jadwal Mentoring - Pathway" />

            {/* Design Tokens Injection from themeTokens */}
            <style>{`
                :root {
                    --mentor-primary: ${themeTokens.colors.primary};
                    --mentor-primary-dark: ${themeTokens.colors.primaryDark};
                    --mentor-header-bg: ${themeTokens.colors.headerBg};
                    --mentor-card-bg: ${themeTokens.colors.cardBg};
                    --mentor-border: ${themeTokens.colors.border};
                }
            `}</style>

            {/* TOP NAVIGATION BAR */}
            <header className="sticky top-0 z-40 bg-[#548299] text-white shadow-md">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex shrink-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl font-extrabold text-white shadow-inner">
                            P
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tight">
                                Pathway
                            </span>
                            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
                                Mentee Portal
                            </span>
                        </div>
                    </div>

                    <nav
                        aria-label="Navigasi mentee"
                        className="order-4 flex w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm font-medium xl:order-none xl:w-auto"
                    >
                        <span className="rounded-full px-4 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer">
                            Dashboard
                        </span>
                        <span className="rounded-full px-4 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer">
                            Cari Mentor
                        </span>
                        <span
                            aria-current="page"
                            className="rounded-full bg-[#3E637A] px-4 py-1.5 font-semibold text-white shadow-sm"
                        >
                            Booking Mentoring
                        </span>
                        <span className="rounded-full px-4 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer">
                            Materi &amp; Modul
                        </span>
                    </nav>

                    <div className="flex shrink-0 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                        </div>
                        <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pl-1 pr-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5ECDD] text-xs font-bold text-[#34443D] shadow-sm">
                                {studentInitials}
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="max-w-[130px] truncate text-xs font-semibold leading-tight text-white">
                                    {studentName}
                                </p>
                                <p className="text-[10px] text-white/70">
                                    Mentee Reguler
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* BREADCRUMBS */}
                <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-400">
                    <ol className="flex flex-wrap items-center gap-1.5">
                        <li className="hover:text-slate-600 cursor-pointer">Portal Mentee</li>
                        <li aria-hidden="true">/</li>
                        <li className="hover:text-slate-600 cursor-pointer">Cari Mentor</li>
                        <li aria-hidden="true">/</li>
                        <li className="hover:text-slate-600 cursor-pointer">{mentor?.name || 'Mentor'}</li>
                        <li aria-hidden="true">/</li>
                        <li className="font-semibold text-slate-700">Pilih Jadwal</li>
                    </ol>
                </nav>

                {/* NOTIFICATIONS: SUCCESS & ERROR BANNERS */}
                {successMessage && !isSuccessDismissed && (
                    <div
                        role="status"
                        className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs sm:text-sm font-medium text-emerald-800 shadow-sm"
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs">
                                ✓
                            </span>
                            <p>{successMessage}</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Tutup pesan sukses"
                            onClick={() => setIsSuccessDismissed(true)}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors focus:outline-none"
                        >
                            ×
                        </button>
                    </div>
                )}

                {scheduleError && !isErrorDismissed && (
                    <AlertBanner
                        variant="danger"
                        title="Perhatian"
                        description={scheduleError}
                        action={
                            <button
                                type="button"
                                aria-label="Tutup pesan kesalahan"
                                onClick={() => setIsErrorDismissed(true)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-base font-semibold text-rose-700 hover:bg-rose-100 transition-colors focus:outline-none"
                            >
                                ×
                            </button>
                        }
                    />
                )}

                {/* PAGE HEADER */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/80 px-3 py-1 text-xs font-semibold text-[#527D98]">
                                <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                WIB (GMT+07:00) Jakarta
                                <span className="underline cursor-pointer hover:text-[#3E637A] font-bold ml-0.5">Ubah</span>
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                Pilih Jadwal Mentoring 1-on-1
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                                Pilih tanggal dan slot waktu konsultasi bersama mentor ahli Anda.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => window.history.back()}
                        className="rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
                    >
                        <span aria-hidden="true">←</span>
                        Kembali ke Profil Mentor
                    </Button>
                </div>

                <Card
                    as="section"
                    aria-labelledby="mentor-card-heading"
                    className="p-5 sm:p-6"
                >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#527D98] text-lg font-bold text-white shadow-sm">
                                    {mentorInitials}
                                </div>
                                <span
                                    aria-hidden="true"
                                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-white"
                                    title="Mentor Terverifikasi"
                                >
                                    ✓
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h2
                                        id="mentor-card-heading"
                                        className="text-lg font-bold text-slate-900 sm:text-xl"
                                    >
                                        {mentor?.name}
                                    </h2>
                                    {mentor?.avg_rating !== null &&
                                        mentor?.avg_rating !== undefined && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                                <span aria-hidden="true">★</span>
                                                {Number(mentor.avg_rating).toFixed(1)}
                                                {mentor?.reviews_count ? (
                                                    <span className="font-normal text-amber-600">
                                                        ({mentor.reviews_count} ulasan)
                                                    </span>
                                                ) : null}
                                            </span>
                                        )}
                                </div>
                                {mentor?.expertise && (
                                    <p className="mt-0.5 text-xs font-semibold text-[#527D98] sm:text-sm">
                                        {mentor.expertise}
                                    </p>
                                )}
                                {mentor?.bio && (
                                    <p className="mt-2.5 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                                        {mentor.bio.length > 220
                                            ? `${mentor.bio.slice(0, 217)}...`
                                            : mentor.bio}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50/70 px-3 py-1 text-[11px] font-semibold text-slate-700">
                                <span className="text-[#527D98]">⚡</span>
                                Tingkat Respon 99% (&lt; 2 Jam)
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-[11px] font-semibold text-slate-700">
                                <svg
                                    className="h-3.5 w-3.5 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                                Meet via Google Meet / Discord
                            </span>
                        </div>
                    </div>
                </Card>

                {!hasSlotsInWindow ? (
                    <Card as="section" className="px-5 py-16 text-center">
                        <div
                            aria-hidden="true"
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-2xl text-[#527D98] shadow-xs"
                        >
                            <svg
                                className="h-8 w-8 text-[#527D98]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-base font-bold text-slate-900 sm:text-lg">
                            Belum ada jadwal tersedia
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                            Mentor belum memiliki slot mentoring dalam rentang
                            tanggal yang dapat dipilih. Silakan coba lagi nanti.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="space-y-6">
                            <Card
                                as="section"
                                aria-labelledby="date-heading"
                                className="p-5 sm:p-6"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#527D98] text-xs font-bold text-white shadow-xs">
                                            1
                                        </span>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                LANGKAH 1
                                            </p>
                                            <h2
                                                id="date-heading"
                                                className="text-base font-bold text-slate-900"
                                            >
                                                Pilih Tanggal Mentoring
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold capitalize text-slate-700">
                                            {selectedDate
                                                ? formatDate(selectedDate, monthYearFormatter)
                                                : (windowDates[0]
                                                    ? formatDate(windowDates[0], monthYearFormatter)
                                                    : 'November 2026')}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                aria-label="Bulan sebelumnya"
                                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-xs text-slate-500 transition hover:bg-slate-50"
                                            >
                                                &lt;
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Bulan berikutnya"
                                                className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 text-xs text-slate-500 transition hover:bg-slate-50"
                                            >
                                                &gt;
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-2 text-xs font-medium text-slate-500">
                                    {formatDate(bookingWindow?.from)} –{' '}
                                    {formatDate(bookingWindow?.until)}
                                </p>

                                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:grid-cols-11">
                                    {windowDates.map((date) => {
                                        const hasSlots =
                                            (slotsByDate[date] ?? []).length >
                                            0;
                                        const isSelected = selectedDate === date;

                                        return (
                                            <button
                                                key={date}
                                                type="button"
                                                aria-pressed={isSelected}
                                                disabled={!hasSlots}
                                                onClick={() => selectDate(date)}
                                                className={`relative flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-1 ${
                                                    isSelected
                                                        ? 'border-[#527D98] bg-[#F0F7FA] text-[#3E637A] ring-2 ring-[#527D98]/30 shadow-xs'
                                                        : hasSlots
                                                          ? 'border-slate-200 bg-white text-slate-700 hover:border-[#527D98] hover:bg-slate-50'
                                                          : 'cursor-not-allowed border-slate-100 bg-slate-50/60 text-slate-300'
                                                }`}
                                            >
                                                <span
                                                    className={`text-[11px] capitalize ${
                                                        isSelected
                                                            ? 'font-bold text-[#3E637A]'
                                                            : hasSlots
                                                              ? 'font-medium text-slate-500'
                                                              : 'text-slate-300'
                                                    }`}
                                                >
                                                    {formatDate(
                                                        date,
                                                        shortDateFormatter,
                                                    )}
                                                </span>
                                                <span
                                                    className={`text-sm font-bold ${
                                                        isSelected
                                                            ? 'text-[#3E637A]'
                                                            : hasSlots
                                                              ? 'text-slate-800'
                                                              : 'text-slate-300'
                                                    }`}
                                                >
                                                    {date.slice(8, 10)}
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        isSelected
                                                            ? 'bg-[#527D98]'
                                                            : hasSlots
                                                              ? 'bg-emerald-500'
                                                              : 'bg-slate-200'
                                                    }`}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        Tersedia slot
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-slate-300" />
                                        Penuh / Tidak tersedia
                                    </span>
                                </div>
                            </Card>

                            <Card
                                as="section"
                                aria-labelledby="time-heading"
                                className="p-5 sm:p-6"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#527D98] text-xs font-bold text-white shadow-xs">
                                            2
                                        </span>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                LANGKAH 2
                                            </p>
                                            <h2
                                                id="time-heading"
                                                className="text-base font-bold capitalize text-slate-900"
                                            >
                                                Pilih Slot Waktu
                                                {selectedDate
                                                    ? ` · ${formatDate(selectedDate)}`
                                                    : ''}
                                            </h2>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        Semua waktu ditampilkan dalam WIB
                                    </span>
                                </div>

                                <p className="mt-2.5 text-xs text-slate-500">
                                    <span className="mr-1">ⓘ</span>
                                    Maksimal 2 slot berurutan per sesi pemesanan.
                                </p>

                                <div
                                    role="group"
                                    aria-label="Filter waktu"
                                    className="mt-4 flex flex-wrap gap-2"
                                >
                                    {filters.map((filter) => {
                                        const labelText =
                                            filter.value === 'semua' &&
                                            allSegments.length > 0
                                                ? `Semua (${allSegments.length} Tersedia)`
                                                : filter.label;

                                        return (
                                            <button
                                                key={filter.value}
                                                type="button"
                                                aria-pressed={
                                                    activeFilter === filter.value
                                                }
                                                onClick={() =>
                                                    setActiveFilter(filter.value)
                                                }
                                                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-1 ${
                                                    activeFilter === filter.value
                                                        ? 'border-transparent bg-[#527D98] text-white shadow-xs'
                                                        : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                                                }`}
                                            >
                                                {labelText}
                                            </button>
                                        );
                                    })}
                                </div>

                                {visibleSegments.length > 0 ? (
                                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {visibleSegments.map((segment) => {
                                            const status = getSegmentStatus(
                                                segment,
                                                {
                                                    selectedIds,
                                                    allSegments,
                                                    busySessions:
                                                        safeBusySessions,
                                                    nowTimestamp,
                                                },
                                            );
                                            const isDisabled =
                                                status === 'terisi' ||
                                                status === 'lewat';
                                            const isSelected =
                                                status === 'dipilih';
                                            const canAdd =
                                                status === 'bisa-ditambahkan';

                                            return (
                                                <button
                                                    key={segment.id}
                                                    type="button"
                                                    aria-pressed={isSelected}
                                                    disabled={isDisabled}
                                                    onClick={() =>
                                                        toggleSegment(segment)
                                                    }
                                                    className={`flex min-h-[96px] flex-col justify-between gap-3 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-1 ${
                                                        isSelected
                                                            ? 'border-[#527D98] bg-[#F0F7FA] ring-2 ring-[#527D98]/30 shadow-xs'
                                                            : canAdd
                                                              ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500 hover:bg-emerald-50/70'
                                                              : isDisabled
                                                                ? 'cursor-not-allowed border-slate-100 bg-slate-50/60 text-slate-400'
                                                                : 'border-slate-200 bg-white hover:border-[#527D98] hover:bg-slate-50 shadow-xs'
                                                    }`}
                                                >
                                                    <span className="flex w-full items-center justify-between gap-2">
                                                        <span
                                                            className={`text-sm font-bold sm:text-base ${
                                                                isDisabled
                                                                    ? 'text-slate-400 line-through'
                                                                    : 'text-slate-900'
                                                            }`}
                                                        >
                                                            {segment.start} –{' '}
                                                            {segment.end} WIB
                                                        </span>

                                                        {isSelected ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#527D98]">
                                                                ✓ Dipilih
                                                            </span>
                                                        ) : status === 'terisi' ? (
                                                            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                                                Sudah Terisi
                                                            </span>
                                                        ) : status === 'lewat' ? (
                                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                                                Lewat
                                                            </span>
                                                        ) : canAdd ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                Bisa ditambah
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                Tersedia
                                                            </span>
                                                        )}
                                                    </span>

                                                    <span className="flex w-full items-center justify-between gap-2 pt-1">
                                                        <span
                                                            className={`text-xs font-semibold ${
                                                                segment.type === 'berbayar'
                                                                    ? isDisabled
                                                                        ? 'text-slate-400 line-through'
                                                                        : 'text-slate-700'
                                                                    : 'rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700'
                                                            }`}
                                                        >
                                                            {segment.type === 'berbayar'
                                                                ? `${formatRupiah(segment.price)} / jam`
                                                                : 'Gratis'}
                                                        </span>

                                                        <span className="text-[11px] font-medium text-slate-400">
                                                            {isSelected
                                                                ? 'Tersedia'
                                                                : isDisabled
                                                                  ? 'Tidak tersedia'
                                                                  : 'Pilih slot'}
                                                        </span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <EmptyState
                                        message="Tidak ada slot pada waktu ini untuk filter yang dipilih."
                                        className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-10"
                                    />
                                )}
                            </Card>

                            {/* NOTICE INFO CARD */}
                            <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">
                                    ⚠
                                </span>
                                <div className="text-xs leading-relaxed">
                                    <p className="font-bold text-slate-800">
                                        Perlu diskusi topik spesifik sebelum booking?
                                    </p>
                                    <p className="mt-0.5 text-slate-500">
                                        Anda dapat menuliskan catatan tujuan mentoring, repositori GitHub, atau isu arsitektur pada langkah konfirmasi berikutnya.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Card
                                as="aside"
                                aria-labelledby="summary-heading"
                                className="p-5 sm:p-6 lg:sticky lg:top-24"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            RINGKASAN
                                        </p>
                                        <h2
                                            id="summary-heading"
                                            className="mt-0.5 text-base font-bold text-slate-900 sm:text-lg"
                                        >
                                            Ringkasan Pemesanan
                                        </h2>
                                    </div>
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            />
                                        </svg>
                                    </span>
                                </div>

                                <dl className="mt-4 space-y-3 text-xs sm:text-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-slate-500">Mentor</dt>
                                        <dd className="flex items-center gap-1.5 font-bold text-slate-800">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#527D98] text-[9px] font-bold text-white">
                                                {mentorInitials}
                                            </span>
                                            {mentor?.name}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-slate-500">Tanggal</dt>
                                        <dd className="font-bold capitalize text-slate-800">
                                            {selectedDate
                                                ? formatDate(selectedDate)
                                                : 'Pilih tanggal'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-slate-500">Waktu Sesi</dt>
                                        <dd className="font-bold text-slate-800">
                                            {firstSelected && lastSelected
                                                ? `${firstSelected.start} – ${lastSelected.end} WIB (${durationHours} Jam)`
                                                : 'Pilih slot'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <dt className="text-slate-500">Media Konsultasi</dt>
                                        <dd className="font-medium text-slate-700">
                                            Google Meet / Discord
                                        </dd>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <dt className="text-slate-500">
                                                Biaya Mentoring {durationHours > 0 ? `(${durationHours} Jam)` : ''}
                                            </dt>
                                            <dd className="font-bold text-slate-800">
                                                {durationHours === 0
                                                    ? '—'
                                                    : isFreeSession
                                                      ? 'Gratis'
                                                      : pricePerHour === null
                                                        ? formatRupiah(totalPrice)
                                                        : `${formatRupiah(pricePerHour)} x ${durationHours} jam`}
                                            </dd>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                                        <dt className="font-bold text-slate-900 sm:text-base">
                                            Total Biaya Sesi
                                        </dt>
                                        <dd className="text-base font-black text-slate-900 sm:text-lg">
                                            {durationHours === 0
                                                ? '—'
                                                : isFreeSession
                                                  ? 'Gratis'
                                                  : formatRupiah(totalPrice)}
                                        </dd>
                                    </div>

                                    {durationHours > 0 && !isFreeSession && (
                                        <div className="rounded-xl border border-sky-100 bg-[#F0F7FA] p-3 space-y-1">
                                            <div className="flex items-center justify-between font-bold text-slate-800">
                                                <span>DP Dibayar Sekarang (50%)</span>
                                                <span className="text-sm font-black text-[#527D98]">
                                                    {formatRupiah(dpAmount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                <span>Pelunasan setelah sesi selesai:</span>
                                                <span>{formatRupiah(totalPrice - dpAmount)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {durationHours > 0 && isFreeSession && (
                                        <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                            <dt className="font-semibold text-emerald-800">
                                                Sesi Mentoring
                                            </dt>
                                            <dd className="font-bold text-emerald-700">
                                                Gratis · Tanpa DP
                                            </dd>
                                        </div>
                                    )}
                                </dl>

                                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                                    <div className="flex items-start gap-2 text-[11px] leading-tight text-slate-500">
                                        <svg
                                            className="h-4 w-4 shrink-0 text-emerald-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                            />
                                        </svg>
                                        <span>100% Garansi Pengembalian Dana jika mentor berhalangan.</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-[11px] leading-tight text-slate-500">
                                        <svg
                                            className="h-4 w-4 shrink-0 text-sky-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <span>Konfirmasi instan otomatis terhubung ke kalender.</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    disabled={
                                        durationHours === 0 || !isSelectionValid
                                    }
                                    onClick={continueToConfirmation}
                                    className="mt-5 w-full py-3 text-xs sm:text-sm font-bold rounded-xl shadow-sm"
                                >
                                    Lanjut ke Konfirmasi
                                    <span aria-hidden="true">→</span>
                                </Button>

                                <p className="mt-3 text-center text-[10px] text-slate-400">
                                    Harga final divalidasi aman oleh server gateway Pathway.
                                </p>
                            </Card>

                            {/* HELP CARD */}
                            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-center text-xs text-slate-600 shadow-xs">
                                <p className="font-medium text-slate-500">
                                    Jadwal yang Anda cari tidak tersedia?
                                </p>
                                <span className="mt-1 inline-block font-semibold text-[#527D98] hover:text-[#3E637A] underline cursor-pointer">
                                    Ajukan permintaan jadwal privat khusus
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className="mx-auto max-w-7xl mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-300 text-[10px] font-bold text-white">
                        P
                    </span>
                    <p>© 2026 Pathway Mentoring Platform. Hak Cipta Dilindungi.</p>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                    <span className="hover:text-slate-600 cursor-pointer">Panduan Mentee</span>
                    <span className="hover:text-slate-600 cursor-pointer">Kebijakan Reschedule</span>
                    <span className="hover:text-slate-600 cursor-pointer">Pusat Bantuan</span>
                </div>
            </footer>
        </div>
    );
}
