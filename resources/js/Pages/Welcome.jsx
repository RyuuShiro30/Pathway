import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
            <Head title="Welcome to Pathway" />

            {/* NAVBAR STANDALONE KHUSUS WELCOME PAGE */}
            <header className="flex w-full items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    {/* Logo Pathway */}
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/images/pathwayIcon.png" alt="Pathway Logo" className="h-11 w-auto" />
                        <div className="text-2xl font-bold text-[#6594B1]">Pathway</div>
                    </Link>
                    
                    {/* Menu Navigasi Utama */}
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                        <Link href="#" className="hover:text-[#6594B1] transition-colors">Course</Link>
                        <Link href="#" className="hover:text-[#6594B1] transition-colors">Mentor</Link>
                        <Link href="#" className="hover:text-[#6594B1] transition-colors">Forum</Link>
                    </nav>
                </div>
                
                {/* Tombol Aksi (Kanan) - Berubah otomatis tergantung status login */}
                <div className="flex items-center gap-4">
                    {/* Menggunakan auth?.user agar aman dari error jika object auth kosong */}
                    {auth?.user ? (
                        <Link
                            href={route('dashboard')}
                            className="rounded-md bg-[#6594B1] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4d758f] transition-colors shadow-sm"
                        >
                            Ke Dashboard
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="rounded-md bg-[#6594B1] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4d758f] transition-colors shadow-sm"
                        >
                            Masuk
                        </Link>
                    )}
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="relative px-8 pt-20 pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                    {/* Kiri: Teks & Search Bar */}
                    <div className="flex-1 space-y-8 z-10">
                        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
                            Bangun Karier sebagai <span className="text-[#6594B1]">Talenta Digital</span> Mulai Hari Ini.
                        </h1>
                        <p className="text-lg text-gray-600 max-w-xl">
                            Belajar teknologi, temukan mentor berpengalaman, dan bangun portfolio yang dibutuhkan industri. Bergabunglah dengan komunitas belajar Pathway.
                        </p>

                        <div className="relative max-w-lg bg-white rounded-full shadow-lg p-2 flex items-center border border-gray-100">
                            <input
                                type="text"
                                placeholder="Aku ingin belajar tentang..."
                                className="w-full px-4 py-2 bg-transparent border-none focus:ring-0 text-gray-700"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button className="bg-[#6594B1] hover:bg-[#4d758f] text-white px-6 py-2.5 rounded-full font-semibold transition whitespace-nowrap shadow-sm">
                                Mulai Belajar
                            </button>
                        </div>
                    </div>

                    {/* Kanan: Gambar */}
                    <div className="flex-1 relative z-10 w-full flex justify-center">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#6594B1] rounded-bl-[150px] rounded-tr-[100px] opacity-10"></div>
                        <img
                            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                            alt="Students collaborative learning"
                            className="rounded-tl-[100px] rounded-br-[100px] rounded-tr-2xl rounded-bl-2xl shadow-2xl object-cover w-[90%] h-[400px] relative z-10"
                        />
                    </div>
                </div>
            </section>

            {/* STATISTIK */}
            <section className="bg-white py-12 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-8 flex justify-center gap-16 md:gap-32 text-center flex-wrap">
                    <div>
                        <div className="text-3xl font-bold text-gray-900">50.000+</div>
                        <div className="text-sm text-gray-500 mt-1">Siswa Aktif</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-gray-900">120+</div>
                        <div className="text-sm text-gray-500 mt-1">Course & Modul</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-gray-900">300+</div>
                        <div className="text-sm text-gray-500 mt-1">Mentor Expert</div>
                    </div>
                </div>
            </section>

            {/* PARTNER LOGOS */}
            <section className="py-16 bg-slate-50 text-center">
                <p className="text-sm font-semibold text-gray-500 mb-8 uppercase tracking-wider">
                    Lulusan Kami Telah Bekerja Di Perusahaan Terkemuka
                </p>
                <div className="flex justify-center items-center gap-12 flex-wrap opacity-60 grayscale">
                    <h2 className="text-xl font-bold">Google</h2>
                    <h2 className="text-xl font-bold">Microsoft</h2>
                    <h2 className="text-xl font-bold">Gojek</h2>
                    <h2 className="text-xl font-bold">Tokopedia</h2>
                    <h2 className="text-xl font-bold">Traveloka</h2>
                </div>
            </section>

            {/* KATEGORI COURSE */}
            <section className="py-20 bg-white px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Mulai Pelajari Skill yang Dibutuhkan Industri</h2>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <button className="px-6 py-2 rounded-full border border-[#6594B1] bg-[#6594B1] text-white font-medium shadow-sm">Software Engineering</button>
                            <button className="px-6 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">Data Science</button>
                            <button className="px-6 py-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">UI/UX Design</button>
                        </div>
                    </div>

                    {/* Grid Course Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {/* Card 1 */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                            <div className="h-40 bg-blue-100 flex items-center justify-center">
                                <span className="text-4xl text-blue-500">⚛️</span>
                            </div>
                            <div className="p-5">
                                <div className="text-xs font-semibold text-[#6594B1] mb-2 uppercase tracking-wide">Web Development</div>
                                <h3 className="font-bold text-gray-900 mb-2 leading-tight">Mastering React & Inertia.js</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">Pelajari cara membangun SPA (Single Page Application) modern.</p>
                                <div className="text-sm font-medium text-gray-900">Rp 450.000</div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                            <div className="h-40 bg-red-100 flex items-center justify-center">
                                <span className="text-4xl text-red-500">🐘</span>
                            </div>
                            <div className="p-5">
                                <div className="text-xs font-semibold text-[#6594B1] mb-2 uppercase tracking-wide">Backend Dev</div>
                                <h3 className="font-bold text-gray-900 mb-2 leading-tight">Laravel 13 for Beginners</h3>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">Fundamental backend framework Laravel dari nol hingga deploy.</p>
                                <div className="text-sm font-medium text-gray-900">Gratis</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-8 text-center bg-slate-50 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">&copy; 2026 Pathway. All rights reserved.</p>
                <p className="text-xs text-gray-400">
                    Laravel v{laravelVersion || '11.x'} (PHP v{phpVersion || '8.x'})
                </p>
            </footer>
        </div>
    );
}