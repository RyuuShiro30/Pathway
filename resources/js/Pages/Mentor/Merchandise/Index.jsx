import { Head, Link, usePage } from '@inertiajs/react';
import MentorNavbar from '@/Components/MentorNavbar';
import { formatPoints } from '@/Components/Rewards/BadgeCatalog';
import MerchandiseCatalog from '@/Components/Rewards/MerchandiseCatalog';

export default function Index({ merchandises = [], pointsBalance = 0 }) {
    const { flash } = usePage().props;

    return (
        <>
            <Head title="Katalog Merchandise" />

            <div className="min-h-screen bg-[#F4F7F9] font-sans text-[#172033] antialiased">
                <MentorNavbar active="rewards" />

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <Link
                            href={route('mentor.rewards.index')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#6594B1] transition hover:text-[#4F7F9B]"
                        >
                            <span>←</span>
                            Kembali ke Toko Poin
                        </Link>

                        <p className="mt-6 text-sm font-semibold tracking-wide text-[#6594B1]">
                            REWARD MENTOR
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#172033]">
                            Katalog Merchandise
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-[#7A8B99]">
                            Tukarkan poin yang kamu kumpulkan dengan merchandise
                            menarik dari Pathway.
                        </p>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                            {flash.error}
                        </div>
                    )}

                    <div className="mb-8 rounded-2xl border border-[#D8E3E9] bg-[#6594B1] p-6 text-white shadow-sm">
                        <p className="text-sm font-medium text-blue-50">
                            Saldo Poin Kamu
                        </p>

                        <div className="mt-2 flex items-center gap-3">
                            <span className="text-4xl font-bold tracking-tight">
                                {formatPoints(pointsBalance)}
                            </span>

                            <span className="text-lg font-semibold text-blue-50">
                                Poin
                            </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-blue-50">
                            Kumpulkan poin dari sesi mentoring gratis yang telah
                            selesai.
                        </p>
                    </div>

                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#172033]">
                            Pilihan Merchandise
                        </h2>

                        <span className="text-sm text-[#7A8B99]">
                            {merchandises.length} produk
                        </span>
                    </div>

                    <MerchandiseCatalog
                        merchandises={merchandises}
                        pointsBalance={pointsBalance}
                    />
                </div>
            </div>
        </>
    );
}
