import { Head, Link } from "@inertiajs/react";
import Navbar from "@/Components/Navbar";

const benefits = [
    {
        number: "01",
        title: "Bagikan Keahlian",
        description:
            "Bagikan pengetahuan dan pengalamanmu kepada mahasiswa yang sedang mempersiapkan perjalanan belajarnya.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
            >
                <path d="M12 3v18" />
                <path d="M17 8a5 5 0 0 0-10 0c0 2.8 2.2 5 5 5s5 2.2 5 5a5 5 0 0 1-10 0" />
            </svg>
        ),
    },
    {
        number: "02",
        title: "Bantu Mahasiswa",
        description:
            "Bantu mahasiswa menemukan arah belajar dan memahami bidang yang ingin mereka tekuni.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
            >
                <path d="M22 10 12 5 2 10l10 5 10-5Z" />
                <path d="M6 12.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.5" />
                <path d="M22 10v5" />
            </svg>
        ),
    },
    {
        number: "03",
        title: "Bangun Profil",
        description:
            "Tampilkan keahlian, portfolio, dan pengalamanmu melalui profil mentor Pathway.",
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
            >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
                <path d="m17 4 .8 1.6L19.5 6l-1.7.4L17 8l-.8-1.6L14.5 6l1.7-.4L17 4Z" />
            </svg>
        ),
    },
];

const steps = [
    {
        number: "01",
        title: "Lengkapi Profil",
        description:
            "Isi informasi diri, keahlian, bio, dan informasi pendukung lainnya.",
    },
    {
        number: "02",
        title: "Tambahkan Bukti",
        description:
            "Masukkan portfolio serta sertifikat atau bukti pengalaman yang relevan.",
    },
    {
        number: "03",
        title: "Verifikasi",
        description:
            "Data pendaftaran akan diperiksa oleh admin sebelum profil disetujui.",
    },
    {
        number: "04",
        title: "Mulai Mentoring",
        description:
            "Setelah disetujui, profilmu dapat ditampilkan dan kamu siap menjadi mentor.",
    },
];

export default function BecomeMentor() {
    return (
        <>
            <Head title="Jadi Mentor" />

            <div className="min-h-screen bg-[#F1F6F8]">
                {/* ================= NAVBAR ================= */}
                <Navbar active="jadi-mentor" />

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
                    {/* ================= HERO ================= */}
                    <section className="relative mb-7 overflow-hidden rounded-3xl bg-[#6594B1] px-6 py-8 shadow-sm sm:px-8 sm:py-10">
                        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10" />

                        <div className="absolute -bottom-20 right-32 h-44 w-44 rounded-full bg-white/10" />

                        <div className="relative max-w-3xl">
                            <div className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                                Program Mentor Pathway
                            </div>

                            <h1 className="text-3xl font-bold text-white sm:text-4xl">
                                Jadi Mentor di Pathway
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
                                Bagikan pengalaman dan keahlianmu untuk membantu
                                mahasiswa menemukan jalur belajar yang sesuai.
                            </p>

                            <Link
                                href={route("mentor.register")}
                                className="mt-6 inline-flex items-center rounded-xl bg-[#95d56b] px-5 py-3 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-[#84c85b]"
                            >
                                Daftar Menjadi Mentor
                                <span className="ml-2">→</span>
                            </Link>
                        </div>
                    </section>

                    {/* ================= BENEFIT ================= */}
                    <section className="mb-6 rounded-2xl border border-[#D7E4E9] bg-white p-6 shadow-sm sm:p-7">
                        <div className="mb-7">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-8 rounded-full bg-[#95d56b]" />

                                <span className="text-xs font-bold uppercase tracking-wider text-[#6594B1]">
                                    Keuntungan
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-slate-800">
                                Mengapa Menjadi Mentor?
                            </h2>

                            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                                Menjadi mentor bukan hanya tentang berbagi
                                pengetahuan, tetapi juga membantu mahasiswa
                                berkembang dan menemukan arah belajarnya.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {benefits.map((benefit) => (
                                <div
                                    key={benefit.number}
                                    className="group relative overflow-hidden rounded-2xl border border-[#D7E4E9] bg-[#F8FBFC] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#AFC8D4] hover:shadow-sm"
                                >
                                    <div className="absolute right-4 top-3 text-4xl font-black text-[#EAF3F6]">
                                        {benefit.number}
                                    </div>

                                    <div className="relative">
                                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#E4F0F4] text-[#527F99]">
                                            {benefit.icon}
                                        </div>

                                        <h3 className="text-sm font-bold text-slate-800">
                                            {benefit.title}
                                        </h3>

                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                            {benefit.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ================= PROCESS ================= */}
                    <section className="mb-6 rounded-2xl border border-[#D7E4E9] bg-white p-6 shadow-sm sm:p-7">
                        <div className="mb-8">
                            <div className="mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-8 rounded-full bg-[#95d56b]" />

                                <span className="text-xs font-bold uppercase tracking-wider text-[#6594B1]">
                                    Langkah Pendaftaran
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-slate-800">
                                Proses Menjadi Mentor
                            </h2>

                            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                                Ikuti beberapa langkah sederhana berikut untuk
                                mendaftarkan diri sebagai mentor di Pathway.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            {steps.map((step, index) => (
                                <div key={step.number} className="relative">
                                    {/* Connector */}
                                    {index < steps.length - 1 && (
                                        <div className="absolute left-[calc(100%+8px)] top-6 hidden h-px w-4 bg-[#C9DCE4] md:block" />
                                    )}

                                    <div className="h-full rounded-2xl border border-[#D7E4E9] bg-[#F8FBFC] p-5 transition duration-200 hover:border-[#AFC8D4] hover:bg-[#F4F9FA]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6594B1] text-xs font-bold text-white">
                                                {step.number}
                                            </div>

                                            {index < steps.length - 1 && (
                                                <span className="text-lg text-[#BFD1D9] md:hidden">
                                                    ↓
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="mt-4 text-sm font-bold text-slate-800">
                                            {step.title}
                                        </h3>

                                        <p className="mt-2 text-xs leading-5 text-slate-500">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ================= CLOSING ================= */}
                    <section className="relative overflow-hidden rounded-2xl border border-[#D7E4E9] bg-white px-6 py-8 text-center shadow-sm sm:px-8 sm:py-10">
                        <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-[#EAF3F6]" />

                        <div className="absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-[#F1F7F2]" />

                        <div className="relative mx-auto max-w-2xl">
                            <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
                                Siap berbagi dan membantu?
                            </h2>

                            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                                Lengkapi pendaftaran mentor melalui tombol di
                                atas dan mulai perjalananmu bersama Pathway.
                            </p>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
