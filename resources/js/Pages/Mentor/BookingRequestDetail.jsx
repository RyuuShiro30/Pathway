import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Badge, Button, Card, SectionHeader } from "@/Components/ui";

const sessionDateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
});

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
});

function formatSessionDateTime(value) {
    if (!value) {
        return "Waktu tidak tersedia";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Waktu tidak tersedia"
        : `${sessionDateTimeFormatter.format(date)} WIB`;
}

function formatRupiah(value) {
    return `Rp ${rupiahFormatter.format(Number(value ?? 0))}`;
}

function formatStatus(status) {
    const labels = {
        diajukan: "Menunggu Verifikasi Mentor",
        dikonfirmasi: "Dikonfirmasi",
        berlangsung: "Berlangsung",
        selesai: "Selesai",
        dibatalkan: "Dibatalkan",
    };

    return labels[status] ?? status ?? "Status tidak tersedia";
}

export default function BookingRequestDetail({ session }) {
    const { auth, errors: pageErrors, flash } = usePage().props;
    const form = useForm({ action: "terima" });
    const rescheduleForm = useForm({
        action: "terima",
        rejection_reason: "",
    });
    const mentorName = auth?.user?.name ?? "Mentor";
    const mentorInitials =
        mentorName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "M";
    const totalPrice = Number(session.price_snapshot ?? 0);
    const dpAmount = totalPrice * 0.5;
    const proofPath = session.payment_dp_proof
        ? String(session.payment_dp_proof).replace(/^\/+/, "")
        : null;
    const proofUrl = proofPath
        ? `/storage/${proofPath
              .split("/")
              .map((segment) => encodeURIComponent(segment))
              .join("/")}`
        : null;
    const backendError =
        flash?.error ??
        pageErrors?.message ??
        Object.values(form.errors).find(Boolean);
    const isPending = session.status === "diajukan";
    const rescheduleRequests =
        session.reschedule_requests ?? session.rescheduleRequests ?? [];

    const latestRescheduleRequest = rescheduleRequests[0] ?? null;

    function respondToBooking(action) {
        if (
            action === "tolak" &&
            !window.confirm(
                "Apakah Anda yakin ingin menolak permintaan booking ini?",
            )
        ) {
            return;
        }

        form.transform(() => ({ action }));
        form.patch(route("mentor.booking.respond", session.id), {
            preserveScroll: true,
        });

        function respondToReschedule(requestId, action) {
            if (
                action === "tolak" &&
                !window.confirm(
                    "Apakah Anda yakin ingin menolak pengajuan reschedule ini?",
                )
            ) {
                return;
            }

            let rejectionReason = "";

            if (action === "tolak") {
                rejectionReason =
                    window.prompt("Alasan penolakan (opsional):") ?? "";
            }

            rescheduleForm.transform(() => ({
                action,
                rejection_reason: rejectionReason,
            }));

            rescheduleForm.patch(
                route("mentor.booking.reschedule.respond", requestId),
                {
                    preserveScroll: true,
                },
            );
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#527D98]/20 selection:text-[#527D98]">
            <Head title="Detail Permintaan Booking" />

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
                            href={route("mentor.dashboard")}
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
                                {mentorInitials}
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="max-w-[130px] truncate text-xs font-semibold leading-tight text-white">
                                    {mentorName}
                                </p>
                                <p className="truncate text-[10px] text-white/75">
                                    Mentor
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* Breadcrumb & Back */}
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href={route("mentor.dashboard")}
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
                            Kembali ke Permintaan Bimbingan
                        </Link>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#527D98]">
                            Portal Mentor &gt; Permintaan Bimbingan
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                            Detail Permintaan Booking
                        </h1>
                        <Badge
                            variant={
                                session.status === "diajukan"
                                    ? "warning"
                                    : session.status === "dikonfirmasi"
                                      ? "success"
                                      : session.status === "dibatalkan"
                                        ? "danger"
                                        : "default"
                            }
                            size="md"
                        >
                            {formatStatus(session.status)}
                        </Badge>
                    </div>
                </div>

                {/* Pesan error/flash */}
                {backendError && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm"
                    >
                        <svg
                            aria-hidden="true"
                            className="mt-0.5 h-4 w-4 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v4m0 4h.01" />
                        </svg>
                        <span>{backendError}</span>
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-5 lg:items-start">
                    <div className="space-y-5 lg:col-span-3">
                        <Card
                            as="section"
                            aria-labelledby="student-heading"
                            className="p-5 sm:p-6"
                        >
                            <SectionHeader
                                title="Informasi Student"
                                icon={
                                    <svg
                                        aria-hidden="true"
                                        className="h-5 w-5 text-[#527D98]"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                }
                            />
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-100 text-lg font-bold text-sky-700">
                                    {(session.student?.name ?? "S")
                                        .trim()
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((part) => part[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2
                                            id="student-heading"
                                            className="break-words text-base font-bold text-slate-900"
                                        >
                                            {session.student?.name ?? "Student"}
                                        </h2>
                                        <Badge variant="success" size="xs">
                                            Mentee Terverifikasi
                                        </Badge>
                                    </div>
                                    <p className="mt-1 break-all text-sm text-slate-500">
                                        {session.student?.email ??
                                            "Email tidak tersedia"}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card
                            as="section"
                            aria-labelledby="payment-heading"
                            className="p-5 sm:p-6"
                        >
                            {session.is_free_session ? (
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2
                                            id="payment-heading"
                                            className="text-sm font-bold text-slate-900"
                                        >
                                            Informasi Pembayaran
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Sesi ini tidak dikenakan biaya.
                                        </p>
                                    </div>
                                    <Badge variant="success" size="md">
                                        Gratis
                                    </Badge>
                                </div>
                            ) : (
                                <>
                                    <SectionHeader
                                        title="Rincian Pembayaran & DP 50%"
                                        icon={
                                            <svg
                                                aria-hidden="true"
                                                className="h-5 w-5 text-[#527D98]"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                            >
                                                <rect
                                                    x="2"
                                                    y="5"
                                                    width="20"
                                                    height="14"
                                                    rx="2"
                                                />
                                                <path d="M2 10h20" />
                                            </svg>
                                        }
                                        badge={
                                            <Badge
                                                variant={
                                                    session.payment_dp_status ===
                                                    "terverifikasi"
                                                        ? "success"
                                                        : "warningBold"
                                                }
                                                size="xs"
                                            >
                                                {session.payment_dp_status ===
                                                "terverifikasi"
                                                    ? "Terverifikasi"
                                                    : "Perlu Verifikasi"}
                                            </Badge>
                                        }
                                    />

                                    <div className="mt-1 grid gap-5 sm:grid-cols-2">
                                        {/* Kolom kiri: ringkasan biaya */}
                                        <div className="space-y-3">
                                            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>Tarif Mentor</span>
                                                    <span className="font-medium text-slate-700">
                                                        {formatRupiah(
                                                            session.price_per_hour_snapshot ??
                                                                totalPrice /
                                                                    (session.duration_hours ||
                                                                        1),
                                                        )}{" "}
                                                        / jam
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>Durasi Sesi</span>
                                                    <span className="font-medium text-slate-700">
                                                        {session.duration_hours ??
                                                            "-"}{" "}
                                                        Jam
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                                                    <span>
                                                        Total Biaya Sesi
                                                    </span>
                                                    <span>
                                                        {formatRupiah(
                                                            totalPrice,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                                <p className="text-xs font-semibold text-emerald-700">
                                                    DP Wajib (50%)
                                                </p>
                                                <p className="mt-1 text-xl font-extrabold text-emerald-800">
                                                    {formatRupiah(dpAmount)}
                                                </p>
                                                <p className="mt-1 text-[11px] text-emerald-600">
                                                    Telah ditransfer ke rekening
                                                    Bank Mandiri pribadi Anda.
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs">
                                                <span className="text-slate-500">
                                                    Sisa Pelunasan:
                                                </span>
                                                <span className="font-bold text-slate-800">
                                                    {formatRupiah(dpAmount)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Kolom kanan: bukti transfer */}
                                        <div>
                                            <p className="mb-2 text-xs font-semibold text-slate-600">
                                                Bukti Transfer Bank Mandiri
                                            </p>
                                            {proofUrl ? (
                                                <a
                                                    href={proofUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#527D98] focus:ring-offset-2"
                                                    aria-label="Buka bukti pembayaran DP di tab baru"
                                                >
                                                    <img
                                                        src={proofUrl}
                                                        alt="Bukti pembayaran DP dari student"
                                                        className="h-52 w-full object-contain transition-transform group-hover:scale-[1.02]"
                                                    />
                                                    <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 py-2 text-xs font-semibold text-[#527D98]">
                                                        <svg
                                                            aria-hidden="true"
                                                            className="h-3.5 w-3.5"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                            <polyline points="15 3 21 3 21 9" />
                                                            <line
                                                                x1="10"
                                                                y1="14"
                                                                x2="21"
                                                                y2="3"
                                                            />
                                                        </svg>
                                                        Lihat Penuh
                                                    </div>
                                                </a>
                                            ) : (
                                                <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm text-slate-400">
                                                    Bukti pembayaran belum
                                                    tersedia.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-5 lg:col-span-2">
                        <Card
                            as="section"
                            aria-labelledby="session-heading"
                            className="p-5 sm:p-6"
                        >
                            <SectionHeader
                                title="Jadwal & Waktu Sesi"
                                icon={
                                    <svg
                                        aria-hidden="true"
                                        className="h-5 w-5 text-[#527D98]"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <rect
                                            x="3"
                                            y="5"
                                            width="18"
                                            height="16"
                                            rx="2"
                                        />
                                        <path d="M16 3v4M8 3v4M3 10h18" />
                                    </svg>
                                }
                            />

                            <div className="space-y-3">
                                {/* Tanggal sesi */}
                                <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Tanggal Sesi
                                    </p>
                                    <p className="mt-1 text-sm font-bold capitalize text-slate-900">
                                        {formatSessionDateTime(
                                            session.schedule_time,
                                        )}
                                    </p>
                                </div>

                                {/* Jam mulai & durasi */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Waktu Selesai
                                        </p>
                                        <p className="mt-1 text-sm font-bold capitalize text-slate-900">
                                            {formatSessionDateTime(
                                                session.end_time,
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                            Durasi Total
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-emerald-800">
                                            {session.duration_hours ?? "-"} Jam
                                        </p>
                                    </div>
                                </div>

                                {/* Tipe sesi */}
                                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                    <p className="text-xs font-semibold text-slate-500">
                                        Tipe Sesi &amp; Platform
                                    </p>
                                    <Badge
                                        variant={
                                            session.is_free_session
                                                ? "success"
                                                : "primary"
                                        }
                                        size="sm"
                                    >
                                        {session.is_free_session
                                            ? "Gratis"
                                            : "Berbayar"}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        {latestRescheduleRequest && (
                            <Card
                                as="section"
                                aria-labelledby="reschedule-heading"
                                className="p-5 sm:p-6"
                            >
                                <SectionHeader
                                    title="Pengajuan Reschedule"
                                    icon={
                                        <svg
                                            aria-hidden="true"
                                            className="h-5 w-5 text-[#527D98]"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                        >
                                            <path d="M3 12a9 9 0 0 1 15.36-6.36L21 8" />
                                            <path d="M21 3v5h-5" />
                                            <path d="M21 12a9 9 0 0 1-15.36 6.36L3 16" />
                                            <path d="M3 21v-5h5" />
                                        </svg>
                                    }
                                />

                                <div className="space-y-3">
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Jadwal Lama
                                        </p>
                                        <p className="mt-1 text-sm font-bold capitalize text-slate-900">
                                            {formatSessionDateTime(
                                                latestRescheduleRequest.old_schedule_time,
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Jadwal Baru
                                        </p>
                                        <p className="mt-1 text-sm font-bold capitalize text-slate-900">
                                            {formatSessionDateTime(
                                                latestRescheduleRequest.new_schedule_time,
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                        <p className="text-xs font-semibold text-slate-500">
                                            Batas Respons
                                        </p>
                                        <p className="text-xs font-bold text-slate-700">
                                            {formatSessionDateTime(
                                                latestRescheduleRequest.respond_deadline,
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-slate-500">
                                            Status
                                        </p>

                                        <Badge
                                            variant={
                                                latestRescheduleRequest.status ===
                                                "menunggu_respons"
                                                    ? "warning"
                                                    : latestRescheduleRequest.status ===
                                                        "diterima"
                                                      ? "success"
                                                      : "danger"
                                            }
                                            size="sm"
                                        >
                                            {latestRescheduleRequest.status ===
                                            "menunggu_respons"
                                                ? "Menunggu Respons"
                                                : latestRescheduleRequest.status ===
                                                    "diterima"
                                                  ? "Diterima"
                                                  : latestRescheduleRequest.status ===
                                                      "ditolak"
                                                    ? "Ditolak"
                                                    : "Kedaluwarsa"}
                                        </Badge>
                                    </div>

                                    {latestRescheduleRequest.rejection_reason && (
                                        <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                                                Alasan Penolakan
                                            </p>
                                            <p className="mt-1 text-sm text-red-700">
                                                {
                                                    latestRescheduleRequest.rejection_reason
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {latestRescheduleRequest.status ===
                                        "menunggu_respons" && (
                                        <>
                                            {rescheduleForm.errors
                                                .reschedule && (
                                                <p className="text-sm font-medium text-red-600">
                                                    {
                                                        rescheduleForm.errors
                                                            .reschedule
                                                    }
                                                </p>
                                            )}

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        respondToReschedule(
                                                            latestRescheduleRequest.id,
                                                            "terima",
                                                        )
                                                    }
                                                    disabled={
                                                        rescheduleForm.processing
                                                    }
                                                    variant="primary"
                                                    size="md"
                                                    className="min-h-11 rounded-xl bg-[#65B175] text-sm font-bold hover:bg-[#559C65] focus:ring-[#65B175] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {rescheduleForm.processing
                                                        ? "Memproses..."
                                                        : "Terima Reschedule"}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    onClick={() =>
                                                        respondToReschedule(
                                                            latestRescheduleRequest.id,
                                                            "tolak",
                                                        )
                                                    }
                                                    disabled={
                                                        rescheduleForm.processing
                                                    }
                                                    variant="danger"
                                                    size="md"
                                                    className="min-h-11 rounded-xl border-0 bg-[#FBECEE] text-sm font-bold text-[#C23B46] shadow-none hover:bg-[#F6DDE1] focus:ring-[#C23B46] disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    Tolak Reschedule
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>
                        )}

                        <Card
                            as="section"
                            aria-labelledby="notes-heading"
                            className="p-5 sm:p-6"
                        >
                            <SectionHeader
                                title="Topik & Kebutuhan"
                                icon={
                                    <svg
                                        aria-hidden="true"
                                        className="h-5 w-5 text-[#527D98]"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                }
                            />
                            <blockquote className="whitespace-pre-line rounded-xl border border-sky-100 bg-sky-50/40 p-4 text-sm leading-6 text-slate-700 italic">
                                {session.notes_from_student?.trim() ||
                                    "Tidak ada catatan dari student."}
                            </blockquote>
                        </Card>
                    </div>
                </div>

                <Card
                    as="section"
                    aria-label="Tindakan permintaan booking"
                    className="overflow-hidden"
                >
                    {/* Sticky action bar bergaya Figma */}
                    <div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
                        <Button
                            type="button"
                            onClick={() => respondToBooking("terima")}
                            disabled={form.processing || !isPending}
                            variant="primary"
                            size="md"
                            className="min-h-12 gap-2 rounded-xl bg-[#65B175] text-sm font-bold hover:bg-[#559C65] focus:ring-[#65B175] disabled:cursor-not-allowed disabled:opacity-60"
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
                                ? "Memproses..."
                                : "Verifikasi & Terima Permintaan"}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => respondToBooking("tolak")}
                            disabled={form.processing || !isPending}
                            variant="danger"
                            size="md"
                            className="min-h-12 gap-2 rounded-xl border-0 bg-[#FBECEE] text-sm font-bold text-[#C23B46] shadow-none hover:bg-[#F6DDE1] focus:ring-[#C23B46] disabled:cursor-not-allowed disabled:opacity-60"
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
                        </Button>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:px-6">
                        <p className="text-xs leading-5 text-slate-500">
                            Dengan menerima permintaan, sesi akan dikonfirmasi
                            sesuai jadwal di atas. Jika status booking sudah
                            berubah, tindakan tidak dapat dilakukan.
                        </p>
                    </div>
                </Card>
            </main>
        </div>
    );
}
