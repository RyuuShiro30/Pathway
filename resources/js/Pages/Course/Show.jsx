import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';

// 1. Menerima props 'course' dan 'materials' dari Backend
export default function Show({ course, materials = [] }) {
    
    // 2. Inisialisasi state modules (Pakai data database jika ada, jika kosong pakai dummy aslimu)
    const [modules, setModules] = useState(
        materials.length > 0 
            ? materials.map(m => ({ ...m, is_completed: false })) 
            : [
                { id: 101, title: 'Pendahuluan React & Inertia.js', is_completed: true },
                { id: 102, title: 'Setup Environment & Instalasi', is_completed: true },
                { id: 103, title: 'Membuat Layout Dasar SPA', is_completed: true },
                { id: 104, title: 'Routing dengan Inertia Link', is_completed: true },
                { id: 105, title: 'Passing Data dari Controller ke View', is_completed: true },
                { id: 106, title: 'Penanganan Form & Validasi', is_completed: true },
                { id: 107, title: 'Kuis: Optimasi dan Build Asset', is_completed: false },
            ]
    );

    // 3. Set materi aktif pertama secara dinamis berdasarkan array
    const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id);

    // Kalkulasi
    const activeIndex = modules.findIndex((m) => m.id === activeModuleId);
    const activeModule = modules[activeIndex];
    const isFirst = activeIndex === 0;
    const isLast = activeIndex === modules.length - 1;

    const completedCount = modules.filter((m) => m.is_completed).length;
    const progressPercentage = Math.round((completedCount / modules.length) * 100) || 0;

    // Otomatis scroll ke atas setiap pindah materi
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeModuleId]);

    // Handlers
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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
            {/* Typo di tag Head sudah diperbaiki */}
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
                    {/* Judul Course dari Database */}
                    <h2 className="text-sm font-bold text-slate-900 truncate px-4">
                        {course?.title || 'Judul Course'}
                    </h2>
                </div>
                <div className="flex-1 flex justify-end items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                        {/* Inisial Instructor / Author dari Database (Fallback 'A') */}
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

                        {/* Timeline List */}
                        <div className="ml-1">
                            {modules.map((module, index) => {
                                const isActive = activeModuleId === module.id;
                                const isCompleted = module.is_completed;
                                const isLastItem = index === modules.length - 1;

                                return (
                                    <div key={module.id} className="relative group flex">

                                        {/* Kolom Kiri: Node (Lingkaran) & Garis */}
                                        <div className="flex flex-col items-center mr-5">
                                            {/* Node Lingkaran */}
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

                                            {/* Garis Penghubung */}
                                            {!isLastItem && (
                                                <div className="w-1 bg-slate-300 h-full my-1 rounded-full"></div>
                                            )}
                                        </div>

                                        {/* Kolom Kanan: Teks Judul */}
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

                    {/* Card Konten Utama */}
                    <article className="bg-white rounded-[2rem] p-8 md:p-16 shadow-sm border border-slate-200">
                        {/* Label & Title */}
                        <div className="mb-10">
                            <span className="inline-block py-1 px-3 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold tracking-wider uppercase mb-4">
                                Modul {activeIndex + 1} dari {modules.length}
                            </span>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                {activeModule?.title}
                            </h1>
                        </div>

                        {/* Isi Materi - Render konten DB jika ada, jika tidak pakai dummy text */}
                        {activeModule?.content ? (
                            <div className="text-slate-600 text-lg leading-relaxed space-y-6" dangerouslySetInnerHTML={{ __html: activeModule.content }} />
                        ) : (
                            <div className="text-slate-600 text-lg leading-relaxed space-y-6">
                                <p>
                                    Halo calon <span className="italic text-slate-800 font-medium">developer</span>! Pada modul ini kita akan membahas tentang materi <strong>{activeModule?.title}</strong>.
                                </p>
                                <div className="p-6 bg-slate-50 border-l-4 border-emerald-500 rounded-r-2xl my-8">
                                    <p className="text-slate-700 italic m-0">
                                        "Ini adalah teks dummy karena tabel course_materials di database kamu mungkin belum ada isinya untuk materi ini."
                                    </p>
                                </div>
                                <p>
                                    Silakan selesaikan materi ini dengan menekan tombol <strong>Selesai & Lanjut</strong> di bawah.
                                </p>
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