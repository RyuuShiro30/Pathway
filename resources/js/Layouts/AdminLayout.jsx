import React from 'react';
import AdminSidebar from '@/Components/AdminSidebar';

export default function AdminLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar di-fix (menempel) di kiri */}
            <div className="fixed inset-y-0 left-0 z-50">
                <AdminSidebar />
            </div>

            {/* Konten Utama ditarik ke kanan (sebesar 64 atau 256px) agar tidak tertutup sidebar */}
            <div className="flex-1 ml-64">
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}