import { Head, Link, usePage } from '@inertiajs/react';
import MentorNavbar from '@/Components/MentorNavbar';
import BadgeCatalog, {
    formatPoints,
} from '@/Components/Rewards/BadgeCatalog';

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
    const { flash = {} } = usePage().props;

    return (
        <>
            <Head title="Katalog Badge" />

            <div className="min-h-screen bg-[#F4F7F9] font-sans text-[#172033]">
                <MentorNavbar active="rewards" />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <Link
                            href={route('mentor.rewards.index')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#6594B1] transition hover:text-[#4F7F9B]"
                        >
                            <span>←</span>
                            Kembali ke Toko Poin
                        </Link>

                        <div className="mt-6">
                            <p className="text-sm font-semibold uppercase tracking-wider text-[#6594B1]">
                                Reward Mentor
                            </p>

                            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#172033]">
                                Katalog Badge
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7A8B99]">
                                Tukarkan poin yang kamu kumpulkan dengan badge
                                eksklusif Pathway.
                            </p>
                        </div>
                    </div>

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
                                    Kumpulkan poin dari sesi mentoring yang
                                    berhasil diselesaikan.
                                </p>
                            </div>

                            <div className="hidden items-center justify-center sm:flex">
                                <PointIllustration />
                            </div>
                        </div>
                    </section>

                    <div className="mb-5">
                        <h2 className="text-xl font-bold text-[#172033]">
                            Pilihan Badge
                        </h2>

                        <p className="mt-1 text-sm text-[#7A8B99]">
                            Pilih badge yang ingin kamu miliki.
                        </p>
                    </div>

                    <BadgeCatalog
                        badges={badges}
                        pointsBalance={pointsBalance}
                    />
                </main>
            </div>
        </>
    );
}
