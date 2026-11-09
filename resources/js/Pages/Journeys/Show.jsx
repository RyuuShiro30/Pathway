import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function Show({ journey }) {
    return (
        <>
            <Head title={journey.title} />

            <div className="min-h-screen w-full bg-gray-50">
                <Navbar />

                <main className="w-full px-6 py-10 sm:px-10 lg:px-14">
                    <Link
                        href="/journeys"
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        ← Kembali ke Sharing Journey
                    </Link>

                    <article className="mt-8 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-7xl">
                            📖
                        </div>

                        <div className="p-7 sm:p-10 lg:p-12">
                            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                                Cerita Komunitas
                            </p>

                            <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                                {journey.title}
                            </h1>

                            <p className="mt-4 text-sm text-gray-500">
                                Ditulis oleh {journey.author?.name ?? 'Pengguna Pathway'}
                            </p>

                            <div className="my-8 border-t border-gray-100" />

                            <div className="whitespace-pre-line text-base leading-8 text-gray-700">
                                {journey.content}
                            </div>

                            <div className="mt-10 border-t border-gray-100 pt-6">
                                <Link
                                    href="/journeys"
                                    className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
                                >
                                    Kembali ke Daftar Cerita
                                </Link>
                            </div>
                        </div>
                    </article>
                </main>
            </div>
        </>
    );
}
