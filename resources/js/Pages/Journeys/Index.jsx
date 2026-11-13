import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function Index({ journeys }) {
    const articles = journeys?.data ?? [];

    return (
        <>
            <Head title="Sharing Journey" />

            <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
                <Navbar active="sharing" />

                <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 md:py-11">

                    {/* Header */}
                    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6594B1]">
                                Cerita Komunitas / Sharing
                            </span>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-800 md:text-[32px]">
                                Sharing Journey
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Bagikan pengalaman belajar, perjalanan bersama mentor,
                                dan cerita yang bisa menginspirasi orang lain.
                            </p>
                        </div>

                        <Link
                            href="/journeys/create"
                            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#6594B1] px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#56839F] hover:shadow-md"
                        >
                            + Tulis Cerita
                        </Link>
                    </header>

                    {/* Daftar Cerita */}
                    {articles.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6EFF4] text-2xl">
                                ✍️
                            </div>

                            <h2 className="mt-4 text-lg font-semibold text-slate-800">
                                Belum ada cerita
                            </h2>

                            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                                Jadilah orang pertama yang membagikan perjalanan
                                belajarmu.
                            </p>

                            <Link
                                href="/journeys/create"
                                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#6594B1] px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#56839F] hover:shadow-md"
                            >
                                Tulis Cerita Pertama
                            </Link>
                        </div>
                    ) : (
                        <section>
                            <div className="mb-5 flex items-end justify-between gap-4">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Cerita Komunitas
                                    </span>

                                    <h2 className="mt-1 text-xl font-semibold text-slate-800">
                                        Cerita Terbaru
                                    </h2>
                                </div>

                                <span className="text-sm text-slate-500">
                                    {journeys?.total ?? articles.length} cerita
                                </span>
                            </div>

                            <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {articles.map((journey) => (
                                    <article
                                        key={journey.id}
                                        className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                                    >
                                        {/* Ilustrasi */}
                                        <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#E6EFF4] to-[#EAF5E1] text-5xl">
                                            📖
                                        </div>

                                        {/* Konten */}
                                        <div className="flex flex-1 flex-col p-6">
                                            <p className="text-xs font-medium text-slate-500">
                                                Oleh {journey.author?.name ?? 'Pengguna Pathway'}
                                            </p>

                                            <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-6 text-slate-800">
                                                {journey.title}
                                            </h3>

                                            <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-sm leading-6 text-slate-500">
                                                {journey.content}
                                            </p>

                                            <div className="mt-5 border-t border-slate-200 pt-4">
                                                <Link
                                                    href={`/journeys/${journey.slug}`}
                                                    className="inline-flex items-center text-sm font-semibold text-[#6594B1] transition-colors duration-200 hover:text-[#56839F]"
                                                >
                                                    Baca selengkapnya →
                                                </Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Pagination */}
                    {journeys?.links && journeys.links.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {journeys.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                        link.active
                                            ? 'border-[#6594B1] bg-[#6594B1] text-white'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-[#6594B1] hover:bg-[#E6EFF4] hover:text-[#6594B1]'
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
