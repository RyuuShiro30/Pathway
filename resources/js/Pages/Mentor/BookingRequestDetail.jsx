import { Head, Link, useForm, usePage } from '@inertiajs/react';

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
    if (!value) {
        return 'Waktu tidak tersedia';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Waktu tidak tersedia'
        : `${sessionDateTimeFormatter.format(date)} WIB`;
}

function formatRupiah(value) {
    return `Rp ${rupiahFormatter.format(Number(value ?? 0))}`;
}

function formatStatus(status) {
    const labels = {
        diajukan: 'Menunggu Verifikasi Mentor',
        dikonfirmasi: 'Dikonfirmasi',
        berlangsung: 'Berlangsung',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
    };

    return labels[status] ?? status ?? 'Status tidak tersedia';
}

export default function BookingRequestDetail({ session }) {
    const { auth, errors: pageErrors, flash } = usePage().props;
    const form = useForm({ action: 'terima' });
    const mentorName = auth?.user?.name ?? 'Mentor';
    const mentorInitials =
        mentorName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'M';
    const totalPrice = Number(session.price_snapshot ?? 0);
    const dpAmount = totalPrice * 0.5;
    const proofPath = session.payment_dp_proof
        ? String(session.payment_dp_proof).replace(/^\/+/, '')
        : null;
    const proofUrl = proofPath
        ? `/storage/${proofPath
              .split('/')
              .map((segment) => encodeURIComponent(segment))
              .join('/')}`
        : null;
    const backendError =
        flash?.error ??
        pageErrors?.message ??
        Object.values(form.errors).find(Boolean);
    const isPending = session.status === 'diajukan';

    function respondToBooking(action) {
    if (
        action === 'tolak' &&
        !window.confirm(
            'Apakah Anda yakin ingin menolak permintaan booking ini?',
        )
    ) {
        return;
    }

    form.transform(() => ({ action }));
    form.patch(route('mentor.booking.respond', session.id), {
        preserveScroll: true,
    });
}

    return (
        <div className="min-h-screen bg-[#F7F5F0] text-[#34443D]">
            <Head title="Detail Permintaan Booking" />

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
                        className="order-3 flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap text-sm sm:order-none sm:w-auto"
                    >
                        <Link
                            href={route('mentor.dashboard')}
                            className="rounded-full px-4 py-2 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
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

                    <div className="flex shrink-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-[#E5ECDD] text-xs font-bold text-[#34443D]">
                            {mentorInitials}
                        </div>
                        <div className="hidden sm:block">
                            <p className="max-w-36 truncate text-sm font-semibold leading-tight">
                                {mentorName}
                            </p>
                            <p className="text-xs text-white/75">Mentor</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
                <div className="space-y-4">
                    <Link
                        href={route('mentor.dashboard')}
                        className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#E7EEF1] px-3 py-2 text-sm font-semibold text-[#527D98] transition-colors hover:bg-[#DCE8ED] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                    >
                        <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="m15 18-6-6 6-6" />
                            <path d="M20 12H9" />
                        </svg>
                        Kembali ke Dashboard
                    </Link>

                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold leading-tight text-[#34443D] sm:text-3xl">
                            Detail Permintaan Booking
                        </h1>
                        <span className="inline-flex items-center rounded-full bg-[#E8F2E8] px-3 py-1.5 text-xs font-semibold text-[#477E50]">
                            {formatStatus(session.status)}
                        </span>
                    </div>
                </div>

                {backendError && (
                    <div
                        role="alert"
                        className="rounded-xl border border-[#E7C7C1] bg-[#FBEEEB] px-4 py-3 text-sm font-medium text-[#A34F45]"
                    >
                        {backendError}
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
                    <div className="space-y-5 lg:col-span-3">
                        <section
                            aria-labelledby="student-heading"
                            className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E7EEF1] text-lg font-bold text-[#527D98]">
                                    {(session.student?.name ?? 'S')
                                        .trim()
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((part) => part[0])
                                        .join('')
                                        .toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A938D]">
                                        Student
                                    </p>
                                    <h2
                                        id="student-heading"
                                        className="mt-1 break-words text-lg font-bold text-[#34443D]"
                                    >
                                        {session.student?.name ?? 'Student'}
                                    </h2>
                                    <p className="mt-1 break-all text-sm text-[#69766F]">
                                        {session.student?.email ??
                                            'Email tidak tersedia'}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section
                            aria-labelledby="payment-heading"
                            className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                        >
                            {session.is_free_session ? (
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2
                                            id="payment-heading"
                                            className="text-base font-bold text-[#34443D]"
                                        >
                                            Informasi Pembayaran
                                        </h2>
                                        <p className="mt-1 text-sm text-[#69766F]">
                                            Sesi ini tidak dikenakan biaya.
                                        </p>
                                    </div>
                                    <span className="inline-flex shrink-0 items-center rounded-full bg-[#E8F2E8] px-3 py-1.5 text-sm font-bold text-[#477E50]">
                                        Gratis
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h2
                                            id="payment-heading"
                                            className="text-base font-bold text-[#34443D]"
                                        >
                                            Bukti Pembayaran DP
                                        </h2>
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                                                session.payment_dp_status ===
                                                'terverifikasi'
                                                    ? 'bg-[#E8F2E8] text-[#477E50]'
                                                    : 'bg-[#F3EFDF] text-[#8A7440]'
                                            }`}
                                        >
                                            {session.payment_dp_status ===
                                            'terverifikasi'
                                                ? 'Terverifikasi'
                                                : 'Menunggu Verifikasi'}
                                        </span>
                                    </div>

                                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                                        <div className="space-y-3">
                                            <div className="rounded-lg bg-[#F7F5F0] p-4">
                                                <p className="text-xs font-medium text-[#78827B]">
                                                    Total harga sesi
                                                </p>
                                                <p className="mt-1 text-lg font-bold text-[#34443D]">
                                                    {formatRupiah(totalPrice)}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-[#E8F2E8] p-4">
                                                <p className="text-xs font-medium text-[#477E50]">
                                                    DP dibayar (50%)
                                                </p>
                                                <p className="mt-1 text-lg font-bold text-[#3E4C3F]">
                                                    {formatRupiah(dpAmount)}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            {proofUrl ? (
                                                <a
                                                    href={proofUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group block overflow-hidden rounded-lg border border-[#E8E5DD] bg-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                                    aria-label="Buka bukti pembayaran DP di tab baru"
                                                >
                                                    <img
                                                        src={proofUrl}
                                                        alt="Bukti pembayaran DP dari student"
                                                        className="h-52 w-full object-contain transition-transform group-hover:scale-[1.02]"
                                                    />
                                                </a>
                                            ) : (
                                                <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-[#D8D5CC] bg-[#F7F5F0] px-5 text-center text-sm text-[#78827B]">
                                                    Bukti pembayaran belum
                                                    tersedia.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>
                    </div>

                    <div className="space-y-5 lg:col-span-2">
                        <section
                            aria-labelledby="session-heading"
                            className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                        >
                            <h2
                                id="session-heading"
                                className="flex items-center gap-2 text-base font-bold text-[#34443D]"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5 text-[#6594B1]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <rect x="3" y="5" width="18" height="16" rx="2" />
                                    <path d="M16 3v4M8 3v4M3 10h18" />
                                </svg>
                                Jadwal &amp; Waktu Sesi
                            </h2>

                            <div className="mt-4 space-y-3">
                                <div className="rounded-lg bg-[#EEF2FD] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                                        Waktu mulai
                                    </p>
                                    <p className="mt-1 text-sm font-bold capitalize text-[#34443D]">
                                        {formatSessionDateTime(
                                            session.schedule_time,
                                        )}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-lg bg-[#F7F5F0] p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                                            Waktu selesai
                                        </p>
                                        <p className="mt-1 text-sm font-bold capitalize text-[#34443D]">
                                            {formatSessionDateTime(
                                                session.end_time,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-[#E8F2E8] p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#477E50]">
                                            Durasi
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-[#3E4C3F]">
                                            {session.duration_hours ?? '-'} Jam
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 rounded-lg bg-[#E7EEF1] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#527D98]">
                                        Tipe sesi
                                    </p>
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                            session.is_free_session
                                                ? 'bg-[#E8F2E8] text-[#477E50]'
                                                : 'bg-white text-[#527D98]'
                                        }`}
                                    >
                                        {session.is_free_session
                                            ? 'Gratis'
                                            : 'Berbayar'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section
                            aria-labelledby="notes-heading"
                            className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                        >
                            <h2
                                id="notes-heading"
                                className="text-base font-bold text-[#34443D]"
                            >
                                Catatan dari Student
                            </h2>
                            <p className="mt-3 whitespace-pre-line rounded-lg bg-[#EEF2FD] p-4 text-sm leading-6 text-[#4F5C55]">
                                {session.notes_from_student?.trim() ||
                                    'Tidak ada catatan dari student.'}
                            </p>
                        </section>
                    </div>
                </div>

                <section
                    aria-label="Tindakan permintaan booking"
                    className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                >
                    <div>
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                            <button
                                type="button"
                                onClick={() => respondToBooking('terima')}
                                disabled={form.processing || !isPending}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#65B175] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#559C65] focus:outline-none focus:ring-2 focus:ring-[#65B175] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="m8 12 2.5 2.5L16 9" />
                                </svg>
                                {form.processing
                                    ? 'Memproses...'
                                    : 'Verifikasi & Terima'}
                            </button>
                            <button
                                type="button"
                                onClick={() => respondToBooking('tolak')}
                                disabled={form.processing || !isPending}
                                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#FBECEE] px-5 py-3 text-sm font-bold text-[#C23B46] transition-colors hover:bg-[#F6DDE1] focus:outline-none focus:ring-2 focus:ring-[#C23B46] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <svg
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="m9 9 6 6m0-6-6 6" />
                                </svg>
                                Tolak Permintaan
                            </button>
                        </div>

                        <p className="mt-4 text-xs leading-5 text-[#78827B]">
                            Dengan menerima permintaan, sesi akan dikonfirmasi
                            sesuai jadwal di atas. Jika status booking sudah
                            berubah, tindakan tidak dapat dilakukan.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
