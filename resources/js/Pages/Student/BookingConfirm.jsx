import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';

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

export default function BookingConfirm({
    mentor,
    summary,
    payment_account: paymentAccount = null,
}) {
    const { errors: pageErrors = {} } = usePage().props;
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

    const fieldErrorClass = 'mt-2 text-sm font-medium text-[#A34F45]';
    const inputClass =
        'mt-2 block w-full rounded-xl border border-[#D8DED8] bg-white px-4 py-3 text-sm text-[#34443D] placeholder:text-[#A4ACA6] focus:border-[#6594B1] focus:outline-none focus:ring-2 focus:ring-[#6594B1]/25';

    return (
        <div className="min-h-screen bg-[#F7F5F0] text-[#34443D]">
            <Head title="Konfirmasi Pengajuan" />

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
                {scheduleError && (
                    <section
                        role="alert"
                        aria-labelledby="schedule-error-heading"
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#E7C7C1] bg-[#FBEEEB] px-4 py-4 text-[#8E453D] shadow-sm"
                    >
                        <div className="flex items-start gap-3">
                            <span
                                aria-hidden="true"
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/70 font-bold"
                            >
                                !
                            </span>
                            <div>
                                <h1
                                    id="schedule-error-heading"
                                    className="font-bold"
                                >
                                    Perhatian Slot Waktu
                                </h1>
                                <p className="mt-1 text-sm">
                                    {scheduleError}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={scheduleUrl}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#D9B3AC] bg-white px-4 py-2 text-sm font-semibold text-[#8E453D] transition-colors hover:bg-[#FFF8F6] focus:outline-none focus:ring-2 focus:ring-[#A34F45] focus:ring-offset-2"
                        >
                            Ganti Slot Waktu
                        </Link>
                    </section>
                )}

                <section>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                        Konfirmasi Pengajuan
                    </p>
                    <h1 className="mt-1 text-2xl font-bold leading-tight text-[#34443D] sm:text-3xl">
                        Konfirmasi Pengajuan
                    </h1>
                    <ol
                        aria-label="Tahapan pemesanan"
                        className="mt-5 grid grid-cols-3 gap-2 sm:gap-4"
                    >
                        <li className="flex items-center gap-2 text-xs font-semibold text-[#477E50] sm:text-sm">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#65B175] text-white">
                                ✓
                            </span>
                            <span>1. Dipilih</span>
                        </li>
                        <li
                            aria-current="step"
                            className="flex items-center gap-2 text-xs font-bold text-[#527D98] sm:text-sm"
                        >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6594B1] text-white">
                                2
                            </span>
                            <span>2. Diajukan</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs font-semibold text-[#9AA19C] sm:text-sm">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8E5DD] text-[#78827B]">
                                3
                            </span>
                            <span>3. Dikonfirmasi</span>
                        </li>
                    </ol>
                </section>

                <form
                    onSubmit={submitBooking}
                    className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
                >
                    <div className="space-y-6">
                        <section
                            aria-labelledby="notes-heading"
                            className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                Detail Pengajuan
                            </p>
                            <h2
                                id="notes-heading"
                                className="mt-1 text-lg font-bold text-[#34443D]"
                            >
                                Catatan untuk Mentor
                            </h2>

                            <label
                                htmlFor="notes-from-student"
                                className="mt-5 block text-sm font-semibold text-[#52635A]"
                            >
                                Catatan &amp; Harapan untuk Mentor
                                <span className="ml-1 font-normal text-[#8A938D]">
                                    (opsional)
                                </span>
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
                                placeholder="Ceritakan hal yang ingin dipelajari atau dibahas bersama mentor."
                                aria-invalid={Boolean(
                                    form.errors.notes_from_student,
                                )}
                                aria-describedby={
                                    form.errors.notes_from_student
                                        ? 'notes-error'
                                        : undefined
                                }
                                className={inputClass}
                            />
                            {form.errors.notes_from_student && (
                                <p
                                    id="notes-error"
                                    className={fieldErrorClass}
                                >
                                    {form.errors.notes_from_student}
                                </p>
                            )}
                        </section>

                        {summary.is_free_session ? (
                            <section className="flex items-start gap-3 rounded-2xl border border-[#CFE2D0] bg-[#E8F2E8] p-5 text-[#477E50]">
                                <span
                                    aria-hidden="true"
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 font-bold"
                                >
                                    ✓
                                </span>
                                <div>
                                    <h2 className="font-bold">
                                        Sesi gratis, tanpa DP
                                    </h2>
                                    <p className="mt-1 text-sm leading-6">
                                        Tidak perlu mengunggah bukti pembayaran
                                        untuk sesi ini.
                                    </p>
                                </div>
                            </section>
                        ) : (
                            <section
                                aria-labelledby="payment-heading"
                                className="space-y-5 rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                            >
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                        Pembayaran
                                    </p>
                                    <h2
                                        id="payment-heading"
                                        className="mt-1 text-lg font-bold text-[#34443D]"
                                    >
                                        Pembayaran DP
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-[#69766F]">
                                        DP ditransfer langsung ke rekening
                                        mentor.
                                    </p>
                                </div>

                                <dl className="space-y-3 rounded-xl bg-[#F7F5F0] p-4">
                                    <div className="flex items-center justify-between gap-4 text-sm">
                                        <dt className="text-[#69766F]">
                                            Total tarif
                                        </dt>
                                        <dd className="font-semibold text-[#34443D]">
                                            {formatRupiah(summary.total_price)}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 border-t border-[#E1E5E0] pt-3">
                                        <dt className="font-semibold text-[#52635A]">
                                            DP yang harus dibayar
                                        </dt>
                                        <dd className="text-lg font-bold text-[#34443D]">
                                            {formatRupiah(summary.dp_amount)}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="rounded-xl border border-[#E8E5DD] bg-[#FCFBF8] p-4">
                                    <h3 className="text-sm font-bold text-[#34443D]">
                                        Rekening mentor
                                    </h3>
                                    {paymentAccount?.bank_name &&
                                    paymentAccount?.account_number &&
                                    paymentAccount?.account_holder ? (
                                        <dl className="mt-3 space-y-3 text-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <dt className="text-[#78827B]">
                                                    Bank
                                                </dt>
                                                <dd className="text-right font-semibold text-[#34443D]">
                                                    {paymentAccount.bank_name}
                                                </dd>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <dt className="text-[#78827B]">
                                                        Nomor rekening
                                                    </dt>
                                                    <dd className="mt-1 font-semibold text-[#34443D]">
                                                        {
                                                            paymentAccount.account_number
                                                        }
                                                    </dd>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        copyAccountNumber
                                                    }
                                                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#C9D9E1] bg-white px-3 py-1.5 text-xs font-bold text-[#527D98] transition-colors hover:bg-[#F2F7F9] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                                >
                                                    Salin
                                                </button>
                                            </div>
                                            <div className="flex items-start justify-between gap-4">
                                                <dt className="text-[#78827B]">
                                                    Atas nama
                                                </dt>
                                                <dd className="text-right font-semibold text-[#34443D]">
                                                    {
                                                        paymentAccount.account_holder
                                                    }
                                                </dd>
                                            </div>
                                        </dl>
                                    ) : (
                                        <p className="mt-2 rounded-lg bg-[#F7F5F0] px-3 py-3 text-sm leading-6 text-[#69766F]">
                                            Transfer DP langsung ke rekening
                                            mentor. Detail rekening mentor akan
                                            ditampilkan di sini.
                                        </p>
                                    )}
                                    {copyMessage && (
                                        <p
                                            role="status"
                                            className="mt-3 text-xs font-medium text-[#477E50]"
                                        >
                                            {copyMessage}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="payment-dp-proof"
                                        className="block text-sm font-semibold text-[#52635A]"
                                    >
                                        Bukti transfer
                                        <span className="ml-1 text-[#A34F45]">
                                            *
                                        </span>
                                    </label>
                                    <p
                                        id="payment-proof-help"
                                        className="mt-1 text-xs text-[#78827B]"
                                    >
                                        JPG atau PNG, maksimal 5 MB.
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        id="payment-dp-proof"
                                        name="payment_dp_proof"
                                        type="file"
                                        accept="image/png,image/jpeg"
                                        required
                                        aria-describedby={
                                            form.errors.payment_dp_proof ||
                                            fileError
                                                ? 'payment-proof-help payment-proof-error'
                                                : 'payment-proof-help'
                                        }
                                        aria-invalid={Boolean(
                                            form.errors.payment_dp_proof ||
                                            fileError,
                                        )}
                                        onChange={selectPaymentProof}
                                        className="mt-3 block w-full cursor-pointer rounded-xl border border-[#D8DED8] bg-white text-sm text-[#52635A] file:mr-4 file:cursor-pointer file:border-0 file:bg-[#E7EEF1] file:px-4 file:py-3 file:font-semibold file:text-[#527D98] hover:file:bg-[#DCE8ED] focus:outline-none focus:ring-2 focus:ring-[#6594B1]"
                                    />
                                    {selectedFile && !fileError && (
                                        <p className="mt-2 break-all text-sm text-[#52635A]">
                                            File dipilih: {selectedFile.name}
                                        </p>
                                    )}
                                    {(fileError ||
                                        form.errors.payment_dp_proof) && (
                                        <p
                                            id="payment-proof-error"
                                            className={fieldErrorClass}
                                        >
                                            {fileError ||
                                                form.errors.payment_dp_proof}
                                        </p>
                                    )}
                                </div>
                            </section>
                        )}

                        

                        <div className="flex items-start gap-3 rounded-xl border border-[#E8E5DD] bg-white p-4">
                            <input
                                id="agree-to-code"
                                type="checkbox"
                                checked={agreedToCode}
                                onChange={(event) =>
                                    setAgreedToCode(event.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 rounded border-[#B9C2BB] text-[#6594B1] focus:ring-[#6594B1]"
                            />
                            <label
                                htmlFor="agree-to-code"
                                className="text-sm leading-6 text-[#52635A]"
                            >
                                Saya menyetujui kode etik mentoring Pathway
                            </label>
                        </div>
                    </div>

                    <aside
                        aria-labelledby="summary-heading"
                        className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.06)] sm:p-6 lg:sticky lg:top-6"
                    >
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                            Ringkasan
                        </p>
                        <h2
                            id="summary-heading"
                            className="mt-1 text-lg font-bold text-[#34443D]"
                        >
                            Ringkasan Pemesanan
                        </h2>

                        <dl className="mt-5 space-y-4 text-sm">
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-[#78827B]">Mentor</dt>
                                <dd className="text-right font-semibold text-[#34443D]">
                                    {mentor.name}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-[#78827B]">Tanggal</dt>
                                <dd className="text-right font-semibold capitalize text-[#34443D]">
                                    {formatDate(summary.date)}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-[#78827B]">Jam</dt>
                                <dd className="text-right font-semibold text-[#34443D]">
                                    {summary.start} - {summary.end} WIB
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-[#78827B]">Durasi</dt>
                                <dd className="text-right font-semibold text-[#34443D]">
                                    {summary.duration_hours} jam
                                </dd>
                            </div>
                            <div className="border-t border-dashed border-[#E1E5E0] pt-4">
                                <div className="flex items-start justify-between gap-4">
                                    <dt className="text-[#78827B]">
                                        Rincian harga
                                    </dt>
                                    <dd className="text-right font-semibold text-[#34443D]">
                                        {summary.is_free_session
                                            ? 'Gratis'
                                            : summary.price_per_hour === null
                                              ? formatRupiah(summary.total_price)
                                              : `${formatRupiah(summary.price_per_hour)} x ${summary.duration_hours} jam`}
                                    </dd>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <dt className="font-semibold text-[#52635A]">
                                    Total
                                </dt>
                                <dd className="text-lg font-bold text-[#34443D]">
                                    {summary.is_free_session
                                        ? 'Gratis'
                                        : formatRupiah(summary.total_price)}
                                </dd>
                            </div>
                            <div
                                className={`flex items-center justify-between gap-4 rounded-xl px-3 py-3 ${
                                    summary.is_free_session
                                        ? 'bg-[#E8F2E8]'
                                        : 'bg-[#F7F5F0]'
                                }`}
                            >
                                <dt
                                    className={`font-medium ${
                                        summary.is_free_session
                                            ? 'text-[#477E50]'
                                            : 'text-[#69766F]'
                                    }`}
                                >
                                    DP 50%
                                </dt>
                                <dd
                                    className={`font-bold ${
                                        summary.is_free_session
                                            ? 'text-[#477E50]'
                                            : 'text-[#34443D]'
                                    }`}
                                >
                                    {summary.is_free_session
                                        ? 'Tanpa DP'
                                        : formatRupiah(summary.dp_amount)}
                                </dd>
                            </div>
                        </dl>

                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#6594B1] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#C8D5DB] disabled:text-white/80"
                        >
                            {form.processing
                                ? 'Mengajukan...'
                                : 'Ajukan Booking'}
                        </button>
                        <Link
                            href={scheduleUrl}
                            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#D8DED8] bg-white px-5 py-2.5 text-sm font-semibold text-[#52635A] transition-colors hover:bg-[#F7F5F0] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                        >
                            Batal / Kembali
                        </Link>
                    </aside>
                </form>
            </main>
        </div>
    );
}
