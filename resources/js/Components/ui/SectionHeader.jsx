export default function SectionHeader({
    title,
    subtitle,
    tag,
    tagColor = 'text-[#527D98]',
    badge,
    icon,
    rightAction,
    className = 'mb-4 border-b border-slate-100 pb-3',
}) {
    return (
        <div
            className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
        >
            <div className="flex items-center gap-2.5">
                {icon && <div className="shrink-0">{icon}</div>}
                <div>
                    {tag && (
                        <p
                            className={`text-[10px] font-bold uppercase tracking-wider ${tagColor}`}
                        >
                            {tag}
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                            {title}
                        </h2>
                        {badge && <div>{badge}</div>}
                    </div>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-slate-500">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>

            {rightAction && <div className="shrink-0">{rightAction}</div>}
        </div>
    );
}

