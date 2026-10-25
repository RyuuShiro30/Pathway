import NotificationBell from '@/Components/NotificationBell';
import { Head, router } from '@inertiajs/react';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
});

export default function Index({ notifications = [] }) {
    const hasUnread = notifications.some((item) => !item.is_read);

    return (
        <div className="min-h-screen bg-[#F5F4EF] text-[#34443D]">
            <Head title="Notifikasi" />

            <header className="bg-[#6594B1] text-white shadow-sm">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <span className="text-lg font-bold tracking-wide">Pathway</span>
                    <NotificationBell />
                </div>
            </header>

            <main className="mx-auto max-w-3xl space-y-4 px-4 py-7 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">Notifikasi</h1>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="rounded-lg border border-[#D8D5CB] bg-white px-4 py-2 text-sm font-semibold text-[#34443D] hover:bg-[#F0EFEB]"
                        >
                            Kembali
                        </button>
                        {hasUnread && (
                            <button
                                type="button"
                                onClick={() =>
                                    router.patch(route('notifications.read-all'))
                                }
                                className="rounded-lg bg-[#6594B1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#527D98]"
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>
                </div>

                {notifications.length === 0 && (
                    <p className="rounded-xl border border-[#E8E5DD] bg-white p-6 text-center text-sm text-[#69766F]">
                        Belum ada notifikasi.
                    </p>
                )}

                <ul className="space-y-3">
                    {notifications.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onClick={() =>
                                    router.patch(route('notifications.read', item.id))
                                }
                                className={`w-full rounded-xl border p-4 text-left shadow-sm transition-colors hover:bg-[#F7F9FA] ${
                                    item.is_read
                                        ? 'border-[#E8E5DD] bg-white text-[#69766F]'
                                        : 'border-[#BFD3E0] bg-[#EEF4F8] font-semibold text-[#34443D]'
                                }`}
                            >
                                <p className="text-sm leading-6">{item.message}</p>
                                <p className="mt-1 text-xs font-normal text-[#8A938D]">
                                    {item.created_at
                                        ? `${dateFormatter.format(new Date(item.created_at))} WIB`
                                        : ''}
                                </p>
                            </button>
                        </li>
                    ))}
                </ul>
            </main>
        </div>
    );
}