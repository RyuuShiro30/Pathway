import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex font-sans text-gray-900 bg-white">
            <Head title="Log in - Pathway" />

            {/* Sisi Kiri: Branding & Pesan Sambutan (Sembunyi di layar HP) */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#63849c] flex-col justify-between p-12 relative overflow-hidden">
                {/* Aksen visual background */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-tl-full bg-white opacity-20"></div>
                </div>

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-16">
                        <img src="/images/pathwayIcon.png" alt="Pathway Logo" className="h-12 w-auto" />
                        <span className="text-2xl font-bold text-white">Pathway</span>
                    </Link>
                </div>

                <div className="relative z-10 mb-20">
                    <h1 className="text-4xl font-extrabold text-white mb-6 leading-tight">
                        Lanjutkan <br /> Perjalanan Belajarmu.
                    </h1>
                    <p className="text-blue-100 text-lg max-w-md">
                        Masuk ke akunmu untuk mengakses course, melihat jadwal bimbingan mentor, dan berdiskusi dengan komunitas.
                    </p>
                </div>

                <div className="relative z-10 text-blue-200 text-sm">
                    &copy; 2026 Pathway. All rights reserved.
                </div>
            </div>

            {/* Sisi Kanan: Form Login */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-20">
                <div className="w-full max-w-md">
                    {/* Logo untuk tampilan Mobile (muncul saat sisi kiri hilang) */}
                    <div className="lg:hidden flex items-center gap-2 mb-8">
                        <img src="/images/pathwayIcon.png" alt="Pathway Logo" className="h-10 w-auto" />
                        <span className="text-2xl font-bold text-[#63849c]">Pathway</span>
                    </div>

                    <h2 className="text-3xl font-bold mb-2">Selamat Datang</h2>
                    <p className="text-gray-500 mb-8">Silakan masukkan email dan kata sandi Anda.</p>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="email" value="Email" className="mb-1.5" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full px-4 py-2.5 border-gray-300 focus:border-[#63849c] focus:ring-[#63849c] rounded-lg shadow-sm"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <InputLabel htmlFor="password" value="Password" />
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-semibold text-[#63849c] hover:text-[#527086]"
                                    >
                                        Lupa password?
                                    </Link>
                                )}
                            </div>
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full px-4 py-2.5 border-gray-300 focus:border-[#63849c] focus:ring-[#63849c] rounded-lg shadow-sm"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="block mt-4">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="text-[#63849c] focus:ring-[#63849c]"
                                />
                                <span className="ms-2 text-sm text-gray-600">Ingat saya</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#63849c] hover:bg-[#527086] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#63849c] disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {processing ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        Belum punya akun?{' '}
                        <Link href={route('register')} className="font-bold text-[#63849c] hover:text-[#527086]">
                            Daftar sekarang
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}