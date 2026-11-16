import { Head, Link } from '@inertiajs/react';
import MentorNavbar from '@/Components/MentorNavbar';
import { formatPoints } from '@/Components/Rewards/BadgeCatalog';

const typeLabels = {
    earned_mentoring: 'Sesi Mentoring Selesai',
    admin_bonus: 'Bonus Poin Admin',
    redeemed_badge: 'Penukaran Badge',
    redeemed_merchandise: 'Penukaran Merchandise',
};

function formatDate(value) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function History({ transactions = [], pointsBalance = 0 }) {
    return (
        <>
            <Head title="Riwayat Poin" />

            <div className="min-h-screen bg-[#F4F7F9] font-sans text-[#172033]">
                <MentorNavbar active="rewards" />

                <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <Link
                            href={route('mentor.rewards.index')}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#6594B1] transition hover:text-[#4F7F9B]"
                        >
                            <span>←</span>
                            Kembali ke Toko Poin
                        </Link>

                        <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#172033]">
                            Riwayat Poin
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-[#7A8B99]">
                            Catatan perolehan dan penukaran poin kamu.
                        </p>
                    </div>

                    <div className="mb-6 rounded-2xl border border-[#C9DCE6] bg-[#E6EFF4] p-6">
                        <p className="text-sm font-semibold text-[#5E7F95]">
                            Saldo Poin Saat Ini
                        </p>

                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-4xl font-bold tracking-tight text-[#263748]">
                                {formatPoints(pointsBalance)}
                            </span>

                            <span className="text-lg font-medium text-[#6594B1]">
                                Poin
                            </span>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#D8E3E9] bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#D8E3E9] bg-[#F4F7F9] text-xs font-semibold uppercase tracking-wide text-[#7A8B99]">
                                    <tr>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4">
                                            Keterangan
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Poin
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EDF1F3]">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-6 py-16 text-center"
                                            >
                                                <p className="text-base font-bold text-[#263748]">
                                                    Belum Ada Transaksi Poin
                                                </p>
                                                <p className="mt-2 text-sm text-[#7A8B99]">
                                                    Selesaikan sesi mentoring
                                                    gratis untuk mulai
                                                    mengumpulkan poin.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className="hover:bg-[#F9FBFC]"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-[#7A8B99]">
                                                    {formatDate(
                                                        transaction.created_at,
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-[#263748]">
                                                        {typeLabels[
                                                            transaction
                                                                .transaction_type
                                                        ] ||
                                                            transaction.transaction_type}
                                                    </p>

                                                    {transaction.description && (
                                                        <p className="mt-1 text-xs text-[#7A8B99]">
                                                            {
                                                                transaction.description
                                                            }
                                                        </p>
                                                    )}
                                                </td>

                                                <td
                                                    className={`whitespace-nowrap px-6 py-4 text-right font-bold ${
                                                        transaction.is_earning
                                                            ? 'text-[#4F7F37]'
                                                            : 'text-red-600'
                                                    }`}
                                                >
                                                    {transaction.is_earning
                                                        ? '+'
                                                        : '-'}
                                                    {formatPoints(
                                                        transaction.amount,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
