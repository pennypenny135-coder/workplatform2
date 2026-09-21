import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        // Variants
        variant === 'primary' && 'bg-cyan-500 hover:bg-cyan-400 text-gray-900 focus:ring-cyan-500 shadow-lg shadow-cyan-500/20',
        variant === 'secondary' && 'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500',
        variant === 'ghost' && 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white focus:ring-gray-600',
        variant === 'danger' && 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-lg shadow-red-500/20',
        variant === 'outline' && 'bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white focus:ring-gray-600',

        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-xs gap-1.5',
        size === 'md' && 'px-4 py-2 text-sm gap-2',
        size === 'lg' && 'px-5 py-2.5 text-base gap-2',
        size === 'icon' && 'p-2',

        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
