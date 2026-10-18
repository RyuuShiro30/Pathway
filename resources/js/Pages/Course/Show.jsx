import React, { useState } from 'react';
import { Head } from '@inertiajs/react';

const TYPE_META = {
    video: {
        label: 'Video',
        path: 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z',
    },
    text: {
        label: 'Bacaan',
        path: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    },
    quiz: {
        label: 'Kuis',
        path: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
    },
};

function TypeIcon({ type, className = 'w-3.5 h-3.5' }) {
    const meta = TYPE_META[type] ?? TYPE_META.text;
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d={meta.path} />
        </svg>
    );
}

function StatusIndicator({ completed, active }) {
    if (completed) {
        return (
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#5a768c] text-white">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </span>
        );
    }
    if (active) {
        return (
            <span className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#5a768c] bg-white">
                <span className="w-2 h-2 rounded-full bg-[#5a768c]" />
            </span>
        );
    }
    return <span className="block w-6 h-6 rounded-full border-2 border-gray-200 bg-white" />;
}

export default function CourseShow() {
    const courseDetail = {
        id: 1,
        title: 'Mastering React & Inertia.js untuk Single Page Application',
    };

    const modules = [
        { id: 101, title: 'Pendahuluan React & Inertia.js', is_completed: true, type: 'video' },
        { id: 102, title: 'Setup Environment & Instalasi', is_completed: true, type: 'video' },
        { id: 103, title: 'Membuat Layout Dasar SPA', is_completed: true, type: 'video' },
        { id: 104, title: 'Routing dengan Inertia Link', is_completed: false, type: 'video' },
        { id: 105, title: 'Passing Data dari Controller ke View', is_completed: false, type: 'video' },
        { id: 106, title: 'Penanganan Form & Validasi', is_completed: false, type: 'text' },
        { id: 107, title: 'Kuis: Optimasi dan Build Asset', is_completed: false, type: 'quiz' },
    ];

    const [activeModuleId, setActiveModuleId] = useState(104);

    const completedCount = modules.filter((m) => m.is_completed).length;
    const progressPercentage = Math.round((completedCount / modules.length) * 100);
    const activeModule = modules.find((m) => m.id === activeModuleId);

    return (
        <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
            <Head title={`${courseDetail.title} - Pathway`} />

            {/* KIRI: SIDEBAR */}
            <aside className="w-[320px] bg-gray-50/60 border-r border-gray-200 flex flex-col h-full flex-shrink-0 z-10">
                {/* Header Sidebar */}
                <div className="pt-7 px-6 pb-5 bg-white border-b border-gray-200">
                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-800 mb-6 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Dashboard
                    </a>

                    <h2 className="font-bold text-gray-900 text-[15px] leading-snug mb-5">
                        {courseDetail.title}
                    </h2>

                    {/* Progres belajar: ramping & berwarna */}
                    <div className="flex justify-between items-baseline mb-2 text-[12px]">
                        <span className="text-gray-500">
                            {completedCount} dari {modules.length} modul selesai
                        </span>
                        <span className="font-bold text-[#5a768c]">{progressPercentage}%</span>
                    </div>
                    <div
                        className="w-full h-2 rounded-full bg-gray-100 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={progressPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Progres belajar"
                    >
                        <div
                            className="h-full rounded-full bg-linear-to-r from-[#5a768c] to-sky-400 transition-all duration-500 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Daftar Materi */}
                <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Daftar materi">
                    <div className="px-2 mb-3 text-[13px] font-semibold text-gray-500">Daftar Materi</div>

                    <ul className="space-y-1">
                        {modules.map((module) => {
                            const isActive = activeModuleId === module.id;
                            return (
                                <li key={module.id}>
                                    <button
                                        onClick={() => setActiveModuleId(module.id)}
                                        aria-current={isActive ? 'true' : undefined}
                                        className={`relative w-full text-left pl-4 pr-3 py-3 flex gap-3 items-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5a768c]/50
                                            ${isActive ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'hover:bg-white/70'}
                                        `}
                                    >
                                        {isActive && (
                                            <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#5a768c]" />
                                        )}

                                        <div className="flex-shrink-0">
                                            <StatusIndicator completed={module.is_completed} active={isActive} />
                                        </div>

                                        <div className="min-w-0">
                                            <div
                                                className={`text-[14px] leading-snug ${isActive
                                                    ? 'text-gray-900 font-semibold'
                                                    : module.is_completed
                                                        ? 'text-gray-600'
                                                        : 'text-gray-700'
                                                    }`}
                                            >
                                                {module.title}
                                            </div>
                                            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-400">
                                                <TypeIcon type={module.type} />
                                                {TYPE_META[module.type]?.label}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </aside>

            {/* KANAN: KONTEN MATERI */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto bg-white">
                <div className="max-w-4xl mx-auto w-full px-12 md:px-20 py-14">
                    {/* Header Modul Aktif */}
                    <div className="mb-6">
                        <h1 className="text-[22px] font-bold text-gray-900 leading-snug">{activeModule?.title}</h1>
                    </div>

                    {/* Konten Teks Materi */}
                    <div className="max-w-none text-gray-600 leading-relaxed text-[15px]">
                        <p className="mb-8">
                            Halo calon <em>developer</em>! Pada modul sebelumnya, kita sudah berhasil melakukan
                            instalasi dan setup layout dasar dari Pathway. Sekarang kita akan membahas bagaimana cara
                            berpindah halaman di React menggunakan Inertia.js.
                        </p>

                        <p className="font-bold text-gray-900 mb-4">Kenapa tidak menggunakan tag &lt;a&gt; HTML biasa?</p>

                        <p className="mb-4">
                            Jika kita menggunakan tag anchor (<code>&lt;a href="..."&gt;</code>) konvensional,{' '}
                            <em>browser</em> akan melakukan <em>full page reload</em>. Ini akan membuat aplikasi Single
                            Page Application (SPA) kita terasa lambat seperti website tradisional.
                        </p>

                        <p className="mb-16">
                            Sebagai solusinya, Inertia.js menyediakan komponen <code>&lt;Link&gt;</code>. Komponen ini
                            bekerja dengan cara "mencegat" (intercept) klik kita, lalu melakukan <em>request</em>{' '}
                            XHR/AJAX ke server Laravel di belakang layar secara mulus tanpa <em>loading</em> putih di
                            layar.
                        </p>
                    </div>

                    <hr className="border-gray-100 mb-10 w-full" />

                    {/* Navigasi Bawah */}
                    <div className="flex justify-between items-center w-full">
                        <button className="flex items-center justify-center gap-4 px-6 py-3 border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors w-[180px] h-[64px]">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="text-[13px] leading-tight text-left text-gray-600 font-medium">
                                Materi<br />Sebelumnya
                            </span>
                        </button>

                        <button className="flex items-center justify-center gap-4 px-6 py-3 bg-[#5a768c] text-white hover:bg-[#496174] transition-colors w-[180px] h-[64px] shadow-sm">
                            <span className="text-[13px] leading-tight text-center font-medium">
                                Tandai<br />Selesai & Lanjut
                            </span>
                            <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
