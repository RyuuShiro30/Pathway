import { Head, Link, useForm, usePage } from '@inertiajs/react';

function formatPoints(value) {
    return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function MedalIllustration() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#C9DCE6] bg-white shadow-sm">
                <svg
                    className="h-16 w-16 text-[#6594B1]"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M20 7H32L27 27H16L20 7Z"
                        fill="#95D56B"
                    />
                    <path
                        d="M44 7H32L37 27H48L44 7Z"
                        fill="#6594B1"
                    />
                    <circle
                        cx="32"
                        cy="35"
                        r="17"
                        fill="#E6EFF4"
                        stroke="#6594B1"
                        strokeWidth="2.5"
                    />
                    <path
                        d="M32 24L35.5 31L43 32L37.5 37.5L39 45L32 41L25 45L26.5 37.5L21 32L28.5 31L32 24Z"
                        fill="#E9B82E"
                    />
                </svg>
            </div>
        </div>
    );
}

function PointIllustration() {
    return (
        <svg
            viewBox="0 0 100 100"
            className="h-24 w-24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="46" fill="white" />
            <circle
                cx="50"
                cy="50"
                r="34"
                fill="#E6EFF4"
                stroke="#6594B1"
                strokeWidth="2"
            />
            <path
                d="M50 25L56 42L74 43L60 55L64 73L50 63L36 73L40 55L26 43L44 42L50 25Z"
                fill="#E9B82E"
            />
            <circle cx="76" cy="23" r="9" fill="#95D56B" />
            <path
                d="M72 23L75 26L80 20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function Index({ badges = [], pointsBalance = 0 }) {
    const { post, processing } = useForm({});
    const { flash = {} } = usePage().props;

    const handleRedeem = (badge) => {
        if (
            badge.is_owned ||
            Number(pointsBalance) < Number(badge.point_cost)
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Apakah kamu yakin ingin menukar ${formatPoints(badge.point_cost)} poin dengan badge "${badge.name}"?`
        );

        if (confirmed) {
            post(route('mentor.badges.redeem', badge.id));
        }
    };

    return (
        <>
            <Head title="Katalog Badge" />

            <div className="min-h-screen bg-[#F4F7F9] font-sans text-[#172033]">
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                    {/* HEADER */}
                    <div className="mb-8">
                        <Link
                            href={route('mentor.dashboard')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#6594B1] transition hover:text-[#4F7F9B]"
                        >
                            <span>←</span>
                            Kembali ke Dashboard
                        </Link>

                        <div className="mt-6">
                            <p className="text-sm font-semibold uppercase tracking-wider text-[#6594B1]">
                                Reward Mentor
                            </p>

                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#172033]">
                                Katalog Badge
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7A8B99]">
                                Tukarkan poin yang kamu kumpulkan dengan
                                badge eksklusif Pathway.
                            </p>
                        </div>
                    </div>

                    {/* NOTIFIKASI */}
                    {flash.success && (
                        <div className="mb-6 rounded-xl border border-[#CDE5BE] bg-[#F0F8EA] p-4 text-sm font-medium text-[#526F37]">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                            {flash.error}
                        </div>
                    )}

                    {/* SALDO POIN */}
                    <section className="mb-9 overflow-hidden rounded-2xl border border-[#C9DCE6] bg-[#E6EFF4] shadow-[0_3px_12px_rgba(38,65,80,0.07)]">
                        <div className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#6594B1] shadow-sm">
                                        <svg
                                            className="h-6 w-6"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                        >
                                            <path d="M12 3L14.8 8.7L21 9.6L16.5 14L17.6 20.2L12 17.2L6.4 20.2L7.5 14L3 9.6L9.2 8.7L12 3Z" />
                                        </svg>
                                    </div>

                                    <p className="text-sm font-semibold text-[#5E7F95]">
                                        Saldo Poin Kamu
                                    </p>
                                </div>

                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-4xl font-bold tracking-tight text-[#263748] sm:text-5xl">
                                        {formatPoints(pointsBalance)}
                                    </span>

                                    <span className="text-lg font-medium text-[#6594B1]">
                                        Poin
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-[#7A8B99]">
                                    Kumpulkan poin dari sesi mentoring
                                    yang berhasil diselesaikan.
                                </p>
                            </div>

                            <div className="hidden items-center justify-center sm:flex">
                                <PointIllustration />
                            </div>
                        </div>
                    </section>

                    {/* JUDUL KATALOG */}
                    <div className="mb-5">
                        <h2 className="text-xl font-bold text-[#172033]">
                            Pilihan Badge
                        </h2>

                        <p className="mt-1 text-sm text-[#7A8B99]">
                            Pilih badge yang ingin kamu miliki.
                        </p>
                    </div>

                    {/* DAFTAR BADGE */}
                    {badges.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {badges.map((badge) => {
                                const isOwned = Boolean(badge.is_owned);

                                const insufficientPoints =
                                    Number(pointsBalance) <
                                    Number(badge.point_cost);

                                return (
                                    <article
                                        key={badge.id}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-[#D8E3E9] bg-white shadow-[0_2px_8px_rgba(38,65,80,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[#B7CCD8] hover:shadow-md"
                                    >
                                        {/* GAMBAR BADGE */}
                                        <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[#E6EFF4] to-[#EAF5E1] p-5">
                                            {badge.image_url ? (
                                                <img
                                                    src={badge.image_url}
                                                    alt={badge.name}
                                                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <MedalIllustration />
                                            )}

                                            {isOwned && (
                                                <span className="absolute right-3 top-3 rounded-full bg-[#EAF5E1] px-3 py-1.5 text-xs font-semibold text-[#5C6F2B] shadow-sm">
                                                    ✓ Dimiliki
                                                </span>
                                            )}
                                        </div>

                                        {/* INFORMASI BADGE */}
                                        <div className="flex flex-1 flex-col p-5">
                                            <h3 className="text-base font-bold text-[#263748]">
                                                {badge.name}
                                            </h3>

                                            <p className="mt-2 min-h-[60px] text-sm leading-6 text-[#7A8B99]">
                                                {badge.description ||
                                                    'Badge eksklusif untuk mentor Pathway.'}
                                            </p>

                                            {/* HARGA */}
                                            <div className="mb-4 mt-4 flex items-center justify-between border-t border-[#EDF1F3] pt-4">
                                                <span className="text-sm text-[#7A8B99]">
                                                    Harga badge
                                                </span>

                                                <span className="font-bold text-[#6594B1]">
                                                    {formatPoints(badge.point_cost)} poin
                                                </span>
                                            </div>

                                            {/* TOMBOL */}
                                            <div className="mt-auto">
                                                {isOwned ? (
                                                    <button
                                                        type="button"
                                                        disabled
                                                        className="w-full cursor-not-allowed rounded-xl bg-[#EAF5E1] px-4 py-3 text-sm font-semibold text-[#5C6F2B]"
                                                    >
                                                        ✓ Sudah Dimiliki
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRedeem(badge)
                                                        }
                                                        disabled={
                                                            processing ||
                                                            insufficientPoints
                                                        }
                                                        className="w-full rounded-xl bg-[#6594B1] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F] disabled:cursor-not-allowed disabled:bg-[#DCE3E7] disabled:text-[#8998A3] disabled:shadow-none"
                                                    >
                                                        {processing
                                                            ? 'Memproses...'
                                                            : insufficientPoints
                                                              ? 'Poin Tidak Cukup'
                                                              : 'Tukar Badge'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        /* BADGE KOSONG */
                        <div className="rounded-2xl border border-dashed border-[#C9D7DF] bg-white px-6 py-16 text-center">
                            <div className="mx-auto mb-4 h-28 w-28">
                                <MedalIllustration />
                            </div>

                            <h3 className="text-lg font-bold text-[#263748]">
                                Belum Ada Badge
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7A8B99]">
                                Katalog badge belum tersedia. Silakan
                                kembali lagi nanti.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
