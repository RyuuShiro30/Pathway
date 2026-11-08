import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        point_cost: '',
        image_url: '',
        stock: 0,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/merchandises');
    };

    return (
        <AdminLayout>
            <Head title="Tambah Merchandise" />

            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <Link
                            href="/admin/merchandises"
                            className="text-sm text-[#6594B1] hover:underline"
                        >
                            ← Kembali ke Daftar Merchandise
                        </Link>

                        <h1 className="text-2xl font-bold text-slate-800 mt-4">
                            Tambah Merchandise
                        </h1>

                        <p className="text-sm text-slate-500 mt-1">
                            Tambahkan merchandise baru yang dapat ditukarkan mentor menggunakan poin.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5"
                    >
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nama Merchandise
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Tumbler Pathway"
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-[#6594B1] focus:ring-[#6594B1]"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Deskripsi
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows="4"
                                placeholder="Masukkan deskripsi merchandise..."
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-[#6594B1] focus:ring-[#6594B1]"
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Harga Poin
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.point_cost}
                                    onChange={(e) => setData('point_cost', e.target.value)}
                                    placeholder="Contoh: 100"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-[#6594B1] focus:ring-[#6594B1]"
                                />
                                {errors.point_cost && (
                                    <p className="text-sm text-red-600 mt-1">{errors.point_cost}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Stok
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.stock}
                                    onChange={(e) => setData('stock', e.target.value)}
                                    placeholder="Contoh: 10"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-[#6594B1] focus:ring-[#6594B1]"
                                />
                                {errors.stock && (
                                    <p className="text-sm text-red-600 mt-1">{errors.stock}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                URL Gambar (Opsional)
                            </label>
                            <input
                                type="url"
                                value={data.image_url}
                                onChange={(e) => setData('image_url', e.target.value)}
                                placeholder="https://example.com/gambar.jpg"
                                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-[#6594B1] focus:ring-[#6594B1]"
                            />
                            {errors.image_url && (
                                <p className="text-sm text-red-600 mt-1">{errors.image_url}</p>
                            )}
                        </div>

                        {data.image_url && (
                            <div>
                                <p className="text-sm font-medium text-slate-700 mb-2">
                                    Preview Gambar
                                </p>
                                <img
                                    src={data.image_url}
                                    alt="Preview merchandise"
                                    className="w-32 h-32 object-cover rounded-lg border border-slate-200"
                                />
                            </div>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
                            <Link
                                href="/admin/merchandises"
                                className="px-5 py-2.5 text-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                Batal
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2.5 rounded-lg bg-[#6594B1] text-white hover:bg-[#527f9b] disabled:opacity-50 font-medium"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Merchandise'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
