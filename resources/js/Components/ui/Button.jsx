import { Link } from '@inertiajs/react';

export default function Button({
    children,
    variant = 'primary',
    size = 'sm',
    className = '',
    href,
    as: Component,
    disabled = false,
    ...props
}) {
    const variantStyles = {
        primary:
            'bg-[#527D98] text-white hover:bg-[#3E637A] border-transparent shadow-sm focus:ring-[#527D98]/40',
        secondary:
            'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-xs focus:ring-slate-300',
        dark: 'bg-[#1E293B] text-white hover:bg-[#0F172A] border-transparent shadow-sm focus:ring-slate-400',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 border-transparent shadow-xs focus:ring-rose-400',
        subtleDark:
            'bg-slate-700 text-white hover:bg-slate-600 border-transparent shadow-xs',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
    };

    const sizeStyles = {
        xs: 'px-2.5 py-1 text-[11px]',
        sm: 'px-3.5 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-xs sm:text-sm',
    };

    const combinedClassName = `inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold border transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeStyles[size] || sizeStyles.sm} ${variantStyles[variant] || variantStyles.primary} ${className}`;

    if (href) {
        if (href.startsWith('#') || href.startsWith('http')) {
            return (
                <a href={href} className={combinedClassName} {...props}>
                    {children}
                </a>
            );
        }

        return (
            <Link href={href} className={combinedClassName} {...props}>
                {children}
            </Link>
        );
    }

    const Comp = Component || 'button';

    return (
        <Comp disabled={disabled} className={combinedClassName} {...props}>
            {children}
        </Comp>
    );
}

