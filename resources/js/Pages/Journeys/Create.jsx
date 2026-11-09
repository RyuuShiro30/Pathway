import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        content: '',
        status: 'published',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/journeys');
    };

    return (
        <>
            <Head title="Tulis Cerita" />

            <div className="min-h-screen w-full bg-gray-50">
                <Navbar />

                <main className="w-full px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
                    <div className="mb-8 flex flex-col gap-3">
                        <Link
                            href="/journeys"
                            className="w-fit text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            ← Kembali ke Sharing Journey
                        </Link>

                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                                Cerita Komunitas
                            </p>

                            <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                                Tulis Ceritamu
                            </h1>

                            <p className="mt-3 text-gray-600">
                                Bagikan pengalaman dan perjalanan belajarmu agar bisa
                                menginspirasi pengguna Pathway lainnya.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="w-full space-y-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10"
                    >
                        <div>
                            <label className="mb-3 block font-semibold text-gray-800">
                                Judul Cerita
                            </label>

                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Masukkan judul ceritamu..."
                                className="w-full rounded-xl border border-gray-300 px-5 py-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                            {errors.title && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-3 block font-semibold text-gray-800">
                                Isi Cerita
                            </label>

                            <textarea
                                rows={8}
                                value={data.content}
                                onChange={(e) => setData('content', e.target.value)}
                                placeholder="Ceritakan pengalaman belajar, perjalanan bersama mentor, atau pencapaianmu di Pathway..."
                                className="w-full resize-y rounded-xl border border-gray-300 px-5 py-4 leading-7 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                            {errors.content && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.content}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-3 block font-semibold text-gray-800">
                                Status Cerita
                            </label>

                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full rounded-xl border border-gray-300 px-5 py-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="published">Publikasikan</option>
                                <option value="draft">Simpan sebagai Draft</option>
                            </select>

                            {errors.status && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.status}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-6 sm:flex-row">
                            <Link
                                href="/journeys"
                                className="rounded-xl border border-gray-300 px-8 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Cerita'}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </>
    );
}
