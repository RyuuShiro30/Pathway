import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Index({ journeys }) {
    const articles = journeys?.data ?? [];

    return (
        <>
            <Head title="Sharing Journey" />

            <div className="min-h-screen bg-gray-50">
                <header className="border-b border-gray-200 bg-white">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                        <Link
                            href="/"
                            className="text-2xl font-bold text-indigo-600"
                        >
                            Pathway
                        </Link>

                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-gray-600 hover:text-indigo-600"
                        >
                            Dashboard
                        </Link>
                    </div>
                </header>

                <main className="mx-auto max-w-6xl px-6 py-12">
                    <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                                Cerita Komunitas
                            </p>

                            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                                Sharing Journey
                            </h1>

                            <p className="mt-3 max-w-2xl text-gray-600">
                                Bagikan pengalaman belajar, perjalanan bersama mentor,
                                dan cerita yang bisa menginspirasi orang lain.
                            </p>
                        </div>

                        <Link
                            href="/journeys/create"
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
                        >
                            + Tulis Cerita
                        </Link>
                    </div>

                    {articles.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                            <div className="mb-4 text-4xl">✍️</div>

                            <h2 className="text-xl font-semibold text-gray-800">
                                Belum ada cerita
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-gray-500">
                                Jadilah orang pertama yang membagikan perjalanan
                                belajarmu di Pathway.
                            </p>

                            <Link
                                href="/journeys/create"
                                className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-700"
                            >
                                Tulis Cerita Pertama
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {articles.map((journey) => (
                                <article
                                    key={journey.id}
                                    className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-5xl">
                                        📖
                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <p className="text-sm text-gray-500">
                                            Oleh {journey.author?.name ?? 'Pengguna Pathway'}
                                        </p>

                                        <h2 className="mt-3 text-xl font-bold text-gray-900">
                                            {journey.title}
                                        </h2>

                                        <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-sm leading-6 text-gray-600">
                                            {journey.content}
                                        </p>

                                        <Link
                                            href={`/journeys/${journey.slug}`}
                                            className="mt-5 font-semibold text-indigo-600 hover:text-indigo-800"
                                        >
                                            Baca selengkapnya →
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {journeys?.links && journeys.links.length > 3 && (
                        <div className="mt-10 flex flex-wrap justify-center gap-2">
                            {journeys.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-lg border px-4 py-2 text-sm ${
                                        link.active
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                                    } ${
                                        !link.url
                                            ? 'pointer-events-none opacity-50'
                                            : ''
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
