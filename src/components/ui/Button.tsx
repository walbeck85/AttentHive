'use client';

import * as React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

function getVariantClasses(variant: ButtonVariant): string {
  switch (variant) {
    case 'secondary':
      return 'bg-white text-primary-600 border border-primary-500 hover:bg-primary-50';
    case 'ghost':
      return 'bg-transparent text-primary-600 hover:bg-primary-50';
    case 'primary':
    default:
      return 'bg-primary-600 text-white hover:bg-primary-700';
  }
}

function getSizeClasses(size: ButtonSize): string {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm';
    case 'lg':
      return 'px-5 py-3 text-base';
    case 'md':
    default:
      return 'px-4 py-2 text-sm';
  }
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const widthClasses = fullWidth ? 'w-full' : '';

  const finalClassName = [
    baseClasses,
    getVariantClasses(variant),
    getSizeClasses(size),
    widthClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <button className={finalClassName} {...props}>
      {children}
    </button>
  );
}