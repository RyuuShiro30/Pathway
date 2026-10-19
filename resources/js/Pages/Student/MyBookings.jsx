import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

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
    { value: 'semua', label: 'Semua' },
    { value: 'diajukan', label: 'Diajukan' },
    { value: 'dikonfirmasi', label: 'Dikonfirmasi' },
    { value: 'berlangsung', label: 'Berlangsung' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

const statusStyles = {
    diajukan: 'bg-[#F3EFDF] text-[#8A7440]',
    dikonfirmasi: 'bg-[#E7EEF1] text-[#527D98]',
    berlangsung: 'bg-[#E8F2E8] text-[#477E50]',
    selesai: 'bg-[#E5F0E7] text-[#3E7048]',
    dibatalkan: 'bg-[#F1E9E7] text-[#8E5D54]',
};

const statsCards = [
    {
        key: 'total',
        label: 'Total Booking',
        accent: 'bg-[#E7EEF1] text-[#527D98]',
        icon: '▤',
    },
    {
        key: 'menunggu_konfirmasi',
        label: 'Menunggu Konfirmasi',
        accent: 'bg-[#F3EFDF] text-[#8A7440]',
        icon: '◷',
    },
    {
        key: 'siap_datang',
        label: 'Sesi Siap Datang',
        accent: 'bg-[#E7EEF1] text-[#527D98]',
        icon: '✓',
    },
    {
        key: 'jam_mentoring',
        label: 'Jam Mentoring',
        accent: 'bg-[#E8F2E8] text-[#477E50]',
        icon: '◴',
    },
];

function getStatusLabel(booking) {
    if (
        booking.status === 'diajukan' &&
        booking.payment_dp_status === 'menunggu_verifikasi'
    ) {
        return 'Menunggu Verifikasi DP';
    }

    if (booking.status === 'dibatalkan' && booking.refund_status === 'menunggu') {
        return 'Menunggu Refund';
    }

    const labels = {
        diajukan: 'Diajukan',
        dikonfirmasi: 'Dikonfirmasi',
        berlangsung: 'Berlangsung',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
    };

    return labels[booking.status] ?? 'Status tidak tersedia';
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

function formatBookingTimeRange(booking) {
    if (!booking.schedule_time || !booking.end_time) {
        return 'Waktu tidak tersedia';
    }

    const start = new Date(booking.schedule_time);
    const end = new Date(booking.end_time);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return 'Waktu tidak tersedia';
    }

    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)} WIB (${booking.duration_hours} Jam)`;
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
    const { flash } = usePage().props;
    const [selectedStatus, setSelectedStatus] = useState('semua');
    const [isSuccessDismissed, setIsSuccessDismissed] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isCancellationModalOpen, setIsCancellationModalOpen] =
        useState(false);
    const cancellationReasonRef = useRef(null);
    const cancelForm = useForm({
        cancellation_reason: '',
    });
    const successMessage =
        typeof flash?.success === 'string' ? flash.success : '';
    const safeBookings = Array.isArray(bookings) ? bookings : [];
    const bookingCounts = useMemo(
        () =>
            safeBookings.reduce(
                (counts, booking) => ({
                    ...counts,
                    [booking.status]: (counts[booking.status] ?? 0) + 1,
                }),
                {},
            ),
        [safeBookings],
    );
    const filteredBookings =
        selectedStatus === 'semua'
            ? safeBookings
            : safeBookings.filter((booking) => booking.status === selectedStatus);

    useEffect(() => {
        setIsSuccessDismissed(false);
    }, [successMessage]);

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

    return (
        <div className="min-h-screen bg-[#F7F5F0] text-[#34443D]">
            <Head title="Daftar Booking Mentoring Saya" />

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
                {successMessage && !isSuccessDismissed && (
                    <section
                        role="status"
                        className="flex items-start justify-between gap-4 rounded-xl border border-[#C9DEC9] bg-[#E8F2E8] px-4 py-3 text-sm font-medium text-[#477E50]"
                    >
                        <p>{successMessage}</p>
                        <button
                            type="button"
                            aria-label="Tutup pesan sukses"
                            onClick={() => setIsSuccessDismissed(true)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg font-semibold transition-colors hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#65B175]"
                        >
                            ×
                        </button>
                    </section>
                )}

                <section className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-2">
                        <span className="inline-flex rounded-full bg-[#E7EEF1] px-3 py-1.5 text-xs font-bold text-[#527D98]">
                            Area Student
                        </span>
                        <h1 className="text-2xl font-bold leading-tight text-[#34443D] sm:text-3xl">
                            Daftar Booking Mentoring Saya
                        </h1>
                        <p className="text-sm text-[#69766F]">
                            Pantau jadwal dan status sesi mentoring Anda.
                        </p>
                    </div>
                </section>

                <section
                    aria-label="Statistik booking"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {statsCards.map((card) => (
                        <article
                            key={card.key}
                            className="flex items-center gap-4 rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)]"
                        >
                            <span
                                aria-hidden="true"
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${card.accent}`}
                            >
                                {card.icon}
                            </span>
                            <div>
                                <p className="text-sm font-medium text-[#69766F]">
                                    {card.label}
                                </p>
                                <p className="mt-1 text-2xl font-bold text-[#34443D]">
                                    {Number(stats?.[card.key] ?? 0)}
                                    {card.key === 'jam_mentoring' ? ' jam' : ''}
                                </p>
                            </div>
                        </article>
                    ))}
                </section>

                <section
                    aria-label="Filter status booking"
                    className="flex flex-wrap gap-2"
                >
                    {statusFilters.map((filter) => {
                        const count =
                            filter.value === 'semua'
                                ? safeBookings.length
                                : bookingCounts[filter.value] ?? 0;
                        const isSelected = selectedStatus === filter.value;

                        return (
                            <button
                                key={filter.value}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setSelectedStatus(filter.value)}
                                className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 ${
                                    isSelected
                                        ? 'border-[#6594B1] bg-[#6594B1] text-white'
                                        : 'border-[#D8DED8] bg-white text-[#52635A] hover:bg-[#F2F3EF]'
                                }`}
                            >
                                {filter.label}
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${
                                        isSelected
                                            ? 'bg-white/20 text-white'
                                            : 'bg-[#F2F3EF] text-[#69766F]'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </section>

                {filteredBookings.length === 0 ? (
                    <section className="rounded-2xl border border-[#E8E5DD] bg-white px-5 py-12 text-center shadow-[0_3px_14px_rgba(52,68,61,0.04)]">
                        <span
                            aria-hidden="true"
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E7EEF1] text-2xl text-[#6594B1]"
                        >
                            ◷
                        </span>
                        <h2 className="mt-4 text-lg font-bold text-[#34443D]">
                            {safeBookings.length === 0
                                ? 'Belum ada booking mentoring'
                                : 'Tidak ada booking dengan status ini'}
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#69766F]">
                            {safeBookings.length === 0
                                ? 'Booking mentoring yang Anda ajukan akan tampil di sini.'
                                : 'Pilih filter status lain untuk melihat booking Anda.'}
                        </p>
                    </section>
                ) : (
                    <section
                        aria-label="Daftar booking"
                        className="space-y-4"
                    >
                        {filteredBookings.map((booking) => {
                            const discordUrl = [
                                'dikonfirmasi',
                                'berlangsung',
                            ].includes(booking.status)
                                ? getSafeDiscordUrl(booking.discord_link)
                                : null;

                            return (
                                <article
                                    key={booking.id}
                                    className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex min-w-0 items-center gap-4">
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7EEF1] text-sm font-bold text-[#527D98]">
                                                {getInitials(booking.mentor?.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <h2 className="truncate text-lg font-bold text-[#34443D]">
                                                    {booking.mentor?.name ??
                                                        'Mentor'}
                                                </h2>
                                                {booking.mentor?.expertise && (
                                                    <p className="mt-1 text-sm text-[#6594B1]">
                                                        {booking.mentor.expertise}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                                                    booking.is_free_session
                                                        ? 'bg-[#E8F2E8] text-[#477E50]'
                                                        : 'bg-[#E7EEF1] text-[#527D98]'
                                                }`}
                                            >
                                                {booking.is_free_session
                                                    ? 'Gratis'
                                                    : formatRupiah(
                                                          booking.price_snapshot,
                                                      )}
                                            </span>
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                                                    statusStyles[
                                                        booking.status
                                                    ] ??
                                                    'bg-[#F2F3EF] text-[#52635A]'
                                                }`}
                                            >
                                                {getStatusLabel(booking)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-3 border-t border-[#EEECE6] pt-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A938D]">
                                                Tanggal
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-[#34443D]">
                                                {formatBookingDateTime(
                                                    booking.schedule_time,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-[#8A938D]">
                                                Waktu
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-[#34443D]">
                                                {formatBookingTimeRange(
                                                    booking,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {discordUrl && (
                                        <div className="mt-4">
                                            <a
                                                href={discordUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                            >
                                                <span aria-hidden="true">↗</span>
                                                Buka Discord
                                            </a>
                                        </div>
                                    )}

                                    {booking.status === 'diajukan' && (
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openCancellationModal(
                                                        booking,
                                                    )
                                                }
                                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#C23B46] bg-white px-4 py-2 text-sm font-bold text-[#A9343D] transition-colors hover:bg-[#FBECEE] focus:outline-none focus:ring-2 focus:ring-[#C23B46] focus:ring-offset-2"
                                            >
                                                Batalkan Pengajuan
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>

            {isCancellationModalOpen && selectedBooking && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1D2B25]/50 p-4"
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
                        className="w-full max-w-lg rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="cancel-booking-heading"
                                    className="text-lg font-bold text-[#34443D]"
                                >
                                    Batalkan Pengajuan?
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-[#69766F]">
                                    Anda akan membatalkan pengajuan bersama{' '}
                                    {selectedBooking.mentor?.name ?? 'Mentor'}{' '}
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
                                className="rounded-md p-1 text-[#78827B] hover:bg-[#F7F5F0] hover:text-[#34443D] focus:outline-none focus:ring-2 focus:ring-[#6594B1] disabled:cursor-not-allowed disabled:opacity-60"
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
                                className="block text-sm font-semibold text-[#34443D]"
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
                                className="mt-2 block w-full rounded-lg border border-[#D8D5CC] bg-white px-4 py-3 text-sm leading-6 text-[#34443D] placeholder:text-[#9AA19C] focus:border-[#6594B1] focus:outline-none focus:ring-2 focus:ring-[#6594B1]/30"
                                placeholder="Tuliskan alasan pembatalan pengajuan..."
                            />
                            <p className="mt-1 text-right text-xs text-[#69766F]">
                                {cancelForm.data.cancellation_reason.length}/500
                            </p>
                            {cancelForm.errors.cancellation_reason && (
                                <p className="mt-2 text-sm font-medium text-[#A34F45]">
                                    {cancelForm.errors.cancellation_reason}
                                </p>
                            )}
                            {selectedBooking.is_free_session === false && (
                                <p className="mt-3 rounded-lg bg-[#F3EFDF] px-4 py-3 text-xs leading-5 text-[#78663A]">
                                    DP akan dikembalikan oleh mentor. Batas
                                    waktu pengembalian 48 jam.
                                </p>
                            )}
                            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeCancellationModal}
                                    disabled={cancelForm.processing}
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#D8D5CC] bg-white px-4 py-2 text-sm font-semibold text-[#4F5C55] transition-colors hover:bg-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Kembali
                                </button>
                                <button
                                    type="submit"
                                    disabled={cancelForm.processing}
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#C23B46] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#A9343D] focus:outline-none focus:ring-2 focus:ring-[#C23B46] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
    );
}
