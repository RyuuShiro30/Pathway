import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
});

const filters = [
    { value: 'semua', label: 'Semua' },
    { value: 'pagi', label: 'Pagi' },
    { value: 'siang', label: 'Siang' },
    { value: 'sore', label: 'Sore/Malam' },
];

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
                slotId: slotIndex,
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
            index === 0 || segments[index - 1].end === segment.start,
    );
}

function canSelectRange(segments, availabilitySchedule, date) {
    if (
        segments.length === 0 ||
        segments.length > 4 ||
        !isContiguousSelection(segments)
    ) {
        return false;
    }

    return Boolean(
        findCoveringAvailabilitySlot(
            availabilitySchedule,
            date,
            segments[0].startMinutes,
            segments[segments.length - 1].startMinutes + 60,
        ),
    );
}

function canExtendSelection(
    selectedSegments,
    segment,
    availabilitySchedule,
    date,
) {
    if (
        selectedSegments.length === 0 ||
        selectedSegments.length >= 4 ||
        selectedSegments.some((item) => item.date !== date)
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

    return canSelectRange(candidate, availabilitySchedule, date);
}

function getPriceForSelection(segments, availabilitySchedule, date) {
    if (segments.length === 0) {
        return 0;
    }

    const coveringSlot = findCoveringAvailabilitySlot(
        availabilitySchedule,
        date,
        segments[0].startMinutes,
        segments[segments.length - 1].startMinutes + 60,
    );
    const type = coveringSlot?.type === 'berbayar' ? 'berbayar' : 'gratis';

    if (type === 'gratis') {
        return 0;
    }

    const price = Number(coveringSlot?.price);

    return Number.isSafeInteger(price) ? price : 0;
}

function getSegmentStatus(
    segment,
    {
        selectedIds,
        allSegments,
        busySessions,
        nowTimestamp,
        availabilitySchedule,
    },
) {
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

    if (startInstant <= nowTimestamp) {
        return 'lewat';
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
        availabilitySchedule,
        segment.date,
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
    const { errors = {} } = usePage().props;
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
                    availabilitySchedule,
                }) === 'tersedia',
        ),
    );
    const [selectedDate, setSelectedDate] = useState(
        () => datesWithSelectableSlots[0] ?? null,
    );
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeFilter, setActiveFilter] = useState('semua');
    const [isErrorDismissed, setIsErrorDismissed] = useState(false);
    const scheduleError = getErrorMessage(errors.schedule_time);
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
    const pricePerHour = getPriceForSelection(
        selectedSegments,
        availabilitySchedule,
        selectedDate,
    );
    const totalPrice = pricePerHour * durationHours;
    const dpAmount = Math.ceil(totalPrice * 0.5);
    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNowTimestamp(Date.now());
        }, 60_000);

        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        setIsErrorDismissed(false);
    }, [scheduleError]);

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
                availabilitySchedule,
                selectedDate,
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
        if (!firstSelected || !selectedDate || durationHours === 0) {
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
        <div className="min-h-screen bg-[#F7F5F0] text-[#34443D]">
            <Head title="Pilih Jadwal Mentoring" />

            <header className="bg-[#6594B1] text-white shadow-sm">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
                            P
                        </div>
                        <span className="text-lg font-bold tracking-wide">
                            Pathway
                        </span>
                    </div>
                    <span className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold">
                        Student
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
                {scheduleError && !isErrorDismissed && (
                    <section
                        role="alert"
                        aria-labelledby="schedule-error-heading"
                        className="flex items-start justify-between gap-4 rounded-xl border border-[#E7C7C1] bg-[#FBEEEB] px-4 py-4 text-[#8E453D] shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <span
                                aria-hidden="true"
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 font-bold"
                            >
                                !
                            </span>
                            <div>
                                <h2
                                    id="schedule-error-heading"
                                    className="font-bold"
                                >
                                    Perhatian Slot Waktu
                                </h2>
                                <p className="mt-1 text-sm">{scheduleError}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            aria-label="Tutup pesan kesalahan"
                            onClick={() => setIsErrorDismissed(true)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-semibold transition-colors hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#A34F45]"
                        >
                            ×
                        </button>
                    </section>
                )}

                <section className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full bg-[#E7EEF1] px-3 py-1.5 text-xs font-bold text-[#527D98]">
                                WIB (GMT+07:00) Jakarta
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold leading-tight text-[#34443D] sm:text-3xl">
                            Pilih Jadwal Mentoring 1-on-1
                        </h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#D8DED8] bg-white px-4 py-2 text-sm font-semibold text-[#52635A] transition-colors hover:bg-[#F2F3EF] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                    >
                        <span aria-hidden="true">←</span>
                        Kembali
                    </button>
                </section>

                <section
                    aria-labelledby="mentor-card-heading"
                    className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 space-y-2">
                            <h2
                                id="mentor-card-heading"
                                className="text-xl font-bold text-[#34443D]"
                            >
                                {mentor?.name}
                            </h2>
                            {mentor?.expertise && (
                                <p className="text-sm font-medium text-[#6594B1]">
                                    {mentor.expertise}
                                </p>
                            )}
                        </div>
                        {mentor?.avg_rating !== null &&
                            mentor?.avg_rating !== undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7F5F0] px-3 py-1.5 text-sm font-semibold text-[#52635A]">
                                    <span aria-hidden="true">★</span>
                                    {Number(mentor.avg_rating).toFixed(1)}
                                </span>
                            )}
                    </div>
                    {mentor?.bio && (
                        <p className="mt-4 max-w-3xl text-sm leading-6 text-[#69766F]">
                            {mentor.bio.length > 220
                                ? `${mentor.bio.slice(0, 217)}...`
                                : mentor.bio}
                        </p>
                    )}
                </section>

                {!hasSlotsInWindow ? (
                    <section className="rounded-2xl border border-[#E8E5DD] bg-white px-5 py-12 text-center shadow-[0_3px_14px_rgba(52,68,61,0.04)]">
                        <div
                            aria-hidden="true"
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E7EEF1] text-2xl text-[#6594B1]"
                        >
                            ◷
                        </div>
                        <h2 className="mt-4 text-lg font-bold text-[#34443D]">
                            Belum ada jadwal tersedia
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69766F]">
                            Mentor belum memiliki slot mentoring dalam rentang
                            tanggal yang dapat dipilih. Silakan coba lagi nanti.
                        </p>
                    </section>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <div className="space-y-6">
                            <section
                                aria-labelledby="date-heading"
                                className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                            >
                                <div className="flex flex-wrap items-end justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                            Langkah 1
                                        </p>
                                        <h2
                                            id="date-heading"
                                            className="mt-1 text-lg font-bold text-[#34443D]"
                                        >
                                            Pilih tanggal
                                        </h2>
                                    </div>
                                    <p className="text-xs text-[#78827B]">
                                        {formatDate(bookingWindow?.from)} –{' '}
                                        {formatDate(bookingWindow?.until)}
                                    </p>
                                </div>

                                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-11">
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
                                                className={`relative flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 ${
                                                    isSelected
                                                        ? 'border-[#6594B1] bg-[#E7EEF1] text-[#416B85] ring-1 ring-[#6594B1]'
                                                        : hasSlots
                                                          ? 'border-[#E8E5DD] bg-white text-[#52635A] hover:border-[#9EB8C7] hover:bg-[#F7FAFB]'
                                                          : 'cursor-not-allowed border-[#EFEEE9] bg-[#F8F7F4] text-[#B8BDB8]'
                                                }`}
                                            >
                                                <span className="text-[11px] font-semibold capitalize">
                                                    {formatDate(
                                                        date,
                                                        shortDateFormatter,
                                                    )}
                                                </span>
                                                <span className="text-xs font-bold">
                                                    {date.slice(8, 10)}
                                                </span>
                                                {hasSlots && (
                                                    <span
                                                        aria-hidden="true"
                                                        className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                                                            isSelected
                                                                ? 'bg-[#6594B1]'
                                                                : 'bg-[#65B175]'
                                                        }`}
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section
                                aria-labelledby="time-heading"
                                className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                            >
                                <div className="flex flex-wrap items-end justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                            Langkah 2
                                        </p>
                                        <h2
                                            id="time-heading"
                                            className="mt-1 text-lg font-bold capitalize text-[#34443D]"
                                        >
                                            Pilih slot waktu
                                            {selectedDate
                                                ? ` · ${formatDate(selectedDate)}`
                                                : ''}
                                        </h2>
                                    </div>
                                    <span className="text-xs font-medium text-[#78827B]">
                                        Semua waktu ditampilkan dalam WIB
                                    </span>
                                </div>

                                <div
                                    role="group"
                                    aria-label="Filter waktu"
                                    className="mt-5 flex flex-wrap gap-2"
                                >
                                    {filters.map((filter) => (
                                        <button
                                            key={filter.value}
                                            type="button"
                                            aria-pressed={
                                                activeFilter === filter.value
                                            }
                                            onClick={() =>
                                                setActiveFilter(filter.value)
                                            }
                                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 ${
                                                activeFilter === filter.value
                                                    ? 'border-[#6594B1] bg-[#6594B1] text-white'
                                                    : 'border-[#E1E5E0] bg-white text-[#69766F] hover:border-[#9EB8C7] hover:text-[#416B85]'
                                            }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
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
                                                    availabilitySchedule,
                                                },
                                            );
                                            const isDisabled =
                                                status === 'terisi' ||
                                                status === 'lewat';
                                            const isSelected =
                                                status === 'dipilih';
                                            const canAdd =
                                                status === 'bisa-ditambahkan';
                                            const statusLabel =
                                                status === 'terisi'
                                                    ? 'Terisi'
                                                    : status === 'lewat'
                                                      ? 'Lewat'
                                                      : isSelected
                                                        ? 'Dipilih'
                                                        : canAdd
                                                          ? 'Bisa ditambahkan'
                                                          : 'Tersedia';

                                            return (
                                                <button
                                                    key={segment.id}
                                                    type="button"
                                                    aria-pressed={isSelected}
                                                    disabled={isDisabled}
                                                    onClick={() =>
                                                        toggleSegment(segment)
                                                    }
                                                    className={`flex min-h-[92px] flex-col items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 ${
                                                        isSelected
                                                            ? 'border-[#6594B1] bg-[#E7EEF1] ring-1 ring-[#6594B1]'
                                                            : canAdd
                                                              ? 'border-[#9FC9A5] bg-[#F1F7F0] hover:border-[#65B175]'
                                                              : isDisabled
                                                                ? 'cursor-not-allowed border-[#E8E5DD] bg-[#F5F4F0] text-[#9AA19C]'
                                                                : 'border-[#E8E5DD] bg-white hover:border-[#9EB8C7] hover:bg-[#F7FAFB]'
                                                    }`}
                                                >
                                                    <span className="flex w-full items-center justify-between gap-3">
                                                        <span
                                                            className={`text-base font-bold ${
                                                                isDisabled
                                                                    ? 'text-[#9AA19C] line-through'
                                                                    : 'text-[#34443D]'
                                                            }`}
                                                        >
                                                            {segment.start} –{' '}
                                                            {segment.end} WIB
                                                        </span>
                                                        <span className="text-xs font-semibold text-[#78827B]">
                                                            {statusLabel}
                                                        </span>
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                                                            segment.type ===
                                                            'berbayar'
                                                                ? 'bg-[#E7EEF1] text-[#527D98]'
                                                                : 'bg-[#E8F2E8] text-[#477E50]'
                                                        } ${
                                                            isDisabled
                                                                ? 'line-through opacity-70'
                                                                : ''
                                                        }`}
                                                    >
                                                        {segment.type ===
                                                        'berbayar'
                                                            ? `${formatRupiah(segment.price)} / jam`
                                                            : 'Gratis'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="mt-5 rounded-xl bg-[#F7F5F0] px-4 py-5 text-center text-sm text-[#78827B]">
                                        Tidak ada slot pada waktu ini untuk
                                        filter yang dipilih.
                                    </p>
                                )}
                            </section>
                        </div>

                        <aside
                            aria-labelledby="summary-heading"
                            className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.06)] sm:p-6 lg:sticky lg:top-6"
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                Ringkasan
                            </p>
                            <h2
                                id="summary-heading"
                                className="mt-1 text-lg font-bold text-[#34443D]"
                            >
                                Ringkasan Pemesanan
                            </h2>

                            <dl className="mt-5 space-y-4 text-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-[#78827B]">Mentor</dt>
                                    <dd className="text-right font-semibold text-[#34443D]">
                                        {mentor?.name}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-[#78827B]">Tanggal</dt>
                                    <dd className="text-right font-semibold capitalize text-[#34443D]">
                                        {selectedDate
                                            ? formatDate(selectedDate)
                                            : 'Pilih tanggal'}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-[#78827B]">Jam</dt>
                                    <dd className="text-right font-semibold text-[#34443D]">
                                        {firstSelected && lastSelected
                                            ? `${firstSelected.start} – ${lastSelected.end} WIB`
                                            : 'Pilih slot'}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-[#78827B]">Durasi</dt>
                                    <dd className="text-right font-semibold text-[#34443D]">
                                        {durationHours
                                            ? `${durationHours} jam`
                                            : '—'}
                                    </dd>
                                </div>
                                <div className="border-t border-dashed border-[#E1E5E0] pt-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <dt className="text-[#78827B]">
                                            Rincian harga
                                        </dt>
                                        <dd className="text-right font-semibold text-[#34443D]">
                                            {durationHours === 0
                                                ? '—'
                                                : pricePerHour === 0
                                                  ? 'Gratis'
                                                  : `${formatRupiah(pricePerHour)} x ${durationHours} jam`}
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <dt className="font-semibold text-[#52635A]">
                                        Total
                                    </dt>
                                    <dd className="text-lg font-bold text-[#34443D]">
                                        {durationHours === 0
                                            ? '—'
                                            : pricePerHour === 0
                                              ? 'Gratis'
                                              : formatRupiah(totalPrice)}
                                    </dd>
                                </div>
                                {durationHours > 0 && pricePerHour > 0 && (
                                    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#F7F5F0] px-3 py-3">
                                        <dt className="font-medium text-[#69766F]">
                                            DP 50%
                                        </dt>
                                        <dd className="font-bold text-[#34443D]">
                                            {formatRupiah(dpAmount)}
                                        </dd>
                                    </div>
                                )}
                                {durationHours > 0 && pricePerHour === 0 && (
                                    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#E8F2E8] px-3 py-3">
                                        <dt className="font-medium text-[#477E50]">
                                            Sesi
                                        </dt>
                                        <dd className="font-bold text-[#477E50]">
                                            Gratis · tanpa DP
                                        </dd>
                                    </div>
                                )}
                            </dl>

                            <p className="mt-5 text-xs leading-5 text-[#8A938D]">
                                Angka ini merupakan perkiraan. Harga final akan
                                dihitung dan divalidasi oleh server.
                            </p>

                            <button
                                type="button"
                                disabled={durationHours === 0}
                                onClick={continueToConfirmation}
                                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6594B1] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#C8D5DB] disabled:text-white/80"
                            >
                                Lanjut ke Konfirmasi
                                <span aria-hidden="true">→</span>
                            </button>
                        </aside>
                    </div>
                )}
            </main>
        </div>
    );
}
