'use client';

type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

type Props = {
  onAction: (action: ActionType) => void;
};

export default function QuickActions({ onAction }: Props) {
  return (
    <div className="mt-4 pt-4 border-t border-[#F4D5B8]">
      <p className="text-xs font-semibold mb-3 text-[#4A4A4A]">
        Quick Actions:
      </p>
      <div className="grid grid-cols-2 gap-2">
        <ActionBtn 
          label="Feed" icon="🍽️" color="#D17D45" 
          onClick={() => onAction('FEED')} 
        />
        <ActionBtn 
          label="Walk" icon="🚶" color="#D17D45" 
          onClick={() => onAction('WALK')} 
        />
        <ActionBtn 
          label="Meds" icon="💊" color="#D17D45" 
          onClick={() => onAction('MEDICATE')} 
        />
        <ActionBtn 
          label="Oops" icon="⚠️" color="#C62828" bgColor="#FFEBEE"
          onClick={() => onAction('ACCIDENT')} 
        />
      </div>
    </div>
  );
}

// Helper sub-component for cleaner buttons
function ActionBtn({ 
  label, icon, color, bgColor, onClick 
}: { 
  label: string; icon: string; color: string; bgColor?: string; onClick: () => void 
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent clicking the card itself
        onClick();
      }}
      className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 hover:opacity-90"
      style={{ 
        backgroundColor: bgColor || color, 
        color: bgColor ? color : 'white' 
      }}
    >
      <span>{icon}</span> {label}
    </button>
  );
}