import { Link, Head } from '@inertiajs/react';

export default function Show({ course, materials = [] }) {
    // Simulasi progress belajar (bisa dinamis dari database nanti)
    const progress = 45;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            <Head title={course.title} />

            {/* HEADER BANNER */}
            <div className="bg-indigo-900 text-white pt-12 pb-24 px-6 relative overflow-hidden">
                {/* Aksen background gamifikasi */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-white opacity-5 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500 opacity-20 blur-3xl"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <Link href="/courses" className="text-indigo-200 hover:text-white flex items-center gap-2 text-sm font-semibold mb-6 transition-colors">
                        <span>←</span> Kembali ke Katalog Kelas
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex-1">
                            <span className="inline-block px-3 py-1 bg-indigo-800 text-indigo-100 rounded-lg text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-700">
                                {course.level || 'Beginner Friendly'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">{course.title}</h1>
                            <p className="text-indigo-200 text-lg max-w-2xl leading-relaxed">
                                {course.description || 'Pelajari materi ini langkah demi langkah dan bangun portofolio teknologimu bersama mentor berpengalaman.'}
                            </p>
                        </div>

                        {/* Progress Bar Gamifikasi */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-full md:w-80 shadow-2xl">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-indigo-100">EXP Belajar</span>
                                <span className="text-2xl font-black text-green-400">{progress}%</span>
                            </div>
                            <div className="w-full bg-indigo-950/50 rounded-full h-3 mb-2 overflow-hidden border border-white/10">
                                <div
                                    className="bg-gradient-to-r from-green-400 to-emerald-300 h-3 rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                                </div>
                            </div>
                            <p className="text-xs text-indigo-200">Selesaikan 3 materi lagi untuk naik level! 🚀</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* LEFT COLUMN: Daftar Materi (Syllabus) */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span>📚</span> Peta Perjalanan
                            </h2>

                            <div className="space-y-4">
                                {materials.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">Materi sedang disusun oleh mentor...</div>
                                ) : (
                                    materials.map((materi, index) => (
                                        <div key={index} className="group flex items-start gap-4 p-4 rounded-2xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer">
                                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">{materi.title}</h4>
                                                <p className="text-sm text-gray-500 mt-1">Video & Modul Praktik</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar (Forum & Mentor) */}
                    <div className="w-full lg:w-96 space-y-6">

                        {/* 🌟 KARTU FORUM TONGKRONGAN (GAMIFIKASI) 🌟 */}
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl p-1 shadow-lg transform hover:-translate-y-1 transition-all duration-300">
                            <div className="bg-white/10 backdrop-blur-sm rounded-[23px] p-6 h-full text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12 scale-150">
                                    💬
                                </div>
                                <h3 className="text-2xl font-extrabold mb-2 flex items-center gap-2 relative z-10">
                                    Pojok Tongkrongan <span className="animate-bounce inline-block">🔥</span>
                                </h3>
                                <p className="text-indigo-100 text-sm mb-6 relative z-10 leading-relaxed">
                                    Mentok karena *error*? Jangan pusing sendiri! Lempar *screenshot* kodemu ke forum dan diskusikan bareng *tech enthusiast* lainnya.
                                </p>
                                {/* Ini Link yang menghubungkan ke fitur forum yang baru saja kita buat */}
                                <Link
                                    href={`/courses/${course.slug}/forums`}
                                    className="block w-full text-center bg-white text-indigo-900 font-bold py-3 px-4 rounded-xl hover:bg-indigo-50 hover:shadow-lg active:scale-95 transition-all relative z-10"
                                >
                                    Masuk ke Forum Sekarang →
                                </Link>
                            </div>
                        </div>

                        {/* Kartu Mentor (Opsional/Placeholder) */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Mentor Kelas</h3>
                            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${course.title}`} alt="Mentor" />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">Kak Mahasiswa Polinema</h4>
                            <p className="text-sm text-gray-500 mb-4">Software Engineer</p>
                            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 w-full py-2 rounded-lg transition-colors">
                                Lihat Profil Mentor
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}