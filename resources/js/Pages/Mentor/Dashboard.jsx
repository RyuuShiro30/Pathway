import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard({ mentorProfile }) {
    const { auth } = usePage().props;
    const availabilitySchedule = Array.isArray(
        mentorProfile?.availability_schedule,
    )
        ? mentorProfile.availability_schedule
        : [];
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

                    {availabilitySchedule.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {availabilitySchedule.map((schedule, index) => (
                                <article
                                    key={`${schedule.day ?? 'jadwal'}-${index}`}
                                    className="rounded-xl border border-[#E5E8DF] bg-white p-4 shadow-[0_2px_8px_rgba(52,68,61,0.03)]"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A938D]">
                                        Hari
                                    </p>
                                    <h3 className="mt-1 text-base font-bold text-[#34443D]">
                                        {schedule.day ?? 'Hari belum diisi'}
                                    </h3>
                                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F2F5F0] px-3 py-2.5 text-sm font-semibold text-[#527D61]">
                                        <span aria-hidden="true">Jam:</span>
                                        <span>
                                            {schedule.start ?? '--:--'} -{' '}
                                            {schedule.end ?? '--:--'}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-[#D9DCD4] bg-white/70 px-5 py-8 text-center text-sm text-[#78827B]">
                            Belum ada jadwal ketersediaan.
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}