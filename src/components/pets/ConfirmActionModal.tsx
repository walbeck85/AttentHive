'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ConfirmActionModalProps = {
  isOpen: boolean;
  petName: string;
  actionType: 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';
  onConfirm: () => void;
  onCancel: () => void;
};

const ACTION_DISPLAY = {
  FEED: { emoji: '🍽️', text: 'feed', color: '#D17D45' },
  WALK: { emoji: '🚶', text: 'walk', color: '#D17D45' },
  MEDICATE: { emoji: '💊', text: 'medicate', color: '#D17D45' },
  ACCIDENT: { emoji: '⚠️', text: 'record accident for', color: '#C62828' },
};

export default function ConfirmActionModal({
  isOpen,
  petName,
  actionType,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const action = ACTION_DISPLAY[actionType];

  const modalContent = (
    <div
  className="fixed inset-0 flex items-center justify-center"
  style={{ 
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}
  onClick={onCancel}
>
      <div
  className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
  style={{ 
    border: '2px solid #F4D5B8',
    backgroundColor: 'white',
    opacity: 1
  }}
  onClick={(e) => e.stopPropagation()}
>
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{action.emoji}</div>
          <h2 className="text-2xl font-bold" style={{ color: '#D17D45' }}>
            Confirm Action
          </h2>
        </div>

        <p className="text-center text-lg mb-6" style={{ color: '#4A4A4A' }}>
          Log <span className="font-bold" style={{ color: action.color }}>{action.text}</span> for{' '}
          <span className="font-bold" style={{ color: '#D17D45' }}>{petName}</span>?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: '#F4D5B8',
              color: '#4A4A4A'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8C9AC'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F4D5B8'}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors"
            style={{ backgroundColor: action.color }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = actionType === 'ACCIDENT' ? '#B71C1C' : '#B8663D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = action.color;
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return modalContent;
}