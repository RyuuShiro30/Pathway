import { Head, Link } from '@inertiajs/react';

export default function History({ history = [] }) {
    const formatDate = (date) => {
        if (!date) return '-';

        return new Date(date).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusConfig = {
        menunggu: {
            label: 'Menunggu',
            className: 'bg-yellow-100 text-yellow-700',
        },
        diproses: {
            label: 'Diproses',
            className: 'bg-blue-100 text-blue-700',
        },
        dikirim: {
            label: 'Dikirim',
            className: 'bg-indigo-100 text-indigo-700',
        },
        diterima: {
            label: 'Diterima',
            className: 'bg-green-100 text-green-700',
        },
    };

    return (
        <>
            <Head title="Riwayat Penukaran Merchandise" />

            <div className="min-h-screen w-full bg-gray-50 px-5 py-8 sm:px-8 lg:px-12">
                <div className="w-full">

                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href={route('mentor.merchandise.index')}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            &larr; Kembali ke Katalog Merchandise
                        </Link>

                        <h1 className="mt-4 text-3xl font-bold text-gray-900">
                            Riwayat Penukaran
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Lihat semua merchandise yang pernah kamu tukarkan
                            dan pantau status pengirimannya.
                        </p>
                    </div>

                    {/* History List */}
                    {history.length === 0 ? (
                        <div className="w-full rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
                            <div className="text-5xl">📦</div>

                            <h2 className="mt-4 text-lg font-semibold text-gray-800">
                                Belum Ada Riwayat Penukaran
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Kamu belum pernah menukarkan poin dengan merchandise.
                            </p>

                            <Link
                                href={route('mentor.merchandise.index')}
                                className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Lihat Merchandise
                            </Link>
                        </div>
                    ) : (
                        <div className="w-full space-y-5">
                            {history.map((item) => {
                                const status =
                                    statusConfig[item.shipping_status] || {
                                        label: item.shipping_status,
                                        className: 'bg-gray-100 text-gray-700',
                                    };

                                return (
                                    <div
                                        key={item.id}
                                        className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                                    >
                                        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Tanggal Penukaran
                                                </p>

                                                <p className="mt-1 font-semibold text-gray-800">
                                                    {formatDate(item.redeemed_at)}
                                                </p>
                                            </div>

                                            <span
                                                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                                            >
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="p-5">
                                            <div className="flex flex-col gap-5 sm:flex-row">
                                                <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:w-32">
                                                    {item.merchandise?.image_url ? (
                                                        <img
                                                            src={item.merchandise.image_url}
                                                            alt={item.merchandise.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-4xl">🎁</span>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <h2 className="text-lg font-bold text-gray-900">
                                                        {item.merchandise?.name || 'Merchandise'}
                                                    </h2>

                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Jumlah: {item.quantity} barang
                                                    </p>

                                                    <p className="mt-2 font-semibold text-indigo-600">
                                                        {Number(item.points_spent).toLocaleString('id-ID')} Poin
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-6 grid gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-800">
                                                        Informasi Penerima
                                                    </h3>

                                                    <p className="mt-2 text-sm text-gray-600">
                                                        {item.recipient_name}
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-600">
                                                        {item.phone_number}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-800">
                                                        Alamat Pengiriman
                                                    </h3>

                                                    <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                                                        {item.shipping_address}
                                                    </p>
                                                </div>
                                            </div>

                                            {item.shipping_status === 'dikirim' ||
                                            item.shipping_status === 'diterima' ? (
                                                <div className="mt-5 rounded-lg bg-gray-50 p-4">
                                                    <p className="text-xs font-medium text-gray-500">
                                                        Nomor Resi
                                                    </p>

                                                    <p className="mt-1 font-semibold text-gray-800">
                                                        {item.tracking_number || 'Nomor resi belum tersedia'}
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
