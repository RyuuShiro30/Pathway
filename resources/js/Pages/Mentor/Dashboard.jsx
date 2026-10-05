import { Head, Link, useForm, usePage } from '@inertiajs/react';

const weekdays = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
];

const defaultTimeSlots = [
    { start: '09:00', end: '11:00' },
    { start: '13:00', end: '15:00' },
    { start: '15:30', end: '17:30' },
];

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
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Waktu tidak tersedia'
        : `${sessionDateTimeFormatter.format(date)} WIB`;
}

function truncateNotes(notes) {
    if (!notes) {
        return 'Tidak ada catatan dari student.';
    }

    return notes.length > 100 ? `${notes.slice(0, 97)}...` : notes;
}

export default function Dashboard({ mentorProfile, bookingRequests = [] }) {
    const { auth, flash } = usePage().props;
    const safeBookingRequests = Array.isArray(bookingRequests)
        ? bookingRequests
        : [];
    const availabilitySchedule = Array.isArray(
        mentorProfile?.availability_schedule,
    )
        ? mentorProfile.availability_schedule
        : [];
    const initialAvailabilitySchedule = availabilitySchedule.flatMap(
        (schedule) => {
            const day = weekdays.find(
                (weekday) =>
                    weekday.value === String(schedule?.day ?? '').toLowerCase(),
            );

            if (!day || !schedule?.start || !schedule?.end) {
                return [];
            }

            return [
                {
                    day: day.value,
                    start: schedule.start,
                    end: schedule.end,
                },
            ];
        },
    );
    const customTimeSlots = availabilitySchedule
        .filter((schedule) =>
            weekdays.some(
                (weekday) =>
                    weekday.value === String(schedule?.day ?? '').toLowerCase(),
            ),
        )
        .map(({ start, end }) => ({ start, end }))
        .filter(
            (slot, index, slots) =>
                slot.start &&
                slot.end &&
                !defaultTimeSlots.some(
                    (defaultSlot) =>
                        defaultSlot.start === slot.start &&
                        defaultSlot.end === slot.end,
                ) &&
                slots.findIndex(
                    (candidate) =>
                        candidate.start === slot.start &&
                        candidate.end === slot.end,
                ) === index,
        );
    const timeSlots = [...defaultTimeSlots, ...customTimeSlots].sort((first, second) =>
        first.start.localeCompare(second.start),
    );
    const form = useForm({
        availability_schedule: initialAvailabilitySchedule,
    });
    const mentorName =
        auth?.user?.name ??
        mentorProfile?.user?.name ??
        mentorProfile?.name ??
        mentorProfile?.expertise ??
        'Mentor';
    const avatarInitials = mentorName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
    const currentHour = new Date().getHours();
    const greeting =
        currentHour < 11
            ? 'Selamat Pagi'
            : currentHour < 15
              ? 'Selamat Siang'
              : 'Selamat Sore';
    const availabilityLabel = mentorProfile
        ? mentorProfile.is_available
            ? 'Tersedia untuk mentoring'
            : 'Sedang tidak tersedia'
        : 'Profil mentor belum tersedia';
    const validationErrors = Object.values(form.errors).filter(Boolean);

    function isSlotAvailable(day, slot) {
        return form.data.availability_schedule.some(
            (schedule) =>
                schedule.day === day &&
                schedule.start === slot.start &&
                schedule.end === slot.end,
        );
    }

    function toggleSlot(day, slot) {
        const isAvailable = isSlotAvailable(day, slot);

        form.setData(
            'availability_schedule',
            isAvailable
                ? form.data.availability_schedule.filter(
                      (schedule) =>
                          !(
                              schedule.day === day &&
                              schedule.start === slot.start &&
                              schedule.end === slot.end
                          ),
                  )
                : [
                      ...form.data.availability_schedule,
                      { day, start: slot.start, end: slot.end },
                  ],
        );
    }

    function saveAvailability(event) {
        event.preventDefault();
        form.patch(route('mentor.availability.update'), {
            preserveScroll: true,
        });
    }

    return (
        <div className="min-h-screen bg-[#F7F5F0] text-[#34443D]">
            <Head title="Dashboard Mentor" />

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
                            aria-current="page"
                            className="rounded-full bg-white/20 px-4 py-2 font-semibold text-white"
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
                                className="min-w-0 w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-0"
                            />
                        </label>
                        <div className="flex shrink-0 items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-[#E5ECDD] text-xs font-bold text-[#34443D]">
                                {avatarInitials || 'M'}
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

            <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                <section>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#6594B1]">
                        Portal Mentor / Ringkasan
                    </p>
                    <h1 className="text-2xl font-bold leading-tight text-[#34443D] sm:text-3xl">
                        {greeting}, {mentorName}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69766F]">
                        Berikut ringkasan profil dan jadwal ketersediaan
                        mentoring Anda.
                    </p>
                </section>

                <section
                    aria-labelledby="mentor-profile-heading"
                    className="overflow-hidden rounded-xl border border-[#E8E5DD] bg-white shadow-[0_3px_14px_rgba(52,68,61,0.04)]"
                >
                    <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#EEECE6] px-5 py-5 sm:px-7 sm:py-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7EEF1] text-lg font-bold text-[#527D98]">
                                {avatarInitials || 'M'}
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A938D]">
                                    Profil Mentor
                                </p>
                                <h2
                                    id="mentor-profile-heading"
                                    className="mt-1 text-xl font-bold text-[#34443D]"
                                >
                                    {mentorName}
                                </h2>
                                <p className="mt-1 text-sm font-medium text-[#6594B1]">
                                    {mentorProfile?.expertise ??
                                        'Keahlian belum diisi'}
                                </p>
                            </div>
                        </div>

                        <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                mentorProfile?.is_available
                                    ? 'bg-[#E8F2E8] text-[#477E50]'
                                    : mentorProfile
                                      ? 'bg-[#F6E9E5] text-[#9A5C4D]'
                                      : 'bg-[#F0EFEB] text-[#737B76]'
                            }`}
                        >
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    mentorProfile?.is_available
                                        ? 'bg-[#65B175]'
                                        : mentorProfile
                                          ? 'bg-[#C17A68]'
                                          : 'bg-[#9AA19C]'
                                }`}
                            />
                            {availabilityLabel}
                        </span>
                    </div>

                    <div className="px-5 py-5 sm:px-7 sm:py-6">
                        <h3 className="text-sm font-semibold text-[#34443D]">
                            Tentang saya
                        </h3>
                        <p className="mt-2 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#69766F]">
                            {mentorProfile?.bio || 'Belum ada bio.'}
                        </p>
                    </div>
                </section>

                <section aria-labelledby="booking-requests-heading">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                Pengajuan sesi mentoring
                            </p>
                            <h2
                                id="booking-requests-heading"
                                className="mt-1 text-xl font-bold text-[#34443D]"
                            >
                                Permintaan Bimbingan Baru
                            </h2>
                        </div>
                        <p className="text-sm text-[#78827B]">
                            {safeBookingRequests.length} permintaan baru
                        </p>
                    </div>

                    {safeBookingRequests.length > 0 ? (
                        <div className="space-y-3">
                            {safeBookingRequests.map((bookingRequest) => (
                                <article
                                    key={bookingRequest.id}
                                    className="rounded-xl border border-[#E8E5DD] bg-white p-5 shadow-[0_3px_14px_rgba(52,68,61,0.04)] sm:p-6"
                                >
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-base font-bold text-[#34443D]">
                                                    {bookingRequest.student
                                                        ?.name ?? 'Student'}
                                                </h3>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                                                        bookingRequest.is_free_session
                                                            ? 'bg-[#E8F2E8] text-[#65B175]'
                                                            : 'bg-[#E7EEF1] text-[#6594B1]'
                                                    }`}
                                                >
                                                    {bookingRequest.is_free_session
                                                        ? 'Gratis'
                                                        : `Rp ${rupiahFormatter.format(Number(bookingRequest.price_snapshot ?? 0))}`}
                                                </span>
                                            </div>

                                            <div className="mt-4 grid gap-3 text-sm text-[#69766F] sm:grid-cols-2">
                                                <p>
                                                    <span className="font-semibold text-[#34443D]">
                                                        Mulai:{' '}
                                                    </span>
                                                    {formatSessionDateTime(
                                                        bookingRequest.schedule_time,
                                                    )}
                                                </p>
                                                <p>
                                                    <span className="font-semibold text-[#34443D]">
                                                        Selesai:{' '}
                                                    </span>
                                                    {formatSessionDateTime(
                                                        bookingRequest.end_time,
                                                    )}
                                                </p>
                                                <p>
                                                    <span className="font-semibold text-[#34443D]">
                                                        Durasi:{' '}
                                                    </span>
                                                    {bookingRequest.duration_hours}{' '}
                                                    Jam
                                                </p>
                                            </div>

                                            <p className="mt-3 text-sm leading-6 text-[#69766F]">
                                                {truncateNotes(
                                                    bookingRequest.notes_from_student,
                                                )}
                                            </p>
                                        </div>

                                        <Link
                                            href={route(
                                                'mentor.booking.show',
                                                bookingRequest.id,
                                            )}
                                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2"
                                        >
                                            Lihat Detail
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-[#E8E5DD] bg-white px-5 py-8 text-center shadow-[0_3px_14px_rgba(52,68,61,0.04)]">
                            <p className="text-sm text-[#78827B]">
                                Belum ada permintaan bimbingan baru
                            </p>
                        </div>
                    )}
                </section>

                <section aria-labelledby="availability-heading">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8A938D]">
                                Waktu mentoring
                            </p>
                            <h2
                                id="availability-heading"
                                className="mt-1 text-xl font-bold text-[#34443D]"
                            >
                                Jadwal Ketersediaan
                            </h2>
                        </div>
                        <p className="text-sm text-[#78827B]">
                            {availabilitySchedule.length} slot tersedia
                        </p>
                    </div>

                    <form
                        onSubmit={saveAvailability}
                        className="overflow-hidden rounded-xl border border-[#E8E5DD] bg-white shadow-[0_3px_14px_rgba(52,68,61,0.04)]"
                    >
                        <div className="overflow-x-auto p-4 sm:p-5">
                            <table className="w-full min-w-[760px] border-separate border-spacing-2 text-left">
                                <thead>
                                    <tr>
                                        <th className="w-36 px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#78827B]">
                                            Waktu
                                        </th>
                                        {weekdays.map((day) => (
                                            <th
                                                key={day.value}
                                                scope="col"
                                                className="px-3 py-2 text-center text-sm font-bold text-[#34443D]"
                                            >
                                                {day.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map((slot) => (
                                        <tr key={`${slot.start}-${slot.end}`}>
                                            <th
                                                scope="row"
                                                className="rounded-lg bg-[#F7F5F0] px-3 py-3 text-xs font-semibold text-[#69766F]"
                                            >
                                                {slot.start} - {slot.end}
                                            </th>
                                            {weekdays.map((day) => {
                                                const isAvailable = isSlotAvailable(
                                                    day.value,
                                                    slot,
                                                );

                                                return (
                                                    <td
                                                        key={`${day.value}-${slot.start}`}
                                                    >
                                                        <button
                                                            type="button"
                                                            aria-pressed={isAvailable}
                                                            aria-label={`${day.label}, ${slot.start} sampai ${slot.end}: ${isAvailable ? 'Tersedia' : 'Tidak tersedia'}`}
                                                            disabled={form.processing}
                                                            onClick={() =>
                                                                toggleSlot(
                                                                    day.value,
                                                                    slot,
                                                                )
                                                            }
                                                            className={`min-h-14 w-full rounded-lg border px-2 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                                                                isAvailable
                                                                    ? 'border-[#65B175] bg-[#E8F2E8] text-[#477E50] hover:bg-[#DDEBDD]'
                                                                    : 'border-[#E1E3DF] bg-[#F2F2EF] text-[#747B76] hover:bg-[#E9EAE6]'
                                                            }`}
                                                        >
                                                            {isAvailable
                                                                ? 'Tersedia'
                                                                : 'Tidak tersedia'}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-4 border-t border-[#EEECE6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div className="space-y-2" aria-live="polite">
                                {(flash?.success || form.recentlySuccessful) && (
                                    <p className="text-sm font-medium text-[#477E50]">
                                        {flash?.success ||
                                            'Jadwal ketersediaan berhasil disimpan.'}
                                    </p>
                                )}
                                {validationErrors.map((error, index) => (
                                    <p
                                        key={`${error}-${index}`}
                                        className="text-sm font-medium text-[#A34F45]"
                                    >
                                        {error}
                                    </p>
                                ))}
                            </div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#6594B1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#527D98] focus:outline-none focus:ring-2 focus:ring-[#6594B1] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {form.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Jadwal Ketersediaan'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}