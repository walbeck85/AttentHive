"use client";

import { FormEvent, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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

  async function handleRemove(memberId: string) {
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

  return (
    <Card
      component="section"
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <CardHeader
        title="Shared with"
        subheader="See who has access to this pet and, if you are the owner, invite additional caregivers."
        sx={{
          pb: 0,
          "& .MuiCardHeader-title": { fontWeight: 700 },
          "& .MuiCardHeader-subheader": { color: "text.secondary" },
        }}
      />

      <CardContent sx={{ pt: 1.5 }}>
        <Stack spacing={2.5}>
          {members.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              This pet is not shared with anyone yet.
            </Typography>
          ) : (
            <List
              disablePadding
              dense
              sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
            >
              {members.map((member) => (
                <ListItem
                  key={member.id}
                  disableGutters
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 1.25,
                    alignItems: "stretch",
                    bgcolor: "background.default",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 1, sm: 0 },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      <Avatar
                        sx={{ bgcolor: "primary.light", color: "primary.dark" }}
                      >
                        {(member.userName || member.userEmail)
                          .charAt(0)
                          .toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.userName || member.userEmail}
                      secondary={member.userEmail}
                      primaryTypographyProps={{ fontWeight: 600 }}
                      secondaryTypographyProps={{ color: "text.secondary" }}
                      sx={{ mr: 2, wordBreak: "break-word", minWidth: 0 }}
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                  >
                    <Chip
                      size="small"
                      variant="outlined"
                      label={member.role.toLowerCase()}
                      sx={{
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                      }}
                    />
                    {isOwner && member.role !== "OWNER" && (
                      <Button
                        type="button"
                        size="small"
                        color="error"
                        onClick={() => handleRemove(member.id)}
                        disabled={removingId === member.id}
                      >
                        {removingId === member.id ? "Removing…" : "Remove"}
                      </Button>
                    )}
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}

          {isOwner && (
            <Box component="form" onSubmit={handleInvite}>
              <Stack spacing={1.25}>
                <TextField
                  type="email"
                  label="Invite a caregiver by email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  size="small"
                  placeholder="caregiver@example.com"
                  required
                />

                {errorMessage && (
                  <Typography variant="body2" color="error">
                    {errorMessage}
                  </Typography>
                )}
                {successMessage && (
                  <Typography variant="body2" color="success.main">
                    {successMessage}
                  </Typography>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                >
                  {isSubmitting ? "Inviting…" : "Invite caregiver"}
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
