import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: 'pathway@admin.com',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <Head title="Admin Login | Pathway" />
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-extrabold text-slate-900">Admin Area</h1>
                    <p className="text-sm text-slate-500">Gunakan kredensial admin untuk mengakses sistem.</p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Admin</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#6594B1]"
                            required
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#6594B1]"
                            required
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 bg-[#6594B1] hover:bg-[#6b9bc3] text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                    >
                        {processing ? 'Memproses...' : 'Login ke Dasbor Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
}