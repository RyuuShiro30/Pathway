import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function extractToast(props) {
    const success = props?.flash?.success;

    if (typeof success === 'string' && success !== '') {
        return { type: 'success', text: success };
    }

    const errors = props?.errors;

    if (errors && typeof errors === 'object') {
        const first = Object.values(errors).find(
            (value) => typeof value === 'string' && value !== '',
        );

        if (first) {
            return { type: 'error', text: first };
        }
    }

    return null;
}

export default function Toast({ initialProps = null }) {
    const [toast, setToast] = useState(() => {
        const initial = extractToast(initialProps);

        return initial ? { ...initial, id: 1 } : null;
    });

    useEffect(() => {
        let counter = 1;

        const handle = (event) => {
            const next = extractToast(event.detail.page.props);

            if (next) {
                counter += 1;
                setToast({ ...next, id: counter });
            }
        };

        const offNavigate = router.on('navigate', handle);
        const offSuccess = router.on('success', handle);
        const offError = router.on('error', (event) => {
            const first = Object.values(event.detail.errors ?? {}).find(
                (value) => typeof value === 'string' && value !== '',
            );

            if (first) {
                counter += 1;
                setToast({ type: 'error', text: first, id: counter });
            }
        });

        return () => {
            offNavigate();
            offSuccess();
            offError();
        };
    }, []);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timer = setTimeout(() => setToast(null), 5000);

        return () => clearTimeout(timer);
    }, [toast]);

    if (!toast) {
        return null;
    }

    const isSuccess = toast.type === 'success';

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[100] w-full max-w-sm">
            <div
                key={toast.id}
                role={isSuccess ? 'status' : 'alert'}
                aria-live={isSuccess ? 'polite' : 'assertive'}
                className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
                    isSuccess
                        ? 'border-[#C9DEC9] bg-[#E8F2E8] text-[#477E50]'
                        : 'border-[#F0C9CD] bg-[#FBECEE] text-[#C23B46]'
                }`}
            >
                <p>{toast.text}</p>
                <button
                    type="button"
                    aria-label="Tutup pesan"
                    onClick={() => setToast(null)}
                    className="shrink-0 rounded-lg px-2 text-lg font-semibold leading-none hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-current"
                >
                    &times;
                </button>
            </div>
        </div>
    );
}