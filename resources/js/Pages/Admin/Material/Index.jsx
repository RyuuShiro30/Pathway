import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ course, materials }) {
    const handleDelete = (materi) => {
        if (confirm(`Yakin ingin menghapus materi "${materi.title}"?`)) {
            router.delete(`/admin/materials/${materi.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout>
            <Head title={`Daftar Materi | ${course.title}`} />

            <div className="p-8 max-w-5xl mx-auto">
                <Link
                    href="/admin/courses"
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 inline-block"
                >
                    &larr; Kembali ke Daftar Course
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Materi Course</h1>
                        <p className="text-slate-500 mt-1">
                            Mengelola materi untuk: <span className="font-bold text-[#6594B1]">{course.title}</span>
                        </p>
                    </div>
                    <Link
                        href={`/admin/courses/${course.id}/materials/create`}
                        className="px-6 py-3 bg-[#6594B1] hover:bg-[#6b9bc3] text-white font-bold rounded-xl shadow-sm transition-all"
                    >
                        + Tambah Materi Baru
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <th className="p-4 font-semibold text-center w-20">Urutan</th>
                                <th className="p-4 font-semibold">Section</th>
                                <th className="p-4 font-semibold">Judul Materi</th>
                                <th className="p-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500 font-medium">
                                        Belum ada materi untuk course ini.
                                    </td>
                                </tr>
                            ) : (
                                materials.map((materi) => (
                                    <tr key={materi.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-center font-bold text-slate-700">{materi.sequence_order}</td>
                                        <td className="p-4 text-sm text-slate-500">{materi.section_name}</td>
                                        <td className="p-4 font-semibold text-slate-900">{materi.title}</td>
                                        <td className="p-4 text-center space-x-3">
                                            <Link
                                                href={`/admin/materials/${materi.id}/edit`}
                                                className="text-blue-500 hover:text-blue-700 text-sm font-bold"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(materi)}
                                                className="text-red-500 hover:text-red-700 text-sm font-bold"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}