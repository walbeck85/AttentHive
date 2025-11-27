'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Types --------------------------------------------------------

type ActivityType = 'FEED' | 'WALK' | 'MEDICATE' | 'ACCIDENT';

type CareLog = {
  id: string;
  activityType: ActivityType;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
};

// Helper functions ---------------------------------------------

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  FEED: 'Feed',
  WALK: 'Walk',
  MEDICATE: 'Medicate',
  ACCIDENT: 'Accident',
};

// Page component -----------------------------------------------

export default function ActivityLogPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const petId = params?.id;

  const [logs, setLogs] = useState<CareLog[]>([]);
  const [petName, setPetName] = useState<string>('Pet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | ActivityType>('ALL');

  // Fetch data -------------------------------------------------
  useEffect(() => {
    if (!petId) return;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

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

  // Derived data -----------------------------------------------

  const filteredLogs =
    filter === 'ALL'
      ? logs
      : logs.filter((log) => log.activityType === filter);

  // Loading / error states -------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mm-bg)] flex items-center justify-center">
        <p className="mm-muted">Loading activity…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--mm-bg)] flex flex-col items-center justify-center gap-4">
        <p className="text-[#382110] text-lg font-semibold">
          Failed to load activity history
        </p>
        <p className="mm-muted text-sm">{error}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mm-chip mm-chip--solid-primary"
        >
          Back
        </button>
      </div>
    );
  }

  // Main layout ------------------------------------------------

  return (
    <div className="mm-page">
      <main className="mm-shell space-y-6">
        {/* Back + header */}
        <section className="mm-section">
          <button
            type="button"
            onClick={() => router.back()}
            className="mm-chip"
          >
            ← Back
          </button>

          <div className="mt-4 mm-card px-5 py-4 flex items-center justify-between">
            <div>
              <h1 className="mm-h2">{petName}</h1>
              <p className="mm-muted-sm">Activity log</p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mm-section">
          <div className="mm-card px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'FEED', 'WALK', 'MEDICATE', 'ACCIDENT'] as const).map(
                (type) => {
                  const isAll = type === 'ALL';
                  const isActive = filter === type;
                  const label = isAll
                    ? 'All activity'
                    : ACTIVITY_LABELS[type as ActivityType];

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFilter(type === 'ALL' ? 'ALL' : (type as ActivityType))
                      }
                      className={`mm-chip ${
                        isActive ? 'mm-chip--solid-primary' : ''
                      }`}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* Activity list */}
        <section className="mm-section">
          <div className="mm-card px-5 py-4">
            <h2 className="mm-h3 mb-3">Recent activity</h2>

            {filteredLogs.length === 0 ? (
              <p className="mm-muted-sm">No records found for this filter.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {filteredLogs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-start justify-between border-b border-[#E5D9C6]/60 pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-semibold text-[#382110]">
                        {ACTIVITY_LABELS[log.activityType]}
                      </p>
                      <p className="mm-muted-sm">
                        by{' '}
                        <span className="text-[#D17D45] font-medium">
                          {log.user?.name || 'Someone'}
                        </span>
                      </p>
                      {log.notes && (
                        <p className="mt-1 text-xs text-[#7A6A56]">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <p className="mm-meta">{formatDateTime(log.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}