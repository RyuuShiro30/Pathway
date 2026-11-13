
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ badges = [] }) {
    const handleDelete = (badge) => {
        if (window.confirm(`Yakin ingin menghapus badge "${badge.name}"?`)) {
            router.delete(`/admin/badges/${badge.id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Kelola Badge | Admin Pathway" />

            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">
                        Kelola Badge
                    </h1>

                    <Link
                        href="/admin/badges/create"
                        className="px-5 py-2.5 bg-[#6594B1] hover:bg-[#6b9bc3] text-white font-bold rounded-xl shadow-sm transition"
                    >
                        + Tambah Badge
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                <th className="p-4 pl-6">Nama Badge</th>
                                <th className="p-4">Deskripsi</th>
                                <th className="p-4">Harga Poin</th>
                                <th className="p-4">Dimiliki</th>
                                <th className="p-4 text-right pr-6">Aksi</th>
                            </tr>
                        </thead>

                        <tbody>
                            {badges.length > 0 ? (
                                badges.map((badge) => (
                                    <tr
                                        key={badge.id}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                                    >
                                        <td className="p-4 pl-6 font-bold text-slate-800">
                                            {badge.name}
                                        </td>

                                        <td className="p-4 text-slate-600">
                                            {badge.description || '-'}
                                        </td>

                                        <td className="p-4 text-slate-600 font-semibold">
                                            {badge.point_cost} poin
                                        </td>

                                        <td className="p-4 text-slate-600">
                                            {badge.user_badges_count ?? 0} mentor
                                        </td>

                                        <td className="p-4 pr-6 text-right space-x-3">
                                            <Link
                                                href={`/admin/badges/${badge.id}/edit`}
                                                className="text-sm font-semibold text-[#6594B1] hover:underline"
                                            >
                                                Edit
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(badge)}
                                                className="text-sm font-semibold text-red-600 hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        Belum ada badge. Silakan tambah badge baru.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
