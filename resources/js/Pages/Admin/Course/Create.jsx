import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        level: 'beginner',
        is_published: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/courses');
    };

    const inputClass =
        'w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#6594B1]';

    return (
        <AdminLayout>
            <Head title="Tambah Course | Admin Pathway" />

            <div className="p-8 max-w-3xl mx-auto">
                <Link
                    href="/admin/courses"
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 inline-block"
                >
                    &larr; Kembali ke Daftar Course
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Tambah Course Baru</h1>

                <form
                    onSubmit={submit}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Judul Course</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className={inputClass}
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                        <textarea
                            rows="5"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className={inputClass}
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                        <select
                            value={data.level}
                            onChange={(e) => setData('level', e.target.value)}
                            className={inputClass}
                        >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                        {errors.level && <p className="text-red-500 text-xs mt-1">{errors.level}</p>}
                    </div>

                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                            type="checkbox"
                            checked={data.is_published}
                            onChange={(e) => setData('is_published', e.target.checked)}
                        />
                        Publikasikan course ini
                    </label>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-[#6594B1] hover:bg-[#6b9bc3] text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Course'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}