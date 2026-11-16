import AdminLayout from '@/Layouts/AdminLayout';
import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const statusTabs = [
    { key: 'menunggu', label: 'Menunggu' },
    { key: 'disetujui', label: 'Disetujui' },
    { key: 'ditolak', label: 'Ditolak' },
    { key: 'semua', label: 'Semua' },
];

const statusVariants = {
    menunggu: 'warning',
    disetujui: 'success',
    ditolak: 'neutral',
};

const statusLabels = {
    menunggu: 'Menunggu Moderasi',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
};

function Stars({ rating }) {
    return (
        <span className="inline-flex items-center gap-0.5 text-base leading-none">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={
                        star <= rating ? 'text-amber-500' : 'text-slate-200'
                    }
                >
                    ★
                </span>
            ))}
        </span>
    );
}

function ReviewRow({ review, errors }) {
    const [showReject, setShowReject] = useState(false);
    const [note, setNote] = useState(review.moderation_note || '');
    const [submitting, setSubmitting] = useState(false);

    const approve = () => {
        setSubmitting(true);
        router.patch(
            `/admin/reviews/${review.id}/approve`,
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
            `/admin/reviews/${review.id}/reject`,
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

    return (
        <tr className="align-top hover:bg-slate-50/70">
            <td className="px-6 py-5">
                <p className="text-xs text-slate-400">Ulasan #{review.id}</p>
                <div className="mt-1">
                    <Stars rating={review.rating} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    {review.created_at
                        ? new Date(review.created_at).toLocaleDateString(
                              'id-ID',
                              {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                              },
                          )
                        : '-'}
                </p>
                {review.feedback ? (
                    <p className="mt-3 max-w-md whitespace-pre-line text-sm leading-6 text-slate-700">
                        {review.feedback}
                    </p>
                ) : (
                    <p className="mt-3 text-sm italic text-slate-400">
                        Tanpa ulasan teks
                    </p>
                )}
            </td>

            <td className="px-6 py-5">
                <p className="font-semibold text-slate-800">
                    {review.mentor?.name || 'Mentor tidak ditemukan'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    {review.mentor?.email || '-'}
                </p>
            </td>

            <td className="px-6 py-5">
                <p className="font-semibold text-slate-800">
                    {review.student?.name || 'Mahasiswa tidak ditemukan'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    {review.student?.email || '-'}
                </p>
            </td>

            <td className="px-6 py-5">
                <p className="text-sm text-slate-700">
                    Sesi #{review.session_id}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    {review.session?.schedule_time
                        ? new Date(
                              review.session.schedule_time,
                          ).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : '-'}
                </p>
            </td>

            <td className="px-6 py-5">
                <Badge
                    variant={statusVariants[review.status] ?? 'default'}
                    size="md"
                >
                    {statusLabels[review.status] ?? review.status}
                </Badge>

                {review.moderation_note && (
                    <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                        Catatan: {review.moderation_note}
                    </p>
                )}
            </td>

            <td className="px-6 py-5">
                <div className="flex flex-col gap-2 min-w-48">
                    <button
                        type="button"
                        onClick={approve}
                        disabled={submitting || review.status === 'disetujui'}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Setujui
                    </button>

                    {showReject ? (
                        <div className="space-y-2">
                            <textarea
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                rows={3}
                                maxLength={500}
                                placeholder="Catatan penolakan (opsional)"
                                className="w-full rounded-lg border-slate-300 text-sm focus:border-[#6594B1] focus:ring-[#6594B1]"
                            />

                            {errors?.moderation_note && (
                                <p className="text-xs text-red-600">
                                    {errors.moderation_note}
                                </p>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={reject}
                                    disabled={submitting}
                                    className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
                                >
                                    Kirim Penolakan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReject(false)}
                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowReject(true)}
                            disabled={submitting || review.status === 'ditolak'}
                            className="w-full rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Tolak
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

export default function Index({
    reviews,
    currentStatus = 'menunggu',
    counts = {},
    flaggedMentors = [],
}) {
    const { flash, errors } = usePage().props;

    const handlePageChange = (url) => {
        if (url) {
            router.visit(url, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout>
            <Head title="Moderasi Ulasan" />

            <div className="min-h-screen bg-slate-50 p-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Moderasi Ulasan
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Tinjau ulasan mahasiswa sebelum ditampilkan di
                                profil mentor.
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

                    {flaggedMentors.length > 0 && (
                        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-semibold text-amber-900">
                                Mentor dengan Rating 1 Bintang Beruntun
                            </p>
                            <p className="mt-1 text-xs text-amber-800">
                                Tiga ulasan terakhir yang disetujui untuk
                                mentor berikut bernilai 1 bintang. Tinjau
                                performa mentor sebelum mengambil tindakan.
                            </p>

                            <ul className="mt-3 space-y-2">
                                {flaggedMentors.map((mentor) => (
                                    <li
                                        key={mentor.id}
                                        className="flex flex-wrap items-center gap-2 text-sm text-amber-900"
                                    >
                                        <span className="font-semibold">
                                            {mentor.name}
                                        </span>
                                        <span className="text-xs text-amber-700">
                                            {mentor.email}
                                        </span>
                                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                                            {mentor.one_star_count}x bintang 1
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mb-6 flex flex-wrap gap-2">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        '/admin/reviews',
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
                                        <th className="px-6 py-4">Ulasan</th>
                                        <th className="px-6 py-4">Mentor</th>
                                        <th className="px-6 py-4">Mahasiswa</th>
                                        <th className="px-6 py-4">Sesi</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Moderasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reviews.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10">
                                                <EmptyState message="Tidak ada ulasan pada kategori ini." />
                                            </td>
                                        </tr>
                                    ) : (
                                        reviews.data.map((review) => (
                                            <ReviewRow
                                                key={review.id}
                                                review={review}
                                                errors={errors}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {reviews.links && reviews.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
                                <p className="text-xs text-slate-500">
                                    Menampilkan {reviews.from}–{reviews.to} dari{' '}
                                    {reviews.total} ulasan
                                </p>

                                <div className="flex flex-wrap gap-1">
                                    {reviews.links.map((link, index) => (
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
