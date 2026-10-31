export default function AlertBanner({
    icon,
    tag,
    title,
    description,
    action,
    variant = 'danger',
    className = '',
    children,
}) {
    const variantStyles = {
        danger: 'border-rose-200 bg-rose-50/70 text-slate-900',
        warning: 'border-amber-200 bg-amber-50/70 text-amber-900',
        info: 'border-sky-200 bg-sky-50/70 text-sky-900',
    };

    return (
        <div
            className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm ${variantStyles[variant] || variantStyles.danger} ${className}`}
        >
            <div className="flex items-start gap-3">
                {icon && <div className="shrink-0">{icon}</div>}
                <div>
                    {(tag || title) && (
                        <div className="flex flex-wrap items-center gap-2">
                            {tag && (
                                <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                                    {tag}
                                </span>
                            )}
                            {title && (
                                <h3 className="text-xs font-bold text-slate-900 sm:text-sm">
                                    {title}
                                </h3>
                            )}
                        </div>
                    )}
                    {description && (
                        <div className="mt-0.5 text-xs text-slate-600">
                            {description}
                        </div>
                    )}
                    {children}
                </div>
            </div>

            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

