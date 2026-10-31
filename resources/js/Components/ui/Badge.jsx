export default function Badge({
    children,
    variant = 'default',
    size = 'sm',
    dot = false,
    dotColor = '',
    className = '',
    ...props
}) {
    const variantStyles = {
        default: 'bg-slate-100 text-slate-700 border-slate-200',
        primary: 'bg-sky-50 text-sky-700 border-sky-200',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
        dangerBold: 'bg-rose-100 text-rose-700 border-rose-300',
        warningBold: 'bg-amber-100 text-amber-800 border-amber-300',
        successBold: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    const sizeStyles = {
        xs: 'px-2 py-0.5 text-[10px]',
        sm: 'px-2.5 py-0.5 text-[11px]',
        md: 'px-3 py-1 text-xs',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${sizeStyles[size] || sizeStyles.sm} ${variantStyles[variant] || variantStyles.default} ${className}`}
            {...props}
        >
            {dot && (
                <span
                    className={`h-2 w-2 rounded-full ${dotColor || 'bg-current'}`}
                />
            )}
            {children}
        </span>
    );
}

