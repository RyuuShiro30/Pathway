import { Link, Head } from '@inertiajs/react';

export default function Window({ course, materials = [] }) {
    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            <Head title={`${course.title} | Jendela Kelas`} />

            {/* HEADER BANNER KELAS */}
            <div className="text-white pt-12 pb-24 px-6 relative overflow-hidden shadow-md" style={{ backgroundColor: '#6594B1' }}>
                <div className="max-w-6xl mx-auto relative z-10">
                    <Link href="/courses" className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-semibold mb-6 transition-colors">
                        <span>←</span> Kembali ke Katalog
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex-1">
                            <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
                                {course.level || 'Beginner'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-white">{course.title}</h1>
                            <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
                                {course.description}
                            </p>
                        </div>

                        {/* TOMBOL MASUK KE RUANG BELAJAR */}
                        <div className="w-full md:w-auto">
                            <Link
                                href={`/courses/${course.slug}/learn`}
                                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all transform hover:-translate-y-1 hover:shadow-lg w-full"
                            >
                                Masuk Ruang Belajar 🚀
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* KONTEN UTAMA: PETA MATERI & FORUM */}
            <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Daftar Ringkasan Materi */}
                    <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <span>📚</span> Modul Pembelajaran
                        </h2>
                        <div className="space-y-4">
                            {materials.map((materi, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <div className="flex-shrink-0 w-10 h-10 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-slate-800">{materi.title}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Modul Akses Online</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* KARTU FORUM TONGKRONGAN */}
                    <div className="w-full lg:w-96 space-y-6">
                        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-400 p-6 shadow-sm hover:shadow-md transition-all duration-300 text-emerald-950">
                            <div className="relative overflow-hidden">
                                <h3 className="text-lg font-extrabold mb-2 flex items-center gap-2 text-emerald-950">
                                    Pojok Tongkrongan <span className="animate-bounce inline-block">🔥</span>
                                </h3>
                                <p className="text-emerald-900 text-sm mb-6 leading-relaxed font-medium">
                                    Ada kode yang *error* atau materi yang membingungkan? Lempar pertanyaannya ke forum kelas!
                                </p>
                                <Link
                                    href={`/courses/${course.slug}/forums`}
                                    className="block w-full text-center bg-white text-emerald-800 font-bold py-3 px-4 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all text-sm shadow-sm"
                                >
                                    Masuk Forum Diskusi →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}