import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ merchandises }) {
    const handleDelete = (merchandise) => {
        if (confirm(`Yakin ingin menghapus merchandise "${merchandise.name}"?`)) {
            router.delete(`/admin/merchandises/${merchandise.id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Kelola Merchandise" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                Kelola Merchandise
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Kelola daftar merchandise yang dapat ditukarkan mentor menggunakan poin.
                            </p>
                        </div>

                        <Link
                            href="/admin/merchandises/create"
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#6594B1] text-white rounded-lg hover:bg-[#527f9b] transition font-medium"
                        >
                            + Tambah Merchandise
                        </Link>
                    </div>

                    {merchandises.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
                            <div className="text-4xl mb-3">📦</div>
                            <h2 className="text-lg font-semibold text-slate-700">
                                Belum Ada Merchandise
                            </h2>
                            <p className="text-sm text-slate-500 mt-2">
                                Silakan tambahkan merchandise untuk mulai menyediakan reward bagi mentor.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-4">Merchandise</th>
                                            <th className="px-6 py-4">Harga Poin</th>
                                            <th className="px-6 py-4">Stok</th>
                                            <th className="px-6 py-4">Jumlah Penukaran</th>
                                            <th className="px-6 py-4 text-center">Aksi</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {merchandises.map((merchandise) => (
                                            <tr key={merchandise.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {merchandise.image_url ? (
                                                            <img
                                                                src={merchandise.image_url}
                                                                alt={merchandise.name}
                                                                className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                                                            />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-2xl">
                                                                📦
                                                            </div>
                                                        )}

                                                        <div>
                                                            <p className="font-semibold text-slate-800">
                                                                {merchandise.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                                {merchandise.description || 'Tidak ada deskripsi'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 font-medium text-slate-700">
                                                    {Number(merchandise.point_cost).toLocaleString('id-ID')} poin
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        merchandise.stock > 0
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {merchandise.stock} tersedia
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-slate-700">
                                                    {merchandise.user_merchandise_count ?? 0} kali
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            href={`/admin/merchandises/${merchandise.id}/edit`}
                                                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                                                        >
                                                            Edit
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(merchandise)}
                                                            disabled={merchandise.user_merchandise_count > 0}
                                                            title={
                                                                merchandise.user_merchandise_count > 0
                                                                    ? 'Merchandise sudah pernah ditukarkan'
                                                                    : 'Hapus merchandise'
                                                            }
                                                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
