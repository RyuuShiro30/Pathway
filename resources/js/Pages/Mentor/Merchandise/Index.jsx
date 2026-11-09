import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ merchandises = [], pointsBalance = 0 }) {
    const [selectedMerchandise, setSelectedMerchandise] = useState(null);

    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        quantity: 1,
        recipient_name: '',
        phone_number: '',
        shipping_address: '',
    });

    const openRedeemForm = (merchandise) => {
        setSelectedMerchandise(merchandise);
        reset();
        setData({
            quantity: 1,
            recipient_name: '',
            phone_number: '',
            shipping_address: '',
        });
    };

    const closeRedeemForm = () => {
        setSelectedMerchandise(null);
        reset();
    };

    const totalPoints = selectedMerchandise
        ? selectedMerchandise.point_cost * Number(data.quantity)
        : 0;

    const handleRedeem = (e) => {
        e.preventDefault();

        if (!selectedMerchandise) return;

        post(route('mentor.merchandise.redeem', selectedMerchandise.id), {
            onSuccess: () => {
                setSelectedMerchandise(null);
                reset();
            },
        });
    };

    return (
        <>
            <Head title="Katalog Merchandise" />

            <div className="min-h-screen bg-[#F4F7F9] px-4 py-8 font-sans text-[#172033] antialiased sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">

                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-sm font-semibold tracking-wide text-[#6594B1]">
                            REWARD MENTOR
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#172033]">
                            Katalog Merchandise
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-[#7A8B99]">
                            Tukarkan poin yang kamu kumpulkan dengan merchandise
                            menarik dari Pathway.
                        </p>
                    </div>

                    {/* Flash Message */}
                    {flash?.success && (
                        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                            {flash.error}
                        </div>
                    )}

                    {/* Point Balance */}
                    <div className="mb-8 rounded-2xl border border-[#D8E3E9] bg-[#6594B1] p-6 text-white shadow-sm">
                        <p className="text-sm font-medium text-blue-50">
                            Saldo Poin Kamu
                        </p>

                        <div className="mt-2 flex items-center gap-3">
                            <span className="text-4xl font-bold tracking-tight">
                                {Number(pointsBalance).toLocaleString('id-ID')}
                            </span>

                            <span className="text-lg font-semibold text-blue-50">
                                Poin
                            </span>
                        </div>

                        <p className="mt-3 text-sm leading-6 text-blue-50">
                            Kumpulkan poin dari sesi mentoring gratis yang telah selesai.
                        </p>
                    </div>

                    {/* Merchandise Catalog */}
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-[#172033]">
                            Pilihan Merchandise
                        </h2>

                        <span className="text-sm text-[#7A8B99]">
                            {merchandises.length} produk
                        </span>
                    </div>

                    {merchandises.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#D8E3E9] bg-white px-6 py-16 text-center shadow-sm">
                            <div className="text-5xl">🎁</div>

                            <h3 className="mt-4 text-base font-bold text-[#172033]">
                                Belum Ada Merchandise
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#7A8B99]">
                                Merchandise akan ditampilkan di sini setelah
                                tersedia di katalog.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {merchandises.map((item) => (
                                <div
                                    key={item.id}
                                    className="overflow-hidden rounded-2xl border border-[#D8E3E9] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                                >
                                    <div className="flex h-52 items-center justify-center bg-[#E6EFF4]">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-6xl">🎁</span>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <h3 className="text-base font-bold text-[#172033]">
                                            {item.name}
                                        </h3>

                                        <p className="mt-2 min-h-10 text-sm leading-6 text-[#7A8B99]">
                                            {item.description || 'Merchandise eksklusif Pathway.'}
                                        </p>

                                        <div className="mt-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-medium text-[#7A8B99]">
                                                    Harga
                                                </p>

                                                <p className="mt-1 font-bold text-[#6594B1]">
                                                    {Number(item.point_cost).toLocaleString('id-ID')} Poin
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs font-medium text-[#7A8B99]">
                                                    Stok
                                                </p>

                                                <p className="mt-1 font-semibold text-[#172033]">
                                                    {item.stock}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => openRedeemForm(item)}
                                            disabled={
                                                item.stock < 1 ||
                                                pointsBalance < item.point_cost
                                            }
                                            className="mt-5 w-full rounded-xl bg-[#6594B1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#56839F] disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            {item.stock < 1
                                                ? 'Stok Habis'
                                                : pointsBalance < item.point_cost
                                                    ? 'Poin Tidak Cukup'
                                                    : 'Tukar Merchandise'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Redeem Modal */}
            {selectedMerchandise && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
                    <div className="my-8 w-full max-w-lg rounded-2xl border border-[#D8E3E9] bg-white p-6 shadow-xl">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-[#172033]">
                                    Tukar Merchandise
                                </h2>

                                <p className="mt-1 text-sm text-[#7A8B99]">
                                    {selectedMerchandise.name}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeRedeemForm}
                                className="text-2xl text-[#7A8B99] transition hover:text-[#172033]"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleRedeem} className="space-y-4">

                            {/* Quantity */}
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-[#172033]">
                                    Jumlah
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    max={Math.min(10, selectedMerchandise.stock)}
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', e.target.value)}
                                    className="w-full rounded-xl border border-[#D8E3E9] bg-white px-3 py-2.5 text-sm text-[#172033] outline-none transition focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                />

                                {errors.quantity && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.quantity}
                                    </p>
                                )}
                            </div>

                            {/* Total Points */}
                            <div className="rounded-xl border border-[#D8E3E9] bg-[#E6EFF4] p-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#7A8B99]">
                                        Harga per barang
                                    </span>

                                    <span className="font-semibold text-[#172033]">
                                        {Number(selectedMerchandise.point_cost).toLocaleString('id-ID')} poin
                                    </span>
                                </div>

                                <div className="mt-3 flex justify-between font-bold">
                                    <span className="text-[#172033]">
                                        Total poin
                                    </span>

                                    <span className="text-[#6594B1]">
                                        {totalPoints.toLocaleString('id-ID')} poin
                                    </span>
                                </div>

                                <div className="mt-3 flex justify-between text-sm">
                                    <span className="text-[#7A8B99]">
                                        Saldo setelah penukaran
                                    </span>

                                    <span className="font-semibold text-[#172033]">
                                        {(pointsBalance - totalPoints).toLocaleString('id-ID')} poin
                                    </span>
                                </div>
                            </div>

                            {/* Recipient Name */}
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-[#172033]">
                                    Nama Penerima
                                </label>

                                <input
                                    type="text"
                                    value={data.recipient_name}
                                    onChange={(e) => setData('recipient_name', e.target.value)}
                                    placeholder="Masukkan nama penerima"
                                    className="w-full rounded-xl border border-[#D8E3E9] bg-white px-3 py-2.5 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                />

                                {errors.recipient_name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.recipient_name}
                                    </p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-[#172033]">
                                    Nomor Telepon
                                </label>

                                <input
                                    type="tel"
                                    value={data.phone_number}
                                    onChange={(e) => setData('phone_number', e.target.value)}
                                    placeholder="Contoh: 081234567890"
                                    className="w-full rounded-xl border border-[#D8E3E9] bg-white px-3 py-2.5 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                />

                                {errors.phone_number && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.phone_number}
                                    </p>
                                )}
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-[#172033]">
                                    Alamat Pengiriman
                                </label>

                                <textarea
                                    rows="3"
                                    value={data.shipping_address}
                                    onChange={(e) => setData('shipping_address', e.target.value)}
                                    placeholder="Masukkan alamat lengkap pengiriman"
                                    className="w-full rounded-xl border border-[#D8E3E9] bg-white px-3 py-2.5 text-sm text-[#172033] outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:ring-2 focus:ring-[#6594B1]/20"
                                />

                                {errors.shipping_address && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.shipping_address}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeRedeemForm}
                                    disabled={processing}
                                    className="w-1/2 rounded-xl border border-[#D8E3E9] px-4 py-3 text-sm font-semibold text-[#172033] transition hover:bg-[#F4F7F9] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={processing || totalPoints > pointsBalance}
                                    className="w-1/2 rounded-xl bg-[#6594B1] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#56839F] disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {processing ? 'Memproses...' : 'Konfirmasi Tukar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
