import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import Modal from '@/Components/Modal';

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

    const pendingReviewSession =
        completedSessions.find((session) => !session.review) || null;
    const [reviewSession, setReviewSession] = useState(pendingReviewSession);

    const {
        data: reviewData,
        setData: setReviewData,
        post: postReview,
        processing: reviewProcessing,
        errors: reviewErrors,
        reset: resetReview,
    } = useForm({
        rating: 0,
        feedback: '',
    });

    const submitReview = (event) => {
        event.preventDefault();

        if (!reviewSession || reviewData.rating === 0) {
            return;
        }

        postReview(`/sessions/${reviewSession.id}/review`, {
            onSuccess: () => {
                setReviewSession(null);
                resetReview();
            },
        });
    };

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
                                                className="px-5 py-2 text-white text-sm font-semibold rounded-lg shadow transition whitespace-nowrap bg-[#6594B1] hover:bg-[#527993]"
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

                                    {(lastBooking.status === 'dikonfirmasi' ||
                                        lastBooking.status === 'confirmed') &&
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
                                                    <div className="text-right">
                                                        <div className="text-sm font-medium text-emerald-700">
                                                            ★ {session.review.rating}/5 — Sudah diulas
                                                        </div>

                                                        {session.review.status === "menunggu" && (
                                                            <p className="mt-1 text-xs font-medium text-amber-600">
                                                                Menunggu moderasi admin
                                                            </p>
                                                        )}

                                                        {session.review.status === "ditolak" && (
                                                            <p className="mt-1 text-xs font-medium text-rose-600">
                                                                Ulasan ditolak oleh admin
                                                            </p>
                                                        )}
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

            <Modal
                show={Boolean(reviewSession)}
                onClose={() => setReviewSession(null)}
                maxWidth="lg"
            >
                <div className="p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6594B1]">
                                Menunggu Ulasan
                            </p>
                            <h2 className="mt-1 text-xl font-semibold text-slate-800">
                                Beri Rating dan Ulasan
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Bagaimana pengalaman mentoring kamu bersama{" "}
                                {reviewSession?.mentor?.name ?? "Mentor"}?
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setReviewSession(null)}
                            aria-label="Tutup form ulasan"
                            className="rounded-lg px-2 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            &times;
                        </button>
                    </div>

                    <form onSubmit={submitReview} className="mt-6">
                        <div className="text-center">
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() =>
                                            setReviewData("rating", star)
                                        }
                                        aria-label={`Beri rating ${star} dari 5`}
                                        aria-pressed={
                                            reviewData.rating === star
                                        }
                                        className={`text-4xl transition-all duration-200 hover:scale-110 ${
                                            star <= reviewData.rating
                                                ? "text-[#E5B94C]"
                                                : "text-slate-200 hover:text-[#E5B94C]"
                                        }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                                {reviewData.rating === 0
                                    ? "Pilih jumlah bintang"
                                    : `${reviewData.rating} dari 5 bintang`}
                            </p>

                            {reviewErrors.rating && (
                                <p className="mt-2 text-sm text-red-600">
                                    {reviewErrors.rating}
                                </p>
                            )}
                        </div>

                        <div className="mt-6">
                            <label
                                htmlFor="dashboard-review-feedback"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Ceritakan pengalaman kamu
                            </label>

                            <textarea
                                id="dashboard-review-feedback"
                                value={reviewData.feedback}
                                onChange={(event) =>
                                    setReviewData(
                                        "feedback",
                                        event.target.value,
                                    )
                                }
                                rows={4}
                                maxLength={1000}
                                placeholder="Tulis pendapat kamu tentang sesi mentoring ini..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/15"
                            />

                            {reviewErrors.feedback && (
                                <p className="mt-2 text-sm text-red-600">
                                    {reviewErrors.feedback}
                                </p>
                            )}

                            <p className="mt-1 text-right text-xs text-slate-400">
                                {reviewData.feedback.length}/1000 karakter
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setReviewSession(null)}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Nanti Saja
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    reviewProcessing || reviewData.rating === 0
                                }
                                className="rounded-lg bg-[#6594B1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {reviewProcessing
                                    ? "Mengirim..."
                                    : "Kirim Ulasan"}
                            </button>
                        </div>
                    </form>

                    <p className="mt-4 text-center text-xs text-slate-400">
                        Ulasan akan tampil di profil mentor setelah disetujui
                        admin. Kamu bisa mengisinya nanti lewat menu notifikasi
                        "Menunggu Ulasan".
                    </p>
                </div>
            </Modal>
        </div>
    );
}
