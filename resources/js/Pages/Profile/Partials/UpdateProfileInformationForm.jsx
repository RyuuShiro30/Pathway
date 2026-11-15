import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Transition } from "@headlessui/react";
import { Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = "",
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            bank_name: user.bank_name || "",
            bank_account_number: user.bank_account_number || "",
            bank_account_holder: user.bank_account_holder || "",
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route("profile.update"));
    };

    // Form khusus foto profil
    const [preview, setPreview] = useState(null);

    const {
        data: photoData,
        setData: setPhotoData,
        post: postPhoto,
        processing: photoProcessing,
        errors: photoErrors,
        reset: resetPhoto,
    } = useForm({
        photo: null,
    });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            setPhotoData("photo", file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const submitPhoto = (e) => {
        e.preventDefault();

        postPhoto(route("profile.photo.update"), {
            onSuccess: () => {
                setPreview(null);
                resetPhoto();
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Foto Profil, Nama, dan Email */}
                <div className="rounded-xl border border-[#DCE5EA] bg-[#F3F7F9] p-5">
                    <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[150px_minmax(0,1fr)]">
                        {/* Kolom Kiri: Foto Profil */}
                        <div className="flex flex-col items-center justify-center">
                            <img
                                src={
                                    preview ||
                                    user.photo_path ||
                                    user.profile_photo_url ||
                                    "/images/bwa.webp"
                                }
                                alt="Foto Profil"
                                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                            />

                            <label
                                htmlFor="photo"
                                className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#56839F]"
                            >
                                Pilih Foto
                            </label>

                            <input
                                id="photo"
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />

                            <p className="mt-2 text-center text-xs text-slate-500">
                                JPG, JPEG, atau PNG.
                                <br />
                                Maksimal 2 MB.
                            </p>

                            {photoData.photo && (
                                <button
                                    type="button"
                                    onClick={submitPhoto}
                                    disabled={photoProcessing}
                                    className="mt-3 rounded-lg bg-[#91D06C] px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-[#80BF5C] disabled:opacity-60"
                                >
                                    {photoProcessing
                                        ? "Mengunggah..."
                                        : "Simpan Foto"}
                                </button>
                            )}

                            {photoErrors.photo && (
                                <p className="mt-2 text-center text-xs text-red-600">
                                    {photoErrors.photo}
                                </p>
                            )}
                        </div>

                        {/* Kolom Kanan: Nama dan Email */}
                        <div className="space-y-4">
                            <div>
                                <InputLabel htmlFor="name" value="Name" />

                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    required
                                    isFocused
                                    autoComplete="name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Email" />

                                <TextInput
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    required
                                    autoComplete="username"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                user.email_verified_at === null && (
                                    <div>
                                        <p className="mt-2 text-sm text-gray-800">
                                            Your email address is unverified.
                                            <Link
                                                href={route(
                                                    "verification.send",
                                                )}
                                                method="post"
                                                as="button"
                                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            "verification-link-sent" && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {/* Informasi Rekening Bank */}
                <div className="rounded-xl border border-[#DCE5EA] bg-[#F3F7F9] p-5">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-slate-800">
                            Informasi Rekening Bank
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Wajib dilengkapi untuk keperluan pengembalian dana
                            (refund) apabila sesi mentoring dibatalkan atau
                            mentor berhalangan.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                            <InputLabel
                                htmlFor="bank_name"
                                value="Nama Bank / E-Wallet"
                            />

                            <TextInput
                                id="bank_name"
                                list="bank-options"
                                className="mt-1 block w-full"
                                value={data.bank_name}
                                onChange={(e) =>
                                    setData("bank_name", e.target.value)
                                }
                                placeholder="Contoh: BCA / Mandiri / GoPay"
                            />
                            <datalist id="bank-options">
                                <option value="BCA" />
                                <option value="BNI" />
                                <option value="BRI" />
                                <option value="Mandiri" />
                                <option value="BSI" />
                                <option value="CIMB Niaga" />
                                <option value="SeaBank" />
                                <option value="Bank Jago" />
                                <option value="GoPay" />
                                <option value="OVO" />
                                <option value="DANA" />
                                <option value="ShopeePay" />
                            </datalist>

                            <InputError
                                className="mt-2"
                                message={errors.bank_name}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="bank_account_number"
                                value="Nomor Rekening"
                            />

                            <TextInput
                                id="bank_account_number"
                                type="text"
                                inputMode="numeric"
                                className="mt-1 block w-full"
                                value={data.bank_account_number}
                                onChange={(e) =>
                                    setData(
                                        "bank_account_number",
                                        e.target.value,
                                    )
                                }
                                placeholder="Contoh: 1234567890"
                            />

                            <InputError
                                className="mt-2"
                                message={errors.bank_account_number}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="bank_account_holder"
                                value="Nama Pemilik Rekening"
                            />

                            <TextInput
                                id="bank_account_holder"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.bank_account_holder}
                                onChange={(e) =>
                                    setData(
                                        "bank_account_holder",
                                        e.target.value,
                                    )
                                }
                                placeholder="Sesuai buku tabungan"
                            />

                            <InputError
                                className="mt-2"
                                message={errors.bank_account_holder}
                            />
                        </div>
                    </div>
                </div>

                {/* Tombol Simpan */}
                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm font-medium text-emerald-600">
                            Profil & rekening berhasil disimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}