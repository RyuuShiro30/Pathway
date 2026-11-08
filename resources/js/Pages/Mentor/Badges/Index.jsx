import { Head, Link, useForm, usePage } from '@inertiajs/react';

function formatPoints(value) {
    return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

export default function Index({ badges = [], pointsBalance = 0 }) {
    const { post, processing } = useForm({});
    const { flash = {} } = usePage().props;

    const handleRedeem = (badge) => {
        if (badge.is_owned || Number(pointsBalance) < Number(badge.point_cost)) {
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

            <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8">
                        <Link
                            href={route('mentor.dashboard')}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            &larr; Kembali ke Dashboard
                        </Link>

                        <p className="mt-5 text-sm font-medium text-indigo-600">
                            REWARD MENTOR
                        </p>

                        <h1 className="mt-2 text-3xl font-bold text-gray-900">
                            Katalog Badge
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Tukarkan poin yang kamu kumpulkan dengan badge eksklusif Pathway.
                        </p>
                    </div>

                    {flash.success && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    <div className="mb-8 rounded-2xl bg-indigo-600 p-6 text-white shadow-sm">
                        <p className="text-sm text-indigo-100">Saldo Poin Kamu</p>
                        <div className="mt-2 flex items-center gap-3">
                            <span className="text-4xl font-bold">
                                {formatPoints(pointsBalance)}
                            </span>
                            <span className="text-lg text-indigo-100">Poin</span>
                        </div>
                    </div>

                    <div className="mb-5">
                        <h2 className="text-xl font-bold text-gray-900">
                            Pilihan Badge
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Pilih badge yang ingin kamu miliki.
                        </p>
                    </div>

                    {badges.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {badges.map((badge) => {
                                const isOwned = Boolean(badge.is_owned);
                                const insufficientPoints =
                                    Number(pointsBalance) < Number(badge.point_cost);

                                return (
                                    <div
                                        key={badge.id}
                                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
                                            {badge.image_url ? (
                                                <img
                                                    src={badge.image_url}
                                                    alt={badge.name}
                                                    className="h-full w-full object-contain p-5"
                                                />
                                            ) : (
                                                <div className="text-7xl">🏅</div>
                                            )}
                                        </div>

                                        <div className="p-5">
                                            <div className="mb-3 flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-gray-900">
                                                    {badge.name}
                                                </h3>

                                                {isOwned && (
                                                    <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                        Dimiliki
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mb-5 min-h-10 text-sm leading-relaxed text-gray-500">
                                                {badge.description || 'Badge eksklusif untuk mentor Pathway.'}
                                            </p>

                                            <div className="mb-4 flex items-center justify-between border-t border-gray-100 pt-4">
                                                <span className="text-sm text-gray-500">
                                                    Harga badge
                                                </span>
                                                <span className="font-bold text-indigo-600">
                                                    {formatPoints(badge.point_cost)} poin
                                                </span>
                                            </div>

                                            {isOwned ? (
                                                <button
                                                    type="button"
                                                    disabled
                                                    className="w-full cursor-not-allowed rounded-xl bg-green-100 px-4 py-3 text-sm font-semibold text-green-700"
                                                >
                                                    Sudah Dimiliki
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRedeem(badge)}
                                                    disabled={processing || insufficientPoints}
                                                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                            <div className="mb-4 text-5xl">🏆</div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Belum Ada Badge
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                                Katalog badge belum tersedia. Silakan kembali lagi nanti.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
