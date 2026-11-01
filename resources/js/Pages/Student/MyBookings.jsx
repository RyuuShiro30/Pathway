import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertBanner,
    Badge,
    Button,
    Card,
    EmptyState,
    themeTokens,
} from '@/Components/ui';
import NotificationBell from '@/Components/NotificationBell';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
});

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
});

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
});

const statusFilters = [
    { value: 'semua', label: 'Semua', countKey: 'semua' },
    { value: 'mendatang', label: 'Mendatang', countKey: 'mendatang' },
    { value: 'menunggu', label: 'Menunggu', countKey: 'menunggu' },
    { value: 'perlu_respon', label: 'Perlu Respon', countKey: 'perlu_respon' },
    { value: 'selesai', label: 'Selesai', countKey: 'selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan / Refund', countKey: 'dibatalkan' },
];

const statusStyles = {
    diajukan: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    dikonfirmasi: 'bg-sky-50 text-sky-700 border border-sky-200/80',
    berlangsung: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    selesai: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    dibatalkan: 'bg-rose-50 text-rose-700 border border-rose-200/80',
};

const statsCards = [
    {
        key: 'total',
        label: 'Total Booking',
        accent: 'bg-slate-100 text-slate-700',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        key: 'menunggu_konfirmasi',
        label: 'Menunggu Respon',
        accent: 'bg-amber-50 text-amber-600',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        key: 'siap_datang',
        label: 'Sesi Mendatang',
        accent: 'bg-emerald-50 text-emerald-600',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        key: 'jam_mentoring',
        label: 'Sesi Selesai',
        accent: 'bg-sky-50 text-sky-600',
        icon: (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
        ),
    },
];

function isScheduleOverdue(booking) {
    if (booking.status !== 'diajukan' || !booking.schedule_time) {
        return false;
    }

    const scheduleTime = new Date(booking.schedule_time);

    return (
        !Number.isNaN(scheduleTime.getTime()) &&
        scheduleTime.getTime() < Date.now()
    );
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
function isScheduleUpcoming(booking) {
    if (!booking.schedule_time) {
        return false;
    }

    const scheduleTime = new Date(booking.schedule_time);

    return (
        !Number.isNaN(scheduleTime.getTime()) &&
        scheduleTime.getTime() > Date.now()
    );
}

function getStatusLabel(booking) {
    if (
        booking.no_show_report &&
        booking.no_show_report.status === 'menunggu_respons'
    ) {
        return booking.no_show_report.is_reporter
            ? 'No-Show Diproses'
            : 'Klarifikasi Diperlukan';
    }

    if (
        booking.status === 'dibatalkan' &&
        booking.refund_status === 'menunggu_konfirmasi'
    ) {
        return 'Konfirmasi Refund';
    }

    if (isScheduleOverdue(booking)) {
        return 'Jadwal Terlewat';
    }

    if (
        booking.status === 'diajukan' &&
        booking.payment_dp_status === 'menunggu_verifikasi'
    ) {
        return 'Menunggu Verifikasi DP';
    }

    if (booking.status === 'dibatalkan' && booking.refund_status === 'menunggu') {
        return 'Menunggu Refund';
    }

    if (booking.status === 'dibatalkan') {
        const refundLabels = {
            selesai: 'Refund Selesai',
            dilaporkan: 'Dilaporkan Belum Diterima',
        };

        if (refundLabels[booking.refund_status]) {
            return refundLabels[booking.refund_status];
        }
    }

    const labels = {
        diajukan: 'Diajukan',
        dikonfirmasi: 'Dikonfirmasi',
        berlangsung: 'Sedang Berlangsung',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
    };

    return labels[booking.status] ?? 'Status tidak tersedia';
}

function getCardBorderClass(booking) {
    if (booking.status === 'berlangsung') {
        return 'border border-emerald-400';
    }

    if (
        booking.no_show_report &&
        booking.no_show_report.status === 'menunggu_respons'
    ) {
        return booking.no_show_report.is_reporter
            ? 'border border-amber-300'
            : 'border border-rose-300';
    }

    if (
        booking.status === 'dibatalkan' &&
        booking.refund_status === 'menunggu_konfirmasi'
    ) {
        return 'border border-amber-300';
    }

    return 'border border-slate-200/90';
}

function getAvatarStyle(booking) {
    if (booking.status === 'berlangsung') {
        return 'bg-[#486B88] text-white';
    }

    if (
        booking.no_show_report &&
        booking.no_show_report.status === 'menunggu_respons'
    ) {
        return booking.no_show_report.is_reporter
            ? 'bg-amber-100 text-amber-800'
            : 'bg-rose-100 text-rose-700';
    }

    if (booking.status === 'selesai') {
        return 'bg-emerald-100 text-emerald-800';
    }

    if (booking.status === 'dikonfirmasi') {
        return 'bg-sky-100 text-sky-700';
    }

    return 'bg-slate-100 text-slate-700';
}

function getInitials(name) {
    return (
        String(name ?? 'Mentor')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'M'
    );
}

function formatBookingDateTime(value) {
    if (!value) {
        return 'Waktu tidak tersedia';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? 'Waktu tidak tersedia' : dateFormatter.format(date);
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

function formatBookingTimeRange(booking) {
    if (!booking.schedule_time || !booking.end_time) {
        return 'Waktu tidak tersedia';
    }

    const start = new Date(booking.schedule_time);
    const end = new Date(booking.end_time);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 'Waktu tidak tersedia';
    }

    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)} WIB`;
}

function formatRupiah(value) {
    return `Rp ${rupiahFormatter.format(Number(value ?? 0))}`;
}

function getSafeDiscordUrl(value) {
    if (typeof value !== 'string' || !value.startsWith('https://')) {
        return null;
    }

    try {
        const url = new URL(value);

        return url.protocol === 'https:' ? url.href : null;
    } catch {
        return null;
    }
}

export default function MyBookings({ bookings = [], stats = {} }) {
    const { auth } = usePage().props;
    const studentName = auth?.user?.name || 'Student';
    const studentInitials = getInitials(studentName);
    const [selectedStatus, setSelectedStatus] = useState('semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('terdekat');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [selectedRefundBooking, setSelectedRefundBooking] = useState(null);
    const [refundDecision, setRefundDecision] = useState(null);
    const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);
    const [refundDecisionError, setRefundDecisionError] = useState('');
    const [isCancellationModalOpen, setIsCancellationModalOpen] =
        useState(false);
    const [selectedConfirmedBooking, setSelectedConfirmedBooking] =
        useState(null);
    const [isConfirmedCancellationModalOpen, setIsConfirmedCancellationModalOpen] =
        useState(false);
    const cancellationReasonRef = useRef(null);
    const confirmedCancellationReasonRef = useRef(null);
    const refundBackButtonRef = useRef(null);
    const cancelForm = useForm({
        cancellation_reason: '',
    });
    const confirmedCancelForm = useForm({
        cancellation_reason: '',
        acknowledge_dp_forfeit: false,
    });
    const [noShowReportBooking, setNoShowReportBooking] = useState(null);
    const [noShowRespondBooking, setNoShowRespondBooking] = useState(null);
    const noShowReportForm = useForm({
        evidence: null,
        reporter_note: '',
    });
    const noShowRespondForm = useForm({
        response_note: '',
        response_evidence: null,
    });

    const safeBookings = Array.isArray(bookings) ? bookings : [];

    const tabCounts = useMemo(
        () => ({
            semua: safeBookings.length,
            mendatang: safeBookings.filter((b) =>
                ['dikonfirmasi', 'berlangsung'].includes(b.status),
            ).length,
            menunggu: safeBookings.filter((b) => b.status === 'diajukan').length,
            perlu_respon: safeBookings.filter(
                (b) =>
                    (b.no_show_report &&
                        b.no_show_report.status === 'menunggu_respons' &&
                        (!b.no_show_report.is_reporter ||
                            b.no_show_report.can_respond)) ||
                    (b.status === 'dibatalkan' &&
                        b.refund_status === 'menunggu_konfirmasi'),
            ).length,
            selesai: safeBookings.filter((b) => b.status === 'selesai').length,
            dibatalkan: safeBookings.filter((b) => b.status === 'dibatalkan')
                .length,
        }),
        [safeBookings],
    );

    const filteredAndSortedBookings = useMemo(() => {
        let result = safeBookings;

        if (selectedStatus === 'mendatang') {
            result = result.filter((b) =>
                ['dikonfirmasi', 'berlangsung'].includes(b.status),
            );
        } else if (selectedStatus === 'menunggu') {
            result = result.filter((b) => b.status === 'diajukan');
        } else if (selectedStatus === 'perlu_respon') {
            result = result.filter(
                (b) =>
                    (b.no_show_report &&
                        b.no_show_report.status === 'menunggu_respons' &&
                        (!b.no_show_report.is_reporter ||
                            b.no_show_report.can_respond)) ||
                    (b.status === 'dibatalkan' &&
                        b.refund_status === 'menunggu_konfirmasi'),
            );
        } else if (selectedStatus === 'selesai') {
            result = result.filter((b) => b.status === 'selesai');
        } else if (selectedStatus === 'dibatalkan') {
            result = result.filter((b) => b.status === 'dibatalkan');
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter((b) => {
                const mentorName = String(b.mentor?.name ?? '').toLowerCase();
                const expertise = String(
                    b.mentor?.expertise ?? '',
                ).toLowerCase();
                const studentNotes = String(
                    b.notes_from_student ?? '',
                ).toLowerCase();
                const reason = String(
                    b.cancellation_reason ?? '',
                ).toLowerCase();

                return (
                    mentorName.includes(query) ||
                    expertise.includes(query) ||
                    studentNotes.includes(query) ||
                    reason.includes(query)
                );
            });
        }

        return [...result].sort((a, b) => {
            const timeA = new Date(a.schedule_time || 0).getTime();
            const timeB = new Date(b.schedule_time || 0).getTime();

            if (sortOrder === 'terbaru') {
                return timeB - timeA;
            }

            return timeA - timeB;
        });
    }, [safeBookings, selectedStatus, searchQuery, sortOrder]);

    const itemsPerPage = 6;
    const totalPages = Math.max(
        1,
        Math.ceil(filteredAndSortedBookings.length / itemsPerPage),
    );
    const currentPageSafe = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (currentPageSafe - 1) * itemsPerPage;
    const endIndex = Math.min(
        startIndex + itemsPerPage,
        filteredAndSortedBookings.length,
    );
    const paginatedBookings = filteredAndSortedBookings.slice(
        startIndex,
        endIndex,
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedStatus, searchQuery, sortOrder]);


    useEffect(() => {
        if (!isCancellationModalOpen) {
            return;
        }

        cancellationReasonRef.current?.focus();
    }, [isCancellationModalOpen]);

    useEffect(() => {
        if (!isCancellationModalOpen) {
            return;
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape' && !cancelForm.processing) {
                setIsCancellationModalOpen(false);
                setSelectedBooking(null);
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCancellationModalOpen, cancelForm.processing]);

    useEffect(() => {
        if (!isConfirmedCancellationModalOpen) {
            return;
        }

        confirmedCancellationReasonRef.current?.focus();
    }, [isConfirmedCancellationModalOpen]);

    useEffect(() => {
        if (!isConfirmedCancellationModalOpen) {
            return;
        }

        function handleKeyDown(event) {
            if (
                event.key === 'Escape' &&
                !confirmedCancelForm.processing
            ) {
                closeConfirmedCancellationModal();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        isConfirmedCancellationModalOpen,
        confirmedCancelForm.processing,
    ]);

    useEffect(() => {
        if (!selectedRefundBooking || !refundDecision) {
            return;
        }

        refundBackButtonRef.current?.focus();
    }, [selectedRefundBooking, refundDecision]);

    useEffect(() => {
        if (!selectedRefundBooking || !refundDecision) {
            return;
        }

        function handleKeyDown(event) {
            if (event.key === 'Escape' && !isRefundSubmitting) {
                closeRefundConfirmation();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedRefundBooking, refundDecision, isRefundSubmitting]);

    function openCancellationModal(booking) {
        cancelForm.reset();
        cancelForm.clearErrors();
        setSelectedBooking(booking);
        setIsCancellationModalOpen(true);
    }

    function closeCancellationModal() {
        if (cancelForm.processing) {
            return;
        }

        setIsCancellationModalOpen(false);
        setSelectedBooking(null);
    }

    function submitCancellation(event) {
        event.preventDefault();

        if (!selectedBooking) {
            return;
        }

        cancelForm.patch(
            route('student.bookings.cancel', selectedBooking.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCancellationModalOpen(false);
                    setSelectedBooking(null);
                    cancelForm.reset();
                },
            },
        );
    }

    function openConfirmedCancellationModal(booking) {
        confirmedCancelForm.reset();
        confirmedCancelForm.clearErrors();
        setSelectedConfirmedBooking(booking);
        setIsConfirmedCancellationModalOpen(true);
    }

    function closeConfirmedCancellationModal() {
        if (confirmedCancelForm.processing) {
            return;
        }

        setIsConfirmedCancellationModalOpen(false);
        setSelectedConfirmedBooking(null);
    }

    function submitConfirmedCancellation(event) {
        event.preventDefault();

        if (!selectedConfirmedBooking) {
            return;
        }

        confirmedCancelForm.patch(
            route(
                'student.bookings.cancel-confirmed',
                selectedConfirmedBooking.id,
            ),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsConfirmedCancellationModalOpen(false);
                    setSelectedConfirmedBooking(null);
                    confirmedCancelForm.reset();
                },
            },
        );
    }
        useEffect(() => {
        if (!noShowReportBooking && !noShowRespondBooking) {
            return;
        }

        function handleKeyDown(event) {
            if (event.key !== 'Escape') {
                return;
            }

            if (noShowRespondBooking) {
                closeNoShowRespondModal();
            } else {
                closeNoShowReportModal();
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        noShowReportBooking,
        noShowRespondBooking,
        noShowReportForm.processing,
        noShowRespondForm.processing,
    ]);
    function openNoShowReportModal(booking) {
        noShowReportForm.reset();
        noShowReportForm.clearErrors();
        setNoShowReportBooking(booking);
    }

    function closeNoShowReportModal() {
        if (noShowReportForm.processing) {
            return;
        }

        setNoShowReportBooking(null);
    }

    function submitNoShowReport(event) {
        event.preventDefault();

        if (!noShowReportBooking) {
            return;
        }

        noShowReportForm.post(
            route('no-show.store', noShowReportBooking.id),
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setNoShowReportBooking(null);
                    noShowReportForm.reset();
                },
            },
        );
    }

    function openNoShowRespondModal(booking) {
        noShowRespondForm.reset();
        noShowRespondForm.clearErrors();
        setNoShowRespondBooking(booking);
    }

    function closeNoShowRespondModal() {
        if (noShowRespondForm.processing) {
            return;
        }

        setNoShowRespondBooking(null);
    }

    function submitNoShowRespond(event) {
        event.preventDefault();

        if (!noShowRespondBooking?.no_show_report) {
            return;
        }

        noShowRespondForm.patch(
            route(
                'no-show.respond',
                noShowRespondBooking.no_show_report.id,
            ),
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setNoShowRespondBooking(null);
                    noShowRespondForm.reset();
                },
            },
        );
    }
    function openRefundConfirmation(booking, decision) {
        setSelectedRefundBooking(booking);
        setRefundDecision(decision);
        setRefundDecisionError('');
    }

    function closeRefundConfirmation() {
        if (isRefundSubmitting) {
            return;
        }

        setSelectedRefundBooking(null);
        setRefundDecision(null);
        setRefundDecisionError('');
    }

    function submitRefundConfirmation() {
        if (
            !selectedRefundBooking ||
            !refundDecision ||
            isRefundSubmitting
        ) {
            return;
        }

        setRefundDecisionError('');
        router.patch(
            route(
                'student.bookings.refund.confirm',
                selectedRefundBooking.id,
            ),
            { decision: refundDecision },
            {
                preserveScroll: true,
                onStart: () => setIsRefundSubmitting(true),
                onFinish: () => setIsRefundSubmitting(false),
                onSuccess: () => {
                    setSelectedRefundBooking(null);
                    setRefundDecision(null);
                    setRefundDecisionError('');
                },
                onError: (errors) => {
                    setRefundDecisionError(
                        errors.decision ?? 'Terjadi kesalahan, coba lagi.',
                    );
                },
            },
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#527D98]/20 selection:text-[#527D98]">
            <Head title="Daftar Booking Mentoring" />

            {/* Design Tokens */}
            <style>{`
                :root {
                    --student-primary: ${themeTokens.colors.primary};
                    --student-header-bg: ${themeTokens.colors.headerBg};
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
                                STUDENT
                            </span>
                        </div>
                    </div>

                    <nav
                        aria-label="Navigasi student"
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
                            <NotificationBell />
                        </div>
                        <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pl-1 pr-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-xs font-bold text-white shadow-sm">
                                {studentInitials}
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="max-w-[130px] truncate text-xs font-semibold leading-tight text-white">
                                    {studentName}
                                </p>
                                <p className="text-[10px] text-white/70">
                                    Student Pathway
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

                {/* BREADCRUMB */}
                <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-400">
                    <ol className="flex flex-wrap items-center gap-1.5">
                        <li className="hover:text-slate-600 cursor-pointer">Area Student</li>
                        <li aria-hidden="true">›</li>
                        <li className="font-semibold text-slate-700">Booking Mentoring</li>
                    </ol>
                </nav>

                {/* PAGE HEADER */}
                <section className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                            Daftar Booking Mentoring
                        </h1>
                        <p className="text-sm text-slate-500">
                            Kelola jadwal temu, status verifikasi sesi, dan riwayat mentoring Anda.
                        </p>
                    </div>
                    <a
                        href={route('mentors.index')}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#527D98] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3E637A] focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2"
                    >
                        + Cari &amp; Jadwalkan Mentor
                    </a>
                </section>

                <section
                    aria-label="Statistik booking"
                    className="grid grid-cols-2 gap-4 xl:grid-cols-4"
                >
                    {statsCards.map((card) => (
                        <article
                            key={card.key}
                            className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm"
                        >
                            <span
                                aria-hidden="true"
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${card.accent}`}
                            >
                                {card.icon}
                            </span>
                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    {card.label}
                                </p>
                                <p className="mt-0.5 text-2xl font-bold text-slate-900">
                                    {Number(stats?.[card.key] ?? 0)}
                                </p>
                            </div>
                        </article>
                    ))}
                </section>

                {/* FILTER, SEARCH & SORT */}
                <section
                    aria-label="Filter dan pencarian booking"
                    className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                >
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {statusFilters.map((filter) => {
                            const count = tabCounts[filter.countKey] ?? 0;
                            const isSelected = selectedStatus === filter.value;
                            const pillColor =
                                {
                                    mendatang: 'bg-emerald-100 text-emerald-800',
                                    menunggu: 'bg-amber-100 text-amber-800',
                                    perlu_respon: 'bg-rose-100 text-rose-800',
                                    selesai: 'bg-slate-100 text-slate-600',
                                    dibatalkan: 'bg-slate-100 text-slate-600',
                                    semua: 'bg-slate-100 text-slate-600',
                                }[filter.countKey] ?? 'bg-slate-100 text-slate-600';

                            return (
                                <button
                                    key={filter.value}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => setSelectedStatus(filter.value)}
                                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-1 ${
                                        isSelected
                                            ? 'bg-[#527D98] text-white shadow-xs'
                                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {filter.label}
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                                            isSelected
                                                ? 'bg-white/20 text-white'
                                                : pillColor
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <svg
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
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
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari mentor / topik..."
                                className="h-9 w-44 sm:w-56 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-1 focus:ring-[#527D98]"
                            />
                        </div>

                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs text-slate-700 focus:border-[#527D98] focus:outline-none focus:ring-1 focus:ring-[#527D98]"
                        >
                            <option value="terdekat">Jadwal Terdekat</option>
                            <option value="terbaru">Terbaru</option>
                        </select>
                    </div>
                </section>

                {filteredAndSortedBookings.length === 0 ? (
                    <Card className="px-5 py-16 text-center">
                        <span
                            aria-hidden="true"
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400"
                        >
                            📋
                        </span>
                        <h2 className="mt-4 text-lg font-bold text-slate-800">
                            {safeBookings.length === 0
                                ? 'Belum ada booking mentoring'
                                : 'Tidak ada booking yang sesuai'}
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            {safeBookings.length === 0
                                ? 'Booking mentoring yang Anda ajukan akan tampil di sini.'
                                : 'Pilih filter status lain atau ubah kata kunci pencarian Anda.'}
                        </p>
                    </Card>
                ) : (
                    <section
                        aria-label="Daftar booking"
                        className="space-y-3.5"
                    >
                        {paginatedBookings.map((booking) => {
                            const discordUrl = [
                                'dikonfirmasi',
                                'berlangsung',
                            ].includes(booking.status)
                                ? getSafeDiscordUrl(booking.discord_link)
                                : null;
                            const refundProofUrl =
                                booking.status === 'dibatalkan' &&
                                booking.refund_status === 'menunggu_konfirmasi'
                                    ? getPublicStorageUrl(
                                          booking.refund_proof_path,
                                      )
                                    : null;

                            const isNoShowReporter =
                                booking.no_show_report &&
                                booking.no_show_report.is_reporter &&
                                booking.no_show_report.status ===
                                    'menunggu_respons';

                            const isNoShowRespondent =
                                booking.no_show_report &&
                                !booking.no_show_report.is_reporter &&
                                booking.no_show_report.status ===
                                    'menunggu_respons';

                            const isAwaitingRefundConfirmation =
                                booking.status === 'dibatalkan' &&
                                booking.refund_status ===
                                    'menunggu_konfirmasi';

                            return (
                                <div
                                    key={booking.id}
                                    className={`overflow-hidden rounded-2xl bg-white shadow-xs transition hover:shadow-sm ${getCardBorderClass(
                                        booking,
                                    )}`}
                                >
                                    {/* Main Row */}
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 sm:px-5 sm:py-3.5">
                                        {/* Left: Avatar + Mentor Info */}
                                        <div className="flex min-w-0 items-center gap-3.5">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-xs ${getAvatarStyle(
                                                    booking,
                                                )}`}
                                            >
                                                {getInitials(
                                                    booking.mentor?.name,
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="truncate text-sm font-bold text-slate-900">
                                                        {booking.mentor?.name ??
                                                            'Mentor'}
                                                    </h2>
                                                    <span
                                                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                                            booking.is_free_session
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}
                                                    >
                                                        {booking.is_free_session
                                                            ? 'Gratis'
                                                            : formatRupiah(
                                                                  booking.price_snapshot,
                                                              )}
                                                    </span>
                                                    {discordUrl && (
                                                        <span className="inline-flex rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                                                            Discord
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-slate-500 truncate">
                                                    {booking.mentor?.expertise ||
                                                        booking.notes_from_student ||
                                                        'Sesi Mentoring'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Center: Schedule Date & Time */}
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                            <svg
                                                className="h-4 w-4 shrink-0 text-slate-400"
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
                                            <span>
                                                {formatBookingDateTime(
                                                    booking.schedule_time,
                                                )}{' '}
                                                •{' '}
                                                {formatBookingTimeRange(
                                                    booking,
                                                )}
                                            </span>
                                        </div>

                                        {/* Right: Status Badge & Actions */}
                                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                                    booking.status ===
                                                    'berlangsung'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : isScheduleOverdue(
                                                                booking,
                                                            )
                                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                          : booking.status ===
                                                                  'dibatalkan' &&
                                                              [
                                                                  'menunggu',
                                                                  'menunggu_konfirmasi',
                                                              ].includes(
                                                                  booking.refund_status,
                                                              )
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : booking.status ===
                                                                    'dibatalkan' &&
                                                                booking.refund_status ===
                                                                    'selesai'
                                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                              : booking.status ===
                                                                      'dibatalkan' &&
                                                                  booking.refund_status ===
                                                                      'dilaporkan'
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : isNoShowReporter
                                                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                                  : isNoShowRespondent
                                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                    : statusStyles[
                                                                          booking
                                                                              .status
                                                                      ] ??
                                                                      'bg-slate-100 text-slate-700 border border-slate-200'
                                                }`}
                                            >
                                                {booking.status ===
                                                    'berlangsung' && (
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                )}
                                                {getStatusLabel(booking)}
                                            </span>

                                            {/* Action Buttons */}
                                            {discordUrl && (
                                                <a
                                                    href={discordUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex min-h-8 items-center gap-1.5 rounded-xl bg-[#527D98] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#3E637A] focus:outline-none focus:ring-2 focus:ring-[#527D98]"
                                                >
                                                    Buka Discord
                                                </a>
                                            )}

                                            {isNoShowReporter && (
                                                <a
                                                    href={route(
                                                        'no-show.evidence',
                                                        [
                                                            booking
                                                                .no_show_report
                                                                .id,
                                                            'report',
                                                        ],
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex min-h-8 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                                >
                                                    Lihat Bukti
                                                </a>
                                            )}

                                            {isNoShowRespondent && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openNoShowRespondModal(
                                                            booking,
                                                        )
                                                    }
                                                    className="inline-flex min-h-8 items-center justify-center rounded-xl bg-[#527D98] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#3E637A] focus:outline-none focus:ring-2 focus:ring-[#527D98]"
                                                >
                                                    Tanggapi Sekarang
                                                </button>
                                            )}

                                            {booking.status ===
                                                'dikonfirmasi' &&
                                                isScheduleUpcoming(
                                                    booking,
                                                ) && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openConfirmedCancellationModal(
                                                                booking,
                                                            )
                                                        }
                                                        className="inline-flex min-h-8 items-center justify-center rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                                    >
                                                        Batalkan
                                                    </button>
                                                )}

                                            {booking.status === 'diajukan' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openCancellationModal(
                                                            booking,
                                                        )
                                                    }
                                                    className="inline-flex min-h-8 items-center justify-center rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                                >
                                                    Batalkan
                                                </button>
                                            )}

                                            {booking.can_report_no_show &&
                                                !booking.no_show_report && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openNoShowReportModal(
                                                                booking,
                                                            )
                                                        }
                                                        className="inline-flex min-h-8 items-center justify-center rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                                    >
                                                        Laporkan Mentor Tidak Hadir
                                                    </button>
                                                )}

                                            {booking.status === 'selesai' &&
                                                (booking.has_reviewed ||
                                                booking.review ? (
                                                    <span className="inline-flex min-h-8 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-500">
                                                        Sudah Diulas
                                                    </span>
                                                ) : (
                                                    <a
                                                        href={route(
                                                            'reviews.create',
                                                            booking.id,
                                                        )}
                                                        className="inline-flex min-h-8 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-[#527D98] transition-colors hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-[#527D98]"
                                                    >
                                                        Beri Ulasan
                                                    </a>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Bottom Single-Line Banners (Edge to Edge) */}
                                    {isNoShowReporter && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-amber-200/80 bg-[#FFFBEB] px-4 sm:px-5 py-2.5 text-xs text-amber-900">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-amber-600 font-bold">
                                                    ⚠
                                                </span>
                                                <span>
                                                    Laporan no-show terkirim.
                                                    Menunggu klarifikasi mentor
                                                    hingga{' '}
                                                    <strong className="font-semibold">
                                                        {formatNoShowDeadline(
                                                            booking
                                                                .no_show_report
                                                                .respond_deadline,
                                                        )}
                                                    </strong>
                                                    .
                                                </span>
                                            </div>
                                            <span className="text-amber-800/80 shrink-0 text-xs">
                                                Refund otomatis jika tanpa respon
                                            </span>
                                        </div>
                                    )}

                                    {isNoShowRespondent && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-rose-200/80 bg-[#FFF5F5] px-4 sm:px-5 py-2.5 text-xs text-rose-900">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-rose-600 font-bold">
                                                    🛈
                                                </span>
                                                <span>
                                                    Mentor melaporkan
                                                    ketidakhadiran Anda. Batas
                                                    tanggapan:{' '}
                                                    <strong className="font-semibold">
                                                        {formatNoShowDeadline(
                                                            booking
                                                                .no_show_report
                                                                .respond_deadline,
                                                        )}
                                                    </strong>
                                                    .
                                                </span>
                                            </div>
                                            {booking.no_show_report
                                                .reporter_note ? (
                                                <span
                                                    title={
                                                        booking.no_show_report
                                                            .reporter_note
                                                    }
                                                    className="text-slate-600 underline cursor-pointer shrink-0 text-xs font-medium hover:text-slate-800"
                                                >
                                                    Lihat Catatan
                                                </span>
                                            ) : (
                                                <a
                                                    href={route(
                                                        'no-show.evidence',
                                                        [
                                                            booking
                                                                .no_show_report
                                                                .id,
                                                            'report',
                                                        ],
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-600 underline cursor-pointer shrink-0 text-xs font-medium hover:text-slate-800"
                                                >
                                                    Lihat Catatan
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {booking.no_show_report &&
                                        ['disanggah', 'berlaku'].includes(
                                            booking.no_show_report.status,
                                        ) && (
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-amber-200/80 bg-[#FFFBEB] px-4 sm:px-5 py-2 text-xs text-amber-900">
                                                <div>
                                                    {booking.no_show_report
                                                        .status ===
                                                        'disanggah' &&
                                                        'Laporan disanggah. Menunggu keputusan admin.'}
                                                    {booking.no_show_report
                                                        .status === 'berlaku' &&
                                                        'Laporan berlaku dan sanksi sudah dijalankan.'}
                                                </div>
                                                <a
                                                    href={route(
                                                        'no-show.evidence',
                                                        [
                                                            booking
                                                                .no_show_report
                                                                .id,
                                                            'report',
                                                        ],
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[#527D98] underline hover:text-[#3E637A] font-semibold text-xs"
                                                >
                                                    Lihat bukti laporan
                                                </a>
                                            </div>
                                        )}

                                    {isAwaitingRefundConfirmation && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-amber-200/80 bg-[#FFFBEB] px-4 sm:px-5 py-2 text-xs text-amber-900">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span>
                                                    Mentor sudah mengunggah{' '}
                                                    <strong>
                                                        bukti transfer refund DP
                                                    </strong>
                                                    . Silakan konfirmasi:
                                                </span>
                                                {refundProofUrl && (
                                                    <a
                                                        href={refundProofUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-[#527D98] underline decoration-2 hover:text-[#3E637A]"
                                                    >
                                                        Cek Bukti
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openRefundConfirmation(
                                                            booking,
                                                            'sudah_terima',
                                                        )
                                                    }
                                                    disabled={
                                                        isRefundSubmitting
                                                    }
                                                    className="inline-flex min-h-8 items-center justify-center rounded-lg bg-emerald-600 px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
                                                >
                                                    ✓ Sudah Terima
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openRefundConfirmation(
                                                            booking,
                                                            'belum_terima',
                                                        )
                                                    }
                                                    disabled={
                                                        isRefundSubmitting
                                                    }
                                                    className="inline-flex min-h-8 items-center justify-center rounded-lg border border-rose-300 bg-white px-3.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                                >
                                                    ✕ Belum
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {booking.status === 'diajukan' &&
                                        isScheduleOverdue(booking) && (
                                            <div className="border-t border-amber-200/80 bg-[#FFFBEB] px-4 sm:px-5 py-2 text-xs text-amber-900">
                                                Jadwal sesi sudah lewat dan
                                                pengajuan ini tidak akan
                                                diproses mentor. Anda dapat
                                                membatalkannya.
                                                {booking.is_free_session ===
                                                    false &&
                                                    ' DP akan dikembalikan oleh mentor.'}
                                            </div>
                                        )}

                                    {booking.status === 'dibatalkan' &&
                                        booking.cancellation_reason &&
                                        !isAwaitingRefundConfirmation && (
                                            <div className="border-t border-slate-200/80 bg-slate-50 px-4 sm:px-5 py-2 text-xs text-slate-600">
                                                <span className="font-semibold text-slate-700">
                                                    Alasan pembatalan:
                                                </span>{' '}
                                                {booking.cancellation_reason}
                                            </div>
                                        )}

                                    {booking.status === 'dibatalkan' &&
                                        booking.refund_status ===
                                            'dilaporkan' && (
                                            <div className="border-t border-rose-200/80 bg-rose-50 px-4 sm:px-5 py-2 text-xs text-rose-700">
                                                <span className="font-semibold">
                                                    Laporan Tercatat:
                                                </span>{' '}
                                                Anda melaporkan belum menerima
                                                refund.
                                            </div>
                                        )}
                                </div>
                            );
                        })}
                    </section>
                )}

                {/* PAGINATION */}
                {filteredAndSortedBookings.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <p className="text-xs text-slate-500">
                            Menampilkan{' '}
                            <span className="font-semibold text-slate-700">
                                {filteredAndSortedBookings.length === 0
                                    ? 0
                                    : startIndex + 1}{' '}
                                - {endIndex}
                            </span>{' '}
                            dari{' '}
                            <span className="font-semibold text-slate-700">
                                {filteredAndSortedBookings.length}
                            </span>{' '}
                            sesi booking
                        </p>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(1, prev - 1),
                                    )
                                }
                                disabled={currentPageSafe <= 1}
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Sebelumnya
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1,
                            ).map((page) => {
                                const isActive = page === currentPageSafe;

                                return (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                                            isActive
                                                ? 'bg-[#527D98] text-white shadow-xs'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(totalPages, prev + 1),
                                    )
                                }
                                disabled={currentPageSafe >= totalPages}
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {isCancellationModalOpen && selectedBooking && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !cancelForm.processing
                        ) {
                            closeCancellationModal();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-booking-heading"
                        className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="cancel-booking-heading"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    Batalkan Pengajuan?
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Anda akan membatalkan pengajuan bersama{' '}
                                    <span className="font-semibold text-slate-700">{selectedBooking.mentor?.name ?? 'Mentor'}</span>{' '}
                                    pada{' '}
                                    {formatBookingDateTime(
                                        selectedBooking.schedule_time,
                                    )}
                                    , pukul{' '}
                                    {formatBookingTimeRange(selectedBooking)}.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeCancellationModal}
                                disabled={cancelForm.processing}
                                aria-label="Tutup dialog pembatalan"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#527D98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="m6 6 12 12M18 6 6 18" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={submitCancellation} className="mt-5">
                            <label
                                htmlFor="cancellation_reason"
                                className="block text-sm font-semibold text-slate-800"
                            >
                                Alasan Pembatalan
                            </label>
                            <textarea
                                ref={cancellationReasonRef}
                                id="cancellation_reason"
                                name="cancellation_reason"
                                rows="4"
                                required
                                maxLength={500}
                                value={cancelForm.data.cancellation_reason}
                                onChange={(event) =>
                                    cancelForm.setData(
                                        'cancellation_reason',
                                        event.target.value,
                                    )
                                }
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#527D98]/20"
                                placeholder="Tuliskan alasan pembatalan pengajuan..."
                            />
                            <p className="mt-1 text-right text-xs text-slate-400">
                                {cancelForm.data.cancellation_reason.length}/500
                            </p>
                            {cancelForm.errors.cancellation_reason && (
                                <p className="mt-2 text-sm font-medium text-rose-600">
                                    {cancelForm.errors.cancellation_reason}
                                </p>
                            )}
                            {selectedBooking.is_free_session === false && (
                                <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200/80 px-4 py-3 text-xs leading-5 text-amber-800">
                                    DP akan dikembalikan oleh mentor. Batas
                                    waktu pengembalian 48 jam.
                                </p>
                            )}
                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeCancellationModal}
                                    disabled={cancelForm.processing}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {cancelForm.processing
                                        ? 'Membatalkan...'
                                        : 'Ya, Batalkan Pengajuan'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {isConfirmedCancellationModalOpen &&
                selectedConfirmedBooking && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4"
                        onMouseDown={(event) => {
                            if (
                                event.target === event.currentTarget &&
                                !confirmedCancelForm.processing
                            ) {
                                closeConfirmedCancellationModal();
                            }
                        }}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cancel-confirmed-booking-heading"
                            className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2
                                        id="cancel-confirmed-booking-heading"
                                        className="text-lg font-bold text-slate-900"
                                    >
                                        Batalkan Sesi?
                                    </h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        Anda akan membatalkan sesi bersama{' '}
                                        <span className="font-semibold text-slate-700">
                                            {selectedConfirmedBooking.mentor?.name ??
                                                'Mentor'}
                                        </span>{' '}
                                        pada{' '}
                                        {formatBookingDateTime(
                                            selectedConfirmedBooking.schedule_time,
                                        )}
                                        , pukul{' '}
                                        {formatBookingTimeRange(
                                            selectedConfirmedBooking,
                                        )}
                                        .
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeConfirmedCancellationModal}
                                    disabled={confirmedCancelForm.processing}
                                    aria-label="Tutup dialog pembatalan sesi"
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#527D98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <svg
                                        aria-hidden="true"
                                        className="h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="m6 6 12 12M18 6 6 18" />
                                    </svg>
                                </button>
                            </div>

                            <form
                                onSubmit={submitConfirmedCancellation}
                                className="mt-5"
                            >
                                <label
                                    htmlFor="confirmed_cancellation_reason"
                                    className="block text-sm font-semibold text-slate-800"
                                >
                                    Alasan Pembatalan
                                </label>
                                <textarea
                                    ref={confirmedCancellationReasonRef}
                                    id="confirmed_cancellation_reason"
                                    name="cancellation_reason"
                                    rows="4"
                                    required
                                    maxLength={500}
                                    value={
                                        confirmedCancelForm.data
                                            .cancellation_reason
                                    }
                                    onChange={(event) =>
                                        confirmedCancelForm.setData(
                                            'cancellation_reason',
                                            event.target.value,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#527D98]/20"
                                    placeholder="Tuliskan alasan pembatalan sesi..."
                                />
                                <p className="mt-1 text-right text-xs text-slate-400">
                                    {
                                        confirmedCancelForm.data
                                            .cancellation_reason.length
                                    }
                                    /500
                                </p>
                                {confirmedCancelForm.errors
                                    .cancellation_reason && (
                                    <p className="mt-2 text-sm font-medium text-rose-600">
                                        {
                                            confirmedCancelForm.errors
                                                .cancellation_reason
                                        }
                                    </p>
                                )}

                                {selectedConfirmedBooking.is_free_session ===
                                false ? (
                                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
                                        <p>
                                            DP yang sudah Anda bayarkan tidak
                                            akan dikembalikan jika Anda
                                            membatalkan sesi yang sudah
                                            dikonfirmasi.
                                        </p>
                                        <div className="mt-3">
                                            <label
                                                htmlFor="acknowledge_dp_forfeit"
                                                className="flex items-start gap-2 font-semibold text-rose-800 cursor-pointer"
                                            >
                                                <input
                                                    id="acknowledge_dp_forfeit"
                                                    name="acknowledge_dp_forfeit"
                                                    type="checkbox"
                                                    checked={
                                                        confirmedCancelForm.data
                                                            .acknowledge_dp_forfeit
                                                    }
                                                    onChange={(event) => {
                                                        confirmedCancelForm.setData(
                                                            'acknowledge_dp_forfeit',
                                                            event.target.checked,
                                                        );
                                                        confirmedCancelForm.clearErrors(
                                                            'acknowledge_dp_forfeit',
                                                        );
                                                    }}
                                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                                                />
                                                Saya mengerti DP tidak
                                                dikembalikan
                                            </label>
                                            {confirmedCancelForm.errors
                                                .acknowledge_dp_forfeit && (
                                                <p
                                                    role="alert"
                                                    className="mt-2 font-medium text-rose-600"
                                                >
                                                    {
                                                        confirmedCancelForm
                                                            .errors
                                                            .acknowledge_dp_forfeit
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs leading-5 text-[#527D98]">
                                        Sesi ini gratis, tidak ada DP yang
                                        hangus.
                                    </p>
                                )}

                                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeConfirmedCancellationModal}
                                        disabled={confirmedCancelForm.processing}
                                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Kembali
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={
                                            confirmedCancelForm.processing ||
                                            (selectedConfirmedBooking.is_free_session ===
                                                false &&
                                                !confirmedCancelForm.data
                                                    .acknowledge_dp_forfeit)
                                        }
                                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {confirmedCancelForm.processing
                                            ? 'Membatalkan...'
                                            : 'Ya, Batalkan Sesi'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
                )}
            {noShowReportBooking && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeNoShowReportModal();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="no-show-report-heading"
                        className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="no-show-report-heading"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    Laporkan Mentor Tidak Hadir
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Sesi bersama{' '}
                                    <span className="font-semibold text-slate-700">
                                        {noShowReportBooking.mentor?.name ?? 'Mentor'}
                                    </span>{' '}
                                    pada{' '}
                                    {formatBookingDateTime(
                                        noShowReportBooking.schedule_time,
                                    )}
                                    , pukul{' '}
                                    {formatBookingTimeRange(noShowReportBooking)}.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeNoShowReportModal}
                                disabled={noShowReportForm.processing}
                                aria-label="Tutup dialog pelaporan no-show"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#527D98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="m6 6 12 12M18 6 6 18" />
                                </svg>
                            </button>
                        </div>

                        <form
                            onSubmit={submitNoShowReport}
                            className="mt-5 space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="no_show_evidence"
                                    className="block text-sm font-semibold text-slate-800"
                                >
                                    Screenshot Bukti
                                </label>
                                <input
                                    id="no_show_evidence"
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
                                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-600 file:mr-4 file:border-0 file:bg-sky-50 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-[#527D98] hover:file:bg-sky-100 cursor-pointer"
                                />
                                <p className="mt-1 text-xs text-slate-400">
                                    Format JPG atau PNG, maksimal 5 MB.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="no_show_note"
                                    className="block text-sm font-semibold text-slate-800"
                                >
                                    Catatan{' '}
                                    <span className="font-normal text-slate-400">
                                        (opsional)
                                    </span>
                                </label>
                                <textarea
                                    id="no_show_note"
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
                                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#527D98]/20"
                                    placeholder="Ceritakan singkat apa yang terjadi..."
                                />
                            </div>

                            <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                                Mentor punya 24 jam untuk menanggapi. Jika tidak
                                ada tanggapan, sesi dibatalkan dan sesi berbayar
                                masuk proses refund. Jika mentor menyanggah,
                                admin yang memutuskan.
                            </p>

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
                                        className="text-sm font-medium text-rose-600"
                                    >
                                        {message}
                                    </p>
                                ))}

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeNoShowReportModal}
                                    disabled={noShowReportForm.processing}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        noShowReportForm.processing ||
                                        !noShowReportForm.data.evidence
                                    }
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {noShowReportForm.processing
                                        ? 'Mengirim...'
                                        : 'Kirim Laporan'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {noShowRespondBooking && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeNoShowRespondModal();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="no-show-respond-heading"
                        className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="no-show-respond-heading"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    Tanggapi Laporan No-Show
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Jika Anda tidak menanggapi sebelum{' '}
                                    <span className="font-semibold text-slate-700">
                                        {formatNoShowDeadline(
                                            noShowRespondBooking.no_show_report
                                                .respond_deadline,
                                        )}
                                    </span>
                                    , laporan berlaku: sesi dibatalkan dan DP (untuk
                                    sesi berbayar) hangus.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeNoShowRespondModal}
                                disabled={noShowRespondForm.processing}
                                aria-label="Tutup dialog tanggapi no-show"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#527D98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="m6 6 12 12M18 6 6 18" />
                                </svg>
                            </button>
                        </div>

                        <form
                            onSubmit={submitNoShowRespond}
                            className="mt-5 space-y-4"
                        >
                            <div>
                                <label
                                    htmlFor="no_show_response_note"
                                    className="block text-sm font-semibold text-slate-800"
                                >
                                    Alasan Sanggahan
                                </label>
                                <textarea
                                    id="no_show_response_note"
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
                                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#527D98]/20"
                                    placeholder="Jelaskan versi Anda..."
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="no_show_response_evidence"
                                    className="block text-sm font-semibold text-slate-800"
                                >
                                    Screenshot{' '}
                                    <span className="font-normal text-slate-400">
                                        (opsional)
                                    </span>
                                </label>
                                <input
                                    id="no_show_response_evidence"
                                    name="response_evidence"
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    onChange={(event) =>
                                        noShowRespondForm.setData(
                                            'response_evidence',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-600 file:mr-4 file:border-0 file:bg-sky-50 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-[#527D98] hover:file:bg-sky-100 cursor-pointer"
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
                                        className="text-sm font-medium text-rose-600"
                                    >
                                        {message}
                                    </p>
                                ))}

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeNoShowRespondModal}
                                    disabled={noShowRespondForm.processing}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        noShowRespondForm.processing ||
                                        !noShowRespondForm.data.response_note.trim()
                                    }
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#527D98] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3E637A] focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {noShowRespondForm.processing
                                        ? 'Mengirim...'
                                        : 'Kirim Sanggahan'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
            {selectedRefundBooking && refundDecision && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !isRefundSubmitting
                        ) {
                            closeRefundConfirmation();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="refund-confirmation-heading"
                        className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="refund-confirmation-heading"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    {refundDecision === 'sudah_terima'
                                        ? 'Konfirmasi Refund Sudah Diterima?'
                                        : 'Laporkan Refund Belum Diterima?'}
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    {refundDecision === 'sudah_terima'
                                        ? 'Pastikan uang refund sudah masuk ke rekening Anda. Pilihan ini tidak dapat diubah.'
                                        : 'Laporan akan dikirim dan tidak dapat diubah. Pastikan Anda sudah mengecek rekening.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeRefundConfirmation}
                                disabled={isRefundSubmitting}
                                aria-label="Tutup dialog konfirmasi refund"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#527D98] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="m6 6 12 12M18 6 6 18" />
                                </svg>
                            </button>
                        </div>

                        {refundDecisionError && (
                            <p
                                role="alert"
                                className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
                            >
                                {refundDecisionError}
                            </p>
                        )}
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                ref={refundBackButtonRef}
                                type="button"
                                onClick={closeRefundConfirmation}
                                disabled={isRefundSubmitting}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Kembali
                            </button>
                            <button
                                type="button"
                                onClick={submitRefundConfirmation}
                                disabled={isRefundSubmitting}
                                className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                                    refundDecision === 'sudah_terima'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                                        : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500'
                                }`}
                            >
                                {isRefundSubmitting
                                    ? 'Mengirim...'
                                    : refundDecision === 'sudah_terima'
                                      ? 'Ya, Sudah Terima'
                                      : 'Ya, Laporkan'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
