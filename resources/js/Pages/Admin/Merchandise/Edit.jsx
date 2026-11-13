import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Edit({ merchandise }) {
    const { data, setData, put, processing, errors } = useForm({
        name: merchandise.name || '',
        description: merchandise.description || '',
        point_cost: merchandise.point_cost || '',
        image_url: merchandise.image_url || '',
        stock: merchandise.stock ?? 0,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        put(`/admin/merchandises/${merchandise.id}`);
    };

    return (
        <AdminLayout>
            <Head title="Edit Merchandise" />

            <div className="p-6">
                <div className="mb-6">
                    <Link
                        href="/admin/merchandises"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        ← Kembali ke daftar merchandise
                    </Link>

                    <h1 className="mt-3 text-2xl font-bold text-gray-800">
                        Edit Merchandise
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Perbarui informasi merchandise yang tersedia untuk ditukarkan.
                    </p>
                </div>

                <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Nama Merchandise
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="Masukkan nama merchandise"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Deskripsi
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows="4"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="Masukkan deskripsi merchandise"
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Harga Poin
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={data.point_cost}
                                onChange={(e) => setData('point_cost', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="Contoh: 100"
                            />
                            {errors.point_cost && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.point_cost}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                URL Gambar
                            </label>
                            <input
                                type="url"
                                value={data.image_url}
                                onChange={(e) => setData('image_url', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="https://example.com/image.jpg"
                            />
                            {errors.image_url && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.image_url}
                                </p>
                            )}

                            {data.image_url && (
                                <div className="mt-3">
                                    <p className="mb-2 text-sm text-gray-500">
                                        Preview gambar:
                                    </p>
                                    <img
                                        src={data.image_url}
                                        alt="Preview merchandise"
                                        className="h-32 w-32 rounded-lg border object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Stok
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.stock}
                                onChange={(e) => setData('stock', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                                placeholder="Masukkan jumlah stok"
                            />
                            {errors.stock && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.stock}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t pt-5">
                            <Link
                                href="/admin/merchandises"
                                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
