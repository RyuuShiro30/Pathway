import { Head, Link, useForm } from '@inertiajs/react';

export default function Show({ course, forum }) {
    // Form useForm untuk mengirim balasan baru
    const { data, setData, post, processing, reset, errors } = useForm({
        body: '',
    });

    const submitReply = (e) => {
        e.preventDefault();
        post(`/courses/${course.slug}/forums/${forum.id}/replies`, {
            preserveScroll: true,
            onSuccess: () => reset('body'), // Kosongkan form setelah balasan terkirim
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 font-sans text-slate-800">
            <Head title={`${forum.title} | Forum Diskusi`} />

            <div className="max-w-4xl mx-auto px-6 space-y-6">
                
                {/* Navigasi Kembali ke Forum */}
                <Link
                    href={`/courses/${course.slug}/forums`}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2 transition-colors text-sm mb-4"
                >
                    <span>←</span> Kembali ke Pojok Tongkrongan
                </Link>

                {/* KARTU PERTANYAAN UTAMA (TOPIK DISKUSI) */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                            {forum.author?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{forum.author?.name || 'Mahasiswa'}</h3>
                            <p className="text-xs text-slate-400">Penulis Topik</p>
                        </div>
                    </div>

                    <h1 className="text-2xl font-extrabold text-slate-900 mb-4 leading-tight">
                        {forum.title}
                    </h1>

                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">
                        {forum.body}
                    </p>

                    {/* Lampiran Gambar Screenshot dari Cloudinary (jika ada) */}
                    {forum.image_url && (
                        <div className="mt-6">
                            <img
                                src={forum.image_url}
                                alt="Screenshot Lampiran"
                                className="rounded-2xl border border-slate-200 max-h-96 object-cover shadow-sm"
                            />
                        </div>
                    )}
                </div>

                {/* DAFTAR BALASAN (REPLIES) */}
                <div className="pt-4">
                    <h3 className="font-bold text-xl text-slate-900 mb-4">
                        Balasan Diskusi ({forum.replies?.length || 0})
                    </h3>

                    <div className="space-y-4">
                        {!forum.replies || forum.replies.length === 0 ? (
                            <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 shadow-sm text-slate-400">
                                Belum ada balasan untuk diskusi ini. Jadilah yang pertama memberikan jawaban! 🚀
                            </div>
                        ) : (
                            forum.replies.map((reply) => (
                                <div key={reply.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm">
                                        {reply.user?.name?.charAt(0) || 'M'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-sm text-slate-900">{reply.user?.name || 'Member'}</h4>
                                            {reply.is_accepted_answer && (
                                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Jawaban Solusi
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                                            {reply.body}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* FORM INPUT TULIS BALASAN */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 mt-8">
                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        💬 Tulis Balasan Kamu
                    </h4>

                    <form onSubmit={submitReply}>
                        <textarea
                            className="w-full border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-all resize-none text-sm text-slate-800"
                            rows="4"
                            placeholder="Tuliskan solusi atau bantuan jawaban kamu di sini..."
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            required
                        ></textarea>
                        {errors.body && <span className="text-red-500 text-xs mt-1 block">{errors.body}</span>}

                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-green-400 hover:bg-green-300 text-indigo-950 font-bold py-3 px-8 rounded-xl disabled:opacity-50 transition-all shadow-sm active:scale-95"
                            >
                                {processing ? 'Mengirim...' : 'Kirim Balasan 🚀'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}