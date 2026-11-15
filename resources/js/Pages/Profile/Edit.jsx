import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateMentorProfileForm from "./Partials/UpdateMentorProfileForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
    mentorProfile,
    expertises = [],
}) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6594B1]">
                        Pengaturan Akun
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-800">
                        Edit Profil
                    </h2>
                </div>
            }
        >
            <Head title="Edit Profil" />

            <div className="min-h-screen bg-[#F3F7F9] py-10 sm:py-12">
                <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6 lg:px-8">
                    {/* Tombol Kembali ke Dashboard */}
                    <Link
                        href={route("dashboard")}
                        className="inline-flex items-center gap-2 rounded-lg border border-white bg-white px-5 py-3 text-sm font-semibold text-[#6594B1] shadow-[0_2px_6px_rgba(45,75,95,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E6EFF4] hover:shadow-md active:translate-y-0"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Kembali ke Dashboard
                    </Link>

                    {/* Hero Profile */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#6594B1] to-[#7FA9C1] px-7 py-8 text-white shadow-md sm:px-10">
                        <div className="relative z-10 max-w-2xl">
                            <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-medium tracking-wide text-white">
                                PERSONAL SETTINGS
                            </span>

                            <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
                                Kelola Profilmu
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                                Perbarui informasi akun dan profil profesionalmu
                                agar orang lain dapat mengenalmu lebih baik di
                                Pathway.
                            </p>
                        </div>

                        <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[35px] border-white/10" />
                        <div className="absolute -bottom-24 right-36 h-52 w-52 rounded-full bg-white/10" />
                    </div>

                    {/* Informasi Akun */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-[#E6EFF4] px-6 py-4 sm:px-8">
                            <h3 className="font-semibold text-slate-800">
                                Informasi Akun
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Atur nama, email, dan informasi dasar akunmu.
                            </p>
                        </div>

                        <div className="p-6 sm:p-8">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="w-full"
                            />
                        </div>
                    </section>

                    {/* Profil Profesional Mentor */}
                    {mentorProfile && (
                        <section>
                            <div className="mb-4">
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6594B1]">
                                    Mentor Workspace
                                </span>
                                <h3 className="mt-1 text-xl font-bold text-slate-800">
                                    Profil Profesional Mentor
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Kelola keahlian, deskripsi diri, dan
                                    portofolio profesionalmu.
                                </p>
                            </div>

                            <UpdateMentorProfileForm
                                mentorProfile={mentorProfile}
                                expertises={expertises}
                                className="w-full"
                            />
                        </section>
                    )}

                    {/* Keamanan Akun */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 bg-[#E6EFF4] px-6 py-4 sm:px-8">
                            <h3 className="font-semibold text-slate-800">
                                Keamanan Akun
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Pastikan akunmu tetap aman dengan kata sandi
                                yang kuat.
                            </p>
                        </div>

                        <div className="p-6 sm:p-8">
                            <UpdatePasswordForm className="max-w-2xl" />
                        </div>
                    </section>

                    {/* Hapus Akun */}
                    <section className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
                        <div className="border-b border-red-100 bg-red-50 px-6 py-4 sm:px-8">
                            <h3 className="font-semibold text-red-800">
                                Zona Berbahaya
                            </h3>
                            <p className="mt-1 text-sm text-red-600">
                                Penghapusan akun merupakan tindakan permanen.
                            </p>
                        </div>

                        <div className="p-6 sm:p-8">
                            <DeleteUserForm className="max-w-2xl" />
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
