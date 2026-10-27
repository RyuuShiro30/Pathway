import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

const weekdays = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
];

const timeSlots = Array.from({ length: 16 }, (_, index) => {
    const startHour = index + 6;
    const endHour = startHour + 1;

    return {
        start: `${String(startHour).padStart(2, '0')}:00`,
        end: `${String(endHour).padStart(2, '0')}:00`,
    };
});

const sessionDateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
});

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
});

function formatSessionDateTime(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Waktu tidak tersedia'
        : `${sessionDateTimeFormatter.format(date)} WIB`;
}

function isRefundOverdue(deadline) {
    if (!deadline) {
        return false;
    }

    const date = new Date(deadline);

    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function truncateNotes(notes) {
    if (!notes) {
        return 'Tidak ada catatan dari student.';
    }

    return notes.length > 100 ? `${notes.slice(0, 97)}...` : notes;
}

function toIntegerPrice(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const price = Number(value);

    return Number.isSafeInteger(price) ? price : null;
}

function timeToMinutes(value) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

import NotificationBell from '@/Components/NotificationBell';

export default function Dashboard({
    mentorProfile,
    bookingRequests = [],
    refundRequests = [],
    reportedRefundRequests = [],
    studentCancelledSessions = [],
    confirmedSessions = [],
}) {
    const { auth, flash } = usePage().props;
    const safeBookingRequests = Array.isArray(bookingRequests)
        ? bookingRequests
        : [];
    const safeRefundRequests = Array.isArray(refundRequests)
        ? refundRequests
        : [];
    const safeReportedRefundRequests = Array.isArray(reportedRefundRequests)
        ? reportedRefundRequests
        : [];
    const safeStudentCancelledSessions = Array.isArray(studentCancelledSessions)
        ? studentCancelledSessions
        : [];
    const safeConfirmedSessions = Array.isArray(confirmedSessions)
        ? confirmedSessions
        : [];    
    const availabilitySchedule = Array.isArray(
        mentorProfile?.availability_schedule,
    )
        ? mentorProfile.availability_schedule
        : [];
    const defaultPrice = toIntegerPrice(mentorProfile?.price_per_session);
    const initialAvailabilitySchedule = [];
    const initializedCells = new Set();

    availabilitySchedule.forEach((schedule) => {
        const day = weekdays.find(
            (weekday) =>
                weekday.value === String(schedule?.day ?? '').toLowerCase(),
        );
        const startMinutes = timeToMinutes(schedule?.start);
        const endMinutes = timeToMinutes(schedule?.end);

        if (!day || startMinutes === null || endMinutes === null) {
            return;
        }

        const firstHour = Math.max(6, Math.ceil(startMinutes / 60));
        const lastHour = Math.min(21, Math.floor((endMinutes - 60) / 60));

        for (let hour = firstHour; hour <= lastHour; hour += 1) {
            const start = `${String(hour).padStart(2, '0')}:00`;
            const end = `${String(hour + 1).padStart(2, '0')}:00`;
            const cellKey = `${day.value}-${start}`;

            if (initializedCells.has(cellKey)) {
                continue;
            }

            initializedCells.add(cellKey);
            initialAvailabilitySchedule.push({
                day: day.value,
                start,
                end,
                type: schedule.type === 'berbayar' ? 'berbayar' : 'gratis',
                price:
                    schedule.type === 'berbayar'
                        ? (toIntegerPrice(schedule.price) ?? defaultPrice)
                        : null,
            });
        }
    });
    const form = useForm({
        availability_schedule: initialAvailabilitySchedule,
    });
    const [editorSlot, setEditorSlot] = useState(null);
    const [paidSelectionOpen, setPaidSelectionOpen] = useState(false);
    const [paidPriceDraft, setPaidPriceDraft] = useState(null);
    const [popoverPosition, setPopoverPosition] = useState({ left: 8, top: 8 });
    const activeCellRef = useRef(null);
    const popoverRef = useRef(null);
    const mentorName =
        auth?.user?.name ??
        mentorProfile?.user?.name ??
        mentorProfile?.name ??
        mentorProfile?.expertise ??
        'Mentor';
    const avatarInitials = mentorName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
    const currentHour = new Date().getHours();
    const greeting =
        currentHour < 11
            ? 'Selamat Pagi'
            : currentHour < 15
              ? 'Selamat Siang'
              : 'Selamat Sore';
    const availabilityLabel = mentorProfile
        ? mentorProfile.is_available
            ? 'Tersedia untuk mentoring'
            : 'Sedang tidak tersedia'
        : 'Profil mentor belum tersedia';
    const validationErrors = Object.values(form.errors).filter(Boolean);

    function getAvailability(day, slot) {
        return form.data.availability_schedule.find(
            (schedule) =>
                schedule.day === day &&
                schedule.start === slot.start &&
                schedule.end === slot.end,
        );
    }

    const displayedSlotCount = form.data.availability_schedule.length;
    const editorAvailability = editorSlot
        ? getAvailability(editorSlot.day, editorSlot)
        : null;
    const selectedAvailabilityType = paidSelectionOpen
        ? 'berbayar'
        : (editorAvailability?.type ?? 'tutup');

    function setSlotAvailability(day, slot, type, price = null) {
        const matchingSlot = (schedule) =>
            schedule.day === day &&
            schedule.start === slot.start &&
            schedule.end === slot.end;

        form.setData('availability_schedule', [
            ...form.data.availability_schedule.filter(
                (schedule) => !matchingSlot(schedule),
            ),
            { day, start: slot.start, end: slot.end, type, price },
        ]);
    }

    function openAvailabilityEditor(event, day, slot) {
        const currentSlot = getAvailability(day, slot);

        activeCellRef.current = event.currentTarget;
        setEditorSlot({ day, ...slot });
        setPaidSelectionOpen(currentSlot?.type === 'berbayar');
        setPaidPriceDraft(
            currentSlot?.type === 'berbayar'
                ? (toIntegerPrice(currentSlot.price) ?? defaultPrice)
                : defaultPrice,
        );
    }

    function closeAvailabilityEditor(restoreFocus = false) {
        setEditorSlot(null);
        setPaidSelectionOpen(false);

        if (restoreFocus) {
            activeCellRef.current?.focus();
        }
    }

    function applyAvailabilityChoice(type, price = null) {
        if (!editorSlot) {
            return;
        }

        if (type !== 'tutup') {
            setSlotAvailability(
                editorSlot.day,
                editorSlot,
                type,
                type === 'gratis' ? null : price,
            );
        } else {
            form.setData(
                'availability_schedule',
                form.data.availability_schedule.filter(
                    (schedule) =>
                        !(
                            schedule.day === editorSlot.day &&
                            schedule.start === editorSlot.start &&
                            schedule.end === editorSlot.end
                        ),
                ),
            );
        }

        closeAvailabilityEditor(true);
    }

    function saveAvailability(event) {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            availability_schedule: data.availability_schedule.map((schedule) => ({
                ...schedule,
                price: schedule.type === 'gratis' ? null : schedule.price,
            })),
        }));
        form.patch(route('mentor.availability.update'), {
            preserveScroll: true,
        });
    }

    useEffect(() => {
        if (!editorSlot) {
            return undefined;
        }

        function updatePopoverPosition() {
            const anchor = activeCellRef.current?.getBoundingClientRect();

            if (!anchor) {
                return;
            }

            const popover = popoverRef.current?.getBoundingClientRect();
            const width = popover?.width ?? 256;
            const height = popover?.height ?? 240;
            const edgePadding = 8;
            const left = Math.min(
                Math.max(edgePadding, anchor.left),
                window.innerWidth - width - edgePadding,
            );
            const top =
                anchor.bottom + height + edgePadding <= window.innerHeight
                    ? anchor.bottom + edgePadding
                    : Math.max(edgePadding, anchor.top - height - edgePadding);

            setPopoverPosition({ left, top });
        }

        function handleOutsidePointerDown(event) {
            if (
                popoverRef.current?.contains(event.target) ||
                activeCellRef.current?.contains(event.target)
            ) {
                return;
            }

            closeAvailabilityEditor();
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                closeAvailabilityEditor(true);
            }
        }

        updatePopoverPosition();
        document.addEventListener('pointerdown', handleOutsidePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('scroll', updatePopoverPosition, true);
        window.addEventListener('resize', updatePopoverPosition);
        popoverRef.current
            ?.querySelector('button')
            ?.focus({ preventScroll: true });

        return () => {
            document.removeEventListener('pointerdown', handleOutsidePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('scroll', updatePopoverPosition, true);
            window.removeEventListener('resize', updatePopoverPosition);
        };
    }, [editorSlot]);

    return (
        <div className="min-h-screen bg-[#F7F5F0] text-[#34443D]">
            <Head title="Dashboard Mentor" />

            <header className="bg-[#6594B1] text-white shadow-sm">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex shrink-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg font-bold text-white">
                            P
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold tracking-wide">
                                Pathway
                            </span>
                            <span className="rounded-full border border-white/40 px-2 py-0.5 text-[9px] font-bold tracking-[0.14em]">
                                MENTOR
                            </span>
                        </div>
                    </div>

                    <nav
                        aria-label="Navigasi mentor"
                        className="order-4 flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap text-sm xl:order-none xl:w-auto"
                    >
                        <Link
                            href={route('mentor.dashboard')}
                            aria-current="page"
                            className="rounded-full bg-white/20 px-4 py-2 font-semibold text-white"
                        >
                            Overview
                        </Link>
                        <span className="rounded-full px-4 py-2 text-white/85">
                            Mentors Directory
                        </span>
                        <span className="rounded-full px-4 py-2 text-white/85">
                            Mentees &amp; Students
                        </span>
                    </nav>

                    <div className="flex min-w-0 flex-1 items-center justify-end gap-4 md:gap-6">
                        <label className="flex min-w-0 max-w-xs flex-1 items-center rounded-md border border-white/25 bg-white/15 px-3 py-2 focus-within:border-white/60 focus-within:bg-white/20">
                            <input
                                type="search"
                                placeholder="Cari mentor, topik..."
                                aria-label="Cari mentor atau topik"
                                className="min-w-0 w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-0"
                            />
                        </label>
                        <div className="flex shrink-0 items-center gap-3">
                            <NotificationBell />
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-[#E5ECDD] text-xs font-bold text-[#34443D]">
                                {avatarInitials || 'M'}
                            </div>
                            <div className="hidden min-w-0 sm:block">
                                <p className="max-w-36 truncate text-sm font-semibold leading-tight">
                                    {mentorName}
                                </p>
                                <p className="text-xs text-white/75">Mentor</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                <section>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6594B1]">
                        Portal Mentor / Ringkasan
                    </p>
                    <h1 className="text-2xl font-bold leading-tight text-[#34443D] sm:text-3xl">
                        {greeting}, {mentorName}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69766F]">
                        Berikut ringkasan profil dan jadwal ketersediaan
                        mentoring Anda.
                    </p>
                </section>

                <section
                    aria-labelledby="mentor-profile-heading"
                    className="overflow-hidden rounded-xl border border-[#E8E5DD] bg-white shadow-[0_3px_14px_rgba(52,68,61,0.04)]"
                >
                    <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#EEECE6] px-5 py-5 sm:px-7 sm:py-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7EEF1] text-lg font-bold text-[#527D98]">
                                {avatarInitials || 'M'}
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A938D]">
                                    Profil Mentor
                                </p>
                                <h2
                                    id="mentor-profile-heading"
                                    className="mt-1 text-xl font-bold text-[#34443D]"
                                >
                                    {mentorName}
                                </h2>
                                <p className="mt-1 text-sm font-medium text-[#6594B1]">
                                    {mentorProfile?.expertise ??
                                        'Keahlian belum diisi'}
                                </p>
                            </div>
                        </div>

                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                mentorProfile?.is_available
                                    ? 'bg-[#E8F2E8] text-[#477E50]'
                                    : mentorProfile
                                      ? 'bg-[#F6E9E5] text-[#9A5C4D]'
                                      : 'bg-[#F0EFEB] text-[#737B76]'
                            }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    mentorProfile?.is_available
                                        ? 'bg-[#65B175]'
                                        : mentorProfile
                                          ? 'bg-[#C17A68]'
                                          : 'bg-[#9AA19C]'
                                }`}
                            />
                            {availabilityLabel}
                        </span>
                    </div>

                    <div className="px-5 py-5 sm:px-7 sm:py-6">
                        <h3 className="text-sm font-semibold text-[#34443D]">
                            Tentang saya
                        </h3>
                        <p className="mt-2 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#69766F]">
                            {mentorProfile?.bio || 'Belum ada bio.'}
                        </p>
                    </div>
                </section>

                <section aria-labelledby="booking-requests-heading">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                Pengajuan sesi mentoring
                            </p>
                            <h2
                                id="booking-requests-heading"
                                className="mt-1 text-xl font-bold text-[#34443D]"
                            >
                                Permintaan Bimbingan Baru
                            </h2>
                        </div>
                        <p className="text-sm text-[#78827B]">
                            {safeBookingRequests.length} permintaan baru
                        </p>
                    </div>

                    {safeBookingRequests.length > 0 ? (
                        <div className="space-y-3">
                            {safeBookingRequests.map((bookingRequest) => (
                                <article
                                    key={bookingRequest.id}
                                    className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                                >
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-base font-bold text-[#34443D]">
                                                    {bookingRequest.student
                                                        ?.name ?? 'Student'}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                                        bookingRequest.is_free_session
                                                            ? 'bg-[#E8F2E8] text-[#65B175]'
                                                            : 'bg-[#E7EEF1] text-[#6594B1]'
                                                    }`}
                                                >
                                                    {bookingRequest.is_free_session
                                                        ? 'Gratis'
                                                        : `Rp ${rupiahFormatter.format(Number(bookingRequest.price_snapshot ?? 0))}`}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid gap-3 text-sm text-[#69766F] sm:grid-cols-2">
                                                <p>
                                                    <span className="font-semibold text-[#34443D]">
                                                        Mulai:{' '}
                                                    </span>
                                                    {formatSessionDateTime(
                                                        bookingRequest.schedule_time,
                                                    )}
                                                </p>
                                                <p>
                                                    <span className="font-semibold text-[#34443D]">
                                                        Selesai:{' '}
                                                    </span>
                                                    {formatSessionDateTime(
                                                        bookingRequest.end_time,
                                                    )}
                                                </p>
                                                <p>
                                                    <span className="font-semibold text-[#34443D]">
                                                        Durasi:{' '}
                                                    </span>
                                                    {bookingRequest.duration_hours}{' '}
                                                    Jam
                                                </p>
                                            </div>

                                            <p className="mt-3 text-sm leading-6 text-[#69766F]">
                                                {truncateNotes(
                                                    bookingRequest.notes_from_student,
                                                )}
                                            </p>
                                        </div>

                                        <Link
                                            href={route(
                                                'mentor.booking.show',
                                                bookingRequest.id,
                                            )}
                                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                        >
                                            Lihat Detail
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-[#E8E5DD] bg-white px-5 py-8 text-center shadow-[0_3px_14px_rgba(52,68,61,0.04)]">
                            <p className="text-sm text-[#78827B]">
                                Belum ada permintaan bimbingan baru
                            </p>
                        </div>
                    )}
                </section>

                {safeRefundRequests.length > 0 && (
                    <section aria-labelledby="refund-requests-heading">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C23B46]">
                                    Aksi Diperlukan
                                </p>
                                <h2
                                    id="refund-requests-heading"
                                    className="mt-1 text-xl font-bold text-[#34443D]"
                                >
                                    Menunggu Refund
                                </h2>
                            </div>
                            <p className="text-sm text-[#78827B]">
                                {safeRefundRequests.length} refund perlu diproses
                            </p>
                        </div>

                        <div className="space-y-3">
                            {safeRefundRequests.map((refundRequest) => {
                                const isOverdue = isRefundOverdue(
                                    refundRequest.refund_deadline,
                                );

                                return (
                                    <article
                                        key={refundRequest.id}
                                        className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                                    >
                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-base font-bold text-[#34443D]">
                                                        {refundRequest.student
                                                            ?.name ?? 'Student'}
                                                    </h3>
                                                    {isOverdue ? (
                                                        <span className="inline-flex items-center rounded-full bg-[#FBECEE] px-3 py-1 text-xs font-bold text-[#C23B46]">
                                                            Melewati batas
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-[#F3EFDF] px-3 py-1 text-xs font-bold text-[#78663A]">
                                                            Menunggu Refund
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-4 grid gap-3 text-sm text-[#69766F] sm:grid-cols-2">
                                                    <p>
                                                        <span className="font-semibold text-[#34443D]">
                                                            Jadwal Sesi:{' '}
                                                        </span>
                                                        {formatSessionDateTime(
                                                            refundRequest.schedule_time,
                                                        )}
                                                    </p>
                                                    <p>
                                                        <span className="font-semibold text-[#34443D]">
                                                            Batas Waktu:{' '}
                                                        </span>
                                                        {formatSessionDateTime(
                                                            refundRequest.refund_deadline,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <Link
                                                href={route(
                                                    'mentor.refund.form',
                                                    refundRequest.id,
                                                )}
                                                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                            >
                                                Proses Refund
                                            </Link>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {safeReportedRefundRequests.length > 0 && (
                    <section aria-labelledby="reported-refunds-heading">
                        <div className="mb-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C23B46]">
                                Perlu Ditinjau
                            </p>
                            <h2
                                id="reported-refunds-heading"
                                className="mt-1 text-xl font-bold text-[#34443D]"
                            >
                                Dilaporkan Belum Diterima
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {safeReportedRefundRequests.map((request) => (
                                <article
                                    key={request.id}
                                    className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                                >
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-base font-bold text-[#34443D]">
                                            {request.student?.name ?? 'Student'}
                                        </h3>
                                        <span className="inline-flex items-center rounded-full bg-[#FBECEE] px-3 py-1 text-xs font-bold text-[#C23B46]">
                                            Dilaporkan Belum Diterima
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3 text-sm text-[#69766F] sm:grid-cols-2">
                                        <p>
                                            <span className="font-semibold text-[#34443D]">
                                                Jadwal Sesi:{' '}
                                            </span>
                                            {formatSessionDateTime(
                                                request.schedule_time,
                                            )}
                                        </p>
                                        <p>
                                            <span className="font-semibold text-[#34443D]">
                                                Bukti diunggah:{' '}
                                            </span>
                                            {formatSessionDateTime(
                                                request.refund_proof_uploaded_at,
                                            )}
                                        </p>
                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-[#69766F]">
                                        Student melaporkan belum menerima
                                        transfer. Belum ada tindakan yang
                                        tersedia di aplikasi untuk laporan ini.
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
                {safeConfirmedSessions.length > 0 && (
                    <section aria-labelledby="confirmed-sessions-heading">
                        <div className="mb-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                Siap dijalankan
                            </p>
                            <h2
                                id="confirmed-sessions-heading"
                                className="mt-1 text-xl font-bold text-[#34443D]"
                            >
                                Sesi Dikonfirmasi
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {safeConfirmedSessions.map((session) => (
                                <article
                                    key={session.id}
                                    className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-base font-bold text-[#34443D]">
                                                    {session.student?.name ??
                                                        'Student'}
                                                </h3>
                                                <span
                                                    className={
                                                        session.status ===
                                                        'berlangsung'
                                                            ? 'inline-flex items-center rounded-full bg-[#E8F2E8] px-3 py-1 text-xs font-bold text-[#477E50]'
                                                            : 'inline-flex items-center rounded-full bg-[#E7EEF1] px-3 py-1 text-xs font-bold text-[#527D98]'
                                                    }
                                                >
                                                    {session.status ===
                                                    'berlangsung'
                                                        ? 'Berlangsung'
                                                        : 'Dikonfirmasi'}
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-[#F0EFEB] px-3 py-1 text-xs font-bold text-[#737B76]">
                                                    {session.is_free_session
                                                        ? 'Gratis'
                                                        : 'Berbayar'}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm text-[#69766F]">
                                                <span className="font-semibold text-[#34443D]">
                                                    Jadwal Sesi:{' '}
                                                </span>
                                                {formatSessionDateTime(
                                                    session.schedule_time,
                                                )}
                                            </p>
                                            {session.no_show_report &&
                                            ['menunggu_respons', 'disanggah'].includes(
                                                session.no_show_report.status,
                                            ) && (
                                                <p className="mt-3 rounded-lg bg-[#F3EFDF] px-3 py-2 text-xs leading-5 text-[#78663A]">
                                                    {session.no_show_report.status === 'disanggah'
                                                        ? 'Laporan no-show disanggah. Menunggu keputusan admin.'
                                                        : session.no_show_report.can_respond
                                                        ? 'Anda dilaporkan tidak hadir. Tanggapi lewat Kelola Sesi sebelum batas waktu.'
                                                        : 'Anda melaporkan no-show. Menunggu tanggapan pihak lawan.'}
                                                </p>
                                            )}
                                                                                </div>

                                        <a
                                            href={route(
                                                'mentor.session.tracking',
                                                session.id,
                                            )}
                                            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                        >
                                            Kelola Sesi
                                        </a>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
                {safeStudentCancelledSessions.length > 0 && (
                    <section aria-labelledby="student-cancelled-sessions-heading">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                    7 hari terakhir
                                </p>
                                <h2
                                    id="student-cancelled-sessions-heading"
                                    className="mt-1 text-xl font-bold text-[#34443D]"
                                >
                                    Dibatalkan Student
                                </h2>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {safeStudentCancelledSessions.map((session) => (
                                <article
                                    key={session.id}
                                    className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                                >
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-base font-bold text-[#34443D]">
                                            {session.student?.name ?? 'Student'}
                                        </h3>
                                        <span className="inline-flex items-center rounded-full bg-[#F1E9E7] px-3 py-1 text-xs font-bold text-[#8E5D54]">
                                            Dibatalkan Student
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3 text-sm text-[#69766F] sm:grid-cols-2">
                                        <p>
                                            <span className="font-semibold text-[#34443D]">
                                                Jadwal Sesi:{' '}
                                            </span>
                                            {formatSessionDateTime(
                                                session.schedule_time,
                                            )}
                                        </p>
                                        <p>
                                            <span className="font-semibold text-[#34443D]">
                                                Alasan:{' '}
                                            </span>
                                            {session.cancellation_reason ||
                                                'Tidak ada alasan yang dicatat.'}
                                        </p>

                                    </div>

                                    <p className="mt-4 text-sm leading-6 text-[#69766F]">
                                        {session.is_free_session === false
                                            ? 'DP hangus dan tetap menjadi hak Anda. Slot kembali kosong.'
                                            : 'Slot kembali kosong.'}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                <section aria-labelledby="availability-heading">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                Waktu mentoring
                            </p>
                            <h2
                                id="availability-heading"
                                className="mt-1 text-xl font-bold text-[#34443D]"
                            >
                                Jadwal Ketersediaan
                            </h2>
                        </div>
                        <p className="text-sm text-[#78827B]">
                            {displayedSlotCount} slot tersedia
                        </p>
                    </div>

                    <form
                        onSubmit={saveAvailability}
                        className="overflow-hidden rounded-xl border border-[#E8E5DD] bg-white shadow-[0_3px_14px_rgba(52,68,61,0.04)]"
                    >
                        <div className="max-h-[520px] overflow-auto p-3 pr-5">
                            <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-x-2 border-spacing-y-2 text-left">
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 top-0 z-30 w-32 border-b border-[#E8E5DD] bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#78827B] shadow-[0_1px_2px_rgba(52,68,61,0.06)]">
                                            Waktu
                                        </th>
                                        {weekdays.map((day) => (
                                            <th
                                                key={day.value}
                                                scope="col"
                                                className="sticky top-0 z-20 border-b border-[#E8E5DD] bg-white px-2 py-2 text-center text-sm font-bold text-[#34443D] shadow-[0_1px_2px_rgba(52,68,61,0.06)]"
                                            >
                                                {day.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map((slot) => (
                                        <tr key={`${slot.start}-${slot.end}`}>
                                            <th
                                                scope="row"
                                                className="sticky left-0 z-10 h-10 rounded-lg bg-[#F7F5F0] px-3 text-xs font-semibold text-[#69766F]"
                                            >
                                                {slot.start} - {slot.end}
                                            </th>
                                            {weekdays.map((day) => {
                                                const availability = getAvailability(
                                                    day.value,
                                                    slot,
                                                );
                                                const isPaid =
                                                    availability?.type ===
                                                    'berbayar';
                                                const isFree =
                                                    availability &&
                                                    !isPaid;
                                                const isEditorOpen =
                                                    editorSlot?.day ===
                                                        day.value &&
                                                    editorSlot?.start ===
                                                        slot.start &&
                                                    editorSlot?.end ===
                                                        slot.end;
                                                const statusLabel = isPaid
                                                    ? `Rp ${rupiahFormatter.format(availability.price)}/jam`
                                                    : isFree
                                                      ? 'Gratis'
                                                      : 'Tutup';

                                                return (
                                                    <td
                                                        key={`${day.value}-${slot.start}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            aria-expanded={isEditorOpen}
                                                            aria-haspopup="dialog"
                                                            aria-label={`${day.label}, ${slot.start} sampai ${slot.end}: ${statusLabel}`}
                                                            disabled={form.processing}
                                                            onClick={(event) =>
                                                                openAvailabilityEditor(
                                                                    event,
                                                                    day.value,
                                                                    slot,
                                                                )
                                                            }
                                                            className={`h-10 w-full truncate rounded-lg border px-1.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 sm:text-xs ${
                                                                isPaid
                                                                    ? 'border-[#6594B1] bg-[#6594B1] text-white hover:bg-[#527D98]'
                                                                    : isFree
                                                                      ? 'border-[#65B175] bg-[#65B175] text-white hover:bg-[#477E50]'
                                                                      : 'border-[#E1E3DF] bg-[#F2F2EF] text-[#747B76] hover:bg-[#E9EAE6]'
                                                            }`}
                                                        >
                                                            {statusLabel}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-4 border-t border-[#EEECE6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="space-y-2" aria-live="polite">
                                {(flash?.success || form.recentlySuccessful) && (
                                    <p className="text-sm font-medium text-[#477E50]">
                                        {flash?.success ||
                                            'Jadwal ketersediaan berhasil disimpan.'}
                                    </p>
                                )}
                                {validationErrors.map((error, index) => (
                                    <p
                                        key={`${error}-${index}`}
                                        className="text-sm font-medium text-[#A34F45]"
                                    >
                                        {error}
                                    </p>
                                ))}
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#6594B1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {form.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Jadwal Ketersediaan'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
            {editorSlot &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={popoverRef}
                        role="dialog"
                        aria-label="Atur ketersediaan slot"
                        className="fixed z-50 max-h-[calc(100vh-1rem)] w-56 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-[#E8E5DD] bg-white p-3 shadow-xl"
                        style={{
                            left: `${popoverPosition.left}px`,
                            top: `${popoverPosition.top}px`,
                        }}
                    >
                        <p className="mb-3 text-xs font-semibold text-[#69766F]">
                            {weekdays.find(
                                (day) => day.value === editorSlot.day,
                            )?.label ?? editorSlot.day}{' '}
                            - {editorSlot.start} - {editorSlot.end}
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                aria-pressed={selectedAvailabilityType === 'tutup'}
                                onClick={() =>
                                    applyAvailabilityChoice('tutup')
                                }
                                className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border-2 px-3 text-left text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6594B1] ${
                                    selectedAvailabilityType === 'tutup'
                                        ? 'border-[#747B76] bg-[#F2F2EF] text-[#34443D]'
                                        : 'border-[#E1E3DF] bg-white text-[#747B76] hover:bg-[#F2F2EF]'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        aria-hidden="true"
                                        className="h-2.5 w-2.5 rounded-full bg-[#9A9D99]"
                                    />
                                    Tutup
                                </span>
                                {selectedAvailabilityType === 'tutup' && (
                                    <span aria-hidden="true">✓</span>
                                )}
                            </button>
                            <button
                                type="button"
                                aria-pressed={selectedAvailabilityType === 'gratis'}
                                onClick={() =>
                                    applyAvailabilityChoice('gratis')
                                }
                                className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border-2 px-3 text-left text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6594B1] ${
                                    selectedAvailabilityType === 'gratis'
                                        ? 'border-[#477E50] bg-[#EAF4EC] text-[#34443D]'
                                        : 'border-[#E1E3DF] bg-white text-[#747B76] hover:bg-[#F2F2EF]'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        aria-hidden="true"
                                        className="h-2.5 w-2.5 rounded-full bg-[#65B175]"
                                    />
                                    Gratis
                                </span>
                                {selectedAvailabilityType === 'gratis' && (
                                    <span aria-hidden="true">✓</span>
                                )}
                            </button>
                            <button
                                type="button"
                                aria-expanded={paidSelectionOpen}
                                aria-pressed={selectedAvailabilityType === 'berbayar'}
                                onClick={() => {
                                    const currentSlot = getAvailability(
                                        editorSlot.day,
                                        editorSlot,
                                    );

                                    setPaidSelectionOpen(true);
                                    setPaidPriceDraft(
                                        currentSlot?.type === 'berbayar'
                                            ? (toIntegerPrice(
                                                  currentSlot.price,
                                              ) ?? defaultPrice)
                                            : defaultPrice,
                                    );
                                }}
                                className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border-2 px-3 text-left text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#6594B1] ${
                                    selectedAvailabilityType === 'berbayar'
                                        ? 'border-[#527D98] bg-[#EAF2F7] text-[#34443D]'
                                        : 'border-[#E1E3DF] bg-white text-[#747B76] hover:bg-[#F2F2EF]'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        aria-hidden="true"
                                        className="h-2.5 w-2.5 rounded-full bg-[#6594B1]"
                                    />
                                    Berbayar
                                </span>
                                {selectedAvailabilityType === 'berbayar' && (
                                    <span aria-hidden="true">✓</span>
                                )}
                            </button>
                            {paidSelectionOpen && (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();

                                        if (
                                            paidPriceDraft !== null &&
                                            paidPriceDraft >= 1000
                                        ) {
                                            applyAvailabilityChoice(
                                                'berbayar',
                                                paidPriceDraft,
                                            );
                                        }
                                    }}
                                    className="mt-3 flex flex-col gap-2 border-t border-[#E8E5DD] pt-3"
                                >
                                    <label
                                        htmlFor="availability-slot-price"
                                        className="text-xs font-medium text-[#69766F]"
                                    >
                                        Harga per jam
                                    </label>
                                    <input
                                        id="availability-slot-price"
                                        type="number"
                                        min="1000"
                                        step="1000"
                                        required
                                        value={paidPriceDraft ?? ''}
                                        onChange={(event) => {
                                            const value =
                                                event.target.value;
                                            const price =
                                                value === ''
                                                    ? null
                                                    : Number(value);

                                            setPaidPriceDraft(
                                                Number.isSafeInteger(price)
                                                    ? price
                                                    : null,
                                            );
                                        }}
                                        className="w-full rounded-lg border border-[#D9DEDA] px-3 py-2 text-sm text-[#34443D] focus:border-[#6594B1] focus:outline-none focus:ring-2 focus:ring-[#6594B1]/30"
                                    />
                                    <button
                                        type="submit"
                                        disabled={
                                            paidPriceDraft === null ||
                                            paidPriceDraft < 1000
                                        }
                                        className="w-full rounded-lg bg-[#6594B1] px-3 py-2 text-sm font-semibold text-white hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Terapkan
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}