import { Head, Link, useForm } from '@inertiajs/react';

export default function Show({ course, forum }) {
    // Inisialisasi form untuk mengirim balasan
    const { data, setData, post, processing, reset, errors } = useForm({
        body: '',
    });

    const submitReply = (e) => {
        e.preventDefault();
        post(`/courses/${course.slug}/forums/${forum.id}/replies`, {
            preserveScroll: true,
            onSuccess: () => reset('body'), // Kosongkan input form setelah balasan terkirim
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 font-sans">
            <Head title={`${forum.title} | Forum Pathway`} />
            
            <div className="max-w-4xl mx-auto px-6 space-y-6">
                
                {/* Tombol Kembali */}
                <Link href={`/courses/${course.slug}/forums`} className="text-indigo-600 font-semibold mb-4 inline-flex items-center gap-2 hover:text-indigo-800 transition-colors">
                    <span>←</span> Kembali ke Daftar Diskusi
                </Link>

                {/* KARTU PERTANYAAN UTAMA (Topik Diskusi) */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-lg text-indigo-600">
                            {forum.author?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{forum.author?.name || 'Mahasiswa'}</h3>
                            <p className="text-xs text-slate-500">Penulis Topik</p>
                        </div>
                    </div>
                    <h1 className="text-2xl font-extrabold mb-4 text-slate-900">{forum.title}</h1>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{forum.body}</p>
                    
                    {/* Menampilkan screenshot jika pengguna melampirkan gambar */}
                    {forum.image_url && (
                        <div className="mt-6">
                            <img src={forum.image_url} alt="Lampiran Masalah" className="rounded-xl border border-slate-200 max-h-96 object-cover shadow-sm" />
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-xl text-slate-800 pt-4">
                    Balasan ({forum.replies?.length || 0})
                </h3>

                {/* AREA DAFTAR BALASAN */}
                <div className="space-y-4">
                    {!forum.replies || forum.replies.length === 0 ? (
                        <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 shadow-sm text-slate-500">
                            Belum ada yang membalas diskusi ini. Jadilah yang pertama membantu!
                        </div>
                    ) : (
                        forum.replies.map((reply) => (
                            <div key={reply.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex-shrink-0 flex items-center justify-center font-bold">
                                    {reply.user?.name?.charAt(0) || 'M'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-sm text-slate-900">{reply.user?.name || 'Member'}</h4>
                                        {reply.is_accepted_answer && (
                                            <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Solusi</span>
                                        )}
                                    </div>
                                    <p className="text-slate-600 mt-2 whitespace-pre-wrap text-sm leading-relaxed">{reply.body}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* AREA FORM TULIS BALASAN */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 mt-8">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        💬 Tulis Balasan Kamu
                    </h4>
                    <form onSubmit={submitReply}>
                        <textarea
                            className="w-full border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 transition-all resize-none"
                            rows="4"
                            placeholder="Tuliskan jawaban, solusi, atau tanggapanmu di sini..."
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            required
                        ></textarea>
                        {errors.body && <span className="text-red-500 text-sm mt-1 block">{errors.body}</span>}
                        
                        <div className="mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50 transition-all hover:shadow-lg active:scale-95"
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