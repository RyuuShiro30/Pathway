export default function Card({
    children,
    className = '',
    variant = 'default',
    as: Component = 'div',
    ...props
}) {
    const variantStyles = {
        default: 'border-slate-200/90 bg-white text-slate-800',
        danger: 'border-rose-200 bg-white text-slate-800',
        warning: 'border-amber-200 bg-white text-slate-800',
        dark: 'border-transparent bg-[#1E293B] text-white',
        subtle: 'border-slate-200/80 bg-white text-slate-800',
        plain: 'border-slate-100 bg-slate-50/60 text-slate-700',
    };

    return (
        <Component
            className={`rounded-2xl border shadow-sm ${variantStyles[variant] || variantStyles.default} ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
}

