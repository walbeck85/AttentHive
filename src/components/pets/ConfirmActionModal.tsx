'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Supported quick action types (mirrors PetCard / QuickActions)
export type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

export type ConfirmActionModalProps = {
  isOpen: boolean;
  petName: string;
  actionType: ActionType;
  onConfirm: () => void;
  onCancel: () => void;
};

// Display metadata for each action (text, emoji, brand color)
const ACTION_DISPLAY: Record<
  ActionType,
  { text: string; emoji: string; color: string }
> = {
  FEED: {
    text: 'a meal',
    emoji: '🍽️',
    color: '#D17D45', // warm orange
  },
  WALK: {
    text: 'a walk',
    emoji: '🚶‍♀️',
    color: '#3E5C2E', // green
  },
  MEDICATE: {
    text: 'medication',
    emoji: '💊',
    color: '#2563EB', // blue
  },
  ACCIDENT: {
    text: 'an accident',
    emoji: '⚠️',
    color: '#C62828', // red
  },
};

export default function ConfirmActionModal({
  isOpen,
  petName,
  actionType,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [isOpen]);

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  const portalContainer =
    typeof document !== 'undefined' ? document.body : null;
  if (!portalContainer) return null;

  const action = ACTION_DISPLAY[actionType];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      // Use inline styles to guarantee full-screen overlay + centering
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      className="font-sans"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-black/50"
      />

      {/* Modal content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="
          relative w-full max-w-md
          mm-card
          px-6 py-6
        "
      >
        {/* Close icon */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="
            absolute right-4 top-4
            text-xs font-bold tracking-[0.16em]
            uppercase text-[#7A6A56]
            hover:text-[#382110]
          "
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-5 mt-1">
          <div className="text-4xl">{action.emoji}</div>
          <h2 className="text-xl font-extrabold tracking-[0.08em] uppercase text-[#382110]">
            Confirm action
          </h2>
        </div>

        {/* Body copy */}
        <p className="text-sm text-center text-[#7A6A56] mb-7">
          Log{' '}
          <span className="font-bold" style={{ color: action.color }}>
            {action.text}
          </span>{' '}
          for{' '}
          <span className="font-bold text-[#382110]">
            {petName}
          </span>
          ?
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="
              flex-1 px-4 py-2 rounded-full
              text-xs font-bold uppercase tracking-[0.16em]
              border border-[#E5D9C6]
              text-[#7A6A56]
              hover:bg-[#F5F3EA]
              transition-colors
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="
              flex-1 px-4 py-2 rounded-full
              text-xs font-bold uppercase tracking-[0.16em]
              text-white
              shadow-sm
              transition-colors
            "
            style={{ backgroundColor: action.color }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    portalContainer
  );
}