import AdminLayout from '@/Layouts/AdminLayout';
import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const statusTabs = [
    { key: 'menunggu', label: 'Menunggu' },
    { key: 'published', label: 'Tayang' },
    { key: 'ditolak', label: 'Ditolak' },
    { key: 'semua', label: 'Semua' },
];

const statusVariants = {
    menunggu: 'warning',
    published: 'success',
    ditolak: 'neutral',
    draft: 'neutral',
};

const statusLabels = {
    menunggu: 'Menunggu Moderasi',
    published: 'Tayang',
    ditolak: 'Ditolak',
    draft: 'Draft',
};

function formatDate(value) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function JourneyRow({ journey }) {
    const [showReject, setShowReject] = useState(false);
    const [note, setNote] = useState(journey.moderation_note || '');
    const [submitting, setSubmitting] = useState(false);

    const approve = () => {
        setSubmitting(true);
        router.patch(
            `/admin/journeys/${journey.id}/approve`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const reject = () => {
        setSubmitting(true);
        router.patch(
            `/admin/journeys/${journey.id}/reject`,
            { moderation_note: note },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    setShowReject(false);
                },
            },
        );
    };

    const destroy = () => {
        if (
            !window.confirm(
                `Hapus journey "${journey.title}"? Tindakan ini tidak dapat dibatalkan.`,
            )
        ) {
            return;
        }

        router.delete(`/journeys/${journey.slug}`, { preserveScroll: true });
    };

    return (
        <tr className="align-top hover:bg-slate-50/70">
            <td className="px-6 py-5">
                <p className="text-xs text-slate-400">Journey #{journey.id}</p>
                <p className="mt-1 font-semibold text-slate-900">
                    {journey.title}
                </p>
                <p className="mt-1 line-clamp-2 max-w-md text-sm text-slate-500">
                    {journey.content}
                </p>
            </td>

            <td className="px-6 py-5">
                <p className="font-medium text-slate-800">
                    {journey.author?.name || 'Pengguna'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    {journey.author?.email}
                </p>
            </td>

            <td className="px-6 py-5">
                <Badge
                    variant={statusVariants[journey.status] ?? 'neutral'}
                >
                    {statusLabels[journey.status] || journey.status}
                </Badge>

                {journey.moderation_note && (
                    <p className="mt-2 max-w-xs text-xs text-slate-500">
                        Catatan: {journey.moderation_note}
                    </p>
                )}
            </td>

            <td className="whitespace-nowrap px-6 py-5 text-xs text-slate-500">
                {formatDate(journey.updated_at)}
            </td>

            <td className="px-6 py-5">
                <div className="flex flex-wrap gap-2">
                    {journey.status !== 'published' && (
                        <button
                            type="button"
                            onClick={approve}
                            disabled={submitting}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Setujui
                        </button>
                    )}

                    {journey.status !== 'ditolak' && (
                        <button
                            type="button"
                            onClick={() => setShowReject((value) => !value)}
                            disabled={submitting}
                            className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Tolak
                        </button>
                    )}

                    {journey.status === 'published' && (
                        <Link
                            href={`/journeys/${journey.slug}`}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            Lihat
                        </Link>
                    )}

                    <Link
                        href={`/journeys/${journey.slug}/edit`}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                        Edit
                    </Link>

                    <button
                        type="button"
                        onClick={destroy}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                        Hapus
                    </button>
                </div>

                {showReject && (
                    <div className="mt-3 w-full max-w-sm rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <label className="text-xs font-semibold text-rose-800">
                            Catatan moderasi (opsional)
                        </label>

                        <textarea
                            rows="3"
                            maxLength="500"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Jelaskan alasan penolakan..."
                            className="mt-2 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        />

                        <div className="mt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowReject(false)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                            >
                                Batal
                            </button>

                            <button
                                type="button"
                                onClick={reject}
                                disabled={submitting}
                                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Kirim Penolakan
                            </button>
                        </div>
                    </div>
                )}
            </td>
        </tr>
    );
}

export default function Index({
    journeys,
    counts,
    currentStatus = 'menunggu',
}) {
    const { flash } = usePage().props;

    const handlePageChange = (url) => {
        if (!url) return;

        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Moderasi Journey" />

            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Moderasi Journey
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Tinjau cerita komunitas sebelum tampil di feed
                                publik.
                            </p>
                        </div>

                        <Link
                            href="/admin/dashboard"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            ← Kembali ke Dasbor
                        </Link>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    <div className="mb-6 flex flex-wrap gap-2">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        '/admin/journeys',
                                        { status: tab.key },
                                        { preserveState: true },
                                    )
                                }
                                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                                    currentStatus === tab.key
                                        ? 'bg-[#6594B1] text-white shadow-sm'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {tab.label} ({counts?.[tab.key] ?? 0})
                            </button>
                        ))}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Journey</th>
                                        <th className="px-6 py-4">Penulis</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">
                                            Diperbarui
                                        </th>
                                        <th className="px-6 py-4">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {journeys.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-10"
                                            >
                                                <EmptyState message="Tidak ada journey pada kategori ini." />
                                            </td>
                                        </tr>
                                    ) : (
                                        journeys.data.map((journey) => (
                                            <JourneyRow
                                                key={journey.id}
                                                journey={journey}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {journeys.links && journeys.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
                                <p className="text-xs text-slate-500">
                                    Menampilkan {journeys.from}–{journeys.to}{' '}
                                    dari {journeys.total} journey
                                </p>

                                <div className="flex flex-wrap gap-1">
                                    {journeys.links.map((link, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            disabled={!link.url}
                                            onClick={() =>
                                                handlePageChange(link.url)
                                            }
                                            className={`rounded-lg px-3 py-2 text-sm ${
                                                link.active
                                                    ? 'bg-[#6594B1] text-white'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            } disabled:cursor-not-allowed disabled:opacity-40`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
