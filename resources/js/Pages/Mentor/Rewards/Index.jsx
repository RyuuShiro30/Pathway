import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import MentorNavbar from '@/Components/MentorNavbar';
import BadgeCatalog, {
    formatPoints,
} from '@/Components/Rewards/BadgeCatalog';
import MerchandiseCatalog from '@/Components/Rewards/MerchandiseCatalog';

const tabs = [
    { key: 'badge', label: 'Badge' },
    { key: 'merchandise', label: 'Merchandise' },
];

export default function Index({
    badges = [],
    merchandises = [],
    pointsBalance = 0,
    currentTab = 'badge',
}) {
    const { flash = {} } = usePage().props;
    const [tab, setTab] = useState(
        currentTab === 'merchandise' ? 'merchandise' : 'badge',
    );

    return (
        <>
            <Head title="Toko Poin" />

            <div className="min-h-screen bg-[#F4F7F9] font-sans text-[#172033]">
                <MentorNavbar active="rewards" />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                                Toko Poin
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7A8B99]">
                                Tukarkan poin yang kamu kumpulkan dengan badge
                                dan merchandise eksklusif Pathway.
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

                    <section className="mb-8 overflow-hidden rounded-2xl border border-[#C9DCE6] bg-[#E6EFF4] shadow-[0_3px_12px_rgba(38,65,80,0.07)]">
                        <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
                            <div>
                                <p className="text-sm font-semibold text-[#5E7F95]">
                                    Saldo Poin Kamu
                                </p>

                                <div className="mt-3 flex items-baseline gap-2">
                                    <span className="text-4xl font-bold tracking-tight text-[#263748] sm:text-5xl">
                                        {formatPoints(pointsBalance)}
                                    </span>

                                    <span className="text-lg font-medium text-[#6594B1]">
                                        Poin
                                    </span>
                                </div>

                                <p className="mt-2 text-sm text-[#7A8B99]">
                                    Poin diperoleh dari sesi mentoring gratis
                                    yang berhasil diselesaikan.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={route('mentor.points.history')}
                                    className="inline-flex items-center justify-center rounded-xl bg-[#6594B1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F]"
                                >
                                    Riwayat Poin
                                </Link>

                                <Link
                                    href={route('mentor.merchandise.history')}
                                    className="inline-flex items-center justify-center rounded-xl border border-[#C9DCE6] bg-white px-4 py-2.5 text-sm font-semibold text-[#527D98] transition hover:bg-[#F4F7F9]"
                                >
                                    Riwayat Penukaran
                                </Link>
                            </div>
                        </div>
                    </section>

                    <div className="mb-6 flex flex-wrap gap-2">
                        {tabs.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setTab(item.key)}
                                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                                    tab === item.key
                                        ? 'bg-[#6594B1] text-white shadow-sm'
                                        : 'border border-[#D8E3E9] bg-white text-[#527D98] hover:bg-[#EDF3F6]'
                                }`}
                            >
                                {item.label} (
                                {item.key === 'badge'
                                    ? badges.length
                                    : merchandises.length}
                                )
                            </button>
                        ))}
                    </div>

                    {tab === 'badge' ? (
                        <BadgeCatalog
                            badges={badges}
                            pointsBalance={pointsBalance}
                        />
                    ) : (
                        <MerchandiseCatalog
                            merchandises={merchandises}
                            pointsBalance={pointsBalance}
                        />
                    )}
                </main>
            </div>
        </>
    );
}
