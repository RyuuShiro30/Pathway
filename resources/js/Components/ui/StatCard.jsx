import Badge from './Badge';

export default function StatCard({
    title,
    value,
    unit,
    icon,
    badge,
    badgeText,
    badgeVariant = 'warning',
    subText,
    className = '',
}) {
    return (
        <div
            className={`flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md ${className}`}
        >
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {title}
                </p>
                {icon && <div>{icon}</div>}
            </div>

            <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-slate-900">
                        {value}
                    </span>
                    {unit && (
                        <span className="text-xs font-medium text-slate-500">
                            {unit}
                        </span>
                    )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                    {badge ? (
                        badge
                    ) : badgeText ? (
                        <Badge variant={badgeVariant} size="xs">
                            {badgeText}
                        </Badge>
                    ) : null}

                    {subText && (
                        <span className="truncate text-[11px] font-medium text-slate-400">
                            {subText}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

