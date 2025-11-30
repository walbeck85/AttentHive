"use client";

import { useState } from "react";

type UserProfileFormProps = {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  initialAddress: string;
  emailVerified?: boolean;
};

export default function UserProfileForm({
  initialName,
  initialEmail,
  initialPhone,
  initialAddress,
  emailVerified,
}: UserProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keeping one submit path that handles both happy path and error states so I do not scatter logic across handlers
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        // Surfacing a simple message here; detailed validation errors can be wired up later if they prove useful
        setErrorMessage(body?.error ?? "Something went wrong saving your profile.");
        setStatus("error");
        return;
      }

      // We do not strictly need the response body yet, but we keep the call for when we want to sync more state
      await response.json();

      setStatus("success");
    } catch (error) {
      console.error("Error updating profile", error);
      // Network-level errors should not silently fail; this at least tells future-me the request never reached the server
      setErrorMessage("Network error while updating profile.");
      setStatus("error");
    }
  }

  const isSaving = status === "saving";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          value={name}
          onChange={(event) => setName(event.target.value)}
          // Name is effectively the primary display field, so I want it to feel required even if the DB allows null
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          {/* This flag tells the user whether changing their email will require an extra step later */}
          {emailVerified
            ? "Email is verified. Changing it may require verification again."
            : "Email is not verified yet."}
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          // Not marking this required yet; forcing a phone number is overkill for the current use case
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="address" className="text-sm font-medium">
          Address
        </label>
        <textarea
          id="address"
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
          rows={3}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </div>

      {status === "success" && (
        <p className="text-sm text-green-700">
          {/* Quick confirmation so users know the save actually worked */}
          Profile updated successfully.
        </p>
      )}

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}