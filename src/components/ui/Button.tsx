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
      // Secondary: light surface with green accent border/text, used for less-prominent actions.
      return 'bg-white text-[#3E5C2E] border border-[#3E5C2E] hover:bg-[#F5F3EA]';
    case 'ghost':
      // Ghost: transparent background that relies on the surrounding surface, ideal for subtle actions.
      return 'bg-transparent text-[#3E5C2E] hover:bg-[#F5F3EA]';
    case 'primary':
    default:
      // Primary: solid brand green call-to-action, used for the main action in a view.
      return 'bg-[#3E5C2E] text-white hover:bg-[#2F4A24]';
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
    'inline-flex items-center justify-center rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3E5C2E] disabled:opacity-50 disabled:cursor-not-allowed';

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