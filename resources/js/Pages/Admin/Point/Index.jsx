import AdminLayout from '@/Layouts/AdminLayout';
import EmptyState from '@/Components/ui/EmptyState';
import { Head, router, useForm, usePage } from '@inertiajs/react';

function formatPoints(value) {
    return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function formatDate(value) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function handlePageChange(url) {
    if (!url) return;

    router.visit(url, { preserveState: true, preserveScroll: true });
}

export default function Index({ mentors, recentBonuses = [] }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        amount: '',
        description: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('admin.point-bonuses.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AdminLayout>
            <Head title="Bonus Poin Mentor" />

            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Bonus Poin Mentor
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Tambahkan poin bonus manual untuk mentor
                                tertentu.
                            </p>
                        </div>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
                            <h2 className="text-lg font-bold text-slate-900">
                                Beri Bonus Poin
                            </h2>

                            <form
                                onSubmit={submit}
                                className="mt-5 space-y-4"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                                        Mentor
                                    </label>

                                    <select
                                        value={data.user_id}
                                        onChange={(e) =>
                                            setData('user_id', e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                    >
                                        <option value="">Pilih mentor</option>
                                        {mentors.data.map((mentor) => (
                                            <option
                                                key={mentor.id}
                                                value={mentor.id}
                                            >
                                                {mentor.name}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.user_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.user_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                                        Jumlah Poin
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        max="10000"
                                        value={data.amount}
                                        onChange={(e) =>
                                            setData('amount', e.target.value)
                                        }
                                        placeholder="Contoh: 50"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                    />

                                    {errors.amount && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.amount}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                                        Keterangan
                                    </label>

                                    <textarea
                                        rows="3"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Bonus kontribusi komunitas"
                                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                    />

                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-[#6594B1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#56839F] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Tambahkan Bonus'}
                                </button>
                            </form>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Bonus Terbaru
                                </h2>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {recentBonuses.length === 0 ? (
                                    <div className="px-6 py-10">
                                        <EmptyState message="Belum ada bonus poin yang diberikan." />
                                    </div>
                                ) : (
                                    recentBonuses.map((bonus) => (
                                        <div
                                            key={bonus.id}
                                            className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {bonus.user?.name ||
                                                        'Mentor'}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {bonus.description} ·{' '}
                                                    {formatDate(
                                                        bonus.created_at,
                                                    )}
                                                </p>
                                            </div>

                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                                                +{formatPoints(bonus.amount)}{' '}
                                                poin
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <h2 className="text-lg font-bold text-slate-900">
                                Saldo Poin Mentor
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Mentor</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">
                                            Keahlian
                                        </th>
                                        <th className="px-6 py-4 text-right">
                                            Saldo Poin
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mentors.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-10"
                                            >
                                                <EmptyState message="Belum ada mentor terdaftar." />
                                            </td>
                                        </tr>
                                    ) : (
                                        mentors.data.map((mentor) => (
                                            <tr
                                                key={mentor.id}
                                                className="hover:bg-slate-50/70"
                                            >
                                                <td className="px-6 py-4 font-semibold text-slate-900">
                                                    {mentor.name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {mentor.email}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {mentor.expertise || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-[#6594B1]">
                                                    {formatPoints(
                                                        mentor.points_balance,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {mentors.links && mentors.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
                                <p className="text-xs text-slate-500">
                                    Menampilkan {mentors.from}–{mentors.to} dari{' '}
                                    {mentors.total} mentor
                                </p>

                                <div className="flex flex-wrap gap-1">
                                    {mentors.links.map((link, index) => (
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
