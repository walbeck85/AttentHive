"use client";

import { FormEvent, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  FormLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type HiveMember = {
  id: string;
  userName: string | null;
  userEmail: string;
  role: "OWNER" | "CAREGIVER" | "VIEWER";
};

type HiveMembersApiResponse = {
  members?: {
    id: string;
    role: HiveMember["role"];
    user?: {
      name: string | null;
      email: string;
    } | null;
  }[];
};

type HivePanelProps = {
  recipientId: string;
  isOwner: boolean;
  isPrimaryOwner: boolean;
  initialMembers: HiveMember[];
};

/**
 * HivePanel
 *
 * Server passes down the current Hive members; this component:
 * - Renders a "Shared with" list
 * - Shows an invite form if the viewer is the owner
 * - Handles invites via /api/hives/invite
 * - Refreshes the member list from /api/hives/members after a successful invite
 * - Allows owners to remove existing caregivers/viewers via /api/hives/members (DELETE)
 */
export default function HivePanel({
  recipientId,
  isOwner,
  isPrimaryOwner,
  initialMembers,
}: HivePanelProps) {
  const [members, setMembers] = useState<HiveMember[]>(initialMembers);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"CAREGIVER" | "OWNER">("CAREGIVER");
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

    // Co-owners can only invite caregivers
    const roleToInvite = isPrimaryOwner ? selectedRole : "CAREGIVER";

    try {
      const inviteResponse = await fetch("/api/hives/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId,
          email: email.trim(),
          role: roleToInvite,
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
        `/api/hives/members?recipientId=${encodeURIComponent(
          recipientId,
        )}`,
      );

      if (!membersResponse.ok) {
        throw new Error("Invite was sent but failed to refresh members list.");
      }

      const data =
        (await membersResponse.json()) as HiveMembersApiResponse;

      const refreshedMembers: HiveMember[] = (data.members ?? []).map(
        (membership) => ({
          id: membership.id,
          role: membership.role,
          userName: membership.user?.name ?? null,
          userEmail: membership.user?.email ?? "",
        }),
      );

      setMembers(refreshedMembers);
      setEmail("");
      setSelectedRole("CAREGIVER");
      const roleLabel = roleToInvite === "OWNER" ? "Co-owner" : "Caregiver";
      setSuccessMessage(`${roleLabel} invited successfully.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while inviting.";
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
      const response = await fetch("/api/hives/members", {
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
          body?.error ?? "Failed to remove caregiver from hive.";
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
            // Members with OWNER role in hive are co-owners (primary owner is on pet.ownerId)
            const roleLabel =
              member.role === "OWNER"
                ? "Co-owner"
                : member.role === "CAREGIVER"
                  ? "Caregiver"
                  : "Viewer";
            // Distinct colors: amber for co-owners, blue for caregivers
            const isCoOwner = member.role === "OWNER";
            const chipColor = isCoOwner ? "warning" : "info";
            const initials =
              (member.userName || member.userEmail || "?")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

            // Remove button visibility:
            // - Primary owner can remove anyone (co-owners and caregivers)
            // - Co-owners can only remove caregivers, not other co-owners
            const canRemove = isPrimaryOwner
              ? true
              : isOwner && !isCoOwner;

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
                    color={chipColor}
                    variant="outlined"
                  />
                  {canRemove && (
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
          sx={{ px: 3, py: hasMembers ? 2 : 3, display: "flex", flexDirection: "column", gap: 1.5 }}
        >
          <TextField
            type="email"
            label="Invite by email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            size="small"
            fullWidth
          />

          {isPrimaryOwner && (
            <FormControl component="fieldset" size="small">
              <FormLabel component="legend" sx={{ fontSize: "0.875rem", mb: 0.5 }}>
                Role
              </FormLabel>
              <RadioGroup
                row
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as "CAREGIVER" | "OWNER")}
              >
                <FormControlLabel
                  value="CAREGIVER"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography variant="body2" component="span">
                        Caregiver
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Can log activities and view pet
                      </Typography>
                    </Box>
                  }
                  sx={{ mr: 3 }}
                />
                <FormControlLabel
                  value="OWNER"
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography variant="body2" component="span">
                        Co-owner
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Full access, can manage pet and members
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          )}

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
              {isSubmitting ? "Inviting..." : `Invite ${selectedRole === "OWNER" && isPrimaryOwner ? "co-owner" : "caregiver"}`}
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
