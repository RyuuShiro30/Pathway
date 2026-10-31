export default function EmptyState({
    message = 'Tidak ada data.',
    icon,
    className = 'py-6',
    children,
}) {
    return (
        <div className={`text-center text-xs text-slate-400 ${className}`}>
            {icon && (
                <div className="mx-auto mb-2 flex justify-center text-slate-300">
                    {icon}
                </div>
            )}
            <p>{message}</p>
            {children}
        </div>
    );
}

