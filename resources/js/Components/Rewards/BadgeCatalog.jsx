import { useForm } from '@inertiajs/react';

export function formatPoints(value) {
    return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

export function MedalIllustration() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#C9DCE6] bg-white shadow-sm">
                <svg
                    className="h-16 w-16 text-[#6594B1]"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M20 7H32L27 27H16L20 7Z" fill="#95D56B" />
                    <path d="M44 7H32L37 27H48L44 7Z" fill="#6594B1" />
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

export default function BadgeCatalog({ badges = [], pointsBalance = 0 }) {
    const { post, processing } = useForm({});

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

    if (badges.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-[#C9D7DF] bg-white px-6 py-16 text-center">
                <div className="mx-auto mb-4 h-28 w-28">
                    <MedalIllustration />
                </div>

                <h3 className="text-lg font-bold text-[#263748]">
                    Belum Ada Badge
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7A8B99]">
                    Katalog badge belum tersedia. Silakan kembali lagi nanti.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {badges.map((badge) => {
                const isOwned = Boolean(badge.is_owned);
                const insufficientPoints =
                    Number(pointsBalance) < Number(badge.point_cost);

                return (
                    <article
                        key={badge.id}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-[#D8E3E9] bg-white shadow-[0_2px_8px_rgba(38,65,80,0.05)] transition duration-200 hover:-translate-y-1 hover:border-[#B7CCD8] hover:shadow-md"
                    >
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

                        <div className="flex flex-1 flex-col p-5">
                            <h3 className="text-base font-bold text-[#263748]">
                                {badge.name}
                            </h3>

                            <p className="mt-2 min-h-[60px] text-sm leading-6 text-[#7A8B99]">
                                {badge.description ||
                                    'Badge eksklusif untuk mentor Pathway.'}
                            </p>

                            <div className="mb-4 mt-4 flex items-center justify-between border-t border-[#EDF1F3] pt-4">
                                <span className="text-sm text-[#7A8B99]">
                                    Harga badge
                                </span>

                                <span className="font-bold text-[#6594B1]">
                                    {formatPoints(badge.point_cost)} poin
                                </span>
                            </div>

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
                                        onClick={() => handleRedeem(badge)}
                                        disabled={
                                            processing || insufficientPoints
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
    );
}
