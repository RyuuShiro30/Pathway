import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';

const shippingStatuses = [
    { value: 'menunggu', label: 'Menunggu' },
    { value: 'diproses', label: 'Diproses' },
    { value: 'dikirim', label: 'Dikirim' },
    { value: 'diterima', label: 'Diterima' },
];

function OrderRow({ order }) {
    const { data, setData, put, processing, errors } = useForm({
        shipping_status: order.shipping_status || 'menunggu',
        tracking_number: order.tracking_number || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        put(`/admin/merchandise-orders/${order.id}`, {
            preserveScroll: true,
        });
    };

    const statusColors = {
        menunggu: 'bg-yellow-100 text-yellow-700',
        diproses: 'bg-blue-100 text-blue-700',
        dikirim: 'bg-purple-100 text-purple-700',
        diterima: 'bg-green-100 text-green-700',
    };

    return (
        <tr className="hover:bg-slate-50 align-top">
            <td className="px-6 py-5">
                <div className="font-semibold text-slate-800">
                    #{order.id}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                    {order.redeemed_at
                        ? new Date(order.redeemed_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        })
                        : '-'}
                </div>
            </td>

            <td className="px-6 py-5">
                <p className="font-semibold text-slate-800">
                    {order.user?.name || 'Pengguna tidak ditemukan'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    {order.user?.email || '-'}
                </p>
            </td>

            <td className="px-6 py-5">
                <div className="flex items-center gap-3 min-w-48">
                    {order.merchandise?.image_url ? (
                        <img
                            src={order.merchandise.image_url}
                            alt={order.merchandise.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
                            📦
                        </div>
                    )}

                    <div>
                        <p className="font-semibold text-slate-800">
                            {order.merchandise?.name || 'Merchandise dihapus'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Jumlah: {order.quantity}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-6 py-5 min-w-48">
                <p className="font-semibold text-slate-800">
                    {order.recipient_name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                    {order.phone_number}
                </p>
                <p className="text-xs text-slate-600 mt-2 whitespace-normal max-w-xs">
                    {order.shipping_address}
                </p>
            </td>

            <td className="px-6 py-5">
                <div className="flex flex-col gap-2 min-w-48">
                    <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.shipping_status] || 'bg-slate-100 text-slate-600'
                    }`}>
                        {shippingStatuses.find(
                            (status) => status.value === order.shipping_status
                        )?.label || order.shipping_status}
                    </span>

                    <p className="text-xs text-slate-500">
                        Resi: {order.tracking_number || 'Belum tersedia'}
                    </p>
                </div>
            </td>

            <td className="px-6 py-5 min-w-64">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Status Pengiriman
                        </label>

                        <select
                            value={data.shipping_status}
                            onChange={(e) => setData('shipping_status', e.target.value)}
                            className="w-full rounded-lg border-slate-300 text-sm focus:border-[#6594B1] focus:ring-[#6594B1]"
                        >
                            {shippingStatuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>

                        {errors.shipping_status && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors.shipping_status}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Nomor Resi
                        </label>

                        <input
                            type="text"
                            value={data.tracking_number}
                            onChange={(e) => setData('tracking_number', e.target.value)}
                            placeholder="Masukkan nomor resi"
                            maxLength={100}
                            className="w-full rounded-lg border-slate-300 text-sm focus:border-[#6594B1] focus:ring-[#6594B1]"
                        />

                        {errors.tracking_number && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors.tracking_number}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full px-4 py-2 rounded-lg bg-[#6594B1] text-white text-sm font-medium hover:bg-[#527f9b] transition disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </td>
        </tr>
    );
}

export default function Index({ orders }) {
    const handlePageChange = (url) => {
        if (url) {
            router.visit(url, { preserveScroll: true });
        }
    };

    return (
        <AdminLayout>
            <Head title="Pesanan Merchandise" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-800">
                            Pesanan Merchandise
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Kelola pesanan penukaran merchandise oleh mentor,
                            status pengiriman, dan nomor resi.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

                        {orders.data.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="text-4xl mb-3">📦</div>

                                <h2 className="text-lg font-semibold text-slate-700">
                                    Belum Ada Pesanan
                                </h2>

                                <p className="text-sm text-slate-500 mt-2">
                                    Pesanan merchandise dari mentor akan muncul di sini.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="px-6 py-4 border-b border-slate-100">
                                    <p className="text-sm text-slate-600">
                                        Total pesanan: <span className="font-semibold text-slate-800">{orders.total}</span>
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                                            <tr>
                                                <th className="px-6 py-4">Pesanan</th>
                                                <th className="px-6 py-4">Mentor</th>
                                                <th className="px-6 py-4">Merchandise</th>
                                                <th className="px-6 py-4">Penerima</th>
                                                <th className="px-6 py-4">Pengiriman</th>
                                                <th className="px-6 py-4">Kelola Pesanan</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {orders.data.map((order) => (
                                                <OrderRow
                                                    key={order.id}
                                                    order={order}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {orders.links && orders.links.length > 3 && (
                                    <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                                        <p className="text-xs text-slate-500">
                                            Menampilkan {orders.from}–{orders.to} dari {orders.total} pesanan
                                        </p>

                                        <div className="flex flex-wrap gap-1">
                                            {orders.links.map((link, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    disabled={!link.url}
                                                    onClick={() => handlePageChange(link.url)}
                                                    className={`px-3 py-2 rounded-lg text-sm ${
                                                        link.active
                                                            ? 'bg-[#6594B1] text-white'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
