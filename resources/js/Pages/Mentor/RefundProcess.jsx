import { useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    Badge,
    Button,
    Card,
    SectionHeader,
} from '@/Components/ui';

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
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#527D98]/20 selection:text-[#527D98]">
            <Head title="Proses Refund" />

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

                    <div className="flex shrink-0 items-center gap-3">
                        <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pl-1 pr-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5ECDD] text-xs font-bold text-[#34443D] shadow-sm">
                                {getInitials(mentorName)}
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
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={route('mentor.dashboard')}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        <svg
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="m15 18-6-6 6-6" />
                            <path d="M20 12H9" />
                        </svg>
                        Kembali ke Sesi Mentoring
                    </Link>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#527D98]">
                        Portal Mentor &gt; Pembatalan &amp; Refund
                    </p>
                </div>

                {/* Hero: Judul + Timer */}
                <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="max-w-xl">
                        <Badge variant="danger" size="sm" className="uppercase tracking-wide">
                            Aksi Diperlukan
                        </Badge>
                        <h1 className="mt-3 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                            Proses Refund Dana Mentee
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Selesaikan pengembalian uang muka (DP) sesuai batas
                            waktu. Pastikan nomor rekening dan nominal transfer
                            akurat.
                        </p>
                    </div>

                    <div
                        className={`rounded-2xl border px-5 py-4 shadow-sm ${
                            remaining.isUrgent
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-wider">
                            Batas Waktu Pengembalian
                        </p>
                        <p className="mt-1 text-2xl font-extrabold">
                            {remaining.text}
                        </p>
                        <p className="mt-1 text-xs opacity-80">
                            Jatuh tempo: {formatDateTime(session.refund_deadline)}
                        </p>
                    </div>
                </div>

                <Card as="section" className="p-5 sm:p-6">
                    <SectionHeader
                        title="Data Reservasi & Pembatalan"
                        tag="Informasi Sesi Terjadwal"
                        icon={
                            <svg
                                aria-hidden="true"
                                className="h-5 w-5 text-[#527D98]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <rect x="3" y="5" width="18" height="16" rx="2" />
                                <path d="M16 3v4M8 3v4M3 10h18" />
                            </svg>
                        }
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-100 text-sm font-bold text-sky-700">
                                {getInitials(studentName)}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">
                                    {studentName}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                    {student.email ?? 'Email tidak tersedia'}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Jadwal Asal
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                                {formatDateTime(session.schedule_time)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Durasi
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                                {session.duration_hours ?? 0} Jam
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                            Alasan Pembatalan
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                            {session.cancellation_reason?.trim() ||
                                'Tidak ada alasan yang dicatat.'}
                        </p>
                    </div>
                </Card>

                <Card as="section" className="p-5 sm:p-6">
                    <SectionHeader
                        title="Detail Pembayaran & Rekening Tujuan"
                        tag="Kewajiban Pengembalian"
                        icon={
                            <svg
                                aria-hidden="true"
                                className="h-5 w-5 text-[#527D98]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                <path d="M2 10h20" />
                            </svg>
                        }
                        badge={
                            <Badge variant="primary" size="xs">
                                DP 50% Diterima Mentor
                            </Badge>
                        }
                    />

                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="space-y-4">
                            {/* Nominal wajib refund */}
                            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-5">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Nominal Wajib Refund
                                </p>
                                <p className="mt-1 text-3xl font-extrabold text-[#315F78]">
                                    Rp {rupiahFormatter.format(refundAmount)}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    100% Pengembalian DP · Besar harus sesuai nominal diterima
                                </p>
                                <dl className="mt-4 space-y-2 border-t border-sky-100 pt-3 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-slate-500">
                                            Total tarif sesi
                                        </dt>
                                        <dd className="font-medium text-slate-700">
                                            Rp {rupiahFormatter.format(totalPrice)}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-4 font-semibold">
                                        <dt className="text-slate-600">DP 50% yang diterima mentor</dt>
                                        <dd className="text-[#315F78]">
                                            Rp {rupiahFormatter.format(refundAmount)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Rekening tujuan */}
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-slate-900">
                                        Rekening Tujuan Transfer Balik
                                    </p>
                                    {hasBankAccount && (
                                        <Badge variant="success" size="xs">
                                            Terverifikasi Sesuai Data Mentee
                                        </Badge>
                                    )}
                                </div>
                                {hasBankAccount ? (
                                    <dl className="mt-4 space-y-3">
                                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                                            <div className="min-w-0 flex-1">
                                                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Bank
                                                </dt>
                                                <dd className="mt-0.5 text-base font-extrabold text-slate-900 tracking-wide">
                                                    {student.bank_name}
                                                </dd>
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                            <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Nomor Rekening
                                            </dt>
                                            <dd className="mt-1 text-xl font-extrabold tracking-widest text-slate-900">
                                                {student.bank_account_number}
                                            </dd>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    Nama Penerima Rekening
                                                </dt>
                                                <dd className="mt-1 text-sm font-semibold text-slate-800">
                                                    {student.bank_account_holder}
                                                </dd>
                                            </div>
                                            {student.bank_branch && (
                                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                                    <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                        Cabang Perbankan
                                                    </dt>
                                                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                                                        {student.bank_branch}
                                                    </dd>
                                                </div>
                                            )}
                                        </div>
                                    </dl>
                                ) : (
                                    <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                        <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="M12 8v4m0 4h.01" />
                                        </svg>
                                        <p className="text-sm leading-6 text-amber-800">
                                            Mentee belum mengisi data rekening di
                                            profilnya. Hubungi mentee untuk
                                            meminta nomor rekening tujuan.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bukti DP Masuk */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-slate-900">
                                    Bukti DP Masuk (Referensi Mentee)
                                </p>
                                {dpProofUrl && (
                                    <a
                                        href={dpProofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-semibold text-[#527D98] hover:underline"
                                    >
                                        Arsip Transaksi ↗
                                    </a>
                                )}
                            </div>
                            {dpProofUrl ? (
                                <a
                                    href={dpProofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#527D98]"
                                    aria-label="Buka bukti DP di tab baru"
                                >
                                    <img
                                        src={dpProofUrl}
                                        alt={`Bukti DP dari ${studentName}`}
                                        className="max-h-80 w-full object-contain"
                                    />
                                </a>
                            ) : (
                                <div className="mt-3 flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
                                    Bukti DP tidak tersedia.
                                </div>
                            )}
                            <p className="mt-3 text-xs leading-5 text-slate-500">
                                Gunakan bukti ini untuk mencocokkan rekening
                                sumber sebelum melakukan transfer balik.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card as="section" className="overflow-hidden">
                    <div className="p-5 sm:p-6">
                        <SectionHeader
                            title="Unggah Bukti Transfer Refund"
                            tag="Verifikasi Keabsahan ini"
                            icon={
                                <svg
                                    aria-hidden="true"
                                    className="h-5 w-5 text-[#527D98]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            }
                        />

                        {/* Dropzone */}
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
                            className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2 ${
                                isDragging
                                    ? 'border-[#527D98] bg-sky-50'
                                    : 'border-slate-300 bg-slate-50/60 hover:border-[#527D98]/60 hover:bg-sky-50/40'
                            }`}
                        >
                            <svg
                                aria-hidden="true"
                                className="mx-auto mb-3 h-10 w-10 text-slate-300"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                            <p className="text-sm font-semibold text-slate-700">
                                Seret file ke sini atau{' '}
                                <span className="text-[#527D98] underline">
                                    klik untuk upload
                                </span>
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                                Mendukung file: JPG, PNG, atau PDF (Ukuran maksimal 5MB)
                            </p>
                            <p className="mt-3 inline-block rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-[#527D98]">
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

                        {/* Error */}
                        {uploadError && (
                            <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                                <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 8v4m0 4h.01" />
                                </svg>
                                <p className="text-sm font-medium text-rose-700">
                                    {uploadError}
                                </p>
                            </div>
                        )}

                        {/* File terpilih */}
                        {selectedFile && (
                            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <svg aria-hidden="true" className="h-8 w-8 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <path d="m9 15 2 2 4-4" />
                                    </svg>
                                    <div className="min-w-0">
                                        <p className="break-all text-sm font-semibold text-emerald-900">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-emerald-600">
                                            {formatFileSize(selectedFile.size)} · Siap dikirimkan
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="shrink-0 text-xs font-semibold text-rose-600 hover:underline"
                                >
                                    Hapus File
                                </button>
                            </div>
                        )}

                        {/* Catatan untuk Mentee (opsional, dipertahankan dari fitur asli) */}
                        {form.data.notes !== undefined && (
                            <div className="mt-5">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Catatan untuk Mentee
                                    <span className="ml-1 font-normal text-slate-400">(Opsional)</span>
                                </label>
                                <textarea
                                    value={form.data.notes ?? ''}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#527D98] focus:outline-none focus:ring-1 focus:ring-[#527D98]"
                                    placeholder="Pesan akan dikirimkan ke email mentee bersama lampiran bukti transfer..."
                                />
                            </div>
                        )}

                        {/* Peringatan overdue */}
                        {remaining.isOverdue && (
                            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                <svg aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <div>
                                    <p className="text-sm font-bold text-rose-700">
                                        Peringatan Penalti &amp; Kebijakan Komitmen Mentor
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-rose-600">
                                        Jika refund tidak diselesaikan dalam batas waktu, akun mentor Anda akan ditangguhkan sementara secara otomatis oleh sistem Pathway dan tidak dapat menerima permintaan booking baru sampai seluruh proses pengembalian dana diverifikasi oleh admin.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer action bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                        <p className="text-xs leading-5 text-slate-500">
                            Notifikasi bukti transfer akan diteruskan ke email resmi mentee &amp; tim Pathway.
                        </p>
                        <div className="flex shrink-0 gap-3">
                            <Button
                                type="button"
                                variant="primary"
                                size="md"
                                onClick={submitRefund}
                                disabled={!selectedFile || form.processing}
                                className="bg-[#527D98] hover:bg-[#3E637A]"
                            >
                                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 2 11 13" />
                                    <path d="m22 2-7 20-4-9-9-4 20-7z" />
                                </svg>
                                {form.processing ? 'Mengirim...' : 'Submit Bukti Refund'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
}