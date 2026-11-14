import { useMemo, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";

const DAY_NAMES = [
    "minggu",
    "senin",
    "selasa",
    "rabu",
    "kamis",
    "jumat",
    "sabtu",
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
});

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
});

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function dateFromKey(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function minutes(time) {
    if (!time) return null;

    const [hour, minute] = time.split(":").map(Number);

    if (
        !Number.isInteger(hour) ||
        !Number.isInteger(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
    ) {
        return null;
    }

    return hour * 60 + minute;
}

function timeString(value) {
    const hour = Math.floor(value / 60);
    const minute = value % 60;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatDateTime(value) {
    if (!value) return "Waktu tidak tersedia";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Waktu tidak tersedia";
    }

    return `${dateFormatter.format(date)} WIB`;
}

function formatRupiah(value) {
    return `Rp ${rupiahFormatter.format(Number(value ?? 0))}`;
}

function getInitials(name) {
    return (
        String(name ?? "User")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "U"
    );
}

function checkSlot({
    date,
    start,
    duration,
    availability,
    busySessions,
    isFree,
    totalPrice,
}) {
    const day = DAY_NAMES[dateFromKey(date).getDay()];
    let calculatedPrice = 0;

    for (let hour = 0; hour < duration; hour++) {
        const hourStart = start + hour * 60;
        const hourEnd = hourStart + 60;

        const matching = availability.find((slot) => {
            const slotStart = minutes(slot.start);
            const slotEnd = minutes(slot.end);

            return (
                slot.day === day &&
                slotStart !== null &&
                slotEnd !== null &&
                slotStart <= hourStart &&
                slotEnd >= hourEnd &&
                (slot.type ?? "gratis") === (isFree ? "gratis" : "berbayar")
            );
        });

        if (!matching) return false;

        calculatedPrice += isFree ? 0 : Number(matching.price ?? 0);
    }

    if (calculatedPrice !== totalPrice) return false;

    const candidateStart = new Date(`${date}T${timeString(start)}:00+07:00`);

    if (candidateStart <= new Date()) return false;

    const candidateEnd = new Date(
        candidateStart.getTime() + duration * 60 * 60 * 1000,
    );

    return !busySessions.some((session) => {
        const busyStart = new Date(session.schedule_time);
        const busyEnd = new Date(session.end_time);

        return candidateStart < busyEnd && candidateEnd > busyStart;
    });
}

function Icon({ children, className = "h-5 w-5" }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {children}
        </svg>
    );
}

function InfoItem({ label, children }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
            </p>
            <div className="mt-1.5 text-sm font-semibold leading-5 text-slate-800">
                {children}
            </div>
        </div>
    );
}

export default function RescheduleOffer({
    session,
    mentor,
    busy_sessions = [],
    booking_window,
}) {
    const { auth } = usePage().props;

    const duration = Number(session.duration_hours ?? 1);
    const isFree = Boolean(session.is_free_session);
    const totalPrice = Number(session.price_snapshot ?? 0);
    const availability = mentor?.availability_schedule ?? [];

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [calendarOffset, setCalendarOffset] = useState(0);

    const form = useForm({
        schedule_time: "",
        reason: "",
    });

    const firstDate = dateFromKey(booking_window.from);
    const lastDate = dateFromKey(booking_window.until);

    const totalDays =
        Math.floor((lastDate - firstDate) / (24 * 60 * 60 * 1000)) + 1;

    function getSlots(date) {
        const day = DAY_NAMES[dateFromKey(date).getDay()];

        const starts = [
            ...new Set(
                availability
                    .filter((slot) => slot.day === day)
                    .flatMap((slot) => {
                        const start = minutes(slot.start);
                        const end = minutes(slot.end);

                        if (start === null || end === null) return [];

                        const result = [];

                        // Ambil kandidat jam dari setiap slot.
                        // Validasi durasi dilakukan oleh checkSlot().
                        for (let time = start; time + 60 <= end; time += 60) {
                            result.push(time);
                        }

                        return result;
                    }),
            ),
        ].sort((a, b) => a - b);

        return starts.map((start) => ({
            start: timeString(start),
            end: timeString(start + duration * 60),
            available: checkSlot({
                date,
                start,
                duration,
                availability,
                busySessions: busy_sessions,
                isFree,
                totalPrice,
            }),
        }));
    }

    const calendarDays = useMemo(() => {
        return Array.from({ length: totalDays }, (_, index) => {
            const date = new Date(firstDate);
            date.setDate(date.getDate() + index);

            const key = dateKey(date);
            const hasAvailable = getSlots(key).some((slot) => slot.available);

            return {
                date: key,
                day: DAY_NAMES[date.getDay()],
                number: date.getDate(),
                month: date.toLocaleDateString("id-ID", {
                    month: "short",
                }),
                hasAvailable,
            };
        });
    }, [
        booking_window.from,
        booking_window.until,
        availability,
        busy_sessions,
        duration,
        isFree,
        totalPrice,
    ]);

    const visibleDays = calendarDays.slice(calendarOffset, calendarOffset + 5);

    const timeSlots = selectedDate ? getSlots(selectedDate) : [];

    const selectedSlot = timeSlots.find(
        (slot) => slot.start === selectedTime && slot.available,
    );

    const mentorName = auth?.user?.name ?? "Mentor";
    const student = session.student ?? {};
    const studentName = student.name ?? "Student";

    const oldSchedule = formatDateTime(session.schedule_time);

    function selectDate(date) {
        setSelectedDate(date);
        setSelectedTime("");
        form.clearErrors("schedule_time");
    }

    function submitOffer() {
        if (!selectedDate || !selectedTime || !selectedSlot) {
            form.setError(
                "schedule_time",
                "Pilih tanggal dan jam yang tersedia terlebih dahulu.",
            );
            return;
        }

        form.clearErrors();

        form.transform((data) => ({
            schedule_time: `${selectedDate}T${selectedTime}:00+07:00`,
            reason: data.reason.trim() || null,
        }));

        form.post(route("mentor.refund.reschedule-offer", session.id), {
            preserveScroll: true,
            onError: (errors) => {
                console.error("Gagal mengirim tawaran:", errors);
            },
        });
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased">
            <Head title="Tawarkan Jadwal Pengganti" />

            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-[#548299] text-white shadow-md">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl font-extrabold">
                            P
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tight">
                                Pathway
                            </span>
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider">
                                MENTOR
                            </span>
                        </div>
                    </div>

                    <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
                        <Link
                            href={route("mentor.dashboard")}
                            className="rounded-full px-4 py-2 text-white/80 transition hover:bg-white/10 hover:text-white"
                        >
                            Overview
                        </Link>
                        <span className="rounded-full px-4 py-2 text-white/80">
                            Mentors Directory
                        </span>
                        <span className="rounded-full px-4 py-2 text-white/80">
                            Mentees & Students
                        </span>
                    </nav>

                    <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5ECDD] text-xs font-bold text-[#34443D]">
                            {getInitials(mentorName)}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-semibold">
                                {mentorName}
                            </p>
                            <p className="text-[10px] text-white/75">Mentor</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* BREADCRUMB */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={route("mentor.dashboard")}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                        <Icon className="h-3.5 w-3.5">
                            <path d="m15 18-6-6 6-6" />
                            <path d="M20 12H9" />
                        </Icon>
                        Kembali ke Proses Refund
                    </Link>

                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#527D98]">
                        Portal Mentor &gt; Jadwal Pengganti
                    </p>
                </div>

                {/* TITLE */}
                <section className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {isFree
                                ? "Alternatif Jadwal - Sesi Gratis"
                                : "Alternatif Refund - Sesi Berbayar"}
                        </div>

                        <h1 className="text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                            Tawarkan Jadwal Pengganti
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            Sebagai alternatif dari pengembalian dana penuh,
                            tawarkan slot jadwal pengganti langsung kepada
                            mentee.
                        </p>
                    </div>
                </section>

                {/* MAIN GRID */}
                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
                    {/* LEFT COLUMN */}
                    <div className="min-w-0 space-y-5">
                        {/* CALENDAR */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                                        <Icon className="h-4 w-4 text-[#527D98]">
                                            <rect
                                                x="3"
                                                y="5"
                                                width="18"
                                                height="16"
                                                rx="2"
                                            />
                                            <path d="M16 3v4M8 3v4M3 10h18" />
                                        </Icon>
                                        Pilih Jadwal Pengganti dari Slot Anda
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Pilih slot sesuai durasi sesi awal. Slot
                                        diambil dari jadwal mingguan yang aktif
                                        di profil Anda.
                                    </p>
                                </div>

                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                                    {duration} jam per sesi
                                </span>
                            </div>

                            {/* WEEK NAVIGATION */}
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    disabled={calendarOffset === 0}
                                    onClick={() =>
                                        setCalendarOffset((value) =>
                                            Math.max(0, value - 5),
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#527D98] hover:text-[#527D98] disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="Tanggal sebelumnya"
                                >
                                    ←
                                </button>

                                <p className="text-xs font-medium text-slate-500">
                                    {calendarOffset + 1}–
                                    {Math.min(calendarOffset + 5, totalDays)}{" "}
                                    dari {totalDays} tanggal
                                </p>

                                <button
                                    type="button"
                                    disabled={calendarOffset + 5 >= totalDays}
                                    onClick={() =>
                                        setCalendarOffset((value) =>
                                            Math.min(value + 5, totalDays - 1),
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#527D98] hover:text-[#527D98] disabled:cursor-not-allowed disabled:opacity-30"
                                    aria-label="Tanggal berikutnya"
                                >
                                    →
                                </button>
                            </div>

                            {/* DATE OPTIONS */}
                            <div className="mt-3 grid grid-cols-5 gap-2">
                                {visibleDays.map((day) => (
                                    <button
                                        key={day.date}
                                        type="button"
                                        disabled={!day.hasAvailable}
                                        onClick={() => selectDate(day.date)}
                                        className={`flex min-h-[104px] flex-col items-center justify-center rounded-xl border px-1 py-3 text-center transition ${
                                            selectedDate === day.date
                                                ? "border-[#527D98] bg-[#527D98] text-white shadow-sm"
                                                : day.hasAvailable
                                                  ? "border-slate-200 bg-white text-slate-700 hover:border-[#527D98] hover:bg-sky-50"
                                                  : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                                        }`}
                                    >
                                        <span className="text-[10px] capitalize">
                                            {day.day}
                                        </span>
                                        <span className="mt-0.5 text-xl font-extrabold">
                                            {day.number}
                                        </span>
                                        <span className="text-[10px]">
                                            {day.month}
                                        </span>
                                        <span className="mt-1 text-[9px] font-semibold">
                                            {day.hasAvailable
                                                ? "Tersedia"
                                                : "Penuh"}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-sm bg-[#527D98]" />
                                    Slot dipilih
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-white" />
                                    Tersedia di profil Anda
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
                                    Tidak tersedia
                                </span>
                            </div>
                        </section>

                        {/* TIME SLOTS */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                                <Icon className="h-4 w-4 text-[#527D98]">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 7v5l3 2" />
                                </Icon>
                                Pilih Jam Mentoring
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Durasi dan jenis sesi mengikuti sesi sebelumnya.
                                Zona waktu WIB.
                            </p>

                            {!selectedDate ? (
                                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                                    <p className="text-sm font-medium text-slate-500">
                                        Pilih tanggal terlebih dahulu.
                                    </p>
                                </div>
                            ) : timeSlots.length === 0 ? (
                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                    Tidak ada slot jadwal pada tanggal ini.
                                </div>
                            ) : (
                                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {timeSlots.map((slot) => (
                                        <button
                                            key={slot.start}
                                            type="button"
                                            disabled={!slot.available}
                                            onClick={() => {
                                                setSelectedTime(slot.start);
                                                form.clearErrors(
                                                    "schedule_time",
                                                );
                                            }}
                                            className={`min-h-[58px] rounded-xl border px-3 py-2 text-center transition ${
                                                selectedTime === slot.start &&
                                                slot.available
                                                    ? "border-[#527D98] bg-[#527D98] text-white shadow-sm"
                                                    : slot.available
                                                      ? "border-slate-200 bg-white text-slate-700 hover:border-[#527D98] hover:bg-sky-50"
                                                      : "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            <span className="block text-xs font-bold">
                                                {slot.start} – {slot.end}
                                            </span>
                                            <span className="mt-1 block text-[10px]">
                                                {slot.available
                                                    ? "Tersedia"
                                                    : "Tidak tersedia"}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {form.errors.schedule_time && (
                                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                                    {form.errors.schedule_time}
                                </p>
                            )}
                        </section>

                        {/* REASON */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-extrabold text-slate-900">
                                    Pesan untuk Mentee
                                </h2>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                                    Opsional
                                </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                                Pesan ini akan ditampilkan otomatis ke mentee.
                            </p>

                            <textarea
                                value={form.data.reason}
                                onChange={(event) =>
                                    form.setData("reason", event.target.value)
                                }
                                maxLength={300}
                                rows={4}
                                placeholder="Halo Fiona, mohon maaf atas pembatalan sesi sebelumnya karena ada agenda mendadak..."
                                className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-xs leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#527D98] focus:ring-2 focus:ring-[#527D98]/10"
                            />

                            {form.errors.reason && (
                                <p className="mt-2 text-xs text-rose-600">
                                    {form.errors.reason}
                                </p>
                            )}

                            <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                                <span>
                                    Pesan tetap sopan & profesional kepada
                                    mentee.
                                </span>
                                <span>
                                    {form.data.reason.length}/300 karakter
                                </span>
                            </div>
                        </section>

                        {/* SELECTED SCHEDULE SUMMARY */}
                        <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                            <p className="text-[10px] font-bold text-sky-700">
                                Jadwal Baru yang Ditawarkan
                            </p>

                            {selectedDate && selectedTime && selectedSlot ? (
                                <>
                                    <p className="mt-1 text-sm font-extrabold text-slate-900">
                                        {formatDateTime(
                                            `${selectedDate}T${selectedTime}:00+07:00`,
                                        )}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Durasi: {duration} jam
                                    </p>
                                </>
                            ) : (
                                <p className="mt-1 text-xs text-slate-500">
                                    Belum ada jadwal yang dipilih.
                                </p>
                            )}
                        </section>

                        {/* ACTIONS */}
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <Link
                                href={route("mentor.dashboard")}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                Batal
                            </Link>

                            <button
                                type="button"
                                onClick={submitOffer}
                                disabled={
                                    !selectedDate ||
                                    !selectedTime ||
                                    !selectedSlot ||
                                    form.processing
                                }
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#527D98] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#3E637A] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {form.processing ? (
                                    <>
                                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <Icon className="h-4 w-4">
                                            <path d="m22 2-7 20-4-9-9-4 20-7z" />
                                            <path d="M22 2 11 13" />
                                        </Icon>
                                        Kirim Penawaran Jadwal
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
                        {/* ORIGINAL SESSION */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                                    <Icon className="h-4 w-4 text-rose-500">
                                        <calendarIcon />
                                    </Icon>
                                    Sesi Asal Dibatalkan
                                </h2>

                                <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-bold text-rose-600">
                                    Batal oleh Mentor
                                </span>
                            </div>

                            <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E5ECDD] text-sm font-extrabold text-[#34443D]">
                                    {getInitials(studentName)}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-slate-900">
                                        {studentName}
                                    </p>
                                    <p className="truncate text-[10px] text-slate-500">
                                        Mentee Pathway
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <InfoItem label="Topik / Catatan Mentee">
                                    {session.notes_from_student?.trim() ||
                                        "Tidak ada catatan dari mentee."}
                                </InfoItem>

                                <InfoItem label="Jadwal Awal (Dibatalkan)">
                                    <span className="text-rose-600">
                                        {oldSchedule}
                                    </span>
                                </InfoItem>

                                <div className="grid grid-cols-2 gap-2">
                                    <InfoItem label="Durasi">
                                        {duration} Jam
                                    </InfoItem>
                                    <InfoItem label="Jenis Sesi">
                                        {isFree ? "Gratis" : "Berbayar"}
                                    </InfoItem>
                                </div>

                                {!isFree && (
                                    <InfoItem label="Nilai Transaksi">
                                        {formatRupiah(totalPrice)}
                                    </InfoItem>
                                )}

                                {session.cancellation_reason && (
                                    <InfoItem label="Alasan Pembatalan">
                                        {session.cancellation_reason}
                                    </InfoItem>
                                )}
                            </div>

                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                <p className="text-[10px] font-bold text-amber-800">
                                    Informasi Pembayaran
                                </p>
                                <p className="mt-1 text-[10px] leading-5 text-amber-700">
                                    {isFree
                                        ? "Sesi ini merupakan sesi gratis. Tidak ada proses pengembalian dana."
                                        : "Sesi ini merupakan sesi berbayar. Proses refund akan dijeda sementara ketika tawaran jadwal dikirimkan kepada mentee."}
                                </p>
                            </div>
                        </section>

                        {/* POLICY & REMINDER */}
                        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 shadow-sm sm:p-5">
                            <div className="flex items-center gap-2">
                                <Icon className="h-5 w-5 shrink-0 text-[#527D98]">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 11v5m0-8h.01" />
                                </Icon>

                                <h2 className="text-sm font-extrabold text-slate-900">
                                    Kebijakan Jadwal Pengganti & Refund
                                </h2>
                            </div>

                            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-700">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#527D98] shadow-sm">
                                        1
                                    </span>
                                    <p className="pt-0.5">
                                        Mentee memiliki waktu{" "}
                                        <strong>24 jam</strong> untuk menerima
                                        atau menolak tawaran jadwal pengganti.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#527D98] shadow-sm">
                                        2
                                    </span>
                                    <p className="pt-0.5">
                                        Jika tawaran diterima, sesi akan
                                        dikonfirmasi menggunakan jadwal baru.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#527D98] shadow-sm">
                                        3
                                    </span>
                                    <p className="pt-0.5">
                                        {isFree
                                            ? "Jika tawaran ditolak atau tidak direspons, sesi tetap berstatus dibatalkan. Tidak ada proses refund."
                                            : "Jika tawaran ditolak atau tidak direspons, proses refund akan dilanjutkan dengan batas waktu 48 jam."}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 border-t border-sky-200 pt-3">
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 shrink-0 text-[#527D98]">
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M12 7v5l3 2" />
                                    </Icon>

                                    <h3 className="text-xs font-extrabold text-slate-900">
                                        Pastikan Jadwal yang Ditawarkan
                                    </h3>
                                </div>

                                <p className="mt-2 pl-6 text-xs leading-relaxed text-slate-600">
                                    Periksa kembali tanggal, jam, durasi, dan
                                    ketersediaan sebelum mengirim penawaran
                                    kepada mentee.
                                </p>
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
}

function calendarIcon() {
    return (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
        </>
    );
}
