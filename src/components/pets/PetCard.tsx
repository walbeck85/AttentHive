'use client';

import Link from 'next/link';
import QuickActions from './QuickActions';

// -- Types (Shared) --
type ActionType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

type CareLog = {
  id: string;
  activityType: ActionType;
  createdAt: string;
  user: { name: string };
};

export type PetData = {
  id: string;
  name: string;
  type: string;
  breed: string;
  gender: string;
  birthDate: string;
  weight: number;
  careLogs: CareLog[];
};

type Props = {
  pet: PetData;
  currentUserName?: string | null;
  onQuickAction: (petId: string, petName: string, action: ActionType) => void;
};

export default function PetCard({ pet, currentUserName, onQuickAction }: Props) {
  
  // -- Logic moved from PetList --
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSecs < 60) return 'just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getActivityConfig = (type: string) => {
    switch (type) {
      case 'FEED': return { icon: '🍽️', verb: 'fed', color: '#D17D45' };
      case 'WALK': return { icon: '🚶', verb: 'walked', color: '#2E7D32' };
      case 'MEDICATE': return { icon: '💊', verb: 'medicated', color: '#7B1FA2' };
      case 'ACCIDENT': return { icon: '⚠️', verb: 'reported accident', color: '#C62828' };
      default: return { icon: '📝', verb: 'logged', color: '#6B6B6B' };
    }
  };

  // -- Derived State --
  const lastLog = pet.careLogs?.[0];
  const activityConfig = lastLog ? getActivityConfig(lastLog.activityType) : null;
  const displayName = lastLog?.user.name === currentUserName ? 'You' : lastLog?.user.name;

  return (
    <div className="bg-white shadow-lg rounded-2xl border-2 border-[#F4D5B8] p-6 hover:-translate-y-1 hover:shadow-xl hover:border-[#D17D45] transition-all flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <Link href={`/pets/${pet.id}`} className="hover:opacity-70 transition-opacity">
          <h3 className="text-xl font-bold text-[#D17D45]">{pet.name}</h3>
        </Link>
        <span className="text-3xl" role="img" aria-label={pet.type}>
          {pet.type === 'DOG' ? '🐕' : '🐱'}
        </span>
      </div>

      {/* Stats Grid - Cleaner Layout */}
      <div className="grid grid-cols-2 gap-y-2 text-sm text-[#6B6B6B] mb-4">
        <div>
          <span className="font-semibold text-[#4A4A4A]">Breed: </span>{pet.breed}
        </div>
        <div>
          <span className="font-semibold text-[#4A4A4A]">Sex: </span>
          {pet.gender === 'MALE' ? 'Male' : 'Female'}
        </div>
        <div>
          <span className="font-semibold text-[#4A4A4A]">Age: </span>
          {calculateAge(pet.birthDate)} yrs
        </div>
        <div>
          <span className="font-semibold text-[#4A4A4A]">Weight: </span>{pet.weight} lbs
        </div>
      </div>

      <div className="flex-grow"></div>

      {/* Recent Activity */}
      <div className="pt-4 border-t border-[#F4D5B8]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
            Recent Activity
          </span>
          <Link 
            href={`/pets/${pet.id}/activity`} 
            className="text-xs font-medium text-[#D17D45] hover:underline"
          >
            View All
          </Link>
        </div>

        {lastLog && activityConfig ? (
          <div className="flex items-center p-2 rounded-lg bg-[#FAF7F2] text-sm">
            <span className="text-lg mr-3">{activityConfig.icon}</span>
            <div className="flex flex-col">
              <span className="font-medium text-[#4A4A4A]">
                {displayName} <span style={{ color: activityConfig.color }}>{activityConfig.verb}</span>
              </span>
              <span className="text-xs text-gray-400">
                {formatTimeAgo(lastLog.createdAt)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic p-2">No recent activity</div>
        )}
      </div>

      {/* Quick Actions Component */}
      <QuickActions 
        onAction={(type) => onQuickAction(pet.id, pet.name, type)} 
      />
    </div>
  );
}