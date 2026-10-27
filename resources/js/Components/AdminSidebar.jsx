import React from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function AdminSidebar() {
    const { url } = usePage();

    // Daftar menu sesuai struktur yang kita bahas tadi
    const menuItems = [
        { name: 'Dasbor', path: '/admin/dashboard', icon: '📊' },
        { name: 'Kelola Course', path: '/admin/courses', icon: '📚' },
        { name: 'Kelola Mahasiswa', path: '/admin/students', icon: '👥' },
        { name: 'Kelola Mentor', path: '/admin/mentors', icon: '👨‍🏫' },
        { name: 'Sesi Bimbingan', path: '/admin/sessions', icon: '🗓️' },
        { name: 'Forum Diskusi', path: '/admin/forums', icon: '💬' },
    ];

    return (
        <div className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col">
            {/* Logo/Header */}
            <div className="h-20 flex items-center px-8 border-b border-slate-100">
                <span className="text-2xl font-extrabold text-[#6594B1]">
                    Pathway <span className="text-slate-800">Admin</span>
                </span>
            </div>

            {/* Navigasi Menu */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item, index) => {
                    // Cek apakah URL saat ini berawalan sama dengan path menu (agar menu menyala saat di sub-page)
                    const isActive = url.startsWith(item.path);
                    
                    return (
                        <Link
                            key={index}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                                ${isActive 
                                    ? 'bg-[#6594B1] text-white shadow-md' // Warna Utama (Aktif)
                                    : 'text-slate-600 hover:bg-[#6b9bc3] hover:text-white' // Warna Hover (Lebih Terang)
                                }
                            `}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Area Logout di bawah */}
            <div className="p-4 border-t border-slate-100">
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                    <span>🚪</span>
                    Keluar Admin
                </Link>
            </div>
        </div>
    );
}