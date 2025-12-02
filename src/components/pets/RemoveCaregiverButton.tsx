"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RemoveCaregiverButtonProps = {
  membershipId: string;
  petName: string;
};

export function RemoveCaregiverButton({
  membershipId,
  petName,
}: RemoveCaregiverButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    // Simple confirmation so owners do not accidentally nuke access
    const confirmed = window.confirm(
      `Remove this person from ${petName}'s Care Circle? They will lose access immediately.`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/care-circles/members?membershipId=${encodeURIComponent(
          membershipId
        )}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message =
          body?.error ?? "Unable to remove caregiver. Please try again.";
        throw new Error(message);
      }

      // Refresh server components so lists stay in sync
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while removing the caregiver.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className="mm-chip mm-chip--danger"
      >
        {isSubmitting ? "Removing..." : "Remove"}
      </button>
      {errorMessage && (
        <p className="text-xs text-red-700 max-w-xs text-right">
          {errorMessage}
        </p>
      )}
    </div>
  );
}