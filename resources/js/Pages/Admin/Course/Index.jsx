import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Index({ courses }) {
    return (
        <AdminLayout>
            <Head title="Kelola Course | Admin Pathway" />
            
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">Kelola Course</h1>
                    
                    <Link 
                        href="/admin/courses/create" 
                        className="px-5 py-2.5 bg-[#6594B1] hover:bg-[#6b9bc3] text-white font-bold rounded-xl shadow-sm transition"
                    >
                        + Tambah Course
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                <th className="p-4 pl-6">Judul Course</th>
                                <th className="p-4">Level</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length > 0 ? (
                                courses.map((course) => (
                                    <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="p-4 pl-6 font-bold text-slate-800">{course.title}</td>
                                        <td className="p-4 text-slate-600 capitalize">{course.level}</td>
                                        <td className="p-4">
                                            {course.is_published ? (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Published</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Draft</span>
                                            )}
                                        </td>
                                        <td className="p-4 pr-6 text-right space-x-3">
                                            <Link 
                                                href={`/admin/courses/${course.id}/materials`} 
                                                className="text-sm font-semibold text-[#6594B1] hover:underline"
                                            >
                                                Kelola Materi
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">Belum ada course. Silakan tambah course baru.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}