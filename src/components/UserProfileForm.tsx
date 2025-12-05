// src/components/UserProfileForm.tsx
"use client";

import type React from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

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
  const [status, setStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // I keep a single submit path that handles happy path + errors so the
  // "what happens when you save" story is in one place instead of sprinkled
  // across multiple handlers.
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
          // Empty strings become undefined so Prisma treats them as "leave as-is"
          // and we avoid writing meaningless blanks into the DB.
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);

        // Surface a single, human-friendly message here. If we ever add
        // field-level validation, we can branch on specific error codes
        // instead of trying to guess from raw JSON.
        setErrorMessage(
          body?.error ?? "Something went wrong saving your profile."
        );
        setStatus("error");
        return;
      }

      // We don't need the response body yet, but keeping this call means we
      // can later sync fresh server state without changing the control flow.
      await response.json();

      setStatus("success");
    } catch (error) {
      console.error("Error updating profile", error);
      // Network errors are the painful kind of silent failure, so I always
      // give the user a clear "this never reached the server" message.
      setErrorMessage("Network error while updating profile.");
      setStatus("error");
    }
  }

  const isSaving = status === "saving";

  return (
    // Box-as-form lets us lean on MUI for layout while still using the
    // native form semantics and browser-level accessibility.
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Stack keeps vertical rhythm consistent so we don't end up hand-tuning
          margin utilities on every field. */}
      <Stack spacing={2.25}>
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          fullWidth
          size="small"
          // Name is effectively the primary display field in the app, so
          // I make it required here even though the DB technically allows null.
        />

        <Box>
          <TextField
            label="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
            size="small"
          />
          {/* This message nudges expectations about verification without
              pretending we have a full email-verification flow wired yet. */}
          <Typography
            variant="caption"
            sx={{ mt: 0.5, display: "block", color: "text.secondary" }}
          >
            {emailVerified
              ? "Email is verified. Changing it may require verification again."
              : "Email is not verified yet. Changing it here updates what we use in-app."}
          </Typography>
        </Box>

        <TextField
          label="Phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          fullWidth
          size="small"
          // Phone is optional for now; forcing this field tends to create
          // more fake numbers than useful data at this stage.
        />

        <TextField
          label="Address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={2}
        />

        {status === "success" && (
          // Using Alert instead of a bare paragraph so the success state
          // is visually obvious without having to scan small text.
          <Alert severity="success" variant="outlined">
            Profile updated successfully.
          </Alert>
        )}

        {status === "error" && errorMessage && (
          <Alert severity="error" variant="outlined">
            {errorMessage}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            pt: 0.5,
          }}
        >
          {/* Primary action is anchored to the bottom-right so the form
              feels consistent with other CTAs across the app. */}
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}