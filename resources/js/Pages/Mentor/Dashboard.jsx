import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import NotificationBell from '@/Components/NotificationBell';
import {
    AlertBanner,
    Badge,
    Button,
    Card,
    EmptyState,
    SectionHeader,
    StatCard,
    themeTokens,
} from '@/Components/ui';

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
    month: 'short',
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

function isRequestScheduleOverdue(scheduleTime) {
    if (!scheduleTime) return false;
    const date = new Date(scheduleTime);
    return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function truncateNotes(notes) {
    if (!notes) {
        return 'Tidak ada catatan dari student.';
    }

    return notes.length > 95 ? `${notes.slice(0, 92)}...` : notes;
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

function getInitials(name) {
    if (!name) return 'S';
    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'S'
    );
}

const avatarColorPalette = [
    'bg-sky-100 text-sky-700 border-sky-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
];

function getAvatarStyle(name) {
    let hash = 0;
    const str = name || 'Student';
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColorPalette[Math.abs(hash) % avatarColorPalette.length];
}

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

    // Filter tabs state
    const [sessionFilterTab, setSessionFilterTab] = useState('semua'); // 'semua' | 'hari_ini'
    const [schedulePeriodTab, setSchedulePeriodTab] = useState('pagi'); // 'pagi' | 'siang' | 'malam' | 'semua'
    const [showAllRefunds, setShowAllRefunds] = useState(false);

    const mentorName =
        auth?.user?.name ??
        mentorProfile?.user?.name ??
        mentorProfile?.name ??
        mentorProfile?.expertise ??
        'Mentor';

    const avatarInitials =
        mentorName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'M';

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

    function handleResetAllClosed() {
        if (
            window.confirm(
                'Apakah Anda yakin ingin menutup semua slot jadwal? Klik tombol "Simpan Jadwal Ketersediaan" setelah ini untuk memperbarui database.',
            )
        ) {
            form.setData('availability_schedule', []);
        }
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
            const width = popover?.width ?? 280;
            const height = popover?.height ?? 260;
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

    const todayDateFormatted = new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    }).format(new Date());

    // Hitung data untuk banner tindakan segera & statistik
    const overdueRefundsCount = safeRefundRequests.filter((r) =>
        isRefundOverdue(r.refund_deadline),
    ).length;
    const activeNoShowDisputesCount = safeConfirmedSessions.filter(
        (s) =>
            s.no_show_report &&
            ['menunggu_respons', 'disanggah'].includes(s.no_show_report.status),
    ).length;
    const hasUrgentActions =
        safeRefundRequests.length > 0 || activeNoShowDisputesCount > 0;

    // Filter Sesi Terjadwal berdasarkan tab (Semua / Hari Ini)
    const filteredConfirmedSessions = safeConfirmedSessions.filter((session) => {
        if (sessionFilterTab === 'hari_ini') {
            if (!session.schedule_time) return false;
            const sessionDate = new Date(session.schedule_time);
            const now = new Date();
            return (
                sessionDate.getDate() === now.getDate() &&
                sessionDate.getMonth() === now.getMonth() &&
                sessionDate.getFullYear() === now.getFullYear()
            );
        }
        return true;
    });

    // Filter timeSlots berdasarkan tab waktu (Pagi, Siang, Malam, Semua)
    const filteredTimeSlots = timeSlots.filter((slot) => {
        const startHour = parseInt(slot.start.split(':')[0], 10);
        if (schedulePeriodTab === 'pagi') {
            return startHour >= 6 && startHour < 12;
        }
        if (schedulePeriodTab === 'siang') {
            return startHour >= 12 && startHour < 17;
        }
        if (schedulePeriodTab === 'malam') {
            return startHour >= 17 && startHour < 22;
        }
        return true;
    });

    // Slices untuk refund requests (maks 3 teratas, sisanya collapsible)
    const displayedRefundRequests = showAllRefunds
        ? safeRefundRequests
        : safeRefundRequests.slice(0, 3);
    const hiddenRefundCount = Math.max(0, safeRefundRequests.length - 3);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#527D98]/20 selection:text-[#527D98]">
            <Head title="Dashboard Mentor - Pathway" />

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
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
                                MENTOR
                            </span>
                        </div>
                    </div>

                    <nav
                        aria-label="Navigasi mentor"
                        className="order-4 flex w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap text-sm font-medium xl:order-none xl:w-auto"
                    >
                        <Link
                            href={route('mentor.dashboard')}
                            aria-current="page"
                            className="rounded-full bg-white/20 px-4 py-1.5 font-semibold text-white transition hover:bg-white/30"
                        >
                            Overview
                        </Link>
                        <Link
                            href={route('mentors.index')}
                            className="rounded-full px-4 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            Mentors Directory
                        </Link>
                        <Link
                            href={route('courses.index')}
                            className="rounded-full px-4 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            Courses &amp; Materials
                        </Link>
                    </nav>

                    <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-5">
                        <label className="relative flex min-w-0 max-w-xs flex-1 items-center">
                            <svg
                                className="pointer-events-none absolute left-3.5 h-4 w-4 text-white/60"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <input
                                type="search"
                                placeholder="Cari mentee, jadwal, topik..."
                                aria-label="Cari mentee atau topik"
                                className="w-full rounded-full border border-white/25 bg-white/15 py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-white/70 focus:border-white focus:bg-white/25 focus:outline-none focus:ring-1 focus:ring-white"
                            />
                        </label>

                        <div className="flex shrink-0 items-center gap-3">
                            <NotificationBell />
                            <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pl-1 pr-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5ECDD] text-xs font-bold text-[#34443D] shadow-sm">
                                    {avatarInitials}
                                </div>
                                <div className="hidden text-left sm:block">
                                    <p className="max-w-[130px] truncate text-xs font-semibold leading-tight text-white">
                                        {mentorName}
                                    </p>
                                    <p className="truncate text-[10px] text-white/75">
                                        {mentorProfile?.expertise ?? 'Mentor'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
                {/* HEADER SAPAAN & STATUS */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#527D98]">
                            PORTAL MENTOR &gt;
                        </p>
                        <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                            {greeting}, {mentorName} 👋
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                            Berikut ringkasan jadwal bimbingan dan permohonan menteemu hari ini.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                            <svg
                                className="h-4 w-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span>{todayDateFormatted}</span>
                        </div>

                        <Badge
                            variant={mentorProfile?.is_available ? 'success' : mentorProfile ? 'warning' : 'default'}
                            size="md"
                            dot={true}
                            dotColor={mentorProfile?.is_available ? 'bg-emerald-500 animate-pulse' : mentorProfile ? 'bg-amber-500' : 'bg-slate-400'}
                            className="shadow-sm"
                        >
                            {availabilityLabel}
                        </Badge>
                    </div>
                </div>

                {/* ALERT AKUN TERSUSPENSI (JIKA ADA) */}
                {mentorProfile?.is_suspended && (
                    <AlertBanner
                        variant="danger"
                        icon={
                            <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        }
                    >
                        <div>
                            <span className="font-bold">Akun Anda sedang ditangguhkan (Suspended).</span> Anda tidak dapat menerima pengajuan booking baru sampai suspensi dicabut.
                        </div>
                    </AlertBanner>
                )}

                {/* BANNER "TINDAKAN SEGERA" */}
                {hasUrgentActions && (
                    <AlertBanner
                        variant="danger"
                        icon={
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        }
                        tag="TINDAKAN SEGERA"
                        title={`${safeRefundRequests.length} Permintaan Refund Menunggu Respon${activeNoShowDisputesCount > 0 ? ` & ${activeNoShowDisputesCount} Sengketa No-Show` : ''}`}
                        description={
                            <>
                                Terdapat {overdueRefundsCount > 0 ? (
                                    <>
                                        <strong className="text-rose-700">{overdueRefundsCount} refund</strong> yang telah{' '}
                                        <span className="font-semibold text-rose-700">melewati batas waktu (48 jam)</span>
                                    </>
                                ) : (
                                    <>{safeRefundRequests.length} refund yang harus segera ditransfer</>
                                )}
                                {activeNoShowDisputesCount > 0 ? ' dan pelaporan kehadiran yang perlu klarifikasi hari ini.' : '.'}
                            </>
                        }
                        action={
                            safeRefundRequests.length > 0 && (
                                <Button
                                    href="#menunggu-refund"
                                    variant="secondary"
                                    size="sm"
                                    className="text-rose-700 border-rose-200 hover:bg-rose-50"
                                >
                                    Selesaikan Refund ↓
                                </Button>
                            )
                        }
                    />
                )}

                {/* 4 BARIS KARTU STATISTIK */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="PERMINTAAN MENUNGGU"
                        value={safeBookingRequests.length}
                        unit="baru masuk"
                        badgeText="Perlu respon"
                        badgeVariant="warning"
                        subText={safeBookingRequests[0]?.notes_from_student?.slice(0, 15) || 'Belum direspon'}
                    />

                    <StatCard
                        title="REFUND TERTUNDA"
                        value={safeRefundRequests.length}
                        unit="menunggu eksekusi"
                        icon={
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        }
                        badgeText={overdueRefundsCount > 0 ? `${overdueRefundsCount} Melewati batas` : 'On-track'}
                        badgeVariant={overdueRefundsCount > 0 ? 'dangerBold' : 'warning'}
                        subText="Batas max 48 jam"
                    />

                    <StatCard
                        title="SESI TERJADWAL"
                        value={safeConfirmedSessions.length}
                        unit="sesi aktif"
                        badgeText={safeConfirmedSessions.filter(s => s.status === 'berlangsung').length > 0 ? '1 Berlangsung' : 'Siap jalan'}
                        badgeVariant="success"
                        subText={`${safeConfirmedSessions.filter(s => s.status === 'dikonfirmasi').length} Dikonfirmasi`}
                    />

                    <StatCard
                        title="SLOT KETERSEDIAAN"
                        value={displayedSlotCount}
                        unit="slot mingguan aktif"
                        badgeText="Aktif"
                        badgeVariant="purple"
                        subText="06:00 - 22:00"
                    />
                </div>

                {/* GRID 2 KOLOM */}
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* KOLOM KIRI (7 / 12 atau 8 / 12) */}
                    <div className="space-y-6 lg:col-span-7 xl:col-span-8">
                        {/* 1. PERMINTAAN BIMBINGAN BARU */}
                        <Card as="section" className="p-5 sm:p-6">
                            <SectionHeader
                                title="Permintaan Bimbingan Baru"
                                rightAction={
                                    <span className="cursor-default text-xs font-medium text-slate-400 hover:text-slate-600">
                                        Riwayat Permintaan &gt;
                                    </span>
                                }
                            />

                            {safeBookingRequests.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {safeBookingRequests.map((request) => {
                                        const studentName = request.student?.name ?? 'Student';
                                        const avatarStyle = getAvatarStyle(studentName);
                                        const initials = getInitials(studentName);
                                        const isOverdue = isRequestScheduleOverdue(request.schedule_time);

                                        return (
                                            <div
                                                key={request.id}
                                                className="flex flex-col gap-3 rounded-xl px-2.5 py-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70"
                                            >
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${avatarStyle}`}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-xs font-bold text-slate-900 sm:text-sm">
                                                                {studentName}
                                                            </h3>
                                                            <Badge variant="warning" size="xs">
                                                                Diajukan
                                                            </Badge>
                                                            <Badge variant={request.is_free_session ? 'success' : 'primary'} size="xs">
                                                                {request.is_free_session
                                                                    ? 'Gratis'
                                                                    : `Rp ${rupiahFormatter.format(Number(request.price_snapshot ?? 0))}`}
                                                            </Badge>
                                                        </div>

                                                        <p className="mt-1 text-xs text-slate-700">
                                                            {request.notes_from_student ? (
                                                                <>
                                                                    {request.notes_from_student}{' '}
                                                                    {isOverdue && (
                                                                        <span className="font-semibold text-rose-600">
                                                                            (Jadwal Terlewat)
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                'Tidak ada catatan dari student.'
                                                            )}
                                                        </p>

                                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                                            <span className="flex items-center gap-1">
                                                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {formatSessionDateTime(request.schedule_time)}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Durasi {request.duration_hours} Jam</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 pl-13 sm:pl-0">
                                                    <Button
                                                        href={route('mentor.booking.show', request.id)}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        Lihat Detail
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState message="Belum ada pengajuan bimbingan baru" />
                            )}
                        </Card>

                        {/* 2. SESI TERJADWAL & SIAP DIJALANKAN */}
                        <Card as="section" className="p-5 sm:p-6">
                            <SectionHeader
                                title="Sesi Terjadwal & Siap Dijalankan"
                                badge={
                                    <Badge variant="success" size="sm">
                                        {safeConfirmedSessions.length} Sesi
                                    </Badge>
                                }
                                rightAction={
                                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
                                        <button
                                            type="button"
                                            onClick={() => setSessionFilterTab('semua')}
                                            className={`rounded-lg px-3 py-1 transition ${
                                                sessionFilterTab === 'semua'
                                                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Semua
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSessionFilterTab('hari_ini')}
                                            className={`rounded-lg px-3 py-1 transition ${
                                                sessionFilterTab === 'hari_ini'
                                                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Hari Ini
                                        </button>
                                    </div>
                                }
                            />

                            {filteredConfirmedSessions.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredConfirmedSessions.map((session) => {
                                        const isOngoing = session.status === 'berlangsung';

                                        return (
                                            <Card
                                                key={session.id}
                                                variant="subtle"
                                                className="p-4 transition hover:border-slate-300 hover:shadow-xs"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>

                                                        <div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-sm font-bold text-slate-900">
                                                                    {session.student?.name ?? 'Student'}
                                                                </h3>
                                                                <Badge variant={isOngoing ? 'successBold' : 'primary'} size="xs">
                                                                    {isOngoing ? '● Berlangsung' : 'Dikonfirmasi'}
                                                                </Badge>
                                                                <span className="text-[11px] font-medium text-slate-400">
                                                                    {session.is_free_session ? 'Sesi Gratis' : 'Sesi Berbayar'}
                                                                </span>
                                                            </div>

                                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {formatSessionDateTime(session.schedule_time)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0">
                                                        <Button
                                                            href={route('mentor.session.tracking', session.id)}
                                                            variant="secondary"
                                                            size="sm"
                                                        >
                                                            Kelola Sesi
                                                            <span aria-hidden="true">&gt;</span>
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* No-Show Alert Banner jika ada sengketa */}
                                                {session.no_show_report &&
                                                    ['menunggu_respons', 'disanggah'].includes(
                                                        session.no_show_report.status,
                                                    ) && (
                                                        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-900">
                                                            <svg className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            <div className="leading-relaxed">
                                                                {session.no_show_report.status === 'disanggah' ? (
                                                                    <>
                                                                        <strong>Laporan no-show disanggah:</strong> Menunggu keputusan admin dan verifikasi log kehadiran.
                                                                    </>
                                                                ) : session.no_show_report.can_respond ? (
                                                                    <>
                                                                        <strong>Anda dilaporkan tidak hadir:</strong> Tanggapi lewat Kelola Sesi sebelum batas waktu.
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <strong>Anda melaporkan no-show:</strong> Menunggu tanggapan pihak lawan sebelum pengembalian dana diproses.
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    message={
                                        sessionFilterTab === 'hari_ini'
                                            ? 'Tidak ada sesi terjadwal untuk hari ini.'
                                            : 'Belum ada sesi terjadwal saat ini.'
                                    }
                                />
                            )}
                        </Card>

                        {/* 3. MANAJEMEN KETERSEDIAAN MINGGUAN */}
                        <Card as="section" className="p-5 sm:p-6">
                            <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                                                Manajemen Ketersediaan Mingguan
                                            </h2>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                                                Slot 1 Jam (06:00 - 22:00)
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Klik sel untuk toggle: Tutup, Gratis, atau Berbayar. Jadwal mencakup Senin hingga Jumat.
                                        </p>
                                    </div>

                                    {/* Legend Pills */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                                            Tutup
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Gratis (0 IDR)
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#527D98] font-medium">
                                            <span className="h-2 w-2 rounded-full bg-[#527D98]" />
                                            Berbayar (Rp)
                                        </span>
                                    </div>
                                </div>

                                {/* Filter Tabs Pagi / Siang / Malam & Tombol Reset */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                    <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-medium text-slate-600">
                                        <button
                                            type="button"
                                            onClick={() => setSchedulePeriodTab('pagi')}
                                            className={`rounded-lg px-3 py-1 transition ${
                                                schedulePeriodTab === 'pagi'
                                                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Pagi (06-12)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSchedulePeriodTab('siang')}
                                            className={`rounded-lg px-3 py-1 transition ${
                                                schedulePeriodTab === 'siang'
                                                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Siang (12-17)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSchedulePeriodTab('malam')}
                                            className={`rounded-lg px-3 py-1 transition ${
                                                schedulePeriodTab === 'malam'
                                                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Malam (17-22)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSchedulePeriodTab('semua')}
                                            className={`rounded-lg px-3 py-1 transition ${
                                                schedulePeriodTab === 'semua'
                                                    ? 'bg-white font-bold text-slate-900 shadow-xs'
                                                    : 'text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            Semua
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleResetAllClosed}
                                        className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
                                    >
                                        Reset Tutup Semua
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={saveAvailability}>
                                <div className="max-h-[460px] overflow-auto rounded-xl border border-slate-100 p-2">
                                    <table className="w-full min-w-[580px] table-fixed border-separate border-spacing-1.5 text-left">
                                        <thead>
                                            <tr>
                                                <th className="sticky left-0 top-0 z-30 w-28 bg-white px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                                    WAKTU
                                                </th>
                                                {weekdays.map((day) => (
                                                    <th
                                                        key={day.value}
                                                        scope="col"
                                                        className="sticky top-0 z-20 bg-white px-2 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100"
                                                    >
                                                        {day.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTimeSlots.map((slot) => (
                                                <tr key={`${slot.start}-${slot.end}`}>
                                                    <th
                                                        scope="row"
                                                        className="sticky left-0 z-10 h-9 rounded-lg bg-slate-50 px-2 text-[11px] font-semibold text-slate-500"
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
                                                            ? `Rp ${rupiahFormatter.format(availability.price)}`
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
                                                                    className={`h-9 w-full truncate rounded-lg border px-2 py-1 text-[11px] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-[#527D98]/50 disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                        isPaid
                                                                            ? 'border-sky-300 bg-[#E3F2FD] text-[#1565C0] hover:bg-[#BBDEFB]'
                                                                            : isFree
                                                                              ? 'border-emerald-300 bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]'
                                                                              : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
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

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4">
                                    <div className="space-y-1" aria-live="polite">
                                        {(flash?.success || form.recentlySuccessful) && (
                                            <p className="text-xs font-semibold text-emerald-700">
                                                ✓ {flash?.success || 'Jadwal ketersediaan berhasil disimpan.'}
                                            </p>
                                        )}
                                        {validationErrors.map((error, index) => (
                                            <p
                                                key={`${error}-${index}`}
                                                className="text-xs font-semibold text-rose-600"
                                            >
                                                ⚠ {error}
                                            </p>
                                        ))}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        variant="dark"
                                        size="md"
                                    >
                                        <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {form.processing ? 'Menyimpan...' : 'Simpan Jadwal Ketersediaan'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>

                    {/* KOLOM KANAN (SIDEBAR / 5 of 12 atau 4 of 12) */}
                    <div className="space-y-6 lg:col-span-5 xl:col-span-4">
                        {/* 1. MENUNGGU REFUND */}
                        <Card as="section" id="menunggu-refund" variant="danger" className="p-5">
                            <SectionHeader
                                icon={
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                }
                                tag="AKSI DIPERLUKAN"
                                tagColor="text-rose-600"
                                title={`Menunggu Refund (${safeRefundRequests.length})`}
                                badge={
                                    <Badge variant="danger" size="sm">
                                        {safeRefundRequests.length} Perlu Diproses
                                    </Badge>
                                }
                                className="border-b border-rose-100 pb-3 mb-3"
                            />

                            {safeRefundRequests.length > 0 ? (
                                <div className="space-y-3">
                                    {displayedRefundRequests.map((refundRequest) => {
                                        const isOverdue = isRefundOverdue(refundRequest.refund_deadline);

                                        return (
                                            <div
                                                key={refundRequest.id}
                                                className={`rounded-xl border p-3.5 transition ${
                                                    isOverdue
                                                        ? 'border-rose-300 bg-rose-50/40'
                                                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-900">
                                                            {refundRequest.student?.name ?? 'Student'}
                                                        </h3>
                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            Jadwal: {formatSessionDateTime(refundRequest.schedule_time)}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant={isOverdue ? 'dangerBold' : 'warningBold'}
                                                        size="xs"
                                                    >
                                                        {isOverdue ? 'Melewati batas' : 'Menunggu Refund'}
                                                    </Badge>
                                                </div>

                                                <p className="mt-2 text-xs text-slate-600">
                                                    Batas:{' '}
                                                    <strong className={isOverdue ? 'text-rose-700 font-bold' : 'text-slate-800'}>
                                                        {formatSessionDateTime(refundRequest.refund_deadline)}
                                                    </strong>
                                                </p>

                                                <div className="mt-3">
                                                    <Button
                                                        href={route('mentor.refund.form', refundRequest.id)}
                                                        variant={isOverdue ? 'danger' : 'dark'}
                                                        size="sm"
                                                        className="w-full py-2"
                                                    >
                                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Proses Refund
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Tombol Expand / Collapse jika > 3 */}
                                    {safeRefundRequests.length > 3 && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setShowAllRefunds(!showAllRefunds)}
                                            className="w-full py-2 text-slate-600"
                                        >
                                            {showAllRefunds
                                                ? 'Sembunyikan Permintaan Refund ^'
                                                : `Lihat ${hiddenRefundCount} Permintaan Refund Lainnya v`}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <EmptyState message="Tidak ada refund yang perlu diproses." className="py-4" />
                            )}
                        </Card>

                        {/* 2. DILAPORKAN BELUM DITERIMA */}
                        {safeReportedRefundRequests.length > 0 && (
                            <Card as="section" variant="warning" className="p-5">
                                <SectionHeader
                                    tag="PERLU DITINJAU"
                                    tagColor="text-amber-700"
                                    title="Dilaporkan Belum Diterima"
                                    badge={
                                        <Badge variant="warning" size="sm">
                                            {safeReportedRefundRequests.length} Laporan
                                        </Badge>
                                    }
                                    className="border-b border-amber-100 pb-3 mb-3"
                                />

                                <div className="space-y-3">
                                    {safeReportedRefundRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 text-xs"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-slate-900">
                                                    {request.student?.name ?? 'Student'}
                                                </h3>
                                                <Badge variant="warningBold" size="xs">
                                                    Belum Diterima
                                                </Badge>
                                            </div>
                                            <div className="mt-2 space-y-0.5 text-slate-600">
                                                <p>Jadwal Sesi: {formatSessionDateTime(request.schedule_time)}</p>
                                                <p>Bukti Diunggah: {formatSessionDateTime(request.refund_proof_uploaded_at)}</p>
                                            </div>
                                            <p className="mt-2 text-[11px] text-amber-900/80 leading-relaxed italic bg-amber-50/80 p-2 rounded-lg border border-amber-100">
                                                "Student melaporkan belum menerima transfer. Belum ada tindakan yang tersedia di aplikasi untuk laporan ini."
                                            </p>

                                            <div className="mt-2.5 text-center">
                                                <span className="text-[11px] font-medium text-slate-400 cursor-default">
                                                    Lihat Bukti Transfer
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* 3. DIBATALKAN STUDENT - 7 HARI TERAKHIR */}
                        {safeStudentCancelledSessions.length > 0 && (
                            <Card as="section" className="p-5">
                                <SectionHeader
                                    tag="7 HARI TERAKHIR"
                                    tagColor="text-slate-400"
                                    title="Dibatalkan Student"
                                    badge={
                                        <Badge variant="neutral" size="sm">
                                            {safeStudentCancelledSessions.length} Sesi
                                        </Badge>
                                    }
                                    className="border-b border-slate-100 pb-3 mb-3"
                                />

                                <div className="space-y-3">
                                    {safeStudentCancelledSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs text-slate-600"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-slate-900">
                                                    {session.student?.name ?? 'Student'}
                                                </h3>
                                                <span className="text-[11px] text-slate-400">
                                                    {formatSessionDateTime(session.schedule_time)}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-slate-600">
                                                Alasan: {session.cancellation_reason || 'Saya berhalangan hadir pada jam tersebut.'}
                                            </p>
                                            <p className="mt-2 text-[11px] text-emerald-700 font-semibold">
                                                ✓ Slot otomatis kembali kosong
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* 4. PROFIL MENTOR (DARK CARD) */}
                        <Card as="section" variant="dark" className="p-5">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-sm font-bold text-white shadow-sm">
                                    {avatarInitials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        PROFIL MENTOR
                                    </p>
                                    <h3 className="truncate text-base font-bold text-white">
                                        {mentorName}
                                    </h3>
                                    <p className="truncate text-xs text-slate-400">
                                        {mentorProfile?.expertise ?? 'Fullstack & Cloud Architecture'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-slate-700 pt-3">
                                <p className="text-xs font-bold text-slate-300">Tentang Saya:</p>
                                <p className="mt-1 text-xs text-slate-400 leading-relaxed line-clamp-3">
                                    {mentorProfile?.bio ||
                                        'Senior Developer dengan pengalaman 8+ tahun di industri tech. Siap membimbing seputar Laravel, React, dan System Design.'}
                                </p>
                            </div>

                            <div className="mt-4">
                                <Button
                                    href={route('profile.edit')}
                                    variant="subtleDark"
                                    size="sm"
                                    className="w-full py-2"
                                >
                                    Edit Profil Mentor
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-6 pb-8 text-xs text-slate-400 sm:flex-row">
                    <p>© 2026 Pathway Indonesia. Hak Cipta Dilindungi.</p>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="hover:text-slate-600 cursor-default">Panduan Mentor</span>
                        <span className="hover:text-slate-600 cursor-default">Kebijakan Refund</span>
                        <span className="hover:text-slate-600 cursor-default">Bantuan &amp; Dukungan</span>
                    </div>
                </footer>
            </main>

            {/* POPOVER DIALOG PENGATURAN SLOT TERSEDIA */}
            {editorSlot &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={popoverRef}
                        role="dialog"
                        aria-label="Atur ketersediaan slot"
                        className="fixed z-50 max-h-[calc(100vh-1rem)] w-72 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            left: `${popoverPosition.left}px`,
                            top: `${popoverPosition.top}px`,
                        }}
                    >
                        <div className="mb-3 border-b border-slate-100 pb-2.5">
                            <h3 className="text-sm font-bold text-slate-900">
                                Ubah Status Slot
                            </h3>
                            <p className="text-xs text-slate-500">
                                {weekdays.find((day) => day.value === editorSlot.day)?.label ?? editorSlot.day},{' '}
                                {editorSlot.start} - {editorSlot.end} WIB
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            {/* Option 1: Tutup */}
                            <button
                                type="button"
                                aria-pressed={selectedAvailabilityType === 'tutup'}
                                onClick={() => applyAvailabilityChoice('tutup')}
                                className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                                    selectedAvailabilityType === 'tutup'
                                        ? 'border-slate-400 bg-slate-50 text-slate-900 ring-1 ring-slate-400'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300">
                                        {selectedAvailabilityType === 'tutup' && (
                                            <span className="h-2 w-2 rounded-full bg-slate-600" />
                                        )}
                                    </span>
                                    <span>Tutup (Nonaktif)</span>
                                </div>
                                <span className="text-[10px] text-slate-400">Tidak reservable</span>
                            </button>

                            {/* Option 2: Gratis */}
                            <button
                                type="button"
                                aria-pressed={selectedAvailabilityType === 'gratis'}
                                onClick={() => applyAvailabilityChoice('gratis')}
                                className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                                    selectedAvailabilityType === 'gratis'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300">
                                        {selectedAvailabilityType === 'gratis' && (
                                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                        )}
                                    </span>
                                    <span>Gratis (0 IDR)</span>
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-700">0 IDR</span>
                            </button>

                            {/* Option 3: Berbayar */}
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
                                            ? (toIntegerPrice(currentSlot.price) ?? defaultPrice)
                                            : defaultPrice,
                                    );
                                }}
                                className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs font-medium transition ${
                                    selectedAvailabilityType === 'berbayar'
                                        ? 'border-sky-500 bg-sky-50 text-sky-900 ring-1 ring-sky-500'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-300">
                                        {selectedAvailabilityType === 'berbayar' && (
                                            <span className="h-2 w-2 rounded-full bg-[#527D98]" />
                                        )}
                                    </span>
                                    <span>Berbayar (Rp)</span>
                                </div>
                                <span className="text-[10px] font-semibold text-sky-700">Aktif</span>
                            </button>

                            {/* Paid Price Input Form */}
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
                                    className="mt-2 rounded-xl border border-sky-100 bg-sky-50/50 p-2.5 text-xs"
                                >
                                    <label
                                        htmlFor="availability-slot-price"
                                        className="font-medium text-slate-700"
                                    >
                                        Tarif Slot Sesi (Rp)
                                    </label>
                                    <input
                                        id="availability-slot-price"
                                        type="number"
                                        min="1000"
                                        step="1000"
                                        required
                                        value={paidPriceDraft ?? ''}
                                        onChange={(event) => {
                                            const value = event.target.value;
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
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#527D98] focus:outline-none focus:ring-1 focus:ring-[#527D98]"
                                        placeholder="50000"
                                    />
                                    <Button
                                        type="submit"
                                        disabled={
                                            paidPriceDraft === null ||
                                            paidPriceDraft < 1000
                                        }
                                        size="xs"
                                        className="mt-2 w-full py-1.5"
                                    >
                                        Terapkan Tarif
                                    </Button>
                                </form>
                            )}
                        </div>

                        <div className="mt-3 border-t border-slate-100 pt-2.5 text-right">
                            <button
                                type="button"
                                onClick={() => closeAvailabilityEditor(true)}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
