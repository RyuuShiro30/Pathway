import { Head, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import Navbar from "@/Components/Navbar";

export default function RescheduleBooking({
    session,
    busy_sessions = [],
    booking_window,
}) {
    const mentor = session?.mentor;
    const duration = Number(session?.duration_hours ?? 1);

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTimes, setSelectedTimes] = useState([]);
    const [agreementChecked, setAgreementChecked] = useState(false);

    const [calendarMonth, setCalendarMonth] = useState(() => {
        const initialDate = booking_window?.from
            ? new Date(`${booking_window.from}T12:00:00`)
            : new Date();

        return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
    });

    const form = useForm({
        schedule_time: "",
        duration_hours: duration,
        reason: "",
    });

    const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    const dayNames = [
        "minggu",
        "senin",
        "selasa",
        "rabu",
        "kamis",
        "jumat",
        "sabtu",
    ];

    const formatDateTime = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
        });
    };

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Asia/Jakarta",
        });

    const formatTime = (date) =>
        new Date(date).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
        });

    const formatPrice = (price) => {
        if (price === null || price === undefined) return "-";

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(price);
    };

    const getDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    // Mengambil slot tersedia per 1 jam.
    const getAvailableSlots = () => {
        if (!mentor?.availability_schedule || !booking_window) {
            return [];
        }

        const startDate = new Date(`${booking_window.from}T00:00:00+07:00`);
        const endDate = new Date(`${booking_window.until}T00:00:00+07:00`);

        const busy = busy_sessions.map((item) => ({
            start: new Date(item.schedule_time).getTime(),
            end: new Date(item.end_time).getTime(),
        }));

        const oldStart = new Date(session.schedule_time).getTime();
        const oldEnd = session.end_time
            ? new Date(session.end_time).getTime()
            : oldStart + duration * 60 * 60 * 1000;

        const slots = [];

        for (
            let date = new Date(startDate);
            date <= endDate;
            date.setDate(date.getDate() + 1)
        ) {
            const dateString = getDateString(date);
            const weekday = dayNames[date.getDay()];

            const availability = mentor.availability_schedule.filter(
                (slot) => slot.day === weekday,
            );

            const dailySlots = [];

            for (let minutes = 0; minutes < 1440; minutes += 60) {
                const endMinutes = minutes + 60;
                if (endMinutes > 1440) continue;

                const startHour = String(Math.floor(minutes / 60)).padStart(
                    2,
                    "0",
                );

                const endHour = String(Math.floor(endMinutes / 60)).padStart(
                    2,
                    "0",
                );

                const time = `${startHour}:00`;
                const endTime = `${endHour}:00`;

                const start = new Date(`${dateString}T${time}:00+07:00`);

                const end = new Date(`${dateString}T${endTime}:00+07:00`);

                // Slot harus lebih dari 6 jam dari waktu sekarang.
                if (start.getTime() <= Date.now() + 6 * 60 * 60 * 1000) {
                    continue;
                }

                const matchingSlot = availability.find((slot) => {
                    const [sh, sm] = slot.start.split(":").map(Number);
                    const [eh, em] = slot.end.split(":").map(Number);

                    return (
                        minutes >= sh * 60 + sm && endMinutes <= eh * 60 + em
                    );
                });

                if (!matchingSlot) continue;

                const conflict = busy.some(
                    (item) =>
                        start.getTime() < item.end &&
                        end.getTime() > item.start,
                );

                if (conflict) continue;

                const isFree = (matchingSlot.type ?? "gratis") === "gratis";

                const isCurrentSession =
                    start.getTime() < oldEnd && end.getTime() > oldStart;

                dailySlots.push({
                    date: dateString,
                    time,
                    endTime,
                    startTimestamp: start.getTime(),
                    is_free_session: isFree,
                    price: isFree ? 0 : Number(matchingSlot.price ?? 0),
                    isCurrentSession,
                });
            }

            // Memastikan slot dapat membentuk rangkaian sesuai durasi.
            const validSlots = new Set();

            for (let i = 0; i <= dailySlots.length - duration; i++) {
                const group = dailySlots.slice(i, i + duration);

                const isConsecutive = group.every((slot, index) => {
                    if (index === 0) return true;

                    return (
                        slot.startTimestamp ===
                        group[index - 1].startTimestamp + 60 * 60 * 1000
                    );
                });

                if (!isConsecutive) continue;

                const types = group.map((slot) => slot.is_free_session);

                if (new Set(types).size !== 1) continue;

                const isFree = types[0];

                if (isFree !== Boolean(session?.is_free_session)) {
                    continue;
                }

                const totalPrice = group.reduce(
                    (total, slot) => total + slot.price,
                    0,
                );

                if (!isFree && totalPrice !== Number(session?.price_snapshot)) {
                    continue;
                }

                group.forEach((slot) => {
                    validSlots.add(slot.startTimestamp);
                });
            }

            dailySlots.forEach((slot) => {
                if (
                    validSlots.has(slot.startTimestamp) ||
                    slot.isCurrentSession
                ) {
                    slots.push({
                        ...slot,
                        label: `${slot.time} - ${slot.endTime}`,
                        total_price: slot.price,
                    });
                }
            });
        }

        return slots;
    };

    const availableSlots = getAvailableSlots();

    const availableDates = [
        ...new Set(availableSlots.map((slot) => slot.date)),
    ];

    const slotsForSelectedDate = availableSlots.filter(
        (slot) => slot.date === selectedDate,
    );

    const firstDayOffset =
        (new Date(
            calendarMonth.getFullYear(),
            calendarMonth.getMonth(),
            1,
        ).getDay() +
            6) %
        7;

    const daysInMonth = new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + 1,
        0,
    ).getDate();

    const calendarDays = [
        ...Array(firstDayOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    const goToPreviousMonth = () => {
        setCalendarMonth(
            (current) =>
                new Date(current.getFullYear(), current.getMonth() - 1, 1),
        );
    };

    const goToNextMonth = () => {
        setCalendarMonth(
            (current) =>
                new Date(current.getFullYear(), current.getMonth() + 1, 1),
        );
    };

    // Ketika tanggal dipilih.
    const handleDateChange = (value) => {
        setSelectedDate(value);
        setSelectedTimes([]);
        form.setData("schedule_time", "");
    };

    // Ketika slot waktu dipilih.
    const handleTimeChange = (value) => {
        setSelectedTimes((current) => {
            let updated;

            if (current.includes(value)) {
                updated = current.filter((time) => time !== value);
            } else {
                updated = [...current, value].sort();
            }

            // Jumlah slot tidak boleh melebihi durasi sesi.
            if (updated.length > duration) {
                updated = [value];
            }

            // Slot harus berurutan dan berada pada hari yang sama.
            const selectedMinutes = updated.map((time) => {
                const [hour, minute] = time.split(":").map(Number);
                return hour * 60 + minute;
            });

            const isConsecutive = selectedMinutes.every(
                (minutes, index) =>
                    index === 0 || minutes - selectedMinutes[index - 1] === 60,
            );

            if (!isConsecutive) {
                updated = [value];
            }

            const firstTime = updated[0];

            form.setData(
                "schedule_time",
                updated.length === duration && firstTime
                    ? `${selectedDate}T${firstTime}:00`
                    : "",
            );

            return updated;
        });
    };

    // Mengirim pengajuan reschedule.
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!form.data.schedule_time || selectedTimes.length !== duration) {
            return;
        }

        // Checkbox persetujuan wajib dicentang.
        if (!agreementChecked) {
            return;
        }

        form.post(route("student.bookings.reschedule.store", session.id));
    };

    const oldStart = new Date(session?.schedule_time);
    const oldEnd = session?.end_time
        ? new Date(session.end_time)
        : new Date(oldStart.getTime() + duration * 60 * 60 * 1000);

    const newStart =
        selectedDate && selectedTimes.length > 0
            ? new Date(`${selectedDate}T${selectedTimes[0]}:00+07:00`)
            : null;

    const newEnd = newStart
        ? new Date(newStart.getTime() + duration * 60 * 60 * 1000)
        : null;

    const isComplete = selectedTimes.length === duration;

    return (
        <>
            <Head title="Ubah Jadwal Mentoring" />
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() =>
                            router.get(route("student.bookings.index"))
                        }
                        className="text-sm font-medium text-slate-500 hover:text-slate-800"
                    >
                        ← Kembali ke Sesi Saya
                    </button>

                    <h1 className="mt-4 text-2xl font-bold text-slate-900">
                        Ubah Jadwal Mentoring
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Pilih jadwal baru untuk sesi mentoring bersama mentor
                        Anda.
                    </p>
                </div>

                {/* Informasi batas waktu */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                        <span className="text-xl">⚠️</span>

                        <div>
                            <h2 className="font-semibold text-amber-900">
                                Perhatikan Ketentuan Reschedule
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-amber-800">
                                Pengajuan perubahan jadwal hanya dapat dilakukan
                                lebih dari 6 jam sebelum sesi dimulai. Jadwal
                                lama tetap berlaku sampai mentor menyetujui
                                perubahan.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Form utama */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Informasi sesi lama */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Informasi Sesi Saat Ini
                            </h2>

                            <div className="mt-5 flex items-center gap-4">
                                {mentor?.photo_path ? (
                                    <img
                                        src={`/storage/${mentor.photo_path}`}
                                        alt={mentor.name}
                                        className="h-14 w-14 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500">
                                        {mentor?.name?.charAt(0) ?? "M"}
                                    </div>
                                )}

                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {mentor?.name ?? "-"}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {mentor?.expertise ?? "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-slate-500">
                                        Jadwal Saat Ini
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {formatDateTime(session?.schedule_time)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Durasi
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {duration} jam
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Jenis Sesi
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {session?.is_free_session
                                            ? "Gratis"
                                            : "Berbayar"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-500">
                                        Harga Sesi
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {session?.is_free_session
                                            ? "Gratis"
                                            : formatPrice(
                                                  session?.price_snapshot,
                                              )}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Pemilihan jadwal baru */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Pilih Jadwal Baru
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Pilih tanggal dan waktu yang sesuai dengan
                                ketersediaan mentor.
                            </p>

                            <div className="mt-5 space-y-5">
                                {/* Kalender */}
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-800">
                                                Pilih Tanggal
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Pilih tanggal yang memiliki
                                                jadwal tersedia.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={goToPreviousMonth}
                                                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
                                            >
                                                ←
                                            </button>

                                            <span className="min-w-32 text-center text-sm font-semibold text-slate-800">
                                                {
                                                    monthNames[
                                                        calendarMonth.getMonth()
                                                    ]
                                                }{" "}
                                                {calendarMonth.getFullYear()}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={goToNextMonth}
                                                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
                                            >
                                                →
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-2">
                                        {[
                                            "Sen",
                                            "Sel",
                                            "Rab",
                                            "Kam",
                                            "Jum",
                                            "Sab",
                                            "Min",
                                        ].map((day) => (
                                            <div
                                                key={day}
                                                className="py-2 text-center text-xs font-semibold text-slate-500"
                                            >
                                                {day}
                                            </div>
                                        ))}

                                        {calendarDays.map((day, index) => {
                                            if (!day) {
                                                return (
                                                    <div
                                                        key={`empty-${index}`}
                                                    />
                                                );
                                            }

                                            const date = new Date(
                                                calendarMonth.getFullYear(),
                                                calendarMonth.getMonth(),
                                                day,
                                            );

                                            const dateString =
                                                getDateString(date);

                                            const isAvailable =
                                                availableDates.includes(
                                                    dateString,
                                                );

                                            const isSelected =
                                                selectedDate === dateString;

                                            return (
                                                <button
                                                    key={dateString}
                                                    type="button"
                                                    disabled={!isAvailable}
                                                    onClick={() =>
                                                        handleDateChange(
                                                            dateString,
                                                        )
                                                    }
                                                    className={`relative flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition ${
                                                        isSelected
                                                            ? "bg-sky-600 text-white"
                                                            : isAvailable
                                                              ? "bg-sky-50 text-sky-700 hover:bg-sky-100"
                                                              : "cursor-not-allowed bg-slate-50 text-slate-300"
                                                    }`}
                                                >
                                                    {day}

                                                    {isAvailable && (
                                                        <span
                                                            className={`absolute bottom-1 h-1 w-1 rounded-full ${
                                                                isSelected
                                                                    ? "bg-white"
                                                                    : "bg-emerald-500"
                                                            }`}
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Tersedia
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-sky-600" />
                                            Dipilih
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                                            Tidak tersedia
                                        </div>
                                    </div>
                                </div>

                                {/* Slot waktu per jam */}
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Jam Tersedia
                                    </label>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {slotsForSelectedDate.map((slot) => {
                                            const isSelected =
                                                selectedTimes.includes(
                                                    slot.time,
                                                );

                                            return (
                                                <button
                                                    key={`${slot.date}-${slot.time}`}
                                                    type="button"
                                                    disabled={
                                                        slot.isCurrentSession
                                                    }
                                                    onClick={() =>
                                                        handleTimeChange(
                                                            slot.time,
                                                        )
                                                    }
                                                    className={`rounded-xl border p-4 text-left transition ${
                                                        slot.isCurrentSession
                                                            ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60"
                                                            : isSelected
                                                              ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500"
                                                              : "border-slate-200 bg-white hover:border-sky-300"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">
                                                                {slot.label} WIB
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Durasi 1 jam
                                                            </p>
                                                        </div>

                                                        <span className="rounded-full px-3 py-1 text-xs font-semibold">
                                                            {slot.isCurrentSession
                                                                ? "Jadwal Saat Ini"
                                                                : isSelected
                                                                  ? "Dipilih"
                                                                  : "Tersedia"}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
                                                        <span className="text-xs text-slate-500">
                                                            {slot.is_free_session
                                                                ? "Sesi Gratis"
                                                                : "Sesi Berbayar"}
                                                        </span>

                                                        <span className="text-xs font-semibold text-slate-700">
                                                            {slot.is_free_session
                                                                ? "Gratis"
                                                                : formatPrice(
                                                                      slot.price,
                                                                  )}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedDate &&
                                        slotsForSelectedDate.length === 0 && (
                                            <p className="mt-2 text-sm text-slate-500">
                                                Tidak ada jadwal tersedia pada
                                                tanggal ini.
                                            </p>
                                        )}
                                </div>

                                {form.errors.schedule_time && (
                                    <p className="text-sm text-red-600">
                                        {form.errors.schedule_time}
                                    </p>
                                )}

                                <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                                    <p className="text-sm font-semibold text-sky-900">
                                        Ketentuan Durasi Sesi
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-sky-800">
                                        Durasi sesi tetap {duration} jam.
                                        {duration === 2 &&
                                            " Sistem memerlukan dua slot waktu berurutan pada hari yang sama."}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Alasan reschedule */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Alasan Perubahan Jadwal
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Bagian ini opsional.
                            </p>

                            <textarea
                                value={form.data.reason}
                                onChange={(e) =>
                                    form.setData("reason", e.target.value)
                                }
                                maxLength={300}
                                rows={4}
                                placeholder="Tuliskan alasan perubahan jadwal jika diperlukan..."
                                className="mt-4 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                            />

                            <div className="mt-2 flex justify-between">
                                {form.errors.reason ? (
                                    <p className="text-xs text-red-600">
                                        {form.errors.reason}
                                    </p>
                                ) : (
                                    <span />
                                )}

                                <p className="text-xs text-slate-400">
                                    {form.data.reason.length}/300 karakter
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Ringkasan Perubahan */}
                    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-6">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-lg font-bold text-slate-900">
                                Ringkasan Perubahan
                            </h2>

                            <span
                                className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                                    isComplete
                                        ? "bg-sky-100 text-sky-700"
                                        : "bg-slate-100 text-slate-500"
                                }`}
                            >
                                {isComplete ? "Siap Diajukan" : "Belum Lengkap"}
                            </span>
                        </div>

                        {/* Jadwal Lama */}
                        <div className="mt-5 rounded-xl bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Jadwal Lama
                                </p>
                                <span className="text-red-500">✕</span>
                            </div>

                            <p className="mt-2 text-sm font-semibold text-slate-800">
                                {formatDate(oldStart)}
                            </p>

                            <p className="mt-1 text-sm text-slate-500 line-through">
                                {formatTime(oldStart)}–{formatTime(oldEnd)} WIB
                                ({duration} Jam)
                            </p>
                        </div>

                        {/* Indikator Perubahan */}
                        <div className="flex justify-center py-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
                                ↓
                            </span>
                        </div>

                        {/* Jadwal Baru */}
                        <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                                    Jadwal Baru Terpilih
                                </p>

                                {isComplete && (
                                    <span className="font-bold text-sky-700">
                                        ✓
                                    </span>
                                )}
                            </div>

                            {newStart ? (
                                <>
                                    <p className="mt-2 text-sm font-semibold text-slate-800">
                                        {formatDate(newStart)}
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-sky-700">
                                        {formatTime(newStart)}–
                                        {formatTime(newEnd)} WIB ({duration}{" "}
                                        Jam)
                                    </p>

                                    {duration === 2 && (
                                        <div className="mt-2 rounded-lg bg-white/70 p-2">
                                            <p className="text-xs font-medium text-slate-500">
                                                Rincian slot waktu:
                                            </p>

                                            {selectedTimes.length === 2 ? (
                                                <div className="mt-1 space-y-1 text-xs text-slate-600">
                                                    {selectedTimes.map(
                                                        (time) => {
                                                            const slotStart =
                                                                new Date(
                                                                    `${selectedDate}T${time}:00+07:00`,
                                                                );

                                                            const slotEnd =
                                                                new Date(
                                                                    slotStart.getTime() +
                                                                        60 *
                                                                            60 *
                                                                            1000,
                                                                );

                                                            return (
                                                                <p key={time}>
                                                                    • {time}–
                                                                    {formatTime(
                                                                        slotEnd,
                                                                    )}
                                                                </p>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-xs text-amber-700">
                                                    Pilih 1 slot berurutan lagi
                                                    untuk melengkapi durasi 2
                                                    jam.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="mt-2 text-sm text-slate-500">
                                    Belum ada jadwal yang dipilih.
                                </p>
                            )}
                        </div>

                        {/* Biaya */}
                        <div className="mt-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4 text-sm">
                            <span className="text-slate-500">
                                Biaya Perubahan Jadwal
                            </span>

                            <span className="font-semibold text-emerald-700">
                                {session?.is_free_session
                                    ? "Gratis (Rp 0)"
                                    : formatPrice(session?.price_snapshot)}
                            </span>
                        </div>

                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                            Biaya mengikuti ketentuan sesi awal. Perubahan
                            jadwal tidak mengubah jenis sesi maupun harga.
                        </p>

                        {/* Checkbox Persetujuan */}
                        <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs leading-5 text-slate-600">
                            <input
                                type="checkbox"
                                checked={agreementChecked}
                                onChange={(e) =>
                                    setAgreementChecked(e.target.checked)
                                }
                                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />

                            <span>
                                Saya memahami bahwa perubahan jadwal baru
                                berlaku setelah mendapatkan persetujuan mentor.
                            </span>
                        </label>

                        {/* Informasi Persetujuan Mentor */}
                        <div className="mt-4 rounded-xl bg-amber-50 p-3">
                            <p className="text-xs font-semibold text-amber-900">
                                Menunggu Persetujuan Mentor
                            </p>

                            <p className="mt-1 text-xs leading-5 text-amber-800">
                                Mentor memiliki waktu maksimal 24 jam untuk
                                merespons pengajuan. Jika ditolak atau tidak
                                direspons hingga batas waktu, jadwal lama tetap
                                berlaku.
                            </p>
                        </div>

                        {/* Tombol Ajukan */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                                !form.data.schedule_time ||
                                !isComplete ||
                                !agreementChecked ||
                                form.processing
                            }
                            className="mt-5 w-full rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing
                                ? "Mengirim Pengajuan..."
                                : "Ajukan Perubahan Jadwal"}
                        </button>

                        {/* Tombol Batal */}
                        <button
                            type="button"
                            onClick={() =>
                                router.get(route("student.bookings.index"))
                            }
                            className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                            Batal & Kembali ke Sesi Saya
                        </button>

                        <p className="mt-4 text-center text-[11px] text-slate-400">
                            Pastikan jadwal baru sudah sesuai sebelum mengajukan
                            perubahan.
                        </p>
                    </aside>
                </div>
            </main>
        </>
    );
}
