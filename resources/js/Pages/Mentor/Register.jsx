import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

const expertiseOptions = [
    "Web Development",
    "Mobile Development",
    "UI/UX",
    "Data",
    "Cybersecurity",
    "Game Dev",
    "Bidang IT Lainnya",
];

export default function Register({ user, mentorProfile }) {
    const [selectedExpertise, setSelectedExpertise] = useState(
        mentorProfile?.expertise ?? "",
    );

    /*
     * Sertifikat yang sudah pernah disimpan di database.
     */
    const [existingCertificates, setExistingCertificates] = useState(
        mentorProfile?.certificates ?? [],
    );

    /*
     * Sinkronkan sertifikat lama dengan data terbaru
     * yang dikirim oleh Laravel melalui Inertia.
     */
    useEffect(() => {
        setExistingCertificates(mentorProfile?.certificates ?? []);
    }, [mentorProfile?.certificates]);

    /*
     * Sertifikat baru yang sedang dipilih dan belum disimpan.
     */
    const [certificates, setCertificates] = useState([]);

    const initialData = {
        name: user?.name ?? "",
        photo: null,
        expertise: mentorProfile?.expertise ?? "",
        bio: mentorProfile?.bio ?? "",
        portfolio_url: mentorProfile?.portfolio_url ?? "",
        mentor_type: mentorProfile?.mentor_type ?? "free",
        price_per_session:
            mentorProfile?.mentor_type === "free"
                ? ""
                : (mentorProfile?.price_per_session ?? ""),
        is_available: mentorProfile?.is_available ?? true,
        certificates: [],
    };

    const { data, setData, post, processing, errors } = useForm(initialData);

    const [savedData, setSavedData] = useState(initialData);

    const [photoPreview, setPhotoPreview] = useState(
        user?.photo_path ? `/storage/${user.photo_path}` : null,
    );

    const fileInputRef = useRef(null);

    /*
     * Mengecek apakah ada perubahan pada data.
     *
     * Sertifikat lama dari database tidak dihitung sebagai perubahan.
     * Hanya sertifikat baru yang sedang dipilih yang dianggap perubahan.
     */
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

    const hasMentorProfile = Boolean(mentorProfile);

    const isRejected = mentorProfile?.verification_status === "rejected";

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        setData("photo", file);

        const previewUrl = URL.createObjectURL(file);
        setPhotoPreview(previewUrl);
    };

    const openPhotoPicker = () => {
        fileInputRef.current?.click();
    };

    /*
     * Memilih satu bidang keahlian.
     * Pilihan baru akan menggantikan pilihan sebelumnya.
     */
    const selectExpertise = (expertise) => {
        setSelectedExpertise(expertise);
        setData("expertise", expertise);
    };

    /*
     * Memilih banyak sertifikat / bukti pengalaman.
     */
    const handleCertificateChange = (e) => {
        const newFiles = Array.from(e.target.files || []);

        if (newFiles.length === 0) {
            return;
        }

        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        /*
         * Cek format file.
         */
        const invalidType = newFiles.find(
            (file) => !allowedTypes.includes(file.type),
        );

        if (invalidType) {
            alert(
                `File "${invalidType.name}" tidak didukung. Gunakan PDF, JPG, JPEG, PNG, atau WEBP.`,
            );

            e.target.value = "";
            return;
        }

        /*
         * Cek ukuran maksimal 5 MB.
         */
        const maxSize = 5 * 1024 * 1024;

        const invalidSize = newFiles.find((file) => file.size > maxSize);

        if (invalidSize) {
            alert(`File "${invalidSize.name}" melebihi ukuran maksimal 5 MB.`);

            e.target.value = "";
            return;
        }

        /*
         * Cek apakah file sudah pernah disimpan di database.
         *
         * Database menyimpan file_name, sehingga pengecekan
         * dilakukan berdasarkan nama file.
         */
        const duplicateExisting = newFiles.find((newFile) =>
            existingCertificates.some(
                (existingFile) => existingFile.file_name === newFile.name,
            ),
        );

        if (duplicateExisting) {
            alert(`File "${duplicateExisting.name}" sudah pernah diupload.`);

            e.target.value = "";
            return;
        }

        /*
         * Cek apakah file sudah dipilih sebelumnya
         * pada sesi edit saat ini.
         */
        const duplicateNew = newFiles.find((newFile) =>
            certificates.some(
                (existingFile) =>
                    existingFile.name === newFile.name &&
                    existingFile.size === newFile.size,
            ),
        );

        if (duplicateNew) {
            alert(`File "${duplicateNew.name}" sudah ditambahkan.`);

            e.target.value = "";
            return;
        }

        /*
         * Gabungkan file lama yang baru dipilih
         * dengan file baru yang ditambahkan.
         */
        const combinedFiles = [...certificates, ...newFiles];

        /*
         * Maksimal 10 file baru dalam satu pengiriman.
         */
        if (combinedFiles.length > 10) {
            alert("Maksimal 10 file sertifikat atau bukti pengalaman.");

            e.target.value = "";
            return;
        }

        setCertificates(combinedFiles);
        setData("certificates", combinedFiles);

        /*
         * Reset input agar file yang sama bisa dipilih lagi
         * setelah file tersebut dihapus dari daftar file baru.
         */
        e.target.value = "";
    };

    /*
     * Menghapus satu file baru dari daftar.
     *
     * Ini hanya menghapus file yang belum disimpan.
     */
    const removeCertificate = (indexToRemove) => {
        const updatedFiles = certificates.filter(
            (_, index) => index !== indexToRemove,
        );

        setCertificates(updatedFiles);
        setData("certificates", updatedFiles);
    };

    /*
     * Menghapus sertifikat yang sudah tersimpan di database.
     */
    const removeExistingCertificate = (certificateId) => {
        if (!confirm("Yakin ingin menghapus sertifikat ini?")) {
            return;
        }

        router.delete(route("mentor.certificate.destroy", certificateId), {
            preserveScroll: true,

            onSuccess: () => {
                setExistingCertificates((current) =>
                    current.filter(
                        (certificate) => certificate.id !== certificateId,
                    ),
                );
            },
        });
    };

    const submit = (e) => {
        e.preventDefault();

        post(route("mentor.register.store"), {
            forceFormData: true,

            onSuccess: () => {
                /*
                 * Setelah berhasil disimpan, data yang sekarang
                 * dianggap sebagai data terbaru.
                 */
                setSavedData({
                    name: data.name,
                    photo: null,
                    expertise: data.expertise,
                    bio: data.bio,
                    portfolio_url: data.portfolio_url,
                    mentor_type: data.mentor_type,
                    price_per_session:
                        data.mentor_type === "free"
                            ? ""
                            : data.price_per_session,
                    is_available: data.is_available,
                    certificates: [],
                });

                setData("photo", null);

                /*
                 * File baru sudah tersimpan di database.
                 */
                setCertificates([]);
                setData("certificates", []);
            },
        });
    };

    return (
        <>
            <Head title="Jadi Mentor di Pathway" />

            <div className="min-h-screen bg-[#f4f7f5] px-6 py-8 lg:px-10">
                <div className="mx-auto max-w-7xl">
                    {/* Kembali */}
                    <Link
                        href={route("dashboard")}
                        className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 transition hover:text-gray-800"
                    >
                        ← Kembali
                    </Link>

                    {/* Header */}
                    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#5b7131] to-[#6498b1] px-7 py-6 text-white shadow-sm">
                        <h1 className="text-2xl font-bold">
                            Jadi Mentor di Pathway
                        </h1>

                        <p className="mt-2 text-sm leading-relaxed text-white/90">
                            Bagikan pengalaman dan bantu pengguna lain
                            berkembang di bidang Teknologi Informasi.
                        </p>
                    </div>

                    <form onSubmit={submit}>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
                            {/* ==================== */}
                            {/* Kartu Profil */}
                            {/* ==================== */}
                            <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-800">
                                        Foto Profil
                                    </p>

                                    {/* Input Foto */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />

                                    {/* Preview Foto */}
                                    <div className="mx-auto mt-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-dashed border-[#6594ad] bg-[#eaf2f6]">
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt="Preview foto profil"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                Foto
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={openPhotoPicker}
                                        className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                                    >
                                        {photoPreview
                                            ? "Ganti Foto"
                                            : "Unggah Foto"}
                                    </button>

                                    <p className="mt-2 text-xs leading-relaxed text-gray-400">
                                        JPG, PNG, atau WEBP, maksimal 2 MB.
                                    </p>

                                    {errors.photo && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.photo}
                                        </p>
                                    )}
                                </div>

                                {/* Nama */}
                                <div className="mt-6">
                                    <label
                                        htmlFor="name"
                                        className="text-sm font-semibold text-gray-800"
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
                                        placeholder="Nama lengkap kamu"
                                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-[#6d833f] focus:ring-1 focus:ring-[#6d833f]"
                                    />

                                    {errors.name && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ==================== */}
                            {/* Form Utama */}
                            {/* ==================== */}
                            <div className="rounded-2xl bg-white p-7 shadow-sm lg:p-8">
                                {/* Keahlian */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-800">
                                        Keahlian
                                    </label>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {expertiseOptions.map((expertise) => {
                                            const selected =
                                                selectedExpertise === expertise;

                                            return (
                                                <button
                                                    key={expertise}
                                                    type="button"
                                                    onClick={() =>
                                                        selectExpertise(
                                                            expertise,
                                                        )
                                                    }
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                                        selected
                                                            ? "border-[#718b43] bg-[#edf5e5] text-[#50682d]"
                                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {expertise}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="mt-2 text-xs text-gray-400">
                                        Pilih satu bidang yang paling kamu
                                        kuasai.
                                    </p>

                                    {errors.expertise && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.expertise}
                                        </p>
                                    )}
                                </div>

                                {/* Tentang Kamu */}
                                <div className="mt-6">
                                    <label
                                        htmlFor="bio"
                                        className="text-sm font-semibold text-gray-800"
                                    >
                                        Tentang Kamu
                                    </label>

                                    <textarea
                                        id="bio"
                                        rows="5"
                                        maxLength={300}
                                        value={data.bio}
                                        onChange={(e) =>
                                            setData("bio", e.target.value)
                                        }
                                        placeholder="Ceritakan pengalaman dan hal yang bisa kamu ajarkan kepada murid."
                                        className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-[#6d833f] focus:ring-1 focus:ring-[#6d833f]"
                                    />

                                    <div className="mt-1 flex justify-end text-xs text-gray-400">
                                        {data.bio.length}/300
                                    </div>

                                    {errors.bio && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.bio}
                                        </p>
                                    )}
                                </div>

                                {/* Portfolio */}
                                <div className="mt-6">
                                    <label
                                        htmlFor="portfolio_url"
                                        className="text-sm font-semibold text-gray-800"
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
                                        placeholder="https://behance.net/namakamu"
                                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none transition focus:border-[#6d833f] focus:ring-1 focus:ring-[#6d833f]"
                                    />

                                    <p className="mt-2 text-xs leading-relaxed text-gray-400">
                                        Tautan GitHub, Behance, atau situs
                                        pribadi. Admin memeriksanya untuk
                                        verifikasi.
                                    </p>

                                    {errors.portfolio_url && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.portfolio_url}
                                        </p>
                                    )}
                                </div>

                                {/* Sertifikat / Bukti Pengalaman */}
                                <div className="mt-6">
                                    <label className="text-sm font-semibold text-gray-800">
                                        Sertifikat / Bukti Pengalaman
                                    </label>

                                    <p className="mt-2 text-xs leading-relaxed text-gray-400">
                                        Upload sertifikat atau bukti pengalaman
                                        yang mendukung keahlian kamu. Maksimal
                                        10 file, 5 MB per file.
                                    </p>

                                    <label
                                        htmlFor="certificates"
                                        className="mt-3 flex w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-4 py-6 transition hover:border-[#6d833f] hover:bg-[#fafcf8]"
                                    >
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-700">
                                                Klik untuk memilih file
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                PDF, JPG, JPEG, PNG, atau WEBP
                                            </p>
                                        </div>

                                        <input
                                            id="certificates"
                                            type="file"
                                            multiple
                                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                                            onChange={handleCertificateChange}
                                            className="hidden"
                                        />
                                    </label>

                                    {/* Sertifikat yang sudah tersimpan */}
                                    {existingCertificates.length > 0 && (
                                        <div className="mt-4">
                                            <p className="mb-2 text-xs font-medium text-gray-500">
                                                Sertifikat yang sudah diupload
                                            </p>

                                            <div className="space-y-2">
                                                {existingCertificates.map(
                                                    (certificate) => (
                                                        <div
                                                            key={certificate.id}
                                                            className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3"
                                                        >
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <span className="shrink-0 text-gray-400">
                                                                    📄
                                                                </span>

                                                                <a
                                                                    href={`/storage/${certificate.file_path}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="min-w-0 truncate text-sm font-medium text-[#5d7431] underline-offset-2 hover:underline"
                                                                >
                                                                    {
                                                                        certificate.file_name
                                                                    }
                                                                </a>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeExistingCertificate(
                                                                        certificate.id,
                                                                    )
                                                                }
                                                                className="shrink-0 text-xs font-medium text-red-500 transition hover:text-red-700"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sertifikat baru yang belum disimpan */}
                                    {certificates.length > 0 && (
                                        <div className="mt-4">
                                            <p className="mb-2 text-xs font-medium text-gray-500">
                                                File baru
                                            </p>

                                            <div className="space-y-2">
                                                {certificates.map(
                                                    (file, index) => (
                                                        <div
                                                            key={`${file.name}-${file.size}-${index}`}
                                                            className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-gray-700">
                                                                    {file.name}
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-gray-400">
                                                                    {(
                                                                        file.size /
                                                                        1024 /
                                                                        1024
                                                                    ).toFixed(
                                                                        2,
                                                                    )}{" "}
                                                                    MB
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeCertificate(
                                                                        index,
                                                                    )
                                                                }
                                                                className="shrink-0 text-xs font-medium text-red-500 transition hover:text-red-700"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {errors.certificates && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.certificates}
                                        </p>
                                    )}

                                    {errors["certificates.0"] && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors["certificates.0"]}
                                        </p>
                                    )}
                                </div>

                                {/* Tipe Mentor */}
                                <div className="mt-6">
                                    <label className="text-sm font-semibold text-gray-800">
                                        Tipe Mentor
                                    </label>

                                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {/* Gratis */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData("mentor_type", "free")
                                            }
                                            className={`rounded-xl border p-4 text-left transition ${
                                                data.mentor_type === "free"
                                                    ? "border-[#78954a] bg-[#edf5e5]"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span
                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                        data.mentor_type ===
                                                        "free"
                                                            ? "border-[#6f893f] bg-[#6f893f]"
                                                            : "border-gray-300"
                                                    }`}
                                                >
                                                    {data.mentor_type ===
                                                        "free" && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                    )}
                                                </span>

                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        Gratis
                                                    </p>

                                                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                                        Membantu tanpa biaya.
                                                    </p>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Berbayar */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData("mentor_type", "paid")
                                            }
                                            className={`rounded-xl border p-4 text-left transition ${
                                                data.mentor_type === "paid"
                                                    ? "border-[#78954a] bg-[#edf5e5]"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span
                                                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                                        data.mentor_type ===
                                                        "paid"
                                                            ? "border-[#6f893f] bg-[#6f893f]"
                                                            : "border-gray-300"
                                                    }`}
                                                >
                                                    {data.mentor_type ===
                                                        "paid" && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                                    )}
                                                </span>

                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        Berbayar
                                                    </p>

                                                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                                        Harga dapat kamu
                                                        sepakati langsung dengan
                                                        murid.
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {errors.mentor_type && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.mentor_type}
                                        </p>
                                    )}
                                </div>

                                {/* Harga per Sesi */}
                                <div className="mt-6">
                                    <label
                                        htmlFor="price_per_session"
                                        className="text-sm font-semibold text-gray-800"
                                    >
                                        Harga per Sesi
                                    </label>

                                    <div className="relative mt-2">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                            Rp
                                        </span>

                                        <input
                                            id="price_per_session"
                                            type="number"
                                            min="0"
                                            value={data.price_per_session}
                                            disabled={
                                                data.mentor_type === "free"
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    "price_per_session",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="50.000"
                                            className="w-full rounded-lg border border-gray-200 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-[#6d833f] focus:ring-1 focus:ring-[#6d833f] disabled:bg-gray-50 disabled:text-gray-400"
                                        />
                                    </div>

                                    <p className="mt-2 text-xs text-gray-400">
                                        Tidak perlu diisi untuk mentor gratis.
                                    </p>

                                    {errors.price_per_session && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.price_per_session}
                                        </p>
                                    )}
                                </div>

                                {/* Availability */}
                                <div className="mt-6 rounded-xl border border-[#e6c8e0] bg-[#fff4fb] px-4 py-3.5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="text-xs leading-relaxed text-gray-700">
                                            <span className="font-semibold">
                                                Siap menerima sesi mentoring?
                                            </span>{" "}
                                            Kamu bisa mengubahnya kapan saja.
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData(
                                                    "is_available",
                                                    !data.is_available,
                                                )
                                            }
                                            aria-label="Ubah ketersediaan mentoring"
                                            className={`relative h-5 w-10 shrink-0 rounded-full transition ${
                                                data.is_available
                                                    ? "bg-[#6d873d]"
                                                    : "bg-gray-300"
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                                                    data.is_available
                                                        ? "left-5"
                                                        : "left-0.5"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {errors.is_available && (
                                    <p className="mt-1.5 text-xs text-red-500">
                                        {errors.is_available}
                                    </p>
                                )}

                                {/* Footer */}
                                <div className="mt-7 flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="max-w-[65%] text-xs leading-relaxed text-gray-400">
                                        Setelah dikirim, admin akan memeriksa
                                        data, portofolio, dan bukti pengalaman
                                        kamu sebelum profil tampil di daftar
                                        mentor.
                                    </p>

                                    <button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            (hasMentorProfile && !hasChanges)
                                        }
                                        className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${
                                            processing ||
                                            (hasMentorProfile && !hasChanges)
                                                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                                                : "bg-[#5d7431] text-white hover:bg-[#4e6428]"
                                        }`}
                                    >
                                        {processing
                                            ? "Mengirim..."
                                            : !hasMentorProfile
                                              ? "Ajukan Pendaftaran"
                                              : isRejected
                                                ? "Ajukan Ulang"
                                                : "Simpan Perubahan"}
                                    </button>
                                </div>

                                {/* Status Verifikasi */}
                                {mentorProfile && (
                                    <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-gray-700">
                                            Status Pendaftaran
                                        </p>

                                        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                                            {mentorProfile.verification_status ===
                                            "pending"
                                                ? "Menunggu pemeriksaan admin."
                                                : mentorProfile.verification_status ===
                                                    "verified"
                                                  ? "Pendaftaran kamu telah diverifikasi."
                                                  : "Pendaftaran kamu ditolak. Silakan periksa kembali data yang dikirim dan ajukan ulang."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
