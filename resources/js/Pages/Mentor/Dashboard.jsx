import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard({ mentorProfile }) {
    const availabilitySchedule = Array.isArray(
        mentorProfile?.availability_schedule,
    )
        ? mentorProfile.availability_schedule
        : [];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard Mentor
                </h2>
            }
        >
            <Head title="Dashboard Mentor" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="space-y-4 p-6 text-gray-900">
                            <section>
                                <h3 className="text-lg font-semibold">
                                    {mentorProfile?.user?.name ??
                                        mentorProfile?.name ??
                                        mentorProfile?.expertise ??
                                        'Profil mentor'}
                                </h3>
                                <p>
                                    Keahlian:{' '}
                                    {mentorProfile?.expertise ?? 'Belum diisi'}
                                </p>
                                <p>
                                    Bio: {mentorProfile?.bio || 'Belum ada bio.'}
                                </p>
                            </section>

                            <p>
                                Status ketersediaan:{' '}
                                {mentorProfile
                                    ? mentorProfile.is_available
                                        ? 'Tersedia'
                                        : 'Tidak tersedia'
                                    : 'Profil mentor belum tersedia'}
                            </p>

                            <section>
                                <h3 className="text-lg font-semibold">
                                    Jadwal ketersediaan
                                </h3>
                                <ul className="list-disc pl-6">
                                    {availabilitySchedule.length > 0 ? (
                                        availabilitySchedule.map(
                                            (schedule, index) => (
                                                <li
                                                    key={`${schedule.day ?? 'jadwal'}-${index}`}
                                                >
                                                    {schedule.day}: {schedule.start} -{' '}
                                                    {schedule.end}
                                                </li>
                                            ),
                                        )
                                    ) : (
                                        <li>Belum ada jadwal ketersediaan.</li>
                                    )}
                                </ul>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}