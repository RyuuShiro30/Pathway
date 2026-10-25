import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

const expertiseOptions = [
    "Web Development",
    "Mobile Development",
    "UI/UX",
    "Data",
    "Cybersecurity",
    "Game Development",
    "Bidang IT Lainnya",
];

export default function Register({ user, mentorProfile }) {
    const existingCertificates = mentorProfile?.certificates ?? [];

    const [selectedExpertise, setSelectedExpertise] = useState(
        mentorProfile?.expertise ?? "",
    );

    const [certificates, setCertificates] = useState([]);

    const [savedData, setSavedData] = useState({
        name: user?.name ?? "",
        expertise: mentorProfile?.expertise ?? "",
        bio: mentorProfile?.bio ?? "",
        portfolio_url: mentorProfile?.portfolio_url ?? "",
        mentor_type: mentorProfile?.mentor_type ?? "free",
        price_per_session: mentorProfile?.price_per_session ?? "",
        is_available: mentorProfile?.is_available ?? true,
    });

    const [existingCertificateState, setExistingCertificateState] =
        useState(existingCertificates);

    const [photoPreview, setPhotoPreview] = useState(
        user?.photo_path ? `/storage/${user.photo_path}` : null,
    );

    const fileInputRef = useRef(null);

    useEffect(() => {
        setExistingCertificateState(existingCertificates);
    }, [mentorProfile]);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user?.name ?? "",
        photo: null,
        expertise: mentorProfile?.expertise ?? "",
        bio: mentorProfile?.bio ?? "",
        portfolio_url: mentorProfile?.portfolio_url ?? "",
        mentor_type: mentorProfile?.mentor_type ?? "free",
        price_per_session: mentorProfile?.price_per_session ?? "",
        is_available: mentorProfile?.is_available ?? true,
        certificates: [],
    });

    const hasMentorProfile = !!mentorProfile;
    const isRejected = mentorProfile?.verification_status === "rejected";

    const hasChanges =
        data.name !== savedData.name ||
        data.expertise !== savedData.expertise ||
        data.bio !== savedData.bio ||
        data.portfolio_url !== savedData.portfolio_url ||
        data.mentor_type !== savedData.mentor_type ||
        data.price_per_session !== savedData.price_per_session ||
        data.is_available !== savedData.is_available ||
        data.photo !== null ||
        certificates.length > 0;

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setData("photo", file);

        const previewUrl = URL.createObjectURL(file);
        setPhotoPreview(previewUrl);
    };

    const handleExpertiseChange = (expertise) => {
        setSelectedExpertise(expertise);
        setData("expertise", expertise);
    };

    const handleCertificateChange = (event) => {
        const files = Array.from(event.target.files ?? []);

        if (!files.length) {
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        const maxSize = 5 * 1024 * 1024;

        const validFiles = [];

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                alert(
                    `${file.name} tidak dapat ditambahkan. Format yang diperbolehkan: PDF, JPG, JPEG, PNG, WEBP.`,
                );
                continue;
            }

            if (file.size > maxSize) {
                alert(
                    `${file.name} terlalu besar. Ukuran maksimal adalah 5MB.`,
                );
                continue;
            }

            const duplicateExisting = existingCertificateState.some(
                (certificate) => certificate.file_name === file.name,
            );

            const duplicateNew = certificates.some(
                (certificate) =>
                    certificate.name === file.name &&
                    certificate.size === file.size,
            );

            if (duplicateExisting || duplicateNew) {
                alert(`${file.name} sudah ditambahkan.`);
                continue;
            }

            validFiles.push(file);
        }

        const totalCertificates =
            existingCertificateState.length +
            certificates.length +
            validFiles.length;

        if (totalCertificates > 10) {
            alert("Maksimal 10 sertifikat.");
            return;
        }

        const updatedCertificates = [...certificates, ...validFiles];

        setCertificates(updatedCertificates);
        setData("certificates", updatedCertificates);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeNewCertificate = (index) => {
        const updatedCertificates = certificates.filter(
            (_, certificateIndex) => certificateIndex !== index,
        );

        setCertificates(updatedCertificates);
        setData("certificates", updatedCertificates);
    };

    const removeExistingCertificate = (certificateId) => {
        router.delete(route("mentor.certificate.destroy", certificateId), {
            preserveScroll: true,
            onSuccess: () => {
                setExistingCertificateState((current) =>
                    current.filter(
                        (certificate) => certificate.id !== certificateId,
                    ),
                );
            },
        });
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        post(route("mentor.register.store"), {
            forceFormData: true,

            onSuccess: () => {
                setSavedData({
                    name: data.name,
                    expertise: data.expertise,
                    bio: data.bio,
                    portfolio_url: data.portfolio_url,
                    mentor_type: data.mentor_type,
                    price_per_session: data.price_per_session,
                    is_available: data.is_available,
                });

                setCertificates([]);
                setData("certificates", []);
                setData("photo", null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            },
        });
    };

    const getStatusStyle = () => {
        if (!mentorProfile) {
            return {
                label: "Belum Terdaftar",
                className: "bg-slate-100 text-slate-600 border-slate-200",
            };
        }

        if (mentorProfile.verification_status === "verified") {
            return {
                label: "Terverifikasi",
                className: "bg-emerald-50 text-emerald-700 border-emerald-200",
            };
        }

        if (mentorProfile.verification_status === "rejected") {
            return {
                label: "Ditolak",
                className: "bg-red-50 text-red-700 border-red-200",
            };
        }

        return {
            label: "Menunggu Verifikasi",
            className: "bg-amber-50 text-amber-700 border-amber-200",
        };
    };

    const statusStyle = getStatusStyle();

    return (
        <>
            <Head title="Pendaftaran Mentor" />

            <div className="min-h-screen bg-[#F1F6F8]">
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
                    {/* Back */}
                    <div className="mb-5">
                        <Link
                            href="/mentor/become"
                            className="inline-flex items-center gap-2 text-sm font-medium text-[#527F99] transition hover:text-[#36586B]"
                        >
                            <span className="text-lg">←</span>
                            Kembali ke Jadi Mentor
                        </Link>
                    </div>

                    {/* Hero */}
                    <div className="relative mb-7 overflow-hidden rounded-3xl bg-[#6594B1] px-6 py-8 shadow-sm sm:px-8 sm:py-10">
                        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10" />
                        <div className="absolute -bottom-20 right-32 h-44 w-44 rounded-full bg-white/10" />

                        <div className="relative">
                            <div className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                Pendaftaran Mentor
                            </div>

                            <h1 className="text-3xl font-bold text-white sm:text-4xl">
                                Jadi Mentor di Pathway
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                                Bagikan pengalaman dan keahlianmu untuk membantu
                                mahasiswa menemukan jalur belajar yang sesuai.
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    {hasMentorProfile && (
                        <div className="mb-6 rounded-2xl border border-[#D7E4E9] bg-white p-4 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Status Pendaftaran Mentor
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Status akan diperbarui setelah proses
                                        verifikasi oleh admin.
                                    </p>
                                </div>

                                <span
                                    className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-xs font-semibold ${statusStyle.className}`}
                                >
                                    {statusStyle.label}
                                </span>
                            </div>

                            {isRejected && (
                                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    Pendaftaran sebelumnya ditolak. Silakan
                                    periksa kembali data dan ajukan ulang.
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Main form */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                            {/* Profile Photo */}
                            <section className="h-fit rounded-2xl border border-[#D7E4E9] bg-white p-6 shadow-sm">
                                <div className="mb-5">
                                    <p className="text-base font-bold text-slate-800">
                                        Foto Profil
                                    </p>

                                    <p className="mt-1 text-sm leading-5 text-slate-500">
                                        Gunakan foto yang jelas agar calon
                                        mentee lebih mudah mengenalmu.
                                    </p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <div className="relative mb-5">
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt="Preview"
                                                className="h-40 w-40 rounded-3xl object-cover ring-4 ring-[#E4F0F4]"
                                            />
                                        ) : (
                                            <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-[#E4F0F4] text-5xl font-bold text-[#6594B1]">
                                                {data.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ?? "U"}
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        id="photo"
                                    />

                                    <label
                                        htmlFor="photo"
                                        className="w-full cursor-pointer rounded-xl bg-[#6594B1] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#527F99]"
                                    >
                                        Unggah Foto
                                    </label>

                                    <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                                        JPG, JPEG, PNG, WEBP
                                        <br />
                                        Maksimal 2MB
                                    </p>

                                    {errors.photo && (
                                        <p className="mt-3 text-center text-xs text-red-600">
                                            {errors.photo}
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* Mentor Detail */}
                            <section className="rounded-2xl border border-[#D7E4E9] bg-white p-6 shadow-sm sm:p-7">
                                <div className="mb-6 border-b border-[#E7EEF1] pb-5">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Informasi Mentor
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Lengkapi informasi yang akan ditampilkan
                                        pada profil mentor.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* Name */}
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="mb-2 block text-sm font-semibold text-slate-700"
                                        >
                                            Nama
                                        </label>

                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
                                            className="w-full rounded-xl border border-[#C9DCE4] bg-[#F8FBFC] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/20"
                                            placeholder="Masukkan nama lengkap"
                                        />

                                        {errors.name && (
                                            <p className="mt-2 text-xs text-red-600">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Expertise */}
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Keahlian
                                        </label>

                                        <div className="flex flex-wrap gap-2">
                                            {expertiseOptions.map(
                                                (expertise) => (
                                                    <button
                                                        key={expertise}
                                                        type="button"
                                                        onClick={() =>
                                                            handleExpertiseChange(
                                                                expertise,
                                                            )
                                                        }
                                                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                                            selectedExpertise ===
                                                            expertise
                                                                ? "border-[#6594B1] bg-[#6594B1] text-white shadow-sm"
                                                                : "border-[#C9DCE4] bg-[#F8FBFC] text-slate-600 hover:border-[#6594B1] hover:bg-[#EAF3F6] hover:text-[#527F99]"
                                                        }`}
                                                    >
                                                        {expertise}
                                                    </button>
                                                ),
                                            )}
                                        </div>

                                        {errors.expertise && (
                                            <p className="mt-2 text-xs text-red-600">
                                                {errors.expertise}
                                            </p>
                                        )}
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label
                                                htmlFor="bio"
                                                className="block text-sm font-semibold text-slate-700"
                                            >
                                                Bio
                                            </label>

                                            <span className="text-xs text-slate-400">
                                                {data.bio?.length ?? 0}/300
                                            </span>
                                        </div>

                                        <textarea
                                            id="bio"
                                            rows="5"
                                            maxLength="300"
                                            value={data.bio}
                                            onChange={(e) =>
                                                setData("bio", e.target.value)
                                            }
                                            className="w-full resize-none rounded-xl border border-[#C9DCE4] bg-[#F8FBFC] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/20"
                                            placeholder="Ceritakan pengalaman, keahlian, atau bidang yang kamu kuasai..."
                                        />

                                        {errors.bio && (
                                            <p className="mt-2 text-xs text-red-600">
                                                {errors.bio}
                                            </p>
                                        )}
                                    </div>

                                    {/* Portfolio */}
                                    <div>
                                        <label
                                            htmlFor="portfolio_url"
                                            className="mb-2 block text-sm font-semibold text-slate-700"
                                        >
                                            Portfolio
                                        </label>

                                        <input
                                            id="portfolio_url"
                                            type="url"
                                            value={data.portfolio_url}
                                            onChange={(e) =>
                                                setData(
                                                    "portfolio_url",
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#C9DCE4] bg-[#F8FBFC] px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/20"
                                            placeholder="https://portfolio-kamu.com"
                                        />

                                        {errors.portfolio_url && (
                                            <p className="mt-2 text-xs text-red-600">
                                                {errors.portfolio_url}
                                            </p>
                                        )}
                                    </div>

                                    {/* Certificates */}
                                    <div className="border-t border-[#E7EEF1] pt-6">
                                        <div className="mb-4 flex items-start justify-between gap-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700">
                                                    Sertifikat & Bukti
                                                    Pengalaman
                                                </label>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Tambahkan sertifikat atau
                                                    dokumen yang mendukung
                                                    keahlianmu sebagai mentor.
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-[#EAF3F6] px-3 py-1 text-xs font-semibold text-[#527F99]">
                                                {existingCertificateState.length +
                                                    certificates.length}
                                                /10
                                            </span>
                                        </div>

                                        {/* Sertifikat yang sudah tersimpan */}
                                        {existingCertificateState.length >
                                            0 && (
                                            <div className="mb-3 space-y-2">
                                                {existingCertificateState.map(
                                                    (certificate) => (
                                                        <div
                                                            key={certificate.id}
                                                            className="flex items-center justify-between gap-3 rounded-xl border border-[#D7E4E9] bg-[#F8FBFC] px-3 py-3"
                                                        >
                                                            <a
                                                                href={`/storage/${certificate.file_path}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex min-w-0 items-center gap-3"
                                                            >
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DCEBF1] text-[10px] font-bold text-[#527F99]">
                                                                    FILE
                                                                </div>

                                                                <span className="truncate text-sm font-medium text-[#527F99] hover:underline">
                                                                    {
                                                                        certificate.file_name
                                                                    }
                                                                </span>
                                                            </a>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeExistingCertificate(
                                                                        certificate.id,
                                                                    )
                                                                }
                                                                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        {/* File baru */}
                                        {certificates.length > 0 && (
                                            <div className="mb-3 space-y-2">
                                                {certificates.map(
                                                    (certificate, index) => (
                                                        <div
                                                            key={`${certificate.name}-${certificate.size}-${index}`}
                                                            className="flex items-center justify-between gap-3 rounded-xl border border-[#BFD8E2] bg-[#EAF3F6] px-3 py-3"
                                                        >
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-[#527F99]">
                                                                    FILE
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-medium text-slate-700">
                                                                        {
                                                                            certificate.name
                                                                        }
                                                                    </p>

                                                                    <p className="text-[11px] text-slate-400">
                                                                        {(
                                                                            certificate.size /
                                                                            1024 /
                                                                            1024
                                                                        ).toFixed(
                                                                            2,
                                                                        )}{" "}
                                                                        MB
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeNewCertificate(
                                                                        index,
                                                                    )
                                                                }
                                                                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        {/* Upload */}
                                        <label
                                            htmlFor="certificates"
                                            className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-[#BFD8E2] bg-[#F5FAFC] px-4 py-3 transition hover:border-[#6594B1] hover:bg-[#EAF3F6]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#DCEBF1] text-lg font-medium text-[#527F99]">
                                                    +
                                                </div>

                                                <div>
                                                    <p className="text-sm font-semibold text-[#527F99]">
                                                        Tambahkan sertifikat
                                                    </p>

                                                    <p className="mt-0.5 text-[11px] text-slate-400">
                                                        PDF, JPG, JPEG, PNG,
                                                        WEBP · Maks. 5MB/file
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="text-xs font-semibold text-[#527F99]">
                                                Pilih File
                                            </span>
                                        </label>

                                        <input
                                            id="certificates"
                                            type="file"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                                            onChange={handleCertificateChange}
                                            className="hidden"
                                        />

                                        {errors.certificates && (
                                            <p className="mt-2 text-xs text-red-600">
                                                {errors.certificates}
                                            </p>
                                        )}

                                        {errors["certificates.0"] && (
                                            <p className="mt-2 text-xs text-red-600">
                                                {errors["certificates.0"]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Mentor Type */}
                                    <div>
                                        <label className="mb-3 block text-sm font-semibold text-slate-700">
                                            Tipe Mentor
                                        </label>

                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        "mentor_type",
                                                        "free",
                                                    )
                                                }
                                                className={`rounded-2xl border p-4 text-left transition ${
                                                    data.mentor_type === "free"
                                                        ? "border-[#6594B1] bg-[#EAF3F6] ring-2 ring-[#6594B1]/20"
                                                        : "border-[#D7E4E9] bg-white hover:border-[#AFC8D4]"
                                                }`}
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-bold text-slate-800">
                                                        Gratis
                                                    </span>

                                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        FREE
                                                    </span>
                                                </div>

                                                <p className="text-xs leading-5 text-slate-500">
                                                    Sesi mentoring tanpa biaya.
                                                </p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        "mentor_type",
                                                        "paid",
                                                    )
                                                }
                                                className={`rounded-2xl border p-4 text-left transition ${
                                                    data.mentor_type === "paid"
                                                        ? "border-[#6594B1] bg-[#EAF3F6] ring-2 ring-[#6594B1]/20"
                                                        : "border-[#D7E4E9] bg-white hover:border-[#AFC8D4]"
                                                }`}
                                            >
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="text-sm font-bold text-slate-800">
                                                        Berbayar
                                                    </span>

                                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                        PAID
                                                    </span>
                                                </div>

                                                <p className="text-xs leading-5 text-slate-500">
                                                    Sesi mentoring dengan tarif
                                                    per sesi.
                                                </p>
                                            </button>
                                        </div>

                                        {errors.mentor_type && (
                                            <p className="mt-2 text-xs text-red-600">
                                                {errors.mentor_type}
                                            </p>
                                        )}
                                    </div>

                                    {/* Price */}
                                    {data.mentor_type === "paid" && (
                                        <div>
                                            <label
                                                htmlFor="price_per_session"
                                                className="mb-2 block text-sm font-semibold text-slate-700"
                                            >
                                                Harga per Sesi
                                            </label>

                                            <div className="flex">
                                                <span className="flex items-center rounded-l-xl border border-r-0 border-[#C9DCE4] bg-[#EAF3F6] px-4 text-sm font-semibold text-[#527F99]">
                                                    Rp
                                                </span>

                                                <input
                                                    id="price_per_session"
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        data.price_per_session
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "price_per_session",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-r-xl border border-[#C9DCE4] bg-[#F8FBFC] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#6594B1] focus:bg-white focus:ring-2 focus:ring-[#6594B1]/20"
                                                    placeholder="50000"
                                                />
                                            </div>

                                            {errors.price_per_session && (
                                                <p className="mt-2 text-xs text-red-600">
                                                    {errors.price_per_session}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Availability */}
                                    <div>
                                        <label className="mb-3 block text-sm font-semibold text-slate-700">
                                            Ketersediaan Mentor
                                        </label>

                                        <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#D7E4E9] bg-[#F8FBFC] p-4 transition hover:border-[#AFC8D4]">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {data.is_available
                                                        ? "Tersedia untuk mentoring"
                                                        : "Tidak tersedia"}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Kamu dapat mengubah status
                                                    ini kapan saja.
                                                </p>
                                            </div>

                                            <input
                                                type="checkbox"
                                                checked={data.is_available}
                                                onChange={(e) =>
                                                    setData(
                                                        "is_available",
                                                        e.target.checked,
                                                    )
                                                }
                                                className="h-5 w-5 rounded border-slate-300 text-[#6594B1] focus:ring-[#6594B1]"
                                            />
                                        </label>

                                        {errors.is_available && (
                                            <p className="mt-2 text-xs text-red-600">
                                                {errors.is_available}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex flex-col gap-3 border-t border-[#E7EEF1] pt-6 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {hasMentorProfile
                                                    ? "Perbarui informasi mentor"
                                                    : "Siap menjadi mentor?"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Pastikan informasi yang kamu
                                                masukkan sudah benar.
                                            </p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing || !hasChanges}
                                            className={`rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-sm transition ${
                                                processing || !hasChanges
                                                    ? "cursor-not-allowed bg-slate-300"
                                                    : "bg-[#6594B1] hover:bg-[#527F99] hover:shadow-md"
                                            }`}
                                        >
                                            {processing
                                                ? "Menyimpan..."
                                                : isRejected
                                                  ? "Ajukan Ulang"
                                                  : hasMentorProfile
                                                    ? "Simpan Perubahan"
                                                    : "Daftar Sebagai Mentor"}
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </form>
                </main>
            </div>
        </>
    );
}
