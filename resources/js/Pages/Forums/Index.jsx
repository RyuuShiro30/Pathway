import { Link } from '@inertiajs/react';

export default function Index({ course, forums }) {
    return (
        <div className="min-h-screen bg-gray-50 py-10 font-sans">
            <div className="max-w-5xl mx-auto px-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link
                            href={`/courses/${course.slug}`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-2 mb-2 transition-colors"
                        >
                            <span>←</span> Kembali ke Jendela Kelas
                        </Link>
                        <h1 className="text-3xl font-extrabold text-gray-900">Pojok Tongkrongan</h1>
                        <p className="text-gray-500 mt-1">
                            Forum diskusi khusus kelas <span className="font-bold text-indigo-600">{course.title}</span>
                        </p>
                    </div>

                    {/* Tombol Buat Diskusi */}
                    <Link
                        href={`/courses/${course.slug}/forums/create`}
                        className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-indigo-900 bg-green-400 hover:bg-green-300 rounded-xl transition-all transform hover:-translate-y-1 hover:shadow-lg active:scale-95"
                    >
                        + Buat Diskusi Baru
                    </Link>
                </div>

                {/* List Forum / Pertanyaan */}
                <div className="space-y-4">
                    {forums.length === 0 ? (
                        /* Tampilan kalau forum masih kosong */
                        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                            <div className="text-6xl mb-4 animate-bounce">👻</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Belum ada diskusi nih!</h3>
                            <p className="text-gray-500">Jadilah orang pertama yang memulai percakapan atau bertanya di kelas ini.</p>
                        </div>
                    ) : (
                        /* Looping data forum dari database */
                        forums.map((forum) => (
                            <Link
                                key={forum.id}
                                href={`/courses/${course.slug}/forums/${forum.id}`}
                                className="block bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-indigo-300 group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {/* Avatar inisial nama */}
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                {forum.author?.name?.charAt(0) || 'A'}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700">
                                                {forum.author?.name || 'Mahasiswa'}
                                            </span>

                                            {/* Badge Solved */}
                                            {forum.is_solved && (
                                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                                                    Solved
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                                            {forum.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm line-clamp-2">
                                            {forum.body}
                                        </p>
                                    </div>

                                    {/* Placeholder Jumlah Balasan */}
                                    <div className="hidden md:flex flex-col items-center justify-center min-w-[80px] p-3 bg-gray-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                        <span className="text-lg font-bold text-gray-700 group-hover:text-indigo-600">?</span>
                                        <span className="text-xs text-gray-500 font-medium">Balasan</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}