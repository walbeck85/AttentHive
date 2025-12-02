"use client";

import { FormEvent, useState } from "react";

type CareCircleMember = {
  id: string;
  userName: string | null;
  userEmail: string;
  role: "OWNER" | "CAREGIVER" | "VIEWER";
};

type CareCircleMembersApiResponse = {
  members?: {
    id: string;
    role: CareCircleMember['role'];
    user?: {
      name: string | null;
      email: string;
    } | null;
  }[];
};

type CareCirclePanelProps = {
  recipientId: string;
  isOwner: boolean;
  initialMembers: CareCircleMember[];
};

/**
 * CareCirclePanel
 *
 * Server passes down the current CareCircle members; this component:
 * - Renders a "Shared with" list
 * - Shows an invite form if the viewer is the owner
 * - Handles invites via /api/care-circles/invite
 * - Refreshes the member list from /api/care-circles/members after a successful invite
 */
export default function CareCirclePanel({
  recipientId,
  isOwner,
  initialMembers,
}: CareCirclePanelProps) {
  const [members, setMembers] = useState<CareCircleMember[]>(initialMembers);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();

    // Basic guardrail so we do not hammer the backend with junk requests.
    if (!email.trim()) {
      setErrorMessage("Please enter an email address.");
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const inviteResponse = await fetch("/api/care-circles/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId,
          email: email.trim(),
        }),
      });

      if (!inviteResponse.ok) {
        const body = await inviteResponse.json().catch(() => null);
        const message =
          body?.error ??
          "Unable to send invite. Double-check the email address or try again.";
        throw new Error(message);
      }

      // After a successful invite, re-fetch the members list so UI stays in sync.
      const membersResponse = await fetch(
        `/api/care-circles/members?recipientId=${encodeURIComponent(
          recipientId,
        )}`,
      );

      if (!membersResponse.ok) {
        throw new Error("Invite was sent but failed to refresh members list.");
      }

      const data = (await membersResponse.json()) as CareCircleMembersApiResponse;

      // The members API returns CareCircle rows with an attached user object.
      // Normalize into the shape this component expects.
      const refreshedMembers: CareCircleMember[] = (data.members ?? []).map(
        (membership) => ({
          id: membership.id,
          role: membership.role,
          userName: membership.user?.name ?? null,
          userEmail: membership.user?.email ?? "",
        }),
      );

      setMembers(refreshedMembers);
      setEmail("");
      setSuccessMessage("Caregiver invited successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while inviting a caregiver.";
      setErrorMessage(message);
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-10 rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-2 text-lg font-semibold">Shared with</h2>
      <p className="mb-4 text-sm text-neutral-600">
        See who has access to this pet and, if you are the owner, invite
        additional caregivers.
      </p>

      {members.length === 0 ? (
        <p className="mb-4 text-sm text-neutral-500">
          This pet is not shared with anyone yet.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">
                  {member.userName || member.userEmail}
                </div>
                <div className="text-xs text-neutral-600">
                  {member.userEmail}
                </div>
              </div>
              <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-700">
                {member.role.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isOwner && (
        <form className="space-y-3" onSubmit={handleInvite}>
          <label className="block text-sm font-medium text-neutral-700">
            Invite a caregiver by email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800"
              placeholder="caregiver@example.com"
            />
          </label>

          {errorMessage && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-sm text-green-600">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-md border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Inviting..." : "Invite caregiver"}
          </button>
        </form>
      )}

      {!isOwner && (
        <p className="mt-2 text-xs text-neutral-500">
          You can see who this pet is shared with, but only the owner can invite
          new caregivers.
        </p>
      )}
    </section>
  );
}