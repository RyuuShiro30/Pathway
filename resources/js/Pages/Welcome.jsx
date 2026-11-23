import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// Helper aman untuk memanggil Laravel route() tanpa error jika nama route belum terdaftar
const safeRoute = (name, fallback, params = {}) => {
    try {
        if (typeof route === 'function' && route().has && route().has(name)) {
            return route(name, params);
        }
    } catch {
        // Gunakan fallback URL jika route tidak ditemukan
    }
    return fallback;
};

// Komponen animasi muncul saat di-scroll (ringan, memakai IntersectionObserver bawaan browser)
function Reveal({ children, delay = 0, className = '' }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.12 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}ms` }}
            className={`transition-all duration-700 ease-out will-change-transform ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            } ${className}`}
        >
            {children}
        </div>
    );
}

const COURSE_ITEMS = [
    {
        id: 1,
        category: 'Web Development',
        level: 'Menengah',
        modules: '14 Modul',
        duration: '6 Jam',
        title: 'Full-Stack Web dengan Laravel, Inertia.js & React',
        desc: 'Bangun aplikasi web modern dari perancangan database relasional, autentikasi, hingga deployment.',
        price: 'Gratis',
        accent: 'from-[#6594B1] to-[#4A7692]',
        tag: 'Populer',
    },
    {
        id: 2,
        category: 'Web Development',
        level: 'Pemula',
        modules: '10 Modul',
        duration: '4 Jam',
        title: 'Fundamental Backend & REST API dengan Laravel',
        desc: 'Pahami arsitektur MVC, validasi request, Eloquent ORM, dan pembuatan API terstruktur.',
        price: 'Gratis',
        accent: 'from-[#56839F] to-[#3B627A]',
        tag: 'Dasar Wajib',
    },
    {
        id: 3,
        category: 'Mobile & UI/UX',
        level: 'Pemula',
        modules: '12 Modul',
        duration: '5 Jam',
        title: 'UI/UX Design System & Prototyping Aplikasi Modern',
        desc: 'Rancang antarmuka yang bersih, responsif, dan ramah pengguna menggunakan prinsip desain modern.',
        price: 'Gratis',
        accent: 'from-[#78A55A] to-[#5C8442]',
        tag: 'Praktis',
    },
    {
        id: 4,
        category: 'Data & AI',
        level: 'Menengah',
        modules: '11 Modul',
        duration: '5.5 Jam',
        title: 'Python Data Processing & Analisis Sentimen NLP',
        desc: 'Olah dataset nyata dari tahap preprocessing, ekstraksi fitur, hingga evaluasi model machine learning.',
        price: 'Gratis',
        accent: 'from-[#6594B1] to-[#5C6F2B]',
        tag: 'Studi Kasus',
    },
];

const HERO_MODULES = [
    { title: '1. Fundamental Arsitektur & Setup', status: 'Selesai', progress: 45 },
    { title: '2. Integrasi Frontend & State Management', status: 'Selesai', progress: 78 },
    { title: '3. Deployment & Pengujian Kualitas', status: 'Sedang Dipelajari', progress: 100 },
];

export default function Welcome({ auth }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [activeRoleTab, setActiveRoleTab] = useState('mentee');
    const [activeHeroModule, setActiveHeroModule] = useState(1);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const categories = ['Semua', 'Web Development', 'Mobile & UI/UX', 'Data & AI'];

    const filteredCourses =
        activeCategory === 'Semua'
            ? COURSE_ITEMS
            : COURSE_ITEMS.filter((item) => item.category === activeCategory);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const targetUrl = safeRoute('courses.index', '/courses');
        const query = searchQuery.trim();
        router.visit(query ? `${targetUrl}?search=${encodeURIComponent(query)}` : targetUrl);
    };

    const currentProgress = HERO_MODULES[activeHeroModule]?.progress ?? 78;

    return (
        <div
            className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#6594B1]/20 selection:text-[#3B627A]"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
            <Head title="Pathway — Peta Belajar & Peer Mentoring Talenta Digital">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            {/* Keyframes GPU ringan untuk animasi halus tanpa library tambahan */}
            <style>{`
                .font-heading {
                    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
                }
                @keyframes floatSlow {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    50% { transform: translate3d(0, -10px, 0); }
                }
                @keyframes floatReverse {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    50% { transform: translate3d(0, 8px, 0); }
                }
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translate3d(0, 14px, 0); }
                    to { opacity: 1; transform: translate3d(0, 0, 0); }
                }
                .animate-float-slow {
                    animation: floatSlow 5.5s ease-in-out infinite;
                }
                .animate-float-reverse {
                    animation: floatReverse 6.5s ease-in-out infinite;
                }
                .animate-hero-in {
                    animation: fadeSlideIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .animate-hero-delay-1 {
                    animation: fadeSlideIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
                }
                .animate-hero-delay-2 {
                    animation: fadeSlideIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.24s both;
                }
                .bg-pathway-grid {
                    background-image: radial-gradient(rgba(101, 148, 177, 0.18) 1px, transparent 1px);
                    background-size: 24px 24px;
                }
            `}</style>

            {/* ================= NAVBAR GLASSMORPHISM ================= */}
            <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
                    <div className="flex items-center gap-10">
                        <Link href="/" className="group flex items-center gap-2.5">
                            <img
                                src="/images/pathwayIcon.png"
                                alt="Pathway Logo"
                                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                            />
                            <span className="font-heading text-2xl font-extrabold tracking-tight text-[#6594B1]">
                                Pathway
                            </span>
                        </Link>

                        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
                            <a href="#keunggulan" className="transition-colors hover:text-[#6594B1]">
                                Keunggulan
                            </a>
                            <a href="#eksplor-course" className="transition-colors hover:text-[#6594B1]">
                                Course Roadmap
                            </a>
                            <a href="#cara-kerja" className="transition-colors hover:text-[#6594B1]">
                                Alur Mentoring
                            </a>
                            <Link
                                href={safeRoute('mentors.index', '/mentors')}
                                className="transition-colors hover:text-[#6594B1]"
                            >
                                Cari Mentor
                            </Link>
                        </nav>
                    </div>

                    {/* Tombol Aksi Desktop */}
                    <div className="hidden items-center gap-3 sm:flex">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#6594B1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#6594B1]/25 transition-all hover:-translate-y-0.5 hover:bg-[#527E9A]"
                            >
                                Ke Dashboard
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#6594B1]"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={safeRoute('register', '/register')}
                                    className="rounded-xl bg-[#6594B1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#6594B1]/25 transition-all hover:-translate-y-0.5 hover:bg-[#527E9A]"
                                >
                                    Daftar Gratis
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Tombol Hamburger Mobile */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle Menu"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Dropdown Mobile */}
                {mobileMenuOpen && (
                    <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-lg md:hidden">
                        <div className="flex flex-col space-y-3 text-sm font-medium text-slate-700">
                            <a
                                href="#keunggulan"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                            >
                                Keunggulan
                            </a>
                            <a
                                href="#eksplor-course"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                            >
                                Course Roadmap
                            </a>
                            <a
                                href="#cara-kerja"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                            >
                                Alur Mentoring
                            </a>
                            <div className="flex gap-2.5 pt-2">
                                {auth?.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="w-full rounded-xl bg-[#6594B1] py-2.5 text-center text-sm font-semibold text-white"
                                    >
                                        Ke Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700"
                                        >
                                            Masuk
                                        </Link>
                                        <Link
                                            href={safeRoute('register', '/register')}
                                            className="flex-1 rounded-xl bg-[#6594B1] py-2.5 text-center text-sm font-semibold text-white"
                                        >
                                            Daftar
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ================= HERO SECTION (ZERO BUFFERING & SIGNATURE) ================= */}
            <section className="bg-pathway-grid relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
                {/* Dekorasi Cahaya Halus */}
                <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#6594B1]/15 blur-3xl" />
                <div className="pointer-events-none absolute top-28 -right-20 h-80 w-80 rounded-full bg-[#91D06C]/20 blur-3xl" />

                <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-10">
                    {/* Kolom Kiri: Copywriting Utama & Search */}
                    <div className="space-y-7 lg:col-span-6">
                        <div className="animate-hero-in inline-flex items-center gap-2.5 rounded-full border border-[#6594B1]/25 bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#4A7692] shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#91D06C] opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#77B851]" />
                            </span>
                            Course Roadmap &amp; Peer Mentoring Platform
                        </div>

                        <h1 className="font-heading animate-hero-delay-1 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.35rem] lg:leading-[1.15]">
                            Belajar Lebih Terarah dengan{' '}
                            <span className="bg-gradient-to-r from-[#6594B1] via-[#4B7B99] to-[#5C6F2B] bg-clip-text text-transparent">
                                Peta Skill &amp; Mentor Pilihan.
                            </span>
                        </h1>

                        <p className="animate-hero-delay-2 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                            Ikuti modul pembelajaran terstruktur, jadwalkan sesi mentoring 1-on-1 langsung melalui
                            Discord, dan dokumentasikan perkembangan portofoliomu dalam satu ruang belajar kolaboratif.
                        </p>

                        {/* Search Bar Interaktif */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="animate-hero-delay-2 flex max-w-xl flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/60 sm:flex-row sm:items-center"
                        >
                            <div className="flex flex-1 items-center gap-3 px-3 py-1.5">
                                <svg
                                    className="h-5 w-5 shrink-0 text-[#6594B1]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Cari kelas Laravel, React, UI/UX..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full border-none bg-transparent p-0 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-0"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded-xl bg-[#6594B1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#527E9A] active:scale-[0.99]"
                            >
                                Mulai Eksplor
                            </button>
                        </form>

                        {/* Quick Tags */}
                        <div className="animate-hero-delay-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium text-slate-600">Topik Populer:</span>
                            {['Laravel & API', 'React Inertia', 'UI/UX Design', 'Python NLP'].map((topic) => (
                                <button
                                    key={topic}
                                    type="button"
                                    onClick={() => setSearchQuery(topic)}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 transition hover:border-[#6594B1] hover:text-[#6594B1]"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kolom Kanan: Interactive Pathway Ecosystem Preview (0ms Load, Tanpa Gambar Berat) */}
                    <div className="relative lg:col-span-6">
                        {/* Kartu Mengambang Kanan Atas: Status Sesi Mentoring */}
                        <div className="animate-float-slow relative z-20 ml-auto mb-4 w-fit max-w-xs rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm sm:mb-0 sm:translate-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5E1] text-[#5C6F2B]">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-slate-800">Mentoring Terjadwal</span>
                                        <span className="rounded-full bg-[#EAF5E1] px-2 py-0.5 text-[10px] font-semibold text-[#5C6F2B]">
                                            Discord Ready
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Slot Gratis &amp; Berbayar (DP 50% Transparan)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Kartu Utama: Simulasi Course Roadmap Interaktif */}
                        <div className="relative z-10 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-300/40 sm:p-7">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <span className="text-[11px] font-bold tracking-wider text-[#6594B1] uppercase">
                                        Interactive Roadmap Preview
                                    </span>
                                    <h2 className="font-heading mt-0.5 text-lg font-bold text-slate-900">
                                        Jalur Full-Stack Developer
                                    </h2>
                                </div>
                                <div className="rounded-xl bg-[#E6EFF4] px-3 py-1.5 text-right">
                                    <span className="text-xs font-bold text-[#4A7692]">{currentProgress}% Selesai</span>
                                </div>
                            </div>

                            {/* Progress Bar Animasi */}
                            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    style={{ width: `${currentProgress}%` }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#6594B1] to-[#91D06C] transition-all duration-500 ease-out"
                                />
                            </div>

                            {/* Daftar Modul yang Bisa Diklik Pengunjung */}
                            <div className="mt-5 space-y-2.5">
                                {HERO_MODULES.map((mod, idx) => {
                                    const isSelected = activeHeroModule === idx;
                                    return (
                                        <button
                                            key={mod.title}
                                            type="button"
                                            onClick={() => setActiveHeroModule(idx)}
                                            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                                                isSelected
                                                    ? 'border-[#6594B1] bg-[#F3F8FB] shadow-sm'
                                                    : 'border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                                        isSelected
                                                            ? 'bg-[#6594B1] text-white'
                                                            : 'bg-white text-slate-600 shadow-xs'
                                                    }`}
                                                >
                                                    {idx + 1}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-800 sm:text-sm">
                                                    {mod.title}
                                                </span>
                                            </div>
                                            <span
                                                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                    mod.status === 'Selesai'
                                                        ? 'bg-[#EAF5E1] text-[#5C6F2B]'
                                                        : 'bg-[#E6EFF4] text-[#4A7692]'
                                                }`}
                                            >
                                                {mod.status}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <p className="mt-3 text-center text-[11px] text-slate-400">
                                Klik tahapan modul di atas untuk melihat simulasi progres belajar
                            </p>
                        </div>

                        {/* Kartu Mengambang Kiri Bawah: Sharing Journey & Community */}
                        <div className="animate-float-reverse relative z-20 mt-4 w-fit max-w-xs rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-lg shadow-slate-200/60 backdrop-blur-sm sm:-mt-5 sm:ml-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6EFF4] text-[#6594B1]">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Sharing Journey &amp; Forum</p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Bagikan progres &amp; raih poin kontribusi
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= KEUNGGULAN KHAS PATHWAY (BENTO GRID) ================= */}
            <section id="keunggulan" className="border-y border-slate-200/70 bg-white py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    <Reveal className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-bold tracking-wider text-[#6594B1] uppercase">
                            Kenapa Pathway Berbeda?
                        </span>
                        <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Satu Ekosistem untuk Belajar Mandiri &amp; Bimbingan Langsung
                        </h2>
                        <p className="mt-3 text-base leading-relaxed text-slate-600">
                            Dirancang khusus agar mahasiswa tidak lagi bingung harus mulai belajar dari mana atau ke
                            siapa harus bertanya saat menemui kendala teknis.
                        </p>
                    </Reveal>

                    <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                title: 'Course Roadmap Terstruktur',
                                desc: 'Materi disusun bertahap dengan pelacakan persentase progres otomatis dan contoh kode siap salin.',
                                badge: 'Belajar Terarah',
                                color: 'bg-[#E6EFF4] text-[#4A7692]',
                                icon: (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                    />
                                ),
                            },
                            {
                                title: '1-on-1 Mentoring via Discord',
                                desc: 'Pilih mentor terverifikasi sesuai bidang keahlian, atur jadwal tanpa bentrok, dan diskusi langsung di Discord.',
                                badge: 'Gratis & DP 50%',
                                color: 'bg-[#EAF5E1] text-[#5C6F2B]',
                                icon: (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                ),
                            },
                            {
                                title: 'Sharing Journey & Forum',
                                desc: 'Tanyakan error di Forum Diskusi dan dokumentasikan perjalanan belajarmu sebagai rekam jejak karya.',
                                badge: 'Komunitas Aktif',
                                color: 'bg-[#E6EFF4] text-[#4A7692]',
                                icon: (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                ),
                            },
                            {
                                title: 'Transparansi & Rewards',
                                desc: 'Setiap sesi dilengkapi konfirmasi selesai, rating jujur, serta sistem poin dan lencana untuk mentor aktif.',
                                badge: 'Terjamin Mutunya',
                                color: 'bg-[#EAF5E1] text-[#5C6F2B]',
                                icon: (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                    />
                                ),
                            },
                        ].map((feature, idx) => (
                            <Reveal
                                key={feature.title}
                                delay={idx * 90}
                                className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#6594B1]/40 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#6594B1] shadow-sm ring-1 ring-slate-200/70 transition-colors group-hover:bg-[#6594B1] group-hover:text-white">
                                            <svg
                                                className="h-6 w-6"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={1.9}
                                            >
                                                {feature.icon}
                                            </svg>
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${feature.color}`}>
                                            {feature.badge}
                                        </span>
                                    </div>
                                    <h3 className="font-heading mt-5 text-lg font-bold text-slate-900">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.desc}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= EKSPLOR COURSE ROADMAP (INTERAKTIF) ================= */}
            <section id="eksplor-course" className="py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <span className="text-xs font-bold tracking-wider text-[#6594B1] uppercase">
                                Kurikulum Terkurasi
                            </span>
                            <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                Mulai Pelajari Skill yang Relevan
                            </h2>
                            <p className="mt-2 max-w-2xl text-base text-slate-600">
                                Pilih bidang minatmu dan ikuti modul pembelajaran langkah demi langkah.
                            </p>
                        </div>

                        {/* Filter Tabs Aktif */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => {
                                const active = activeCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setActiveCategory(cat)}
                                        className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
                                            active
                                                ? 'bg-[#6594B1] text-white shadow-sm shadow-[#6594B1]/30'
                                                : 'border border-slate-200 bg-white text-slate-600 hover:border-[#6594B1]/50 hover:text-[#6594B1]'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </Reveal>

                    {/* Grid Kartu Course */}
                    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {filteredCourses.map((course, idx) => (
                            <Reveal
                                key={course.id}
                                delay={idx * 80}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#6594B1]/40 hover:shadow-xl hover:shadow-slate-200/60"
                            >
                                {/* Banner Header Kartu Tanpa Gambar Berat */}
                                <div className={`relative h-36 bg-gradient-to-br ${course.accent} p-5 text-white`}>
                                    <div className="flex items-center justify-between">
                                        <span className="rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-xs">
                                            {course.category}
                                        </span>
                                        <span className="rounded-full bg-[#91D06C] px-2.5 py-0.5 text-[11px] font-bold text-slate-900">
                                            {course.tag}
                                        </span>
                                    </div>
                                    <div className="mt-6 flex items-center gap-3 text-xs text-white/90">
                                        <span>{course.level}</span>
                                        <span>•</span>
                                        <span>{course.modules}</span>
                                        <span>•</span>
                                        <span>{course.duration}</span>
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col justify-between p-5">
                                    <div>
                                        <h3 className="font-heading text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#6594B1]">
                                            {course.title}
                                        </h3>
                                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                                            {course.desc}
                                        </p>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="rounded-lg bg-[#EAF5E1] px-2.5 py-1 text-xs font-bold text-[#5C6F2B]">
                                            {course.price}
                                        </span>
                                        <Link
                                            href={
                                                auth?.user
                                                    ? safeRoute('courses.index', '/courses')
                                                    : safeRoute('register', '/register')
                                            }
                                            className="inline-flex items-center gap-1 text-xs font-bold text-[#6594B1] transition-transform group-hover:translate-x-1"
                                        >
                                            Pelajari
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= ALUR PENGGUNAAN (MENTEE VS MENTOR SWITCH) ================= */}
            <section id="cara-kerja" className="border-t border-slate-200/70 bg-white py-20 sm:py-24">
                <div className="mx-auto max-w-7xl px-5 sm:px-8">
                    <Reveal className="mx-auto max-w-2xl text-center">
                        <span className="text-xs font-bold tracking-wider text-[#6594B1] uppercase">
                            Alur Kolaborasi Jelas
                        </span>
                        <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Bagaimana Pathway Bekerja?
                        </h2>

                        {/* Switch Toggle Mentee / Mentor */}
                        <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-[#F8FAFC] p-1.5">
                            <button
                                type="button"
                                onClick={() => setActiveRoleTab('mentee')}
                                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                                    activeRoleTab === 'mentee'
                                        ? 'bg-[#6594B1] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Sebagai Mentee (Siswa)
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveRoleTab('mentor')}
                                className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                                    activeRoleTab === 'mentor'
                                        ? 'bg-[#6594B1] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Sebagai Mentor
                            </button>
                        </div>
                    </Reveal>

                    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
                        {(activeRoleTab === 'mentee'
                            ? [
                                  {
                                      step: '01',
                                      title: 'Pilih Roadmap & Mentor',
                                      desc: 'Pelajari modul gratis secara mandiri atau saring mentor sesuai keahlian yang dibutuhkan.',
                                  },
                                  {
                                      step: '02',
                                      title: 'Booking Jadwal Sesi',
                                      desc: 'Pilih slot waktu yang tersedia (sesi gratis atau berbayar dengan DP 50% yang transparan).',
                                  },
                                  {
                                      step: '03',
                                      title: 'Diskusi via Discord',
                                      desc: 'Setelah mentor mengonfirmasi pesanan, tautan ruang bimbingan Discord otomatis terbuka.',
                                  },
                                  {
                                      step: '04',
                                      title: 'Selesai & Beri Ulasan',
                                      desc: 'Konfirmasi sesi selesai, berikan rating untuk mentor, dan bagikan progresmu di Sharing Journey.',
                                  },
                              ]
                            : [
                                  {
                                      step: '01',
                                      title: 'Lengkapi Profil & Portofolio',
                                      desc: 'Tampilkan bidang keahlian, bio profesional, dan tautan karya untuk membangun kepercayaan mentee.',
                                  },
                                  {
                                      step: '02',
                                      title: 'Atur Slot Ketersediaan',
                                      desc: 'Tentukan hari, jam, dan tarif sesi. Sistem otomatis mencegah jadwal yang saling bertabrakan.',
                                  },
                                  {
                                      step: '03',
                                      title: 'Konfirmasi & Bimbing',
                                      desc: 'Tinjau permintaan booking mentee, terima pesanan, dan laksanakan sesi bimbingan di Discord.',
                                  },
                                  {
                                      step: '04',
                                      title: 'Kumpulkan Poin & Rewards',
                                      desc: 'Tandai sesi selesai, dapatkan ulasan positif, raih lencana, dan tukarkan poin dengan merchandise.',
                                  },
                              ]
                        ).map((item) => (
                            <div
                                key={item.step}
                                className="relative rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-6 transition-all hover:border-[#6594B1]/40 hover:bg-white hover:shadow-md"
                            >
                                <span className="font-heading inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#E6EFF4] text-sm font-extrabold text-[#4A7692]">
                                    {item.step}
                                </span>
                                <h3 className="font-heading mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ================= CTA BANNER AKHIR ================= */}
            <section className="px-5 py-16 sm:px-8 sm:py-20">
                <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#6594B1] via-[#4D7893] to-[#375B72] px-6 py-14 text-center text-white shadow-2xl shadow-[#6594B1]/25 sm:px-14">
                    <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-[#91D06C]/25 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

                    <div className="relative z-10 mx-auto max-w-2xl">
                        <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Siap Memulai Perjalanan Belajarmu di Pathway?
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-white/90">
                            Bergabung sekarang untuk mengakses roadmap pembelajaran terstruktur, berdiskusi dengan
                            komunitas, dan terhubung dengan mentor pilihanmu.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                            {auth?.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="w-full rounded-xl bg-[#91D06C] px-7 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#82C25D] sm:w-auto"
                                >
                                    Masuk ke Dashboard Saya
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={safeRoute('register', '/register')}
                                        className="w-full rounded-xl bg-[#91D06C] px-7 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#82C25D] sm:w-auto"
                                    >
                                        Daftar Akun Gratis
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="w-full rounded-xl border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-xs transition-all hover:bg-white/20 sm:w-auto"
                                    >
                                        Sudah Punya Akun? Masuk
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </Reveal>
            </section>

            {/* ================= FOOTER BERSIH ================= */}
            <footer className="border-t border-slate-200 bg-white py-10">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm text-slate-500 sm:flex-row sm:px-8">
                    <div className="flex items-center gap-2.5">
                        <img src="/images/pathwayIcon.png" alt="Pathway" className="h-7 w-auto" />
                        <span className="font-heading font-bold text-slate-800">Pathway</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-slate-500">Course Roadmap &amp; Peer Mentoring Platform</span>
                    </div>
                    <p className="text-xs text-slate-400">&copy; 2026 Pathway. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}