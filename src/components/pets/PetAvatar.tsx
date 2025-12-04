// src/components/pets/PetAvatar.tsx
'use client';

import React from 'react';

type Size = 'sm' | 'md' | 'lg';

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: Size;
  className?: string;
};

// We keep text sizing in Tailwind but lock physical dimensions in pixels so
// parent layout or global CSS can't accidentally stretch avatars.
const TEXT_SIZE_MAP: Record<Size, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const DIMENSIONS: Record<Size, { width: number; height: number }> = {
  sm: { width: 32, height: 32 }, // 2rem
  md: { width: 40, height: 40 }, // 2.5rem
  lg: { width: 56, height: 56 }, // 3.5rem
};

// Shared avatar for pets: shows a photo when we have one, otherwise initials.
// Keeping this logic in one place means cards, detail views, and activity pages
// all stay visually consistent.
export default function PetAvatar({
  name,
  imageUrl,
  size = 'md',
  className = '',
}: Props) {
  // Fallback to initials when there is no photo; keeps the UI from feeling empty.
  const initials = React.useMemo(() => {
    const trimmed = name?.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (
      (parts[0][0] ?? '').toUpperCase() +
      (parts[1][0] ?? '').toUpperCase()
    );
  }, [name]);

  const textSizeClasses = TEXT_SIZE_MAP[size];
  const { width, height } = DIMENSIONS[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full border border-[#D17D45] bg-[#FAF3E7] text-[#382110] font-semibold overflow-hidden ${textSizeClasses} ${className}`}
      // Explicit pixel dimensions so the avatar can’t be scaled up by a parent.
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        maxWidth: width,
        maxHeight: height,
      }}
    >
      {imageUrl ? (
        // Using a plain img here because this avatar can come from user-uploaded or external URLs,
        // and we don't need Next's optimization pipeline for these small, frequently-changing assets.
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt={name ? `${name} photo` : 'Pet photo'}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}