'use client';
// Imports ------------------------------------------------------
import { Utensils, Footprints, Pill, AlertTriangle } from 'lucide-react';
// Types --------------------------------------------------------
type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';
// Component Props ----------------------------------------------
type Props = {
  onAction: (action: ActionType) => void;
};
// Component -----------------------------------------------------

export default function QuickActions({ onAction }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <ActionBtn 
        icon={<Utensils size={16} />} 
        onClick={() => onAction('FEED')} 
        title="Feed"
      />
      <ActionBtn 
        icon={<Footprints size={16} />} 
        onClick={() => onAction('WALK')} 
        title="Walk"
      />
      <ActionBtn 
        icon={<Pill size={16} />} 
        onClick={() => onAction('MEDICATE')} 
        title="Meds"
      />
      <ActionBtn 
        icon={<AlertTriangle size={16} />} 
        danger 
        onClick={() => onAction('ACCIDENT')} 
        title="Report Accident"
      />
    </div>
  );
}
// Action Button Component --------------------------------------
function ActionBtn({ 
  icon, onClick, danger, title 
}: { 
  icon: React.ReactNode; onClick: () => void; danger?: boolean; title: string
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={`
        flex items-center justify-center py-2 rounded-md transition-all
        border
        ${danger 
          ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20' 
          : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary-600 dark:border-dark-600 dark:text-gray-400 dark:hover:bg-dark-600'}
      `}
    >
      {icon}
    </button>
  );
}