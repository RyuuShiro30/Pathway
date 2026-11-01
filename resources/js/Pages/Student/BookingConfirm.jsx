import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import {
    AlertBanner,
    Badge,
    Button,
    Card,
    themeTokens,
} from '@/Components/ui';
import NotificationBell from '@/Components/NotificationBell';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
});

function formatDate(date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date ?? '');

    if (!match) {
        return '';
    }

    return dateFormatter.format(
        new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)),
    );
}

function formatRupiah(value) {
    return `Rp ${rupiahFormatter.format(Number(value ?? 0))}`;
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

export default function BookingConfirm({
    mentor,
    summary,
    payment_account: paymentAccount = null,
}) {
    const { auth, errors: pageErrors = {} } = usePage().props;
    const studentName = auth?.user?.name || 'Student';
    const studentInitials = getInitials(studentName);
    const fileInputRef = useRef(null);
    const [agreedToCode, setAgreedToCode] = useState(false);
    const [fileError, setFileError] = useState('');
    const [copyMessage, setCopyMessage] = useState('');
    const scheduleUrl = route('student.booking.schedule', mentor.id);
    const form = useForm({
        mentor_id: mentor.id,
        schedule_time: `${summary.date}T${summary.start}:00+07:00`,
        duration_hours: summary.duration_hours,
        notes_from_student: '',
        payment_dp_proof: null,
    });
    const scheduleError = form.errors.schedule_time ?? pageErrors.schedule_time;
    const selectedFile = form.data.payment_dp_proof;
    const canSubmit =
        agreedToCode &&
        !form.processing &&
        (summary.is_free_session || Boolean(selectedFile));

    function selectPaymentProof(event) {
        const file = event.target.files?.[0] ?? null;
        setFileError('');

        if (!file) {
            form.setData('payment_dp_proof', null);
            return;
        }

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setFileError('Pilih file JPG atau PNG.');
            form.setData('payment_dp_proof', null);
            event.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setFileError('Ukuran file maksimal 5 MB.');
            form.setData('payment_dp_proof', null);
            event.target.value = '';
            return;
        }

        form.clearErrors('payment_dp_proof');
        form.setData('payment_dp_proof', file);
    }

    function submitBooking(event) {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        form.post(route('booking.store'), {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    async function copyAccountNumber() {
        setCopyMessage('');

        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error('Clipboard tidak tersedia.');
            }

            await navigator.clipboard.writeText(paymentAccount.account_number);
            setCopyMessage('Nomor rekening berhasil disalin.');
        } catch {
            setCopyMessage(
                'Nomor rekening tidak dapat disalin. Silakan salin secara manual.',
            );
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#527D98]/20 selection:text-[#527D98]">
            <Head title="Konfirmasi Pengajuan" />

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
                                Mentee Portal
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
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5ECDD] text-xs font-bold text-[#34443D] shadow-sm">
                                {studentInitials}
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="max-w-[130px] truncate text-xs font-semibold leading-tight text-white">
                                    {studentName}
                                </p>
                                <p className="text-[10px] text-white/70">
                                    Student Pro
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
                {/* BREADCRUMB */}
                <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-400">
                    <ol className="flex flex-wrap items-center gap-1.5">
                        <li className="hover:text-slate-600 transition-colors">Portal Mentee</li>
                        <li aria-hidden="true">/</li>
                        <li className="hover:text-slate-600 transition-colors">Booking Mentoring</li>
                        <li aria-hidden="true">/</li>
                        <li className="font-semibold text-slate-700">Konfirmasi Pengajuan</li>
                    </ol>
                </nav>

                {/* BACK LINK */}
                <div>
                    <Link
                        href={scheduleUrl}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#527D98] transition-colors"
                    >
                        <span aria-hidden="true">←</span>
                        <span>Kembali ke Pemilihan Jadwal</span>
                    </Link>
                </div>

                {/* SCHEDULE ERROR ALERT */}
                {scheduleError && (
                    <section
                        role="alert"
                        aria-labelledby="schedule-error-heading"
                        className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <span
                                aria-hidden="true"
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700"
                            >
                                !
                            </span>
                            <div>
                                <h1
                                    id="schedule-error-heading"
                                    className="text-sm sm:text-base font-bold text-rose-900"
                                >
                                    Perhatian Slot Waktu
                                </h1>
                                <p className="mt-0.5 text-xs sm:text-sm text-rose-700">
                                    {scheduleError}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={scheduleUrl}
                            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-rose-700 shadow-xs transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                            Ganti Slot Waktu
                        </Link>
                    </section>
                )}

                {/* PAGE TITLE & SUBTITLE */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        {summary.is_free_session
                            ? 'Konfirmasi Pengajuan Mentoring'
                            : 'Konfirmasi Pengajuan & Pembayaran DP'}
                    </h1>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                        {summary.is_free_session
                            ? 'Lengkapi catatan untuk mentor untuk mengamankan slot sesi mentoring Anda.'
                            : 'Lengkapi catatan untuk mentor dan unggah bukti transfer uang muka (DP 50%) untuk mengamankan slot sesi mentoring Anda.'}
                    </p>
                </div>

                {/* STEP INDICATOR */}
                <Card className="p-4 sm:p-5">
                    <ol
                        aria-label="Tahapan pemesanan"
                        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                    >
                        <li className="flex items-center gap-3">
                            <span
                                aria-hidden="true"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
                            >
                                ✓
                            </span>
                            <div>
                                <div className="text-xs sm:text-sm font-bold text-slate-800">
                                    1. Pilih Jadwal
                                </div>
                                <div className="text-[11px] font-medium text-emerald-600">
                                    Selesai dipilih
                                </div>
                            </div>
                        </li>
                        <li
                            aria-current="step"
                            className="flex items-center gap-3"
                        >
                            <span
                                aria-hidden="true"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#527D98] text-sm font-bold text-white shadow-xs"
                            >
                                2
                            </span>
                            <div>
                                <div className="text-xs sm:text-sm font-bold text-slate-900">
                                    2. Konfirmasi &amp; DP
                                </div>
                                <div className="text-[11px] font-medium text-[#527D98]">
                                    Langkah ini
                                </div>
                            </div>
                        </li>
                        <li className="flex items-center gap-3">
                            <span
                                aria-hidden="true"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-400"
                            >
                                3
                            </span>
                            <div>
                                <div className="text-xs sm:text-sm font-semibold text-slate-500">
                                    3. Menunggu Mentor
                                </div>
                                <div className="text-[11px] font-medium text-slate-400">
                                    Konfirmasi jadwal
                                </div>
                            </div>
                        </li>
                    </ol>
                </Card>

                <form
                    onSubmit={submitBooking}
                    className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
                >
                    <div className="space-y-6">
                        <Card
                            as="section"
                            aria-labelledby="notes-heading"
                            className="p-5 sm:p-6"
                        >
                            <div className="flex items-center justify-between">
                                <Badge variant="primary" size="xs">
                                    DETAIL PENGAJUAN
                                </Badge>
                                <span className="text-xs text-slate-400">
                                    Opsional
                                </span>
                            </div>

                            <h2
                                id="notes-heading"
                                className="mt-3 text-lg font-bold text-slate-900"
                            >
                                Catatan untuk Mentor
                            </h2>

                            <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                Bantu mentor memahami kebutuhan, tujuan spesifik, dan ekspektasi Anda agar sesi konsultasi berjalan jauh lebih terarah dan berdampak maksimal.
                            </p>

                            <div className="mt-4">
                                <label
                                    htmlFor="notes-from-student"
                                    className="sr-only"
                                >
                                    Catatan &amp; Harapan untuk Mentor (opsional)
                                </label>
                                <textarea
                                    id="notes-from-student"
                                    name="notes_from_student"
                                    rows={5}
                                    value={form.data.notes_from_student}
                                    onChange={(event) =>
                                        form.setData(
                                            'notes_from_student',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ceritakan hal yang ingin dipelajari, kendala teknis yang sedang dihadapi, atau tautkan repositori GitHub / dokumen kerja Anda..."
                                    aria-invalid={Boolean(
                                        form.errors.notes_from_student,
                                    )}
                                    aria-describedby={
                                        form.errors.notes_from_student
                                            ? 'notes-error'
                                            : undefined
                                    }
                                    className="block w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#527D98]/20 transition"
                                />
                                <div className="mt-1.5 flex items-center justify-between">
                                    {form.errors.notes_from_student ? (
                                        <p
                                            id="notes-error"
                                            className="text-xs font-semibold text-rose-600"
                                        >
                                            {form.errors.notes_from_student}
                                        </p>
                                    ) : (
                                        <div />
                                    )}
                                    <span className="text-[11px] text-slate-400">
                                        {form.data.notes_from_student.length} karakter
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {summary.is_free_session ? (
                            <Card className="border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
                                <div className="flex items-start gap-3.5 text-emerald-800">
                                    <span
                                        aria-hidden="true"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
                                    >
                                        ✓
                                    </span>
                                    <div>
                                        <h2 className="text-base font-bold text-emerald-900">
                                            Sesi gratis, tanpa DP
                                        </h2>
                                        <p className="mt-1 text-xs sm:text-sm text-emerald-700 leading-relaxed">
                                            Tidak perlu mengunggah bukti pembayaran
                                            untuk sesi ini. Anda dapat langsung mengajukan booking.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card
                                as="section"
                                aria-labelledby="payment-heading"
                                className="p-5 sm:p-6 space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <Badge variant="primary" size="xs">
                                        PEMBAYARAN DP
                                    </Badge>
                                    <Badge variant="warning" size="xs">
                                        Wajib Transfer DP
                                    </Badge>
                                </div>

                                <h2
                                    id="payment-heading"
                                    className="text-lg font-bold text-slate-900"
                                >
                                    Pembayaran Uang Muka (DP 50%)
                                </h2>

                                <div className="flex items-start gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50/60 p-3.5 text-xs text-sky-800">
                                    <svg
                                        className="mt-0.5 h-4 w-4 shrink-0 text-[#527D98]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <p className="leading-relaxed">
                                        DP ditransfer langsung ke rekening terverifikasi mentor untuk mengunci jadwal sesi. Sisa pelunasan (50%) dapat dibayarkan sesudah sesi mentoring berhasil dilaksanakan.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
                                        <span>Total Tarif Sesi ({summary.duration_hours} Jam)</span>
                                        <span className="font-semibold text-slate-800">
                                            {formatRupiah(summary.total_price)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-xs sm:text-sm">
                                        <span className="font-bold text-slate-900">
                                            DP yang Wajib Ditransfer Sekarang (50%)
                                        </span>
                                        <span className="text-base sm:text-lg font-black text-slate-900">
                                            {formatRupiah(summary.dp_amount)}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded bg-[#527D98] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
                                                {paymentAccount?.bank_name || 'BANK'}
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Rekening Tujuan Mentor
                                            </span>
                                        </div>
                                        <Badge
                                            variant="success"
                                            size="xs"
                                            dot
                                            dotColor="bg-emerald-500"
                                        >
                                            Terverifikasi
                                        </Badge>
                                    </div>

                                    {paymentAccount?.bank_name &&
                                    paymentAccount?.account_number &&
                                    paymentAccount?.account_holder ? (
                                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <span className="text-[11px] font-semibold text-slate-400">
                                                    Nomor Rekening
                                                </span>
                                                <div className="mt-1 flex items-center gap-2.5">
                                                    <span className="text-lg sm:text-xl font-mono font-extrabold tracking-tight text-slate-900">
                                                        {paymentAccount.account_number}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={copyAccountNumber}
                                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-[#527D98]"
                                                    >
                                                        <svg
                                                            className="h-3.5 w-3.5 text-slate-500"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        Salin
                                                    </button>
                                                </div>
                                                {copyMessage && (
                                                    <p
                                                        role="status"
                                                        className="mt-1.5 text-xs font-medium text-emerald-600"
                                                    >
                                                        {copyMessage}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="sm:text-right">
                                                <span className="text-[11px] font-semibold text-slate-400">
                                                    Atas Nama Penerima
                                                </span>
                                                <p className="mt-1 text-base sm:text-lg font-bold text-slate-900">
                                                    {paymentAccount.account_holder}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs sm:text-sm text-slate-500">
                                            Transfer DP langsung ke rekening mentor. Detail rekening mentor akan ditampilkan di sini.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="payment-dp-proof"
                                            className="text-xs sm:text-sm font-bold text-slate-800"
                                        >
                                            Unggah Bukti Transfer{' '}
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            JPG atau PNG (maks. 5 MB)
                                        </span>
                                    </div>

                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`mt-2.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                                            fileError || form.errors.payment_dp_proof
                                                ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50/60'
                                                : selectedFile
                                                  ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/50'
                                                  : 'border-slate-200 bg-slate-50/50 hover:border-[#527D98] hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            id="payment-dp-proof"
                                            name="payment_dp_proof"
                                            type="file"
                                            accept="image/png,image/jpeg"
                                            required
                                            aria-describedby={
                                                form.errors.payment_dp_proof || fileError
                                                    ? 'payment-proof-help payment-proof-error'
                                                    : 'payment-proof-help'
                                            }
                                            aria-invalid={Boolean(
                                                form.errors.payment_dp_proof || fileError,
                                            )}
                                            onChange={selectPaymentProof}
                                            className="sr-only"
                                        />

                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-[#527D98] shadow-xs">
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
                                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                />
                                            </svg>
                                        </div>

                                        <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-700">
                                            {selectedFile ? (
                                                <span className="text-emerald-700 font-bold">
                                                    File dipilih: {selectedFile.name}
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-[#527D98] underline decoration-solid">
                                                        Klik untuk memilih file
                                                    </span>{' '}
                                                    atau seret dan lepas di sini
                                                </>
                                            )}
                                        </p>
                                        <p
                                            id="payment-proof-help"
                                            className="mt-1 text-[11px] text-slate-400"
                                        >
                                            Pastikan nominal {formatRupiah(summary.dp_amount)} dan nomor rekening terlihat jelas
                                        </p>
                                    </div>

                                    {(fileError ||
                                        form.errors.payment_dp_proof) && (
                                        <p
                                            id="payment-proof-error"
                                            className="mt-2 text-xs font-semibold text-rose-600"
                                        >
                                            {fileError ||
                                                form.errors.payment_dp_proof}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        )}

                        

                        <Card className="p-4 sm:p-5 space-y-3">
                            <label
                                htmlFor="agree-to-code"
                                className="flex items-start gap-3 cursor-pointer select-none"
                            >
                                <input
                                    id="agree-to-code"
                                    type="checkbox"
                                    checked={agreedToCode}
                                    onChange={(event) =>
                                        setAgreedToCode(event.target.checked)
                                    }
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#527D98] focus:ring-[#527D98]"
                                />
                                <span className="text-xs sm:text-sm leading-relaxed text-slate-700">
                                    Saya telah membaca dan menyetujui{' '}
                                    <span className="font-semibold text-slate-900">
                                        Kode Etik Mentoring Pathway
                                    </span>{' '}
                                    serta kebijakan pembatalan dan penjadwalan ulang sesi mentoring.
                                </span>
                            </label>
                            <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
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
                                <span>
                                    Jaminan perlindungan 100% dana aman jika mentor berhalangan hadir atau tidak menanggapi dalam waktu 24 jam.
                                </span>
                            </div>
                        </Card>
                    </div>

                    <Card
                        as="aside"
                        aria-labelledby="summary-heading"
                        className="p-5 sm:p-6 lg:sticky lg:top-24 space-y-5"
                    >
                        <div>
                            <Badge variant="primary" size="xs">
                                RINGKASAN
                            </Badge>
                            <h2
                                id="summary-heading"
                                className="mt-2 text-lg font-bold text-slate-900"
                            >
                                Ringkasan Pemesanan
                            </h2>
                        </div>

                        {/* MENTOR SNIPPET */}
                        <div className="flex items-center gap-3.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#527D98] text-sm font-extrabold text-white shadow-xs">
                                {getInitials(mentor.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="truncate text-sm font-bold text-slate-900">
                                        {mentor.name}
                                    </h3>
                                    <svg
                                        className="h-4 w-4 shrink-0 text-[#527D98]"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Mentor Terverifikasi
                                </p>
                            </div>
                        </div>

                        {/* BOOKING DETAILS */}
                        <dl className="space-y-3 border-t border-slate-100 pt-4 text-xs sm:text-sm">
                            <div className="flex items-center justify-between text-slate-600">
                                <dt className="flex items-center gap-2 text-slate-500">
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
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    Tanggal
                                </dt>
                                <dd className="font-semibold capitalize text-slate-900">
                                    {formatDate(summary.date)}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <dt className="flex items-center gap-2 text-slate-500">
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
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Waktu &amp; Durasi
                                </dt>
                                <dd className="font-semibold text-slate-900">
                                    {summary.start} - {summary.end} WIB ({summary.duration_hours} jam)
                                </dd>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <dt className="flex items-center gap-2 text-slate-500">
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
                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                    Platform
                                </dt>
                                <dd className="font-semibold text-slate-900">
                                    Google Meet / Discord
                                </dd>
                            </div>
                        </dl>

                        {/* PRICE BREAKDOWN */}
                        <div className="space-y-2 border-t border-slate-100 pt-4 text-xs sm:text-sm">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Tarif Mentoring ({summary.duration_hours} jam)</span>
                                <span className="font-semibold text-slate-900">
                                    {summary.is_free_session
                                        ? 'Gratis'
                                        : summary.price_per_hour === null
                                          ? formatRupiah(summary.total_price)
                                          : `${formatRupiah(summary.price_per_hour)} x ${summary.duration_hours} jam`}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span className="flex items-center gap-1.5">
                                    Biaya Layanan Platform
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                        Promo
                                    </span>
                                </span>
                                <span className="font-semibold text-emerald-600">
                                    Rp 0
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-sm font-bold text-slate-900">
                                <span>Total Biaya Mentoring</span>
                                <span className="text-base font-extrabold text-slate-900">
                                    {summary.is_free_session
                                        ? 'Gratis'
                                        : formatRupiah(summary.total_price)}
                                </span>
                            </div>

                            {!summary.is_free_session && (
                                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                                        <span className="text-[#527D98]">
                                            DP Dibayar Sekarang (50%)
                                        </span>
                                        <span className="text-sm font-black text-slate-900">
                                            {formatRupiah(summary.dp_amount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Pelunasan Pasca-Sesi (50%)</span>
                                        <span>
                                            {formatRupiah(
                                                summary.total_price -
                                                    summary.dp_amount,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ACTIONS */}
                        <div className="space-y-2.5 pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={!canSubmit}
                                className="w-full py-3 text-sm font-bold shadow-sm"
                            >
                                {form.processing
                                    ? 'Mengajukan...'
                                    : 'Ajukan Booking Sekarang →'}
                            </Button>
                            <Button
                                href={scheduleUrl}
                                variant="secondary"
                                size="md"
                                className="w-full text-slate-600 hover:text-slate-900"
                            >
                                Batal / Kembali
                            </Button>
                        </div>

                        {/* TRUST BADGES */}
                        <div className="space-y-1.5 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
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
                                <span>
                                    100% Refund Guarantee jika mentor no-show
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg
                                    className="h-3.5 w-3.5 shrink-0 text-amber-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>
                                    Konfirmasi mentor rata-rata &lt; 2 jam kerja
                                </span>
                            </div>
                        </div>
                    </Card>
                </form>
            </main>

            {/* FOOTER */}
            <footer className="mt-16 border-t border-slate-200/80 bg-white py-6 text-xs text-slate-400">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Pathway</span>
                        <span>—</span>
                        <span>Platform Mentoring Pemrograman &amp; Karir Digital</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-slate-500">
                        <span className="hover:text-slate-700 cursor-pointer">Pusat Bantuan</span>
                        <span className="hover:text-slate-700 cursor-pointer">Aturan Refund &amp; DP</span>
                        <span className="hover:text-slate-700 cursor-pointer">Hubungi CS</span>
                    </div>
                    <div>
                        © 2026 Pathway Mentoring Platform. Hak Cipta Dilindungi.
                    </div>
                </div>
            </footer>
        </div>
    );
}
