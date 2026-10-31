import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import NotificationBell from '@/Components/NotificationBell';
import {
    AlertBanner,
    Badge,
    Button,
    Card,
    themeTokens,
} from '@/Components/ui';

const sessionDateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
});

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
});

const statusStyles = {
    dikonfirmasi: {
        label: 'Dikonfirmasi',
        className: 'bg-[#E7EEF1] text-[#527D98]',
        dotClassName: 'bg-[#6594B1]',
    },
    berlangsung: {
        label: 'Berlangsung',
        className: 'bg-[#E8F2E8] text-[#477E50]',
        dotClassName: 'bg-[#65B175]',
    },
    selesai: {
        label: 'Selesai',
        className: 'bg-[#E5F0E7] text-[#3E7048]',
        dotClassName: 'bg-[#4E965D]',
    },
};

function formatSessionDateTime(value) {
    if (!value) {
        return 'Waktu tidak tersedia';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Waktu tidak tersedia'
        : `${sessionDateTimeFormatter.format(date)} WIB`;
}
function formatNoShowDeadline(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'batas waktu tidak tersedia';
    }

    return `${new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Asia/Jakarta',
    }).format(date)} WIB`;
}
function getInitials(name) {
    return (
        String(name ?? 'Student')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'S'
    );
}

function getPublicStorageUrl(path) {
    if (!path) {
        return null;
    }

    const value = String(path);

    if (/^https?:\/\//i.test(value)) {
        return value;
    }

    return `/storage/${value
        .replace(/^\/+/, '')
        .replace(/^storage\//, '')
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/')}`;
}

function ErrorMessages({ messages }) {
    if (messages.length === 0) {
        return null;
    }

    return (
        <AlertBanner
            variant="danger"
            tag="PERHATIAN"
            title="Terjadi Kesalahan"
            className="mb-2"
        >
            <div className="mt-1 space-y-0.5 text-xs font-medium text-rose-700">
                {messages.map((message, index) => (
                    <p key={`${message}-${index}`}>{message}</p>
                ))}
            </div>
        </AlertBanner>
    );
}

export default function SessionTracking({
    session,
    canReportNoShow = false,
    noShowReport = null,
}) {
    const { auth, errors: pageErrors = {}, flash } = usePage().props;
    const [isCancellationModalOpen, setIsCancellationModalOpen] =
        useState(false);
    const [hasCopiedDiscordLink, setHasCopiedDiscordLink] = useState(false);
    const [copyError, setCopyError] = useState('');
    const startForm = useForm({});
    const completeForm = useForm({
        proof_file: null,
        notes_from_mentor: session.notes_from_mentor ?? '',
    });
    const cancelForm = useForm({
        cancellation_reason: '',
    });
    const [isNoShowReportModalOpen, setIsNoShowReportModalOpen] =
        useState(false);
    const [isNoShowRespondModalOpen, setIsNoShowRespondModalOpen] =
        useState(false);
    const noShowReportForm = useForm({
        evidence: null,
        reporter_note: '',
    });
    const noShowRespondForm = useForm({
        response_note: '',
        response_evidence: null,
    });
    const mentorName = auth?.user?.name ?? 'Mentor';
    const mentorInitials = getInitials(mentorName);
    const studentName = session.student?.name ?? 'Student';
    const status = statusStyles[session.status] ?? {
        label: session.status ?? 'Status tidak tersedia',
        className: 'bg-[#F0EFEB] text-[#737B76]',
        dotClassName: 'bg-[#9AA19C]',
    };
    const proofUrl = getPublicStorageUrl(session.proof_file);
    const formErrors = [
        ...Object.values(pageErrors),
        ...Object.values(startForm.errors),
        ...Object.values(completeForm.errors),
        ...Object.values(cancelForm.errors),
    ].filter(Boolean);
    const errorMessages = [
        ...new Set([flash?.error, ...formErrors, copyError].filter(Boolean)),
    ];

        useEffect(() => {
        if (!isNoShowReportModalOpen && !isNoShowRespondModalOpen) {
            return;
        }

        function handleKeyDown(event) {
            if (event.key !== 'Escape') {
                return;
            }

            if (isNoShowRespondModalOpen && !noShowRespondForm.processing) {
                setIsNoShowRespondModalOpen(false);
            } else if (
                isNoShowReportModalOpen &&
                !noShowReportForm.processing
            ) {
                setIsNoShowReportModalOpen(false);
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        isNoShowReportModalOpen,
        isNoShowRespondModalOpen,
        noShowReportForm.processing,
        noShowRespondForm.processing,
    ]);
    function startSession() {
        startForm.patch(route('mentor.session.start', session.id), {
            preserveScroll: true,
        });
    }

    function completeSession(event) {
        event.preventDefault();
        completeForm.patch(
            route('mentor.session.complete', session.id),
            {
                forceFormData: true,
                preserveScroll: true,
            },
        );
    }
    function submitNoShowReport(event) {
        event.preventDefault();
        noShowReportForm.post(route('no-show.store', session.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsNoShowReportModalOpen(false);
                noShowReportForm.reset();
            },
        });
    }

    function submitNoShowRespond(event) {
        event.preventDefault();

        if (!noShowReport) {
            return;
        }

        noShowRespondForm.patch(route('no-show.respond', noShowReport.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsNoShowRespondModalOpen(false);
                noShowRespondForm.reset();
            },
        });
    }
    function cancelSession(event) {
        event.preventDefault();
        cancelForm.patch(route('mentor.session.cancel', session.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsCancellationModalOpen(false);
                cancelForm.reset();
            },
        });
    }

    async function copyDiscordLink() {
        setCopyError('');

        if (!navigator.clipboard?.writeText) {
            setCopyError('Browser ini tidak mendukung penyalinan link otomatis.');
            return;
        }

        try {
            await navigator.clipboard.writeText(session.discord_link);
            setHasCopiedDiscordLink(true);
        } catch {
            setCopyError('Link gagal disalin. Silakan salin link secara manual.');
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#527D98]/20 selection:text-[#527D98]">
            <Head title="Tracking Sesi Mentoring - Pathway" />

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
                            className="rounded-full px-4 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            Overview
                        </Link>
                        <span className="rounded-full px-4 py-1.5 text-white/80">
                            Mentors Directory
                        </span>
                        <span className="rounded-full px-4 py-1.5 text-white/80">
                            Mentees &amp; Students
                        </span>
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
                                placeholder="Cari mentor, topik..."
                                aria-label="Cari mentor atau topik"
                                className="w-full rounded-full border border-white/25 bg-white/15 py-1.5 pl-9 pr-3 text-xs text-white placeholder:text-white/70 focus:border-white focus:bg-white/25 focus:outline-none focus:ring-1 focus:ring-white"
                            />
                        </label>
                        <div className="flex shrink-0 items-center gap-3">
                            <NotificationBell />
                            <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pl-1 pr-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5ECDD] text-xs font-bold text-[#34443D] shadow-sm">
                                    {mentorInitials}
                                </div>
                                <div className="hidden text-left sm:block">
                                    <p className="max-w-[130px] truncate text-xs font-semibold leading-tight text-white">
                                        {mentorName}
                                    </p>
                                    <p className="truncate text-[10px] text-white/75">Mentor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* BREADCRUMB & STATUS BAR */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                        <Link
                            href={route('mentor.dashboard')}
                            className="inline-flex items-center gap-1.5 font-semibold text-[#527D98] transition hover:text-[#3E637A]"
                        >
                            <svg
                                aria-hidden="true"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Jadwal &amp; Sesi
                        </Link>
                        <span className="text-slate-300">|</span>
                        <span className="font-semibold text-slate-700">Session Tracking</span>
                        <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600">
                            #SES-{String(session.id).padStart(4, '0')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge
                            variant={
                                session.status === 'berlangsung'
                                    ? 'success'
                                    : session.status === 'dikonfirmasi'
                                      ? 'primary'
                                      : session.status === 'selesai'
                                        ? 'successBold'
                                        : 'default'
                            }
                            size="md"
                            dot
                            dotColor={
                                session.status === 'berlangsung'
                                    ? 'bg-emerald-500'
                                    : session.status === 'dikonfirmasi'
                                      ? 'bg-[#527D98]'
                                      : 'bg-emerald-600'
                            }
                            className="text-xs font-bold"
                        >
                            {session.status === 'berlangsung'
                                ? 'Berlangsung Sekarang'
                                : status.label}
                        </Badge>
                    </div>
                </div>

                <ErrorMessages messages={errorMessages} />

                {/* STEPPER PROGRESS CARD */}
                <Card className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-100">
                        {/* Step 1: Dikonfirmasi */}
                        <div className="flex items-start gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800">1. Dikonfirmasi</p>
                                <p className="text-[11px] text-slate-500">Jadwal disepakati</p>
                                <p className="text-[10px] text-slate-400 font-medium">Terkonfirmasi</p>
                            </div>
                        </div>

                        {/* Step 2: Ruang Discord Siap */}
                        <div className="flex items-start gap-3 lg:pl-4">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800">2. Ruang Discord Siap</p>
                                <p className="text-[11px] text-slate-500">Kanal privat otomatis</p>
                                <p className="text-[10px] text-slate-400 font-medium">Link siap diakses</p>
                            </div>
                        </div>

                        {/* Step 3: Berlangsung */}
                        <div className="flex items-start gap-3 lg:pl-4">
                            {session.status === 'selesai' ? (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : session.status === 'berlangsung' ? (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#527D98] text-white shadow-xs">
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold">
                                    3
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className={`text-xs font-bold ${session.status === 'berlangsung' ? 'text-[#527D98]' : 'text-slate-800'}`}>
                                        3. Berlangsung
                                    </p>
                                    {session.status === 'berlangsung' && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#527D98] animate-ping" />
                                    )}
                                </div>
                                <p className={`text-[11px] ${session.status === 'berlangsung' ? 'font-semibold text-[#527D98]' : 'text-slate-500'}`}>
                                    {session.status === 'berlangsung'
                                        ? 'Sedang Berlangsung'
                                        : session.status === 'selesai'
                                          ? 'Selesai Dilaksanakan'
                                          : 'Menunggu Waktu Mulai'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {session.schedule_time ? formatSessionDateTime(session.schedule_time).split(',')[1]?.trim() ?? '' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Step 4: Selesai */}
                        <div className="flex items-start gap-3 lg:pl-4">
                            {session.status === 'selesai' ? (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800">4. Selesai</p>
                                <p className="text-[11px] text-slate-500">
                                    {session.status === 'selesai'
                                        ? 'Sesi Telah Selesai'
                                        : 'Menunggu unggah bukti'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">Verifikasi kehadiran</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
                    <div className="space-y-5 lg:col-span-3">
                        {/* DETAIL MENTEE & TOPIK MENTORING */}
                        <Card aria-labelledby="session-info-heading" className="p-5 sm:p-6 space-y-5">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3.5">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 border border-sky-200 text-sm font-bold text-sky-700 shadow-xs">
                                        {getInitials(studentName)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h2
                                                id="session-info-heading"
                                                className="truncate text-base font-bold text-slate-900"
                                            >
                                                {studentName}
                                            </h2>
                                            <Badge variant="neutral" size="xs">
                                                Student
                                            </Badge>
                                        </div>
                                        <p className="truncate text-xs text-slate-500">
                                            {session.student?.email ?? 'Email tidak tersedia'}
                                        </p>
                                    </div>
                                </div>

                                <Badge
                                    variant={
                                        session.status === 'berlangsung'
                                            ? 'success'
                                            : session.status === 'dikonfirmasi'
                                              ? 'primary'
                                              : session.status === 'selesai'
                                                ? 'successBold'
                                                : 'default'
                                    }
                                    dot
                                    size="sm"
                                >
                                    {status.label}
                                </Badge>
                            </div>

                            {/* Kotak Topik Mentoring */}
                            <div className="rounded-xl border border-sky-100 bg-[#F0F5FA] p-4 sm:p-5 space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#527D98]">
                                        Topik Mentoring
                                    </p>
                                    <h3 className="mt-1 text-sm sm:text-base font-bold text-slate-900 leading-snug">
                                        {session.topic || session.notes_from_student || 'Konsultasi & Mentoring 1-on-1'}
                                    </h3>
                                </div>

                                <div className="grid gap-2.5 sm:grid-cols-2 pt-1 border-t border-sky-200/50 text-xs text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <svg className="h-4 w-4 shrink-0 text-[#527D98]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-medium truncate">
                                            {formatSessionDateTime(session.schedule_time)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="h-4 w-4 shrink-0 text-[#527D98]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium truncate">
                                            {session.duration_hours ?? 0} Jam ({((session.duration_hours ?? 0) * 60)} Menit)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Catatan Persiapan dari Mentee */}
                            {session.notes_from_student && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-slate-500">
                                        Catatan Persiapan dari Mentee:
                                    </p>
                                    <p className="text-xs italic leading-relaxed text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                        "{session.notes_from_student}"
                                    </p>
                                </div>
                            )}
                        </Card>

                        {/* STATUS PEMBAYARAN */}
                        <Card className="p-5 sm:p-6 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Status Pembayaran
                                            </h3>
                                            <Badge variant={session.is_free_session ? 'default' : 'primary'} size="xs">
                                                {session.is_free_session ? 'Sesi Gratis' : 'Sesi Berbayar'}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            {session.is_free_session
                                                ? 'Sesi bimbingan bebas biaya'
                                                : 'Sistem komitmen honorarium mentoring'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-left sm:text-right">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                        Total Biaya Sesi
                                    </p>
                                    <p className="text-base font-extrabold text-[#527D98]">
                                        {session.is_free_session
                                            ? 'Rp 0'
                                            : `Rp ${rupiahFormatter.format(Number(session.price_snapshot ?? 0))}`}
                                    </p>
                                    {!session.is_free_session && session.duration_hours && (
                                        <p className="text-[10px] text-slate-400">
                                            {session.duration_hours} Jam @ Rp {rupiahFormatter.format(Number(session.price_snapshot ?? 0) / session.duration_hours)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!session.is_free_session ? (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[11px] font-semibold text-slate-500">
                                                    DP Wajib Masuk (50%)
                                                </p>
                                                <Badge variant="success" size="xs">
                                                    Terverifikasi
                                                </Badge>
                                            </div>
                                            <p className="text-base font-bold text-slate-900">
                                                Rp {rupiahFormatter.format(Number(session.price_snapshot ?? 0) * 0.5)}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                Diterima via QRIS Pathway
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[11px] font-semibold text-slate-500">
                                                    Sisa Pelunasan (50%)
                                                </p>
                                                <Badge variant="warning" size="xs">
                                                    {session.status === 'selesai' ? 'Siap Dicairkan' : 'Menunggu Pasca-Sesi'}
                                                </Badge>
                                            </div>
                                            <p className="text-base font-bold text-slate-900">
                                                Rp {rupiahFormatter.format(Number(session.price_snapshot ?? 0) * 0.5)}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {session.status === 'selesai'
                                                    ? 'Diteruskan setelah verifikasi'
                                                    : 'Dibayarkan mentee saat konfirmasi selesai'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 rounded-xl bg-sky-50/60 border border-sky-100/80 px-3.5 py-2.5 text-[11px] text-slate-600">
                                        <svg className="h-4 w-4 shrink-0 text-[#527D98]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>
                                            Pelunasan sisa 50% akan ditransfer mentee bersamaan dengan pemberian ulasan/rating setelah sesi ditandai selesai.
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                                    Sesi mentoring ini disediakan secara gratis untuk mentee.
                                </div>
                            )}
                        </Card>

                        {/* RUANG MENTORING DISCORD */}
                        {['dikonfirmasi', 'berlangsung'].includes(session.status) && (
                            <Card
                                aria-labelledby="discord-heading"
                                className="p-5 sm:p-6 space-y-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2
                                                id="discord-heading"
                                                className="text-sm font-bold text-slate-900"
                                            >
                                                Ruang Mentoring Discord Anda
                                            </h2>
                                            <p className="text-[11px] text-slate-500">
                                                Room permanen, sama untuk semua sesi Anda.
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="success" size="xs">
                                        Room Permanen Aktif
                                    </Badge>
                                </div>

                                {session.discord_link ? (
                                    <>
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-700">
                                                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                <span className="truncate font-mono">
                                                    {session.discord_link}
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={copyDiscordLink}
                                                className="shrink-0"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                {hasCopiedDiscordLink
                                                    ? 'Link Tersalin'
                                                    : 'Salin Link'}
                                            </Button>
                                        </div>

                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <Button
                                                href={session.discord_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                variant="primary"
                                                size="sm"
                                                className="w-full sm:w-auto"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                Buka Discord App / Web
                                            </Button>
                                            <p className="text-[11px] text-slate-400">
                                                Tautan ini telah tersimpan di profil mentor Anda dan otomatis dikirim ke email mentee setiap sesi terkonfirmasi.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                                        Link Discord belum tersedia. Silakan periksa kembali sebelum memulai sesi.
                                    </div>
                                )}

                                {session.status === 'dikonfirmasi' && (
                                    <div className="pt-2">
                                        <Button
                                            type="button"
                                            onClick={startSession}
                                            disabled={startForm.processing}
                                            variant="primary"
                                            size="md"
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm rounded-xl shadow-xs"
                                        >
                                            {startForm.processing
                                                ? 'Memulai Sesi...'
                                                : 'Mulai Sesi'}
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* UNGGAH BUKTI MENTORING (STATUS BERLANGSUNG) */}
                        {session.status === 'berlangsung' && (
                            <Card
                                aria-labelledby="proof-heading"
                                className="p-5 sm:p-6 space-y-5"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2
                                                id="proof-heading"
                                                className="text-sm font-bold text-slate-900"
                                            >
                                                Unggah Bukti Mentoring
                                            </h2>
                                            <p className="text-[11px] text-slate-500">
                                                Unggah tangkapan layar panggilan Discord atau foto bersama mentee.
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="danger" size="xs">
                                        Wajib untuk Penyelesaian Sesi
                                    </Badge>
                                </div>

                                <form
                                    onSubmit={completeSession}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label
                                            htmlFor="proof_file"
                                            className="block text-xs font-semibold text-slate-700 mb-1.5"
                                        >
                                            File Bukti Sesi
                                        </label>

                                        {/* Dropzone container */}
                                        <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center transition hover:border-[#527D98]/60 hover:bg-slate-50">
                                            <input
                                                id="proof_file"
                                                name="proof_file"
                                                type="file"
                                                accept="image/*"
                                                required
                                                onChange={(event) =>
                                                    completeForm.setData(
                                                        'proof_file',
                                                        event.target.files?.[0] ?? null,
                                                    )
                                                }
                                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            />
                                            <div className="flex flex-col items-center pointer-events-none">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-[#527D98] shadow-xs">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                </div>
                                                <p className="mt-2 text-xs font-medium text-slate-700">
                                                    Seret file tangkapan layar ke sini atau{' '}
                                                    <span className="font-semibold text-[#527D98] underline">
                                                        klik untuk browse
                                                    </span>
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-400">
                                                    Format yang didukung: JPG, PNG (Maksimal ukuran file 5 MB)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Preview file terpilih */}
                                        {completeForm.data.proof_file && (
                                            <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-bold text-slate-800">
                                                            {completeForm.data.proof_file.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {(completeForm.data.proof_file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="success" size="xs">
                                                        Siap Dikirim
                                                    </Badge>
                                                    <button
                                                        type="button"
                                                        onClick={() => completeForm.setData('proof_file', null)}
                                                        className="text-slate-400 hover:text-rose-600 p-1"
                                                        title="Hapus file"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {completeForm.errors.proof_file && (
                                            <p className="mt-2 text-xs font-medium text-rose-600">
                                                {completeForm.errors.proof_file}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label
                                                htmlFor="notes_from_mentor"
                                                className="block text-xs font-semibold text-slate-700"
                                            >
                                                Catatan Evaluasi Sesi{' '}
                                                <span className="font-normal text-slate-400">
                                                    (opsional untuk mentee)
                                                </span>
                                            </label>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {completeForm.data.notes_from_mentor?.length ?? 0} karakter
                                            </span>
                                        </div>
                                        <textarea
                                            id="notes_from_mentor"
                                            name="notes_from_mentor"
                                            rows="4"
                                            value={completeForm.data.notes_from_mentor}
                                            onChange={(event) =>
                                                completeForm.setData(
                                                    'notes_from_mentor',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Tuliskan evaluasi, masukan, atau rekomendasi materi untuk student..."
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-1 focus:ring-[#527D98]"
                                        />
                                        {completeForm.errors.notes_from_mentor && (
                                            <p className="mt-1.5 text-xs font-medium text-rose-600">
                                                {completeForm.errors.notes_from_mentor}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            <span>
                                                Kompensasi honorarium sesi dicairkan otomatis setelah bukti diverifikasi.
                                            </span>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={
                                                completeForm.processing ||
                                                !completeForm.data.proof_file
                                            }
                                            variant="primary"
                                            size="sm"
                                            className="bg-[#3A5A40] hover:bg-[#2C4631] text-white shadow-xs shrink-0 py-2.5 px-5"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {completeForm.processing
                                                ? 'Mengirim Bukti...'
                                                : 'Submit Bukti & Selesaikan Sesi'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        {/* TAMPILAN SESI TELAH SELESAI */}
                        {session.status === 'selesai' && (
                            <Card
                                aria-labelledby="completed-heading"
                                className="p-5 sm:p-6 space-y-5 border-emerald-200"
                            >
                                <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                        <svg
                                            aria-hidden="true"
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2
                                            id="completed-heading"
                                            className="text-sm font-bold text-emerald-800"
                                        >
                                            Sesi Mentoring Telah Selesai
                                        </h2>
                                        <p className="text-[11px] text-slate-500">
                                            Bukti dan catatan evaluasi sesi tersimpan.
                                        </p>
                                    </div>
                                </div>

                                {proofUrl ? (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-700">
                                            Bukti Mentoring Terverifikasi
                                        </p>
                                        <a
                                            href={proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-[#527D98]"
                                            aria-label="Buka bukti mentoring di tab baru"
                                        >
                                            <img
                                                src={proofUrl}
                                                alt={`Bukti sesi mentoring bersama ${studentName}`}
                                                className="max-h-72 w-full object-contain p-2 transition group-hover:scale-[1.01]"
                                            />
                                        </a>
                                    </div>
                                ) : (
                                    <p className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-500">
                                        Tidak ada bukti mentoring yang tersimpan.
                                    </p>
                                )}

                                <div>
                                    <h3 className="text-xs font-bold text-slate-800">
                                        Catatan Evaluasi Sesi
                                    </h3>
                                    <p className="mt-1.5 whitespace-pre-line rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-xs leading-relaxed text-slate-700">
                                        {session.notes_from_mentor?.trim() ||
                                            'Tidak ada catatan evaluasi.'}
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>

                    <aside className="space-y-5 lg:col-span-2">
                        {/* PENYESUAIAN JADWAL / PEMBATALAN SESI */}
                        {session.status === 'dikonfirmasi' && (
                            <Card className="p-5 sm:p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#527D98] border border-sky-100">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Penyesuaian Jadwal Mendadak
                                    </h2>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-500">
                                    Jika Anda atau mentee berhalangan sebelum sesi dimulai, batalkan sesi agar kuota atau dana diproses sesuai ketentuan.
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => setIsCancellationModalOpen(true)}
                                    variant="secondary"
                                    size="sm"
                                    className="w-full justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                                >
                                    Batalkan Sesi
                                </Button>
                                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-100">
                                    <svg className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        Batas toleransi keterlambatan 15 menit sebelum sesi dapat ditandai sebagai kendala kehadiran (no-show).
                                    </span>
                                </div>
                            </Card>
                        )}

                        {/* KENDALA KEHADIRAN MENTEE (NO-SHOW) */}
                        {canReportNoShow && (
                            <Card className="p-5 sm:p-6 space-y-3.5 border-rose-200 bg-rose-50/20">
                                <div className="flex items-center gap-2.5 text-rose-700">
                                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Kendala Kehadiran Mentee?
                                    </h2>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-600">
                                    Jika {studentName} belum bergabung ke kanal Discord setelah 15 menit waktu mulai tanpa memberikan kabar darurat.
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        noShowReportForm.reset();
                                        noShowReportForm.clearErrors();
                                        setIsNoShowReportModalOpen(true);
                                    }}
                                    variant="danger"
                                    size="sm"
                                    className="w-full justify-center shadow-xs"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Laporkan Kendala Kehadiran (No-Show)
                                </Button>
                            </Card>
                        )}

                        {/* RINGKASAN SESI */}
                        <Card
                            aria-labelledby="quick-info-heading"
                            className="p-5 sm:p-6 space-y-4"
                        >
                            <h2
                                id="quick-info-heading"
                                className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5"
                            >
                                Ringkasan Sesi
                            </h2>
                            <dl className="divide-y divide-slate-100 text-xs">
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-500">Student</dt>
                                    <dd className="font-bold text-slate-900">{studentName}</dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-500">Durasi</dt>
                                    <dd className="font-bold text-slate-900">{session.duration_hours ?? 0} Jam</dd>
                                </div>
                                <div className="flex items-center justify-between py-2.5">
                                    <dt className="text-slate-500">Biaya</dt>
                                    <dd className="font-bold text-[#527D98]">
                                        {session.is_free_session
                                            ? 'Gratis'
                                            : `Rp ${rupiahFormatter.format(Number(session.price_snapshot ?? 0))}`}
                                    </dd>
                                </div>
                            </dl>
                        </Card>
                    </aside>
                </div>

                {/* BANNER LAPORAN NO-SHOW (JIKA ADA) */}
                {noShowReport && (
                    <Card
                        variant="warning"
                        className="p-5 sm:p-6 space-y-3.5 border-amber-300 bg-amber-50/70 shadow-sm"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                            <div className="flex items-center gap-2.5 text-amber-800">
                                <svg className="h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h2 className="text-sm font-bold text-slate-900">
                                    Laporan No-Show (Sengketa Kehadiran)
                                </h2>
                            </div>
                            <Badge variant={noShowReport.status === 'disanggah' ? 'danger' : 'warningBold'} size="xs">
                                {noShowReport.status === 'menunggu_respons' ? 'Menunggu Respons' : 'Laporan Disanggah'}
                            </Badge>
                        </div>

                        {noShowReport.status === 'menunggu_respons' && (
                            <p className="text-xs leading-relaxed text-amber-900 font-medium">
                                {noShowReport.is_reporter
                                    ? `Laporan Anda terkirim. Student punya waktu sampai ${formatNoShowDeadline(noShowReport.respond_deadline)} untuk menanggapi. Jika tidak ada tanggapan, laporan berlaku.`
                                    : `Student melaporkan Anda tidak hadir. Tanggapi sebelum ${formatNoShowDeadline(noShowReport.respond_deadline)}, kalau tidak laporan berlaku dan sesi dibatalkan.`}
                            </p>
                        )}
                        {noShowReport.status === 'disanggah' && (
                            <p className="text-xs leading-relaxed text-amber-900 font-medium">
                                Laporan disanggah. Menunggu keputusan admin dan verifikasi log kehadiran.
                            </p>
                        )}
                        {noShowReport.reporter_note && (
                            <div className="rounded-xl bg-white/80 p-3 border border-amber-200/80 text-xs text-slate-700">
                                <span className="font-bold text-slate-900">Catatan Pelapor: </span>
                                {noShowReport.reporter_note}
                            </div>
                        )}
                        {noShowReport.response_note && (
                            <div className="rounded-xl bg-white/80 p-3 border border-amber-200/80 text-xs text-slate-700">
                                <span className="font-bold text-slate-900">Sanggahan: </span>
                                {noShowReport.response_note}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div className="flex flex-wrap gap-4 text-xs font-semibold">
                                <a
                                    href={route('no-show.evidence', [noShowReport.id, 'report'])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#527D98] hover:underline inline-flex items-center gap-1"
                                >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Lihat bukti laporan
                                </a>
                                {noShowReport.has_response_evidence && (
                                    <a
                                        href={route('no-show.evidence', [
                                            noShowReport.id,
                                            'response',
                                        ])}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#527D98] hover:underline inline-flex items-center gap-1"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Lihat bukti sanggahan
                                    </a>
                                )}
                            </div>

                            {noShowReport.can_respond && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setIsNoShowRespondModalOpen(true)}
                                    className="shadow-xs"
                                >
                                    Tanggapi Laporan
                                </Button>
                            )}
                        </div>
                    </Card>
                )}

                {/* FOOTER */}
                <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-6 pb-8 text-xs text-slate-400 sm:flex-row">
                    <p>© 2026 Pathway Mentorship Ecosystem. All rights reserved.</p>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="hover:text-slate-600 cursor-default">Privacy Policy</span>
                        <span className="hover:text-slate-600 cursor-default">Terms of Service</span>
                        <span className="hover:text-slate-600 cursor-default">Support Desk</span>
                    </div>
                </footer>
            </main>

{isNoShowReportModalOpen && (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4"
        onMouseDown={(event) => {
            if (
                event.target === event.currentTarget &&
                !noShowReportForm.processing
            ) {
                setIsNoShowReportModalOpen(false);
            }
        }}
    >
        <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-no-show-report-heading"
            className="w-full max-w-lg p-5 sm:p-6 shadow-2xl border-slate-200"
        >
            <div className="flex items-center gap-2.5 text-rose-600 border-b border-slate-100 pb-3">
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2
                    id="mentor-no-show-report-heading"
                    className="text-base font-bold text-slate-900"
                >
                    Laporkan Student Tidak Hadir
                </h2>
            </div>

            <form onSubmit={submitNoShowReport} className="mt-4 space-y-4">
                <div>
                    <label
                        htmlFor="mentor_no_show_evidence"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                        Screenshot Bukti Kehadiran
                    </label>
                    <input
                        id="mentor_no_show_evidence"
                        name="evidence"
                        type="file"
                        accept="image/png,image/jpeg"
                        required
                        onChange={(event) =>
                            noShowReportForm.setData(
                                'evidence',
                                event.target.files?.[0] ?? null,
                            )
                        }
                        className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-[#527D98] hover:file:bg-sky-100 cursor-pointer"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                        Format JPG atau PNG, maksimal 5 MB.
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="mentor_no_show_note"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                        Catatan{' '}
                        <span className="font-normal text-slate-400">
                            (opsional)
                        </span>
                    </label>
                    <textarea
                        id="mentor_no_show_note"
                        name="reporter_note"
                        rows="3"
                        maxLength={500}
                        value={noShowReportForm.data.reporter_note}
                        onChange={(event) =>
                            noShowReportForm.setData(
                                'reporter_note',
                                event.target.value,
                            )
                        }
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-1 focus:ring-[#527D98]"
                        placeholder="Ceritakan singkat apa yang terjadi..."
                    />
                </div>

                {[
                    noShowReportForm.errors.message,
                    noShowReportForm.errors.evidence,
                    noShowReportForm.errors.reporter_note,
                ]
                    .filter(Boolean)
                    .map((message) => (
                        <p
                            key={message}
                            role="alert"
                            className="text-xs font-medium text-rose-600"
                        >
                            {message}
                        </p>
                    ))}

                <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end border-t border-slate-100 pt-3.5">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsNoShowReportModalOpen(false)}
                        disabled={noShowReportForm.processing}
                    >
                        Kembali
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        size="sm"
                        disabled={
                            noShowReportForm.processing ||
                            !noShowReportForm.data.evidence
                        }
                    >
                        {noShowReportForm.processing
                            ? 'Mengirim...'
                            : 'Kirim Laporan'}
                    </Button>
                </div>
            </form>
        </Card>
    </div>
)}

{isNoShowRespondModalOpen && noShowReport && (
    <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4"
        onMouseDown={(event) => {
            if (
                event.target === event.currentTarget &&
                !noShowRespondForm.processing
            ) {
                setIsNoShowRespondModalOpen(false);
            }
        }}
    >
        <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-no-show-respond-heading"
            className="w-full max-w-lg p-5 sm:p-6 shadow-2xl border-slate-200"
        >
            <div className="border-b border-slate-100 pb-3">
                <h2
                    id="mentor-no-show-respond-heading"
                    className="text-base font-bold text-slate-900"
                >
                    Tanggapi Laporan No-Show
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                    Jika Anda tidak menanggapi sebelum{' '}
                    <span className="font-semibold text-rose-600">{formatNoShowDeadline(noShowReport.respond_deadline)}</span>, laporan berlaku: sesi dibatalkan dan proses refund diproses.
                </p>
            </div>

            <form onSubmit={submitNoShowRespond} className="mt-4 space-y-4">
                <div>
                    <label
                        htmlFor="mentor_no_show_response_note"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                        Alasan Sanggahan
                    </label>
                    <textarea
                        id="mentor_no_show_response_note"
                        name="response_note"
                        rows="4"
                        required
                        maxLength={500}
                        value={noShowRespondForm.data.response_note}
                        onChange={(event) =>
                            noShowRespondForm.setData(
                                'response_note',
                                event.target.value,
                            )
                        }
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-1 focus:ring-[#527D98]"
                        placeholder="Jelaskan versi Anda..."
                    />
                </div>

                <div>
                    <label
                        htmlFor="mentor_no_show_response_evidence"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                        Screenshot Bukti{' '}
                        <span className="font-normal text-slate-400">
                            (opsional)
                        </span>
                    </label>
                    <input
                        id="mentor_no_show_response_evidence"
                        name="response_evidence"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(event) =>
                            noShowRespondForm.setData(
                                'response_evidence',
                                event.target.files?.[0] ?? null,
                            )
                        }
                        className="block w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-[#527D98] hover:file:bg-sky-100 cursor-pointer"
                    />
                </div>

                {[
                    noShowRespondForm.errors.message,
                    noShowRespondForm.errors.response_note,
                    noShowRespondForm.errors.response_evidence,
                ]
                    .filter(Boolean)
                    .map((message) => (
                        <p
                            key={message}
                            role="alert"
                            className="text-xs font-medium text-rose-600"
                        >
                            {message}
                        </p>
                    ))}

                <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end border-t border-slate-100 pt-3.5">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsNoShowRespondModalOpen(false)}
                        disabled={noShowRespondForm.processing}
                    >
                        Kembali
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={
                            noShowRespondForm.processing ||
                            !noShowRespondForm.data.response_note.trim()
                        }
                    >
                        {noShowRespondForm.processing
                            ? 'Mengirim...'
                            : 'Kirim Sanggahan'}
                    </Button>
                </div>
            </form>
        </Card>
    </div>
)}
            {isCancellationModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsCancellationModalOpen(false);
                        }
                    }}
                >
                    <Card
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-session-heading"
                        className="w-full max-w-lg p-5 sm:p-6 shadow-2xl border-slate-200"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                            <div>
                                <h2
                                    id="cancel-session-heading"
                                    className="text-base font-bold text-slate-900"
                                >
                                    Batalkan Sesi?
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Tindakan ini tidak dapat dibatalkan. Mohon jelaskan alasan pembatalan.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setIsCancellationModalOpen(false)
                                }
                                aria-label="Tutup dialog pembatalan"
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#527D98]"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={cancelSession} className="mt-4 space-y-4">
                            <div>
                                <label
                                    htmlFor="cancellation_reason"
                                    className="block text-xs font-semibold text-slate-700 mb-1"
                                >
                                    Alasan Pembatalan
                                </label>
                                <textarea
                                    id="cancellation_reason"
                                    name="cancellation_reason"
                                    rows="4"
                                    required
                                    value={cancelForm.data.cancellation_reason}
                                    onChange={(event) =>
                                        cancelForm.setData(
                                            'cancellation_reason',
                                            event.target.value,
                                        )
                                    }
                                    className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-1 focus:ring-[#527D98]"
                                    placeholder="Tuliskan alasan pembatalan sesi..."
                                />
                                {cancelForm.errors.cancellation_reason && (
                                    <p className="mt-1 text-xs font-medium text-rose-600">
                                        {cancelForm.errors.cancellation_reason}
                                    </p>
                                )}
                            </div>

                            {!session.is_free_session && (
                                <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900">
                                    Refund akan ditandai menunggu dengan batas waktu 48 jam.
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end border-t border-slate-100 pt-3.5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                        setIsCancellationModalOpen(false)
                                    }
                                >
                                    Kembali
                                </Button>
                                <Button
                                    type="submit"
                                    variant="danger"
                                    size="sm"
                                    disabled={cancelForm.processing}
                                >
                                    {cancelForm.processing
                                        ? 'Membatalkan...'
                                        : 'Ya, Batalkan Sesi'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
