import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

const statusMeta = {
    draft: {
        label: 'Draft',
        className: 'bg-slate-100 text-slate-600',
    },
    menunggu: {
        label: 'Menunggu Moderasi',
        className: 'bg-amber-100 text-amber-800',
    },
    published: {
        label: 'Tayang',
        className: 'bg-emerald-100 text-emerald-800',
    },
    ditolak: {
        label: 'Ditolak',
        className: 'bg-rose-100 text-rose-700',
    },
};

export default function Mine({ journeys }) {
    const { flash = {} } = usePage().props;
    const articles = journeys?.data ?? [];

    const handleDelete = (journey) => {
        const confirmed = window.confirm(
            `Hapus cerita "${journey.title}"? Tindakan ini tidak dapat dibatalkan.`,
        );

        if (confirmed) {
            router.delete(`/journeys/${journey.slug}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Cerita Saya" />

            <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
                <Navbar active="sharing" />

                <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:py-11">
                    <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6594B1]">
                                Cerita Komunitas / Sharing
                            </span>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-800 md:text-[32px]">
                                Cerita Saya
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Kelola semua cerita yang kamu tulis beserta
                                status moderasinya.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href="/journeys"
                                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                            >
                                Feed Publik
                            </Link>

                            <Link
                                href="/journeys/create"
                                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#6594B1] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F]"
                            >
                                + Tulis Cerita
                            </Link>
                        </div>
                    </header>

                    {flash.success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {articles.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6EFF4] text-2xl">
                                ✍️
                            </div>

                            <h2 className="mt-4 text-lg font-semibold text-slate-800">
                                Belum ada cerita
                            </h2>

                            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                                Mulai tulis cerita pertamamu dan kirim untuk
                                moderasi admin.
                            </p>

                            <Link
                                href="/journeys/create"
                                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-[#6594B1] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F]"
                            >
                                Tulis Cerita Pertama
                            </Link>
                        </div>
                    ) : (
                        <section className="flex flex-col gap-4">
                            {articles.map((journey) => {
                                const meta =
                                    statusMeta[journey.status] ??
                                    statusMeta.draft;

                                return (
                                    <article
                                        key={journey.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                </div>

                                                <h2 className="mt-3 text-lg font-semibold text-slate-800">
                                                    {journey.title}
                                                </h2>

                                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                                                    {journey.content}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {journey.status ===
                                                    'published' && (
                                                    <Link
                                                        href={`/journeys/${journey.slug}`}
                                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                                    >
                                                        Lihat
                                                    </Link>
                                                )}

                                                <Link
                                                    href={`/journeys/${journey.slug}/edit`}
                                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    Edit
                                                </Link>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(journey)
                                                    }
                                                    className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>

                                        {journey.status === 'ditolak' && (
                                            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                                                <p className="font-semibold">
                                                    Catatan Moderasi
                                                </p>
                                                <p className="mt-1">
                                                    {journey.moderation_note ||
                                                        'Tidak ada catatan moderasi.'}
                                                </p>
                                            </div>
                                        )}

                                        {journey.status === 'menunggu' && (
                                            <p className="mt-4 text-xs text-amber-700">
                                                Cerita sedang ditinjau admin dan
                                                belum tampil di feed publik.
                                            </p>
                                        )}
                                    </article>
                                );
                            })}
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
