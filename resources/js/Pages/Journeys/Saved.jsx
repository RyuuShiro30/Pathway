import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function Saved({ journeys }) {
    const { flash = {} } = usePage().props;
    const articles = journeys?.data ?? [];

    const removeBookmark = (journey) => {
        router.post(
            `/journeys/${journey.slug}/bookmark`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Cerita Tersimpan" />

            <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
                <Navbar active="sharing" />

                <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:py-11">
                    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6594B1]">
                                Cerita Komunitas / Sharing
                            </span>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-800 md:text-[32px]">
                                Cerita Tersimpan
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Kumpulan cerita yang kamu simpan untuk dibaca
                                kembali nanti.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/journeys"
                                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                            >
                                Feed Publik
                            </Link>

                            <Link
                                href="/journeys/mine"
                                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#6594B1] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F]"
                            >
                                Cerita Saya
                            </Link>
                        </div>
                    </header>

                    {flash.success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                            {flash.error}
                        </div>
                    )}

                    {articles.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6EFF4] text-2xl">
                                🔖
                            </div>

                            <h2 className="mt-4 text-lg font-semibold text-slate-800">
                                Belum ada cerita tersimpan
                            </h2>

                            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                                Simpan cerita menarik dari feed publik agar mudah
                                ditemukan kembali.
                            </p>

                            <Link
                                href="/journeys"
                                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#6594B1] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F]"
                            >
                                Jelajahi Cerita
                            </Link>
                        </div>
                    ) : (
                        <section className="flex flex-col gap-4">
                            {articles.map((journey) => (
                                <article
                                    key={journey.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-slate-500">
                                                Oleh{' '}
                                                {journey.author?.name ??
                                                    'Pengguna Pathway'}
                                            </p>

                                            <h2 className="mt-2 text-lg font-semibold text-slate-800">
                                                {journey.title}
                                            </h2>

                                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                                                {journey.content}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                href={`/journeys/${journey.slug}`}
                                                className="rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#56839F]"
                                            >
                                                Baca
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeBookmark(journey)
                                                }
                                                className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                            >
                                                Hapus Simpanan
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </section>
                    )}

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
