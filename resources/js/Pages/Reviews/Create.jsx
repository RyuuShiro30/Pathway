
import React from 'react';
import { Head, useForm } from '@inertiajs/react';

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

            <div className="min-h-screen bg-gray-50 px-4 py-10">
                <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                    <a
                        href="/dashboard"
                        className="text-sm text-gray-500 hover:text-gray-800"
                    >
                        ← Kembali ke Dashboard
                    </a>

                    <div className="mt-6 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl font-semibold text-indigo-600">
                            {session.mentor.name.charAt(0).toUpperCase()}
                        </div>

                        <h1 className="mt-4 text-2xl font-bold text-gray-900">
                            Beri Rating dan Ulasan
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Bagaimana pengalaman mentoring kamu bersama
                        </p>

                        <h2 className="mt-1 text-lg font-semibold text-gray-800">
                            {session.mentor.name}
                        </h2>

                        <p className="mt-1 text-sm text-gray-400">
                            {session.schedule_time}
                        </p>
                    </div>

                    <form onSubmit={submit} className="mt-8">
                        <div className="text-center">
                            <p className="font-medium text-gray-700">
                                Berikan penilaian kamu
                            </p>

                            <div className="mt-3 flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setData('rating', star)}
                                        aria-label={`Beri rating ${star} dari 5`}
                                        className={`text-4xl transition ${
                                            star <= data.rating
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
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

                        <div className="mt-8">
                            <label
                                htmlFor="feedback"
                                className="mb-2 block font-medium text-gray-700"
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
                                className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                            />

                            {errors.feedback && (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.feedback}
                                </p>
                            )}

                            <p className="mt-1 text-right text-xs text-gray-400">
                                {data.feedback.length}/1000 karakter
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={processing || data.rating === 0}
                            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Mengirim...' : 'Kirim Ulasan'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
