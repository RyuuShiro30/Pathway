import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function Dashboard() {
    const props = usePage().props || {};

    const activeCourses = props.activeCourses || [];
    const lastBooking = props.lastBooking || null;
    const myCourses = props.myCourses || [];
    const completedSessions = props.completedSessions || [];
    
    // Tangkap data angka statistik dari Controller
    const courseSelesaiCount = props.courseSelesaiCount || 0;
    const modulSelesaiCount = props.modulSelesaiCount || 0;
    const sesiSelesaiCount = props.sesiSelesaiCount || 0;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
            <Head title="Dashboard User - Pathway" />

            <Navbar active="dashboard" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-6">

                        {/* Statistik */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <p className="text-xs text-slate-500 font-medium uppercase">
                                    Course Selesai
                                </p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {courseSelesaiCount}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <p className="text-xs text-slate-500 font-medium uppercase">
                                    Modul Selesai
                                </p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {modulSelesaiCount}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                <p className="text-xs text-slate-500 font-medium uppercase">
                                    Sesi Bimbingan Selesai
                                </p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {sesiSelesaiCount}
                                </p>
                            </div>
                        </div>

                        {/* Kelas Saya */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">
                                Kelas Saya
                            </h2>

                            {myCourses.length > 0 ? (
                                myCourses.map(enrollment => {
                                    const isCompleted =
                                        enrollment.status === 'completed' ||
                                        enrollment.progress_percentage === 100;

                                    return (
                                        <div
                                            key={enrollment.id}
                                            className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-100 rounded-lg hover:shadow-md transition mb-3"
                                        >
                                            <div className="mb-4 md:mb-0 w-full md:w-2/3">
                                                <h3 className="font-semibold text-slate-800">
                                                    {enrollment.course?.title}
                                                </h3>

                                                <p className="text-sm text-slate-500 mt-1">
                                                    Progres Kelas
                                                </p>

                                                <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            isCompleted
                                                                ? 'bg-indigo-500'
                                                                : 'bg-emerald-500'
                                                        }`}
                                                        style={{
                                                            width: `${enrollment.progress_percentage ?? 0}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <Link
                                                href={`/courses/${enrollment.course?.slug || enrollment.course_id}`}
                                                className={`px-5 py-2 text-white text-sm font-semibold rounded-lg shadow transition whitespace-nowrap ${
                                                    isCompleted
                                                        ? 'bg-indigo-600 hover:bg-indigo-700'
                                                        : 'bg-cyan-600 hover:bg-cyan-700'
                                                }`}
                                            >
                                                {isCompleted ? 'Pelajari Ulang' : 'Lanjutkan'}
                                            </Link>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p className="text-slate-500 text-sm">
                                        Belum ada course yang sedang dipelajari.
                                    </p>
                                    <Link
                                        href="/courses"
                                        className="inline-block mt-3 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800"
                                    >
                                        Cari Course
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Jadwal Terdekat */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-4">
                                Sesi Bimbingan Terdekat
                            </h2>

                            {lastBooking ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 rounded-lg">
                                    <div>
                                        <h3 className="text-white font-semibold">
                                            Mentor: {lastBooking.mentor?.name ?? 'Anonim'}
                                        </h3>
                                        <p className="text-sm text-slate-400">
                                            {lastBooking.schedule_time} WIB
                                        </p>
                                    </div>

                                    {lastBooking.status === 'confirmed' &&
                                    lastBooking.discord_link ? (
                                        <a
                                            href={lastBooking.discord_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg font-medium text-center"
                                        >
                                            Join Discord
                                        </a>
                                    ) : (
                                        <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
                                            Menunggu Konfirmasi
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">
                                    Belum ada jadwal bimbingan dalam waktu dekat.
                                </p>
                            )}
                        </div>

                        {/* Riwayat Mentoring dan Rating */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">
                                Riwayat Mentoring
                            </h2>
                            <p className="text-sm text-slate-500 mb-5">
                                Berikan rating dan ulasan setelah sesi mentoring selesai.
                            </p>

                            {completedSessions.length > 0 ? (
                                <div className="space-y-4">
                                    {completedSessions.map(session => {
                                        const alreadyReviewed = Boolean(session.review);
                                        
                                        return (
                                            <div
                                                key={session.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 rounded-xl p-4"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">
                                                        {session.mentor?.name ?? 'Mentor'}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        {session.schedule_time ?? 'Jadwal tidak tersedia'}
                                                    </p>
                                                    <span className="inline-block mt-2 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                                                        Selesai
                                                    </span>
                                                </div>

                                                {alreadyReviewed ? (
                                                    <div className="text-sm font-medium text-emerald-700">
                                                        ★ {session.review.rating}/5 — Sudah diulas
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={`/sessions/${session.id}/review`}
                                                        className="inline-flex justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg"
                                                    >
                                                        Beri Rating
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                    <p className="text-sm text-slate-500">
                                        Belum ada sesi mentoring yang selesai.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Kolom Kanan */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900">
                                    Top Learner
                                </h2>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                                    Bulan Ini
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900">
                                Fire Streak 🔥
                            </h2>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
