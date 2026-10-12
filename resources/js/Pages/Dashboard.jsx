import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function Dashboard() {
    const props = usePage().props || {};
    const auth = props.auth;
    const activeCourses = props.activeCourses || [];
    const lastBooking = props.lastBooking || null;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
            <Head title="Dashboard User - Pathway" />

            <div className="min-h-screen">
                {/* NAVBAR */}
                <Navbar active="dashboard" />

                {/* KONTEN UTAMA */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* KOLOM KIRI (Course & Booking) - Mengambil porsi 2/3 layar */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Section Statistik Belajar (Quick Stats) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Stat Card 1 */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center space-x-4">
                                    <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Course Selesai</p>
                                        <p className="text-2xl font-bold text-slate-900">0</p>
                                    </div>
                                </div>

                                {/* Stat Card 2 */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center space-x-4">
                                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Modul Diselesaikan</p>
                                        <p className="text-2xl font-bold text-slate-900">0</p>
                                    </div>
                                </div>

                                {/* Stat Card 3 */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center space-x-4">
                                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sesi Bimbingan</p>
                                        <p className="text-2xl font-bold text-slate-900">0</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: Course yang Sedang Dipelajari */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Lanjutkan Belajarmu</h2>

                                {activeCourses && activeCourses.length > 0 ? (
                                    activeCourses.map((enrollment) => (
                                        <div key={enrollment.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-100 rounded-lg hover:shadow-md transition mb-3">
                                            <div className="mb-4 md:mb-0 w-full md:w-2/3">
                                                <h3 className="font-semibold text-slate-800">{enrollment.course?.title}</h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {enrollment.completed_modules_count} / {enrollment.total_modules_count} Bab Selesai
                                                </p>

                                                {/* Progress Bar */}
                                                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${enrollment.progress_percentage}%` }}></div>
                                                </div>
                                            </div>
                                            <Link href={`/courses/${enrollment.id}`} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg shadow transition whitespace-nowrap">
                                                Lanjutkan
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                        <p className="text-slate-500 text-sm">Belum ada course yang sedang dipelajari.</p>
                                        <Link href="/courses" className="inline-block mt-3 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800">
                                            Cari Course
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Section 2: Booking Mentoring Terakhir */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Sesi Bimbingan Terdekat</h2>

                                {lastBooking ? (
                                    <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg shadow-inner">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-slate-800 p-3 rounded-lg text-cyan-400">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">Mentor: {lastBooking.mentor?.name ?? 'Anonim'}</h3>
                                                <p className="text-sm text-slate-400">{lastBooking.schedule_time} WIB</p>
                                            </div>
                                        </div>
                                        <div>
                                            {lastBooking.status === 'confirmed' ? (
                                                <a href={lastBooking.discord_link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg font-medium shadow-md">
                                                    Join Discord
                                                </a>
                                            ) : (
                                                <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
                                                    Menunggu Konfirmasi
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">Belum ada jadwal bimbingan dalam waktu dekat.</p>
                                )}
                            </div>
                        </div>

                        {/* KOLOM KANAN (Leaderboards) - Mengambil porsi 1/3 layar */}
                        <div className="space-y-6">

                            {/* Leaderboard: Poin Progress Bab */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-slate-900">Top Learner</h2>
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">Bulan Ini</span>
                                </div>
                                {/* 
                                <ul className="space-y-4">
                                    @foreach($pointLeaderboard as $index =>$user)
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-lg font-bold w-4">...</span>
                                            <span className="text-sm font-semibold text-slate-700">User</span>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-500">Poin</span>
                                    </div>
                                    @endforeach
                                </ul> 
                                */}
                            </div>

                            {/* Leaderboard: Streak Aktif */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-slate-900">Fire Streak 🔥</h2>
                                </div>
                                {/* 
                                <ul className="space-y-4">
                                    ...
                                </ul> 
                                */}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}