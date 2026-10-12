import { useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
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

function formatDateTime(value) {
    if (!value) {
        return 'Waktu tidak tersedia';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Waktu tidak tersedia'
        : `${dateTimeFormatter.format(date)} WIB`;
}

function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name) {
    return (
        String(name ?? 'User')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'U'
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

function getRemainingTime(deadline) {
    if (!deadline) {
        return { text: 'Batas waktu tidak tersedia', isOverdue: false, isUrgent: false };
    }

    const diffMs = new Date(deadline).getTime() - Date.now();

    if (Number.isNaN(diffMs)) {
        return { text: 'Batas waktu tidak tersedia', isOverdue: false, isUrgent: false };
    }

    if (diffMs <= 0) {
        return { text: 'Batas waktu terlewat', isOverdue: true, isUrgent: true };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    return {
        text: days > 0 ? `${days} hari ${hours} jam lagi` : `${hours} jam lagi`,
        isOverdue: false,
        isUrgent: totalHours < 6,
    };
}

export default function RefundProcess({ session }) {
    const { auth } = usePage().props;

    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState('');

    const form = useForm({
        _method: 'patch',
        refund_proof: null,
    });

    const mentorName = auth?.user?.name ?? 'Mentor';
    const student = session.student ?? {};
    const studentName = student.name ?? 'Student';
    const totalPrice = Number(session.price_snapshot ?? 0);
    const refundAmount = totalPrice / 2;
    const remaining = getRemainingTime(session.refund_deadline);
    const dpProofUrl = getPublicStorageUrl(session.payment_dp_proof);
    const hasBankAccount =
        student.bank_name &&
        student.bank_account_number &&
        student.bank_account_holder;

    const selectedFile = form.data.refund_proof;
    const uploadError = fileError || form.errors.refund_proof;

    const pickFile = (file) => {
        if (!file) {
            return;
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            setFileError('Format file harus JPG, PNG, atau PDF.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setFileError('Ukuran file maksimal 5MB.');
            return;
        }

        setFileError('');
        form.clearErrors();
        form.setData('refund_proof', file);
    };

    const removeFile = () => {
        form.setData('refund_proof', null);
        form.clearErrors();
        setFileError('');

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        pickFile(event.dataTransfer.files?.[0]);
    };

    const submitRefund = () => {
        form.post(route('mentor.refund.complete', session.id), {
            forceFormData: true,
        });
    };

    return (
        <div className="min-h-screen bg-[#F7F5F0] text-[#34443D]">
            <Head title="Proses Refund" />

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
                        className="flex items-center gap-1 text-sm"
                    >
                        <Link
                            href={route('mentor.dashboard')}
                            className="rounded-full px-4 py-2 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
                        >
                            Overview
                        </Link>
                    </nav>

                    <div className="flex shrink-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-[#E5ECDD] text-xs font-bold text-[#34443D]">
                            {getInitials(mentorName)}
                        </div>
                        <p className="hidden max-w-36 truncate text-sm font-semibold sm:block">
                            {mentorName}
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
                <Link
                    href={route('mentor.dashboard')}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#E7EEF1] px-3 py-2 text-sm font-semibold text-[#527D98] transition-colors hover:bg-[#DCE8ED] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                >
                    Kembali ke Dashboard
                </Link>

                <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="max-w-xl">
                        <span className="inline-flex rounded-full bg-[#FBECEE] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#A34F45]">
                            Aksi Diperlukan
                        </span>
                        <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
                            Proses Refund Dana Mentee
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-[#69766F]">
                            Selesaikan pengembalian uang muka (DP) sesuai batas
                            waktu. Pastikan nomor rekening dan nominal transfer
                            akurat.
                        </p>
                    </div>

                    <div
                        className={`rounded-xl px-5 py-4 ${
                            remaining.isUrgent
                                ? 'bg-[#FBECEE] text-[#A34F45]'
                                : 'bg-[#F3EFDF] text-[#78663A]'
                        }`}
                    >
                        <p className="text-xs font-bold uppercase tracking-wide">
                            Batas Waktu Pengembalian
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                            {remaining.text}
                        </p>
                        <p className="mt-1 text-xs">
                            Jatuh tempo: {formatDateTime(session.refund_deadline)}
                        </p>
                    </div>
                </div>

                <section className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6">
                    <h2 className="text-base font-bold">
                        Data Reservasi &amp; Pembatalan
                    </h2>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-lg bg-[#EEF2FD] p-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#6594B1] text-sm font-bold text-white">
                                {getInitials(studentName)}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold">
                                    {studentName}
                                </p>
                                <p className="truncate text-xs text-[#69766F]">
                                    {student.email ?? 'Email tidak tersedia'}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-lg bg-[#EEF2FD] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                                Jadwal Asal
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6">
                                {formatDateTime(session.schedule_time)}
                            </p>
                        </div>
                        <div className="rounded-lg bg-[#EEF2FD] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                                Durasi
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6">
                                {session.duration_hours ?? 0} Jam
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-[#EEF2FD] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                            Alasan Pembatalan
                        </p>
                        <p className="mt-2 text-sm leading-6">
                            {session.cancellation_reason?.trim() ||
                                'Tidak ada alasan yang dicatat.'}
                        </p>
                    </div>
                </section>

                <section className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6">
                    <h2 className="text-base font-bold">
                        Detail Pembayaran &amp; Rekening Tujuan
                    </h2>

                    <div className="mt-5 grid gap-5 lg:grid-cols-2">
                        <div className="space-y-4">
                            <div className="rounded-lg bg-[#EEF2FD] p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                                    Nominal Wajib Refund
                                </p>
                                <p className="mt-1 text-3xl font-bold text-[#315F78]">
                                    Rp {rupiahFormatter.format(refundAmount)}
                                </p>
                                <dl className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-[#69766F]">
                                            Total tarif sesi
                                        </dt>
                                        <dd>
                                            Rp {rupiahFormatter.format(totalPrice)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4 font-semibold">
                                        <dt>DP 50% yang diterima mentor</dt>
                                        <dd className="text-[#315F78]">
                                            Rp {rupiahFormatter.format(refundAmount)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="rounded-lg bg-[#EEF2FD] p-5">
                                <p className="text-sm font-bold">
                                    Rekening Tujuan Transfer Balik
                                </p>
                                {hasBankAccount ? (
                                    <dl className="mt-3 space-y-3 text-sm">
                                        <div>
                                            <dt className="text-xs text-[#78827B]">
                                                Bank
                                            </dt>
                                            <dd className="font-semibold">
                                                {student.bank_name}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-[#78827B]">
                                                Nomor Rekening
                                            </dt>
                                            <dd className="text-lg font-bold tracking-wider">
                                                {student.bank_account_number}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-[#78827B]">
                                                Nama Penerima
                                            </dt>
                                            <dd className="font-semibold">
                                                {student.bank_account_holder}
                                            </dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className="mt-3 rounded-lg bg-[#F3EFDF] px-4 py-3 text-sm leading-6 text-[#78663A]">
                                        Mentee belum mengisi data rekening di
                                        profilnya. Hubungi mentee untuk
                                        meminta nomor rekening tujuan.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg bg-[#EEF2FD] p-5">
                            <p className="text-sm font-bold">
                                Bukti DP Masuk (Referensi Mentee)
                            </p>
                            {dpProofUrl ? (
                                <a
                                    href={dpProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 block overflow-hidden rounded-lg border border-[#E8E5DD] bg-white focus:outline-none focus:ring-2 focus:ring-[#6594B1]"
                                    aria-label="Buka bukti DP di tab baru"
                                >
                                    <img
                                        src={dpProofUrl}
                                        alt={`Bukti DP dari ${studentName}`}
                                        className="max-h-80 w-full object-contain"
                                    />
                                </a>
                            ) : (
                                <p className="mt-3 text-sm text-[#78827B]">
                                    Bukti DP tidak tersedia.
                                </p>
                            )}
                            <p className="mt-3 text-xs leading-5 text-[#69766F]">
                                Gunakan bukti ini untuk mencocokkan rekening
                                sumber sebelum melakukan transfer balik.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                        Verifikasi Keabsahan
                    </p>
                    <h2 className="mt-1 text-base font-bold">
                        Unggah Bukti Transfer Refund
                    </h2>

                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                fileInputRef.current?.click();
                            }
                        }}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`mt-5 cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 ${
                            isDragging
                                ? 'border-[#6594B1] bg-[#E7EEF1]'
                                : 'border-[#6594B1]/50 bg-[#F7F5F0] hover:bg-[#EEF2FD]'
                        }`}
                    >
                        <p className="text-sm font-semibold">
                            Seret file ke sini atau{' '}
                            <span className="text-[#527D98] underline">
                                klik untuk upload
                            </span>
                        </p>
                        <p className="mt-1 text-xs text-[#69766F]">
                            Mendukung file: JPG, PNG, atau PDF (Ukuran maksimal
                            5MB)
                        </p>
                        <p className="mt-3 inline-block rounded-full bg-[#E7EEF1] px-3 py-1 text-xs text-[#527D98]">
                            Pastikan nama penerima &amp; nominal Rp{' '}
                            {rupiahFormatter.format(refundAmount)} terbaca jelas
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="hidden"
                            onChange={(event) => pickFile(event.target.files?.[0])}
                        />
                    </div>

                    {uploadError && (
                        <p className="mt-2 text-sm font-medium text-[#A34F45]">
                            {uploadError}
                        </p>
                    )}

                    {selectedFile && (
                        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-[#EEF2FD] px-4 py-3">
                            <div className="min-w-0">
                                <p className="break-all text-sm font-semibold">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-[#69766F]">
                                    {formatFileSize(selectedFile.size)} •
                                    Siap dikirimkan
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="shrink-0 text-sm font-semibold text-[#A34F45] hover:underline"
                            >
                                Hapus File
                            </button>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={submitRefund}
                            disabled={!selectedFile || form.processing}
                            className="rounded-xl bg-[#6594B1] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#557f99] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Mengirim...'
                                : 'Submit Bukti Refund'}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}