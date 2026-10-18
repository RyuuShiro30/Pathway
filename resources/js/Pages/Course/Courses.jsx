import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';

export default function Dashboard() {
    // Data course yang diikuti
    const myCourses = [
        {
            id: 1,
            title: "Mastering React & Inertia.js untuk Single Page Application",
            category: "Web Development",
            bgColor: "bg-blue-50",
            icon: "⚛"
        },
        {
            id: 2,
            title: "UI/UX Design Fundamental: Wireframing hingga Prototyping",
            category: "Design",
            bgColor: "bg-pink-50",
            icon: "🎨"
        },
        {
            id: 3,
            title: "Backend API dengan Laravel 13 & PostgreSQL",
            category: "Backend",
            bgColor: "bg-red-50",
            icon: "🐘"
        },
        {
            id: 4,
            title: "Penerapan Gamifikasi Produk untuk Retensi Pengguna",
            category: "Product Management",
            bgColor: "bg-purple-50",
            icon: "🎮"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
            <Head title="Dashboard - Pathway" />

            {/* NAVBAR DI PALING ATAS */}
            <Navbar active="courses" />

            {/* KONTEN UTAMA DENGAN PADDING */}
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Ruang Belajarmu</h1>
                    <p className="text-sm text-slate-500 mt-1">Pilih course yang ingin kamu pelajari hari ini.</p>
                </div>

                {/* Grid 3 Kolom */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myCourses.map((course) => (
                        <Link
                            key={course.id}
                            href={`/courses/${course.id}`}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group"
                        >
                            {/* Bagian Atas: Gambar/Ikon Cover */}
                            <div className={`h-48 ${course.bgColor} flex items-center justify-center relative`}>
                                <span className="text-6xl transform group-hover:scale-110 transition-transform duration-500">{course.icon}</span>

                                {/* Badge Kategori */}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                                    {course.category}
                                </div>
                            </div>

                            {/* Bagian Bawah: Judul Course */}
                            <div className="p-6 flex flex-col justify-between flex-grow">
                                <h2 className="text-xl font-bold text-gray-900 leading-snug mb-6 group-hover:text-[#63849c] transition-colors line-clamp-3">
                                    {course.title}
                                </h2>

                                {/* Aksen Tombol */}
                                <div className="mt-auto flex justify-end">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#63849c] group-hover:text-white transition-colors duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}


