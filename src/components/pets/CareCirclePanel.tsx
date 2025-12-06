"use client";

import { FormEvent, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type CareCircleMember = {
  id: string;
  userName: string | null;
  userEmail: string;
  role: "OWNER" | "CAREGIVER" | "VIEWER";
};

type CareCircleMembersApiResponse = {
  members?: {
    id: string;
    role: CareCircleMember["role"];
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
 * - Allows owners to remove existing caregivers/viewers via /api/care-circles/members (DELETE)
 */
export default function CareCirclePanel({
  recipientId,
  isOwner,
  initialMembers,
}: CareCirclePanelProps) {
  const [members, setMembers] = useState<CareCircleMember[]>(initialMembers);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
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

      const data =
        (await membersResponse.json()) as CareCircleMembersApiResponse;

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

  // Owner-only action: remove an existing caregiver/viewer from this pet.
  async function handleRemove(memberId: string) {
    // Clear previous status so feedback always reflects the latest action.
    setErrorMessage(null);
    setSuccessMessage(null);
    setRemovingId(memberId);

    try {
      const response = await fetch("/api/care-circles/members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          membershipId: memberId,
          recipientId,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          body?.error ?? "Failed to remove caregiver from care circle.";
        throw new Error(message);
      }

      // Update the local list so the UI reflects the removal immediately.
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      setSuccessMessage("Caregiver removed successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while removing the caregiver.";
      setErrorMessage(message);
    } finally {
      setRemovingId(null);
    }
  }

  const hasMembers = members.length > 0;

  return (
    <Box>
      <Box sx={{ px: 3, pt: 1, pb: hasMembers ? 2 : 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          See who has access to this pet and, if you are the owner, invite
          additional caregivers.
        </Typography>

        {!hasMembers && (
          <Typography variant="body2" color="text.secondary">
            This pet is not shared with anyone yet.
          </Typography>
        )}
      </Box>

      {hasMembers && (
        <List disablePadding>
          {members.map((member) => {
            const displayName = member.userName || member.userEmail;
            const roleLabel =
              member.role === "OWNER"
                ? "Owner"
                : member.role === "CAREGIVER"
                  ? "Caregiver"
                  : "Viewer";
            const initials =
              (member.userName || member.userEmail || "?")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

            return (
              <ListItem
                key={member.id}
                divider
                alignItems="flex-start"
                sx={{
                  px: 3,
                  py: 1.5,
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                  alignItems: { xs: "center", sm: "flex-start" },
                  gap: { xs: 1.5, sm: 0 },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}>
                    {initials}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={displayName}
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {member.userEmail}
                    </Typography>
                  }
                  primaryTypographyProps={{
                    variant: "body2",
                    sx: { fontWeight: 600 },
                  }}
                  secondaryTypographyProps={{ component: "div" }}
                  sx={{ minWidth: 0, pr: { sm: 2, md: 3 } }}
                />
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    ml: { sm: "auto" },
                    mt: { xs: 1, sm: 0 },
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                  }}
                >
                  <Chip
                    label={roleLabel}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: "capitalize" }}
                  />
                  {isOwner && member.role !== "OWNER" && (
                    <Button
                      type="button"
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      color="error"
                      size="small"
                    >
                      {removingId === member.id ? "Removing..." : "Remove"}
                    </Button>
                  )}
                </Stack>
              </ListItem>
            );
          })}
        </List>
      )}

      {isOwner && (
        <Box
          component="form"
          onSubmit={handleInvite}
          sx={{ px: 3, py: hasMembers ? 2 : 3, display: "flex", flexDirection: "column", gap: 1.25 }}
        >
          <TextField
            type="email"
            label="Invite a caregiver by email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="caregiver@example.com"
            size="small"
            fullWidth
          />

          {errorMessage && (
            <Typography variant="body2" color="error">
              {errorMessage}
            </Typography>
          )}
          {successMessage && (
            <Typography variant="body2" sx={{ color: "success.main" }}>
              {successMessage}
            </Typography>
          )}

          <Stack direction="row" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Inviting..." : "Invite caregiver"}
            </Button>
          </Stack>
        </Box>
      )}

      {!isOwner && (
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            You can see who this pet is shared with, but only the owner can
            invite new caregivers.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
