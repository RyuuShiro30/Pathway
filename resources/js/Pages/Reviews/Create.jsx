import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Create({ session }) {
    const { data, setData, post, processing, errors } = useForm({
        rating: 0,
        feedback: '',
    });

    const submit = (e) => {
        e.preventDefault();

        if (data.rating < 1 || data.rating > 5) {
            return;
        }

        post(route('reviews.store', session.id));
    };

    return (
        <>
            <Head title="Rating dan Ulasan Mentor" />

            <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
                <main className="mx-auto flex max-w-7xl flex-col px-4 py-10 md:py-11">

                    {/* Form Review */}
                    <div className="mx-auto w-full max-w-xl">

                        {/* Kembali */}
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-[#6594B1]"
                        >
                            ← Kembali ke Dashboard
                        </Link>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-8">

                            {/* Header */}
                            <div className="text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E6EFF4] text-3xl font-semibold text-[#6594B1]">
                                    {session.mentor.name.charAt(0).toUpperCase()}
                                </div>

                                <span className="mt-5 inline-block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6594B1]">
                                    Pengalaman Mentoring
                                </span>

                                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
                                    Beri Rating dan Ulasan
                                </h1>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Bagaimana pengalaman mentoring kamu bersama
                                </p>

                                <h2 className="mt-1 text-lg font-semibold text-slate-800">
                                    {session.mentor.name}
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    {session.schedule_time}
                                </p>
                            </div>

                            <div className="my-7 h-px bg-slate-200" />

                            <form onSubmit={submit}>

                                {/* Rating */}
                                <div className="text-center">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Berikan penilaian kamu
                                    </label>

                                    <div className="mt-4 flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setData('rating', star)}
                                                aria-label={`Beri rating ${star} dari 5`}
                                                aria-pressed={data.rating === star}
                                                className={`text-4xl transition-all duration-200 hover:scale-110 ${
                                                    star <= data.rating
                                                        ? 'text-[#E5B94C]'
                                                        : 'text-slate-200 hover:text-[#E5B94C]'
                                                }`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>

                                    <p className="mt-2 text-sm text-slate-500">
                                        {data.rating === 0
                                            ? 'Pilih jumlah bintang'
                                            : `${data.rating} dari 5 bintang`}
                                    </p>

                                    {errors.rating && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {errors.rating}
                                        </p>
                                    )}
                                </div>

                                {/* Feedback */}
                                <div className="mt-8">
                                    <label
                                        htmlFor="feedback"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Ceritakan pengalaman kamu
                                    </label>

                                    <textarea
                                        id="feedback"
                                        value={data.feedback}
                                        onChange={(e) =>
                                            setData('feedback', e.target.value)
                                        }
                                        rows={5}
                                        maxLength={1000}
                                        placeholder="Tulis pendapat kamu tentang sesi mentoring ini..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/15"
                                    />

                                    {errors.feedback && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {errors.feedback}
                                        </p>
                                    )}

                                    <p className="mt-1 text-right text-xs text-slate-400">
                                        {data.feedback.length}/1000 karakter
                                    </p>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={processing || data.rating === 0}
                                    className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-[#6594B1] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#56839F] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {processing ? 'Mengirim...' : 'Kirim Ulasan'}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
