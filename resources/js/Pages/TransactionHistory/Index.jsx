import { Head, Link } from '@inertiajs/react';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function TransactionHistoryIndex({ transactions, userRole }) {
    const dataList = transactions.data || [];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 sm:p-8">
            <Head title="Riwayat Transaksi - Pathway" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                            Riwayat Transaksi
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            {userRole === 'admin' 
                                ? 'Menampilkan seluruh catatan transaksi pembayaran dalam sistem.' 
                                : 'Catatan riwayat pembayaran dan status sesi mentoring Anda.'}
                        </p>
                    </div>
                    <Link
                        href={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold shadow-xs hover:bg-slate-50"
                    >
                        ← Kembali ke Dashboard
                    </Link>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                                    <th className="p-4">ID / Tanggal</th>
                                    {userRole !== 'student' && <th className="p-4">Mentee</th>}
                                    {userRole !== 'mentor' && <th className="p-4">Mentor</th>}
                                    <th className="p-4">Tipe / Durasi</th>
                                    <th className="p-4">Total Biaya</th>
                                    <th className="p-4">Status DP</th>
                                    <th className="p-4">Status Refund</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dataList.length > 0 ? (
                                    dataList.map((trx) => (
                                        <tr key={trx.id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-4 font-medium text-slate-700">
                                                <div className="font-bold">#TRX-{trx.id}</div>
                                                <div className="text-[11px] text-slate-400">
                                                    {new Date(trx.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            {userRole !== 'student' && (
                                                <td className="p-4 font-semibold text-slate-800">{trx.student_name}</td>
                                            )}
                                            {userRole !== 'mentor' && (
                                                <td className="p-4 font-semibold text-slate-800">{trx.mentor_name}</td>
                                            )}
                                            <td className="p-4">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                    trx.is_free_session ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                                                }`}>
                                                    {trx.is_free_session ? 'Gratis' : `Berbayar (${trx.duration_hours} Jam)`}
                                                </span>
                                            </td>
                                            <td className="p-4 font-black text-slate-900">
                                                {trx.is_free_session ? 'Rp 0' : rupiahFormatter.format(trx.total_price)}
                                            </td>
                                            <td className="p-4">
                                                <span className="capitalize px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                                                    {trx.payment_dp_status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`capitalize px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                                                    trx.refund_status === 'selesai' ? 'bg-emerald-50 text-emerald-700' :
                                                    trx.refund_status === 'menunggu' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {trx.refund_status ? trx.refund_status.replace('_', ' ') : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-slate-400">
                                            Belum ada riwayat transaksi yang tercatat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}