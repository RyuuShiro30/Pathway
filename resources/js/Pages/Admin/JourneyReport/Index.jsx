import AdminLayout from '@/Layouts/AdminLayout';
import Badge from '@/Components/ui/Badge';
import EmptyState from '@/Components/ui/EmptyState';
import { Head, Link, router, usePage } from '@inertiajs/react';

const statusTabs = [
    { key: 'menunggu', label: 'Menunggu' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'semua', label: 'Semua' },
];

const statusVariants = {
    menunggu: 'warning',
    selesai: 'success',
};

const statusLabels = {
    menunggu: 'Menunggu Tinjauan',
    selesai: 'Selesai',
};

function formatDate(value) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default function Index({ reports, counts, currentStatus = 'menunggu' }) {
    const { flash } = usePage().props;

    const handlePageChange = (url) => {
        if (!url) return;

        router.visit(url, { preserveState: true, preserveScroll: true });
    };

    const resolve = (report) => {
        router.patch(
            `/admin/journey-reports/${report.id}/resolve`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <AdminLayout>
            <Head title="Laporan Journey" />

            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Laporan Journey
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Tinjau laporan pengguna terhadap cerita
                                komunitas.
                            </p>
                        </div>

                        <Link
                            href="/admin/journeys"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            Moderasi Journey
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
                                        '/admin/journey-reports',
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
                                        <th className="px-6 py-4">Pelapor</th>
                                        <th className="px-6 py-4">Alasan</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Tanggal</th>
                                        <th className="px-6 py-4">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reports.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-10"
                                            >
                                                <EmptyState message="Tidak ada laporan pada kategori ini." />
                                            </td>
                                        </tr>
                                    ) : (
                                        reports.data.map((report) => (
                                            <tr
                                                key={report.id}
                                                className="align-top hover:bg-slate-50/70"
                                            >
                                                <td className="px-6 py-5">
                                                    <p className="font-semibold text-slate-900">
                                                        {report.journey?.title ||
                                                            'Journey dihapus'}
                                                    </p>
                                                    {report.journey?.slug && (
                                                        <Link
                                                            href={`/journeys/${report.journey.slug}`}
                                                            className="mt-1 inline-block text-xs font-medium text-[#6594B1] hover:underline"
                                                        >
                                                            Lihat di feed publik
                                                        </Link>
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <p className="font-medium text-slate-800">
                                                        {report.reporter?.name ||
                                                            'Pengguna'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {report.reporter?.email}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <p className="max-w-sm text-sm leading-6 text-slate-600">
                                                        {report.reason}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <Badge
                                                        variant={
                                                            statusVariants[
                                                                report.status
                                                            ] ?? 'neutral'
                                                        }
                                                    >
                                                        {statusLabels[
                                                            report.status
                                                        ] || report.status}
                                                    </Badge>
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-5 text-xs text-slate-500">
                                                    {formatDate(
                                                        report.created_at,
                                                    )}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-2">
                                                        {report.status ===
                                                            'menunggu' && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    resolve(
                                                                        report,
                                                                    )
                                                                }
                                                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                                            >
                                                                Tandai Selesai
                                                            </button>
                                                        )}

                                                        {report.journey?.slug && (
                                                            <Link
                                                                href={`/journeys/${report.journey.slug}/edit`}
                                                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                                            >
                                                                Edit Journey
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {reports.links && reports.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
                                <p className="text-xs text-slate-500">
                                    Menampilkan {reports.from}–{reports.to} dari{' '}
                                    {reports.total} laporan
                                </p>

                                <div className="flex flex-wrap gap-1">
                                    {reports.links.map((link, index) => (
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
