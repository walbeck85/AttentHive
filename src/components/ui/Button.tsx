// src/components/ui/Button.tsx
import * as React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-60 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    outline:
      'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:bg-dark-800 dark:text-gray-100 dark:border-dark-700',
    ghost:
      'bg-transparent text-gray-900 hover:bg-light-100 dark:text-gray-100 dark:hover:bg-dark-800',
  };

  const sizes: Record<string, string> = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm md:text-base px-4 py-2',
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}