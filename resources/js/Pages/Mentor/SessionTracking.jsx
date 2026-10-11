import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

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
        <div
            role="alert"
            className="space-y-1 rounded-xl border border-[#E7C7C1] bg-[#FBEEEB] px-4 py-3 text-sm font-medium text-[#A34F45]"
        >
            {messages.map((message, index) => (
                <p key={`${message}-${index}`}>{message}</p>
            ))}
        </div>
    );
}

export default function SessionTracking({ session }) {
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
        <div className="min-h-screen bg-[#F7F5F0] text-[#34443D]">
            <Head title="Tracking Sesi Mentoring" />

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

                    <div className="flex min-w-0 flex-1 items-center justify-end gap-4 md:gap-6">
                        <label className="flex min-w-0 max-w-xs flex-1 items-center rounded-md border border-white/25 bg-white/15 px-3 py-2 focus-within:border-white/60 focus-within:bg-white/20">
                            <input
                                type="search"
                                placeholder="Cari mentor, topik..."
                                aria-label="Cari mentor atau topik"
                                className="w-full min-w-0 border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-0"
                            />
                        </label>
                        <div className="flex shrink-0 items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-[#E5ECDD] text-xs font-bold text-[#34443D]">
                                {mentorInitials}
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

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                Portal Mentor / Tracking Sesi
                            </p>
                            <h1 className="mt-1 text-2xl font-bold leading-tight text-[#34443D] sm:text-3xl">
                                Sesi Mentoring
                            </h1>
                        </div>
                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-base font-bold sm:text-lg ${status.className}`}
                        >
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${status.dotClassName}`}
                            />
                            {status.label}
                        </span>
                    </div>
                </div>

                <ErrorMessages messages={errorMessages} />

                {flash?.success && (
                    <div
                        role="status"
                        className="rounded-xl border border-[#C9DEC9] bg-[#E8F2E8] px-4 py-3 text-sm font-medium text-[#477E50]"
                    >
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
                    <div className="space-y-5 lg:col-span-3">
                        <section
                            aria-labelledby="session-info-heading"
                            className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-5">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E7EEF1] text-lg font-bold text-[#527D98]">
                                        {getInitials(studentName)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A938D]">
                                            Student
                                        </p>
                                        <h2
                                            id="session-info-heading"
                                            className="mt-1 break-words text-lg font-bold text-[#34443D]"
                                        >
                                            {studentName}
                                        </h2>
                                        <p className="mt-1 break-all text-sm text-[#69766F]">
                                            {session.student?.email ??
                                                'Email tidak tersedia'}
                                        </p>
                                    </div>
                                </div>
                                <span className="inline-flex shrink-0 items-center rounded-full bg-[#F3EFDF] px-3 py-1.5 text-xs font-semibold text-[#8A7440]">
                                    {session.is_free_session
                                        ? 'Sesi Gratis'
                                        : `Rp ${rupiahFormatter.format(Number(session.price_snapshot ?? 0))}`}
                                </span>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg bg-[#EEF2FD] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                                        Jadwal Mulai
                                    </p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-[#34443D]">
                                        {formatSessionDateTime(
                                            session.schedule_time,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[#EEF2FD] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                                        Jadwal Selesai
                                    </p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-[#34443D]">
                                        {formatSessionDateTime(
                                            session.end_time,
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[#F7F5F0] p-4 sm:col-span-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#78827B]">
                                        Durasi Sesi
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-[#34443D]">
                                        {session.duration_hours ?? 0} Jam
                                    </p>
                                </div>
                            </div>
                        </section>

                        {session.status === 'dikonfirmasi' && (
                            <section
                                aria-labelledby="discord-heading"
                                className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2
                                            id="discord-heading"
                                            className="text-base font-bold text-[#34443D]"
                                        >
                                            Ruang Mentoring Discord Anda
                                        </h2>
                                        <p className="mt-1 text-sm text-[#69766F]">
                                            Ruang privat untuk sesi mentoring
                                            ini.
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-[#E8F2E8] px-3 py-1 text-xs font-semibold text-[#477E50]">
                                        Siap Digunakan
                                    </span>
                                </div>

                                {session.discord_link ? (
                                    <>
                                        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                                            <p className="min-w-0 flex-1 break-all rounded-lg bg-[#EEF2FD] px-4 py-3 text-sm text-[#4F5C55]">
                                                {session.discord_link}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={copyDiscordLink}
                                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#E7EEF1] px-4 py-2 text-sm font-semibold text-[#527D98] transition-colors hover:bg-[#DCE8ED] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                            >
                                                {hasCopiedDiscordLink
                                                    ? 'Link Tersalin'
                                                    : 'Salin Link'}
                                            </button>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                            <a
                                                href={session.discord_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#315F78] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#274D62] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                            >
                                                Buka Discord
                                                <svg
                                                    aria-hidden="true"
                                                    className="h-4 w-4"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M14 4h6v6" />
                                                    <path d="m20 4-9 9" />
                                                    <path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
                                                </svg>
                                            </a>
                                            <p className="text-xs leading-5 text-[#78827B]">
                                                Link ini hanya untuk sesi
                                                mentoring yang terjadwal.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <p className="mt-5 rounded-lg bg-[#F7F5F0] px-4 py-3 text-sm text-[#78827B]">
                                        Link Discord belum tersedia. Silakan
                                        periksa kembali sebelum memulai sesi.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={startSession}
                                    disabled={startForm.processing}
                                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#65B175] px-5 py-3 text-base font-bold text-white transition-colors hover:bg-[#559C65] focus:outline-none focus:ring-2 focus:ring-[#65B175] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {startForm.processing
                                        ? 'Memulai Sesi...'
                                        : 'Mulai Sesi'}
                                </button>
                            </section>
                        )}

                        {session.status === 'berlangsung' && (
                            <section
                                aria-labelledby="proof-heading"
                                className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2
                                            id="proof-heading"
                                            className="text-base font-bold text-[#34443D]"
                                        >
                                            Unggah Bukti Mentoring
                                        </h2>
                                        <p className="mt-1 text-sm leading-6 text-[#69766F]">
                                            Unggah tangkapan layar sesi untuk
                                            menyelesaikan mentoring.
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-[#FBECEE] px-3 py-1 text-xs font-semibold text-[#A34F45]">
                                        Wajib Sebelum Sesi Selesai
                                    </span>
                                </div>

                                <form
                                    onSubmit={completeSession}
                                    className="mt-5 space-y-5"
                                >
                                    <div>
                                        <label
                                            htmlFor="proof_file"
                                            className="block text-sm font-semibold text-[#34443D]"
                                        >
                                            File Bukti Sesi
                                        </label>
                                        <input
                                            id="proof_file"
                                            name="proof_file"
                                            type="file"
                                            accept="image/*"
                                            required
                                            onChange={(event) =>
                                                completeForm.setData(
                                                    'proof_file',
                                                    event.target.files?.[0] ??
                                                        null,
                                                )
                                            }
                                            className="mt-2 block w-full rounded-lg border border-[#D8D5CC] bg-white text-sm text-[#4F5C55] file:mr-4 file:border-0 file:bg-[#E7EEF1] file:px-4 file:py-3 file:text-sm file:font-semibold file:text-[#527D98] hover:file:bg-[#DCE8ED] focus:outline-none focus:ring-2 focus:ring-[#6594B1]"
                                        />
                                        <p className="mt-2 text-xs text-[#78827B]">
                                            Format gambar, ukuran maksimum 5 MB.
                                        </p>
                                        {completeForm.errors.proof_file && (
                                            <p className="mt-2 text-sm font-medium text-[#A34F45]">
                                                {
                                                    completeForm.errors
                                                        .proof_file
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="notes_from_mentor"
                                            className="block text-sm font-semibold text-[#34443D]"
                                        >
                                            Catatan Evaluasi Sesi{' '}
                                            <span className="font-normal text-[#78827B]">
                                                (opsional)
                                            </span>
                                        </label>
                                        <textarea
                                            id="notes_from_mentor"
                                            name="notes_from_mentor"
                                            rows="5"
                                            value={
                                                completeForm.data
                                                    .notes_from_mentor
                                            }
                                            onChange={(event) =>
                                                completeForm.setData(
                                                    'notes_from_mentor',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Tuliskan evaluasi dan rekomendasi untuk student..."
                                            className="mt-2 block w-full rounded-lg border border-[#D8D5CC] bg-white px-4 py-3 text-sm leading-6 text-[#34443D] placeholder:text-[#9AA19C] focus:border-[#6594B1] focus:outline-none focus:ring-2 focus:ring-[#6594B1]/30"
                                        />
                                        {completeForm.errors
                                            .notes_from_mentor && (
                                            <p className="mt-2 text-sm font-medium text-[#A34F45]">
                                                {
                                                    completeForm.errors
                                                        .notes_from_mentor
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-4 border-t border-[#EEECE6] pt-5 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs leading-5 text-[#78827B]">
                                            Pastikan bukti dapat dibaca sebelum
                                            mengirim.
                                        </p>
                                        <button
                                            type="submit"
                                            disabled={
                                                completeForm.processing ||
                                                !completeForm.data.proof_file
                                            }
                                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#526557] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#435448] focus:outline-none focus:ring-2 focus:ring-[#526557] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {completeForm.processing
                                                ? 'Mengirim Bukti...'
                                                : 'Submit Bukti & Selesaikan Sesi'}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        )}

                        {session.status === 'selesai' && (
                            <section
                                aria-labelledby="completed-heading"
                                className="rounded-xl border border-[#C9DEC9] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F2E8] text-[#477E50]">
                                        <svg
                                            aria-hidden="true"
                                            className="h-6 w-6"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="m8 12 2.5 2.5L16 9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2
                                            id="completed-heading"
                                            className="text-lg font-bold text-[#3E7048]"
                                        >
                                            Sesi Mentoring Telah Selesai
                                        </h2>
                                        <p className="mt-1 text-sm leading-6 text-[#69766F]">
                                            Bukti dan catatan evaluasi sesi
                                            tersimpan.
                                        </p>
                                    </div>
                                </div>

                                {proofUrl ? (
                                    <a
                                        href={proofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-5 block overflow-hidden rounded-lg border border-[#E8E5DD] bg-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                        aria-label="Buka bukti mentoring di tab baru"
                                    >
                                        <img
                                            src={proofUrl}
                                            alt={`Bukti sesi mentoring bersama ${studentName}`}
                                            className="max-h-[28rem] w-full object-contain"
                                        />
                                    </a>
                                ) : (
                                    <p className="mt-5 rounded-lg bg-[#F7F5F0] p-4 text-sm text-[#78827B]">
                                        Tidak ada bukti mentoring yang
                                        tersimpan.
                                    </p>
                                )}

                                <div className="mt-5">
                                    <h3 className="text-sm font-bold text-[#34443D]">
                                        Catatan Evaluasi Sesi
                                    </h3>
                                    <p className="mt-2 whitespace-pre-line rounded-lg bg-[#EEF2FD] p-4 text-sm leading-6 text-[#4F5C55]">
                                        {session.notes_from_mentor?.trim() ||
                                            'Tidak ada catatan evaluasi.'}
                                    </p>
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="space-y-5 lg:col-span-2">
                        <section
                            aria-labelledby="quick-info-heading"
                            className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                        >
                            <h2
                                id="quick-info-heading"
                                className="text-base font-bold text-[#34443D]"
                            >
                                Ringkasan Sesi
                            </h2>
                            <dl className="mt-4 divide-y divide-[#EEECE6]">
                                <div className="flex items-center justify-between gap-4 py-3">
                                    <dt className="text-sm text-[#69766F]">
                                        Student
                                    </dt>
                                    <dd className="text-right text-sm font-semibold text-[#34443D]">
                                        {studentName}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-4 py-3">
                                    <dt className="text-sm text-[#69766F]">
                                        Durasi
                                    </dt>
                                    <dd className="text-sm font-semibold text-[#34443D]">
                                        {session.duration_hours ?? 0} Jam
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-4 py-3">
                                    <dt className="text-sm text-[#69766F]">
                                        Biaya
                                    </dt>
                                    <dd className="text-sm font-semibold text-[#34443D]">
                                        {session.is_free_session
                                            ? 'Gratis'
                                            : `Rp ${rupiahFormatter.format(Number(session.price_snapshot ?? 0))}`}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        {session.status === 'dikonfirmasi' && (
                            <section className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6">
                                <h2 className="text-base font-bold text-[#34443D]">
                                    Perlu Membatalkan?
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-[#69766F]">
                                    Batalkan hanya sebelum sesi dimulai. Sesi
                                    berbayar akan diajukan untuk pengembalian
                                    dana.
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsCancellationModalOpen(true)
                                    }
                                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#C23B46] bg-white px-4 py-2.5 text-sm font-bold text-[#A9343D] transition-colors hover:bg-[#FBECEE] focus:outline-none focus:ring-2 focus:ring-[#C23B46] focus:ring-offset-2"
                                >
                                    Batalkan Sesi
                                </button>
                            </section>
                        )}
                    </aside>
                </div>
            </main>

            {isCancellationModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#1D2B25]/50 p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsCancellationModalOpen(false);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-session-heading"
                        className="w-full max-w-lg rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="cancel-session-heading"
                                    className="text-lg font-bold text-[#34443D]"
                                >
                                    Batalkan Sesi?
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-[#69766F]">
                                    Tindakan ini tidak dapat dibatalkan. Mohon
                                    jelaskan alasan pembatalan.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setIsCancellationModalOpen(false)
                                }
                                aria-label="Tutup dialog pembatalan"
                                className="rounded-md p-1 text-[#78827B] hover:bg-[#F7F5F0] hover:text-[#34443D] focus:outline-none focus:ring-2 focus:ring-[#6594B1]"
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

                        <form onSubmit={cancelSession} className="mt-5">
                            <label
                                htmlFor="cancellation_reason"
                                className="block text-sm font-semibold text-[#34443D]"
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
                                className="mt-2 block w-full rounded-lg border border-[#D8D5CC] bg-white px-4 py-3 text-sm leading-6 text-[#34443D] placeholder:text-[#9AA19C] focus:border-[#6594B1] focus:outline-none focus:ring-2 focus:ring-[#6594B1]/30"
                                placeholder="Tuliskan alasan pembatalan sesi..."
                            />
                            {cancelForm.errors.cancellation_reason && (
                                <p className="mt-2 text-sm font-medium text-[#A34F45]">
                                    {cancelForm.errors.cancellation_reason}
                                </p>
                            )}
                            {!session.is_free_session && (
                                <p className="mt-3 rounded-lg bg-[#F3EFDF] px-4 py-3 text-xs leading-5 text-[#78663A]">
                                    Refund akan ditandai menunggu dengan batas
                                    waktu 48 jam.
                                </p>
                            )}
                            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsCancellationModalOpen(false)
                                    }
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#D8D5CC] bg-white px-4 py-2 text-sm font-semibold text-[#4F5C55] transition-colors hover:bg-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
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
                                        : 'Ya, Batalkan Sesi'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
