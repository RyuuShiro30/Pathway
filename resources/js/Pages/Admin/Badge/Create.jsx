import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        point_cost: '',
        image_url: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/badges');
    };

    const inputClass =
        'w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#6594B1]';

    return (
        <AdminLayout>
            <Head title="Tambah Badge | Admin Pathway" />

            <div className="p-8 max-w-3xl mx-auto">
                <Link
                    href="/admin/badges"
                    className="text-sm font-medium text-slate-500 hover:text-slate-800 mb-2 inline-block"
                >
                    &larr; Kembali ke Daftar Badge
                </Link>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">
                    Tambah Badge Baru
                </h1>

                <form
                    onSubmit={submit}
                    className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Nama Badge
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={inputClass}
                            placeholder="Masukkan nama badge"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            rows="5"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className={inputClass}
                            placeholder="Masukkan deskripsi badge"
                        />
                        {errors.description && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Harga Poin
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={data.point_cost}
                            onChange={(e) => setData('point_cost', e.target.value)}
                            className={inputClass}
                            placeholder="Masukkan jumlah poin"
                        />
                        {errors.point_cost && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.point_cost}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            URL Gambar Badge
                        </label>
                        <input
                            type="url"
                            value={data.image_url}
                            onChange={(e) => setData('image_url', e.target.value)}
                            className={inputClass}
                            placeholder="https://example.com/badge.png"
                        />
                        {errors.image_url && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.image_url}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-[#6594B1] hover:bg-[#6b9bc3] text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Badge'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}