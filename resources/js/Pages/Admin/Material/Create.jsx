import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Create({ course, existingSections = [], nextOrder = 1 }) {
    const hasSavedSections = existingSections.length > 0;
    const [isNewSection, setIsNewSection] = useState(!hasSavedSections);

    const { data, setData, post, processing, errors } = useForm({
        section_name: hasSavedSections ? existingSections[existingSections.length - 1] : '',
        title: '',
        content: '',
        video_url: '',
        sequence_order: nextOrder,
    });

    const handleSectionSelect = (e) => {
        const value = e.target.value;
        if (value === '__new__') {
            setIsNewSection(true);
            setData('section_name', '');
        } else {
            setIsNewSection(false);
            setData('section_name', value);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(`/admin/courses/${course.id}/materials`);
    };

    const inputClass =
        'w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#6594B1] outline-none';

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
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nama Bagian (Section)
                        </label>

                        {hasSavedSections && (
                            <select
                                value={isNewSection ? '__new__' : data.section_name}
                                onChange={handleSectionSelect}
                                className={`${inputClass} ${isNewSection ? 'mb-3' : ''}`}
                            >
                                {existingSections.map((section, idx) => (
                                    <option key={idx} value={section}>
                                        {section}
                                    </option>
                                ))}
                                <option value="__new__">+ Buat Section Baru...</option>
                            </select>
                        )}

                        {isNewSection && (
                            <input
                                type="text"
                                value={data.section_name}
                                onChange={(e) => setData('section_name', e.target.value)}
                                className={inputClass}
                                placeholder="Contoh: Section 1: Dasar Teori"
                                required
                            />
                        )}

                        {errors.section_name && (
                            <p className="text-red-500 text-xs mt-1">{errors.section_name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Judul Materi</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            className={inputClass}
                            required
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Isi Materi</label>
                        <textarea
                            rows="6"
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            className={inputClass}
                            required
                        />
                        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (opsional)</label>
                        <input
                            type="url"
                            value={data.video_url}
                            onChange={(e) => setData('video_url', e.target.value)}
                            className={inputClass}
                        />
                        {errors.video_url && <p className="text-red-500 text-xs mt-1">{errors.video_url}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Urutan Modul</label>
                        <input
                            type="number"
                            value={data.sequence_order}
                            onChange={(e) => setData('sequence_order', e.target.value)}
                            className={inputClass}
                            required
                        />
                        {errors.sequence_order && (
                            <p className="text-red-500 text-xs mt-1">{errors.sequence_order}</p>
                        )}
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