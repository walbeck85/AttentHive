// src/components/pets/ConfirmActionModal.tsx
'use client';

import React from 'react';

type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Full-screen confirmation modal for quick actions.
 * Uses inline styles for the overlay + card so it cannot be
 * accidentally affected by Tailwind or global CSS.
 */
export default function ConfirmActionModal({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      // Full-screen dimmed overlay
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel} // click on backdrop closes
    >
      {/* Modal card */}
      <div
        onClick={(event) => event.stopPropagation()} // don't close when clicking inside
        style={{
          maxWidth: '420px',
          width: '90%',
          borderRadius: '0.75rem',
          backgroundColor: '#FFF9F0', // distinct from page background
          border: '1px solid #D1C3A5',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          padding: '1.5rem 1.75rem',
        }}
      >
        <h2
          id="confirm-dialog-title"
          className="mb-2 text-base font-semibold text-[#382110] text-center"
        >
          {title}
        </h2>

        <p className="mb-4 text-sm text-[#7A6A56] text-center">{body}</p>

        <div className="mt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="mm-chip"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="mm-chip mm-chip--solid-primary"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}