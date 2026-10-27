import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ course, materials }) {
    return (
        <AdminLayout>
            <Head title={`Kelola Materi: ${course.title} | Admin`} />
            
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin/courses" className="text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 inline-block">
                            &larr; Kembali ke Daftar Course
                        </Link>
                        <h1 className="text-3xl font-extrabold text-slate-900">Materi: {course.title}</h1>
                    </div>
                    
                    <Link 
                        href={`/admin/courses/${course.id}/materials/create`} 
                        className="px-5 py-2.5 bg-[#6594B1] hover:bg-[#6b9bc3] text-white font-bold rounded-xl shadow-sm transition"
                    >
                        + Tambah Materi
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                <th className="p-4 pl-6 w-20">Urutan</th>
                                <th className="p-4">Judul Materi</th>
                                <th className="p-4">Video URL</th>
                                <th className="p-4 text-right pr-6">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.length > 0 ? (
                                materials.map((material) => (
                                    <tr key={material.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="p-4 pl-6 font-bold text-[#6594B1]">Modul {material.sequence_order}</td>
                                        <td className="p-4 font-semibold text-slate-800">{material.title}</td>
                                        <td className="p-4 text-sm text-slate-500 truncate max-w-xs">
                                            {material.video_url || 'Tidak ada video'}
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-3">
                                            <button className="text-sm font-semibold text-amber-500 hover:underline">Edit</button>
                                            <button className="text-sm font-semibold text-red-500 hover:underline">Hapus</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">Belum ada materi di course ini.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}