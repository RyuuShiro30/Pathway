import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import ReactMarkdown from 'react-markdown';
import Navbar from '@/Components/Navbar';

const markdownComponents = {
    h1: ({ children }) => (
        <h2 className="mt-8 text-2xl font-bold text-slate-900">{children}</h2>
    ),
    h2: ({ children }) => (
        <h3 className="mt-7 text-xl font-bold text-slate-900">{children}</h3>
    ),
    h3: ({ children }) => (
        <h4 className="mt-6 text-lg font-semibold text-slate-900">
            {children}
        </h4>
    ),
    p: ({ children }) => (
        <p className="mt-4 leading-8 text-slate-700">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className="leading-7">{children}</li>,
    strong: ({ children }) => (
        <strong className="font-semibold text-slate-900">{children}</strong>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#6594B1] underline underline-offset-2"
        >
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mt-4 border-l-4 border-[#C9DCE6] bg-[#F4F7F9] px-4 py-2 italic text-slate-600">
            {children}
        </blockquote>
    ),
    code: ({ className, children }) => (
        <code
            className={
                className ||
                'rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800'
            }
        >
            {children}
        </code>
    ),
    pre: ({ children }) => (
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
            {children}
        </pre>
    ),
};

function formatDate(value) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(value));
}

function getInitials(name) {
    if (!name) return 'P';

    return (
        name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'P'
    );
}

export default function Show({ journey, comments = [], interactions }) {
    const { auth, flash = {} } = usePage().props;
    const user = auth?.user;

    const [showReport, setShowReport] = useState(false);

    const likeForm = useForm({});
    const bookmarkForm = useForm({});
    const commentForm = useForm({ body: '' });
    const reportForm = useForm({ reason: '' });

    const toggleLike = () => {
        likeForm.post(`/journeys/${journey.slug}/like`, {
            preserveScroll: true,
        });
    };

    const toggleBookmark = () => {
        bookmarkForm.post(`/journeys/${journey.slug}/bookmark`, {
            preserveScroll: true,
        });
    };

    const toggleComments = () => {
        router.patch(
            `/journeys/${journey.slug}/comments-setting`,
            {},
            { preserveScroll: true },
        );
    };

    const submitComment = (e) => {
        e.preventDefault();

        commentForm.post(`/journeys/${journey.slug}/comments`, {
            preserveScroll: true,
            onSuccess: () => commentForm.reset(),
        });
    };

    const deleteComment = (comment) => {
        if (!window.confirm('Hapus komentar ini?')) return;

        router.delete(`/journeys/${journey.slug}/comments/${comment.id}`, {
            preserveScroll: true,
        });
    };

    const submitReport = (e) => {
        e.preventDefault();

        reportForm.post(`/journeys/${journey.slug}/report`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowReport(false);
                reportForm.reset();
            },
        });
    };

    return (
        <>
            <Head title={journey.title} />

            <div className="min-h-screen w-full bg-gray-50">
                <Navbar active="sharing" />

                <main className="w-full px-6 py-10 sm:px-10 lg:px-14">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href="/journeys"
                            className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            ← Kembali ke Sharing Journey
                        </Link>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/journeys/saved"
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                                Cerita Tersimpan
                            </Link>

                            {interactions.can_manage && (
                                <Link
                                    href={`/journeys/${journey.slug}/edit`}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    Edit Cerita
                                </Link>
                            )}
                        </div>
                    </div>

                    {flash.success && (
                        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {flash.error && (
                        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
                            {flash.error}
                        </div>
                    )}

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
                                Ditulis oleh{' '}
                                {journey.author?.name ?? 'Pengguna Pathway'} ·{' '}
                                {formatDate(journey.created_at)}
                            </p>

                            <div className="my-8 border-t border-gray-100" />

                            <div>
                                <ReactMarkdown
                                    components={markdownComponents}
                                >
                                    {journey.content}
                                </ReactMarkdown>
                            </div>

                            <div className="mt-10 flex flex-wrap gap-3 border-t border-gray-100 pt-6">
                                <button
                                    type="button"
                                    onClick={toggleLike}
                                    disabled={likeForm.processing}
                                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                                        interactions.is_liked
                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>
                                        {interactions.is_liked ? '♥' : '♡'}
                                    </span>
                                    {interactions.likes_count} Suka
                                </button>

                                <button
                                    type="button"
                                    onClick={toggleBookmark}
                                    disabled={bookmarkForm.processing}
                                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                                        interactions.is_bookmarked
                                            ? 'bg-[#E6EFF4] text-[#4F7F9B]'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>
                                        {interactions.is_bookmarked
                                            ? '🔖'
                                            : '📑'}
                                    </span>
                                    {interactions.is_bookmarked
                                        ? 'Tersimpan'
                                        : 'Simpan'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowReport(true)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                                >
                                    <span>🚩</span>
                                    Laporkan
                                </button>
                            </div>
                        </div>
                    </article>

                    <section className="mt-8 w-full rounded-2xl border border-gray-100 bg-white p-7 shadow-sm sm:p-10">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-gray-900">
                                Komentar ({interactions.comments_count})
                            </h2>

                            {interactions.can_toggle_comments && (
                                <button
                                    type="button"
                                    onClick={toggleComments}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    {journey.allow_comments
                                        ? 'Nonaktifkan Komentar'
                                        : 'Aktifkan Komentar'}
                                </button>
                            )}
                        </div>

                        {journey.allow_comments ? (
                            user ? (
                                <form
                                    onSubmit={submitComment}
                                    className="mt-5"
                                >
                                    <textarea
                                        rows="3"
                                        value={commentForm.data.body}
                                        onChange={(e) =>
                                            commentForm.setData(
                                                'body',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Tulis komentar yang positif..."
                                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                    />

                                    {commentForm.errors.body && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {commentForm.errors.body}
                                        </p>
                                    )}

                                    <div className="mt-3 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={commentForm.processing}
                                            className="rounded-xl bg-[#6594B1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#56839F] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {commentForm.processing
                                                ? 'Mengirim...'
                                                : 'Kirim Komentar'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                    <Link
                                        href="/login"
                                        className="font-semibold text-[#6594B1] underline"
                                    >
                                        Masuk
                                    </Link>{' '}
                                    untuk menulis komentar.
                                </p>
                            )
                        ) : (
                            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                Kolom komentar dinonaktifkan oleh penulis.
                            </p>
                        )}

                        <div className="mt-6 space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    Belum ada komentar. Jadilah yang pertama
                                    berkomentar.
                                </p>
                            ) : (
                                comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5ECDD] text-xs font-bold text-[#34443D]">
                                                    {getInitials(
                                                        comment.user?.name,
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {comment.user?.name ||
                                                            'Pengguna Pathway'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatDate(
                                                            comment.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {comment.can_delete && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        deleteComment(comment)
                                                    }
                                                    className="text-xs font-medium text-rose-600 transition hover:text-rose-800"
                                                >
                                                    Hapus
                                                </button>
                                            )}
                                        </div>

                                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                                            {comment.body}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <div className="mt-8">
                        <Link
                            href="/journeys"
                            className="inline-flex rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
                        >
                            Kembali ke Daftar Cerita
                        </Link>
                    </div>
                </main>
            </div>

            {showReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
                    <div className="my-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Laporkan Cerita
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Beri tahu admin mengapa cerita ini
                                    bermasalah.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowReport(false)}
                                className="text-2xl text-slate-400 transition hover:text-slate-700"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={submitReport} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">
                                    Alasan Laporan
                                </label>

                                <textarea
                                    rows="4"
                                    maxLength="500"
                                    value={reportForm.data.reason}
                                    onChange={(e) =>
                                        reportForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: mengandung spam atau promosi berbayar."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                />

                                {reportForm.errors.reason && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {reportForm.errors.reason}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowReport(false)}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={reportForm.processing}
                                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {reportForm.processing
                                        ? 'Mengirim...'
                                        : 'Kirim Laporan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
