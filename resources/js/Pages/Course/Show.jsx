import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';

export default function Show({ course, materials = [] }) {
    
    const [modules, setModules] = useState(
        materials.length > 0 
            ? materials.map(m => ({ ...m, is_completed: false })) 
            : [
                { id: 101, title: 'Pendahuluan', is_completed: true, content_body: '<p>Teks dummy.</p>' }
            ]
    );

    const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id);

    // Kalkulasi
    const activeIndex = modules.findIndex((m) => m.id === activeModuleId);
    const activeModule = modules[activeIndex];
    const isFirst = activeIndex === 0;
    const isLast = activeIndex === modules.length - 1;

    const completedCount = modules.filter((m) => m.is_completed).length;
    const progressPercentage = Math.round((completedCount / modules.length) * 100) || 0;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeModuleId]);

    const handlePrevious = () => {
        if (!isFirst) setActiveModuleId(modules[activeIndex - 1].id);
    };

    const handleCompleteAndNext = () => {
        const updatedModules = [...modules];
        if (!updatedModules[activeIndex].is_completed) {
            updatedModules[activeIndex] = { ...updatedModules[activeIndex], is_completed: true };
            setModules(updatedModules);
        }
        if (!isLast) {
            setActiveModuleId(updatedModules[activeIndex + 1].id);
        }
    };

    // Fungsi canggih untuk mengubah link YouTube biasa menjadi format Embed
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}?rel=0`; // rel=0 agar video rekomendasi di akhir nggak ngaco
        }
        return url;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
            <Head title={`${activeModule?.title || 'Materi'} - Pathway`} />

            {/* TOP NAVIGATION BAR */}
            <header className="fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center px-6 md:px-12">
                <div className="flex-1">
                    <a href="/courses" className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </span>
                        Kembali
                    </a>
                </div>
                <div className="flex-1 text-center hidden md:block">
                    <h2 className="text-sm font-bold text-slate-900 truncate px-4">
                        {course?.title || 'Judul Course'}
                    </h2>
                </div>
                <div className="flex-1 flex justify-end items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                        {course?.instructor?.charAt(0) || 'A'}
                    </div>
                </div>
            </header>

            {/* MAIN LAYOUT */}
            <main className="pt-32 px-6 lg:px-12 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">

                {/* KOLOM KIRI: SIDEBAR INFORMASI & TIMELINE */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Widget Progress Belajar */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Progres Belajar</h3>
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{progressPercentage}%</span>
                            <span className="text-sm text-slate-500 font-medium">Diselesaikan</span>
                        </div>
                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative">
                            <div
                                className="absolute top-0 left-0 h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Widget Daftar Materi (Timeline Style) */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 sticky top-32">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Peta Modul</h3>
                        <div className="ml-1">
                            {modules.map((module, index) => {
                                const isActive = activeModuleId === module.id;
                                const isCompleted = module.is_completed;
                                const isLastItem = index === modules.length - 1;

                                return (
                                    <div key={module.id} className="relative group flex">
                                        <div className="flex flex-col items-center mr-5">
                                            <span className={`relative z-10 flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white transition-all duration-300 mt-0.5
                                                ${isActive ? 'bg-emerald-500 scale-125 ring-emerald-50 shadow-sm' : isCompleted ? 'bg-emerald-500' : 'bg-slate-300'}
                                            `}>
                                                {isCompleted && !isActive && (
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                                {isActive && (
                                                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                                                )}
                                            </span>
                                            {!isLastItem && (
                                                <div className="w-1 bg-slate-300 h-full my-1 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className={`w-full ${isLastItem ? '' : 'pb-9'}`}>
                                            <button
                                                onClick={() => setActiveModuleId(module.id)}
                                                className="text-left w-full focus:outline-none transition-transform group-hover:translate-x-1"
                                            >
                                                <h4 className={`text-[15px] leading-snug transition-colors
                                                    ${isActive ? 'font-bold text-emerald-600' : isCompleted ? 'font-medium text-slate-500 hover:text-emerald-500' : 'font-medium text-slate-600 hover:text-slate-900'}
                                                `}>
                                                    {module.title}
                                                </h4>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN: AREA MEMBACA KONTEN */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <article className="bg-white rounded-[2rem] p-8 md:p-16 shadow-sm border border-slate-200">
                        {/* Label & Title */}
                        <div className="mb-10">
                            <span className="inline-block py-1 px-3 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold tracking-wider uppercase mb-4">
                                {activeModule?.section_name || `Modul ${activeIndex + 1} dari ${modules.length}`}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                {activeModule?.title}
                            </h1>
                        </div>

                        {/* FITUR BARU: Video Embed YouTube (Hanya muncul jika content_url ada isinya) */}
                        {activeModule?.content_url && (
                            <div className="mb-12 rounded-2xl overflow-hidden shadow-md border border-slate-200 aspect-video bg-slate-900">
                                <iframe
                                    className="w-full h-full"
                                    src={getYouTubeEmbedUrl(activeModule.content_url)}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}

                        {/* Isi Materi Teks */}
                        {activeModule?.content_body ? (
                            <div className="text-slate-600 text-lg leading-relaxed space-y-6 prose prose-emerald max-w-none" dangerouslySetInnerHTML={{ __html: activeModule.content_body }} />
                        ) : (
                            <div className="text-slate-600 text-lg leading-relaxed space-y-6">
                                <p>Materi sedang disiapkan oleh mentor.</p>
                            </div>
                        )}
                    </article>

                    {/* Navigasi Bawah */}
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-full shadow-sm border border-slate-200 gap-4">
                        <button
                            onClick={handlePrevious}
                            disabled={isFirst}
                            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-full font-medium transition-all w-full sm:w-auto
                                ${isFirst ? 'opacity-40 cursor-not-allowed bg-transparent' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                            `}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Materi Sebelumnya
                        </button>
                        <button
                            onClick={handleCompleteAndNext}
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all w-full sm:w-auto"
                        >
                            {isLast ? 'Selesaikan Kelas' : 'Selesai & Lanjut'}
                            {!isLast && (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}