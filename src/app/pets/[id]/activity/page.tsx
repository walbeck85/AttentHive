'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// -- Types --
type CareLog = {
  id: string;
  activityType: 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
};

export default function ActivityLogPage() {
  const router = useRouter();
  // Next.js 15/16 params typing
  const params = useParams<{ id: string }>();
  const petId = params?.id;

  // -- State --
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [petName, setPetName] = useState<string>('Pet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');

  // -- Fetch Data --
  useEffect(() => {
    if (!petId) return;

    const fetchLogs = async () => {
      setLoading(true); // Reset loading state on ID change
      try {
        console.log(`🔍 Fetching logs for Pet ID: ${petId}`);
        const response = await fetch(`/api/pets/${petId}/care-logs`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch logs');
        }

        setLogs(data.logs);
        setPetName(data.petName);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [petId]);

  // -- Helpers --
  const getActivityStyle = (type: string) => {
    switch (type) {
      case 'FEED': return { icon: '🍽️', bg: '#E3F2FD', text: '#1565C0', label: 'Feed' }; // Blue
      case 'WALK': return { icon: '🚶', bg: '#E8F5E9', text: '#2E7D32', label: 'Walk' }; // Green
      case 'MEDICATE': return { icon: '💊', bg: '#F3E5F5', text: '#7B1FA2', label: 'Medicate' }; // Purple
      case 'ACCIDENT': return { icon: '⚠️', bg: '#FFEBEE', text: '#C62828', label: 'Accident' }; // Red
      default: return { icon: '📝', bg: '#F5F5F5', text: '#616161', label: 'Log' };
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // -- Filter Logic --
  const filteredLogs = filter === 'ALL' 
    ? logs 
    : logs.filter(log => log.activityType === filter);

  // -- Loading State --
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-6 flex justify-center">
        <p className="text-[#4A4A4A]">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-white border-b border-[#F4D5B8] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-4 flex items-center gap-2 px-3 py-2 rounded-lg text-[#6B6B6B] hover:bg-[#FAF7F2] hover:text-[#D17D45] transition-all"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium text-sm hidden sm:inline">Back</span>
          </button>
          <h1 className="text-xl font-bold text-[#4A4A4A] truncate">
            {petName}'s Activity Log
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Filter Pills */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-[#F4D5B8]">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {['ALL', 'FEED', 'WALK', 'MEDICATE'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === type 
                    ? 'bg-[#D17D45] text-white' 
                    : 'bg-gray-100 text-[#4A4A4A] hover:bg-gray-200'
                }`}
              >
                {type === 'ALL' ? 'All Activity' : getActivityStyle(type).label}
              </button>
            ))}
          </div>
        </div>

        {/* Log List */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-[#F4D5B8]">
              <p className="text-[#6B6B6B]">No records found for this filter.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const style = getActivityStyle(log.activityType);
              return (
                <div key={log.id} className="bg-white rounded-xl shadow-sm p-4 border border-[#F4D5B8]">
                  <div className="flex items-start gap-4">
                    {/* Icon Circle */}
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: style.bg }}
                    >
                      <span className="text-2xl">{style.icon}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-bold text-[#4A4A4A] capitalize">
                            {style.label}
                          </p>
                          <p className="text-sm text-[#6B6B6B]">
                            by <span className="font-medium text-[#D17D45]">{log.user.name}</span>
                          </p>
                        </div>
                        <p className="text-xs text-[#9ca3af] whitespace-nowrap ml-2">
                          {formatDateTime(log.createdAt)}
                        </p>
                      </div>
                      
                      {log.notes && (
                        <div className="mt-2 bg-[#FAF7F2] p-3 rounded-lg text-sm text-[#4A4A4A]">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}