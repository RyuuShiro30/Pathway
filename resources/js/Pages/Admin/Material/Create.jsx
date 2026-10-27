import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Create({ course }) {
    const { data, setData, post, processing, errors } = useForm({
        section_name: '',
        title: '',
        content: '',
        video_url: '',
        sequence_order: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/admin/courses/${course.id}/materials`);
    };

    return (
        <AdminLayout>
            <Head title={`Tambah Materi: ${course.title} | Admin`} />

            <div className="p-8 max-w-3xl mx-auto">
                <Link
                    href={`/admin/courses/${course.id}/materials`}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 inline-block"
                >
                    &larr; Kembali ke Daftar Materi
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">
                    Tambah Materi: {course.title}
                </h1>

                <form
                    onSubmit={submit}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nama Bagian (Section)</label>
                        <input
                            type="text"
                            value={data.section_name}
                            onChange={(e) => setData('section_name', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6594B1] outline-none"
                            placeholder="Contoh: Bab 1: Pendahuluan"
                            required
                        />
                        {errors.section_name && <p className="text-red-500 text-xs mt-1">{errors.section_name}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Judul Materi</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#6594B1]"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Isi Materi</label>
                        <textarea
                            rows="6"
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#6594B1]"
                        />
                        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (opsional)</label>
                        <input
                            type="url"
                            value={data.video_url}
                            onChange={(e) => setData('video_url', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#6594B1]"
                        />
                        {errors.video_url && <p className="text-red-500 text-xs mt-1">{errors.video_url}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Urutan Modul</label>
                        <input
                            type="number"
                            value={data.sequence_order}
                            onChange={(e) => setData('sequence_order', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#6594B1]"
                        />
                        {errors.sequence_order && <p className="text-red-500 text-xs mt-1">{errors.sequence_order}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-[#6594B1] hover:bg-[#6b9bc3] text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Materi'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}