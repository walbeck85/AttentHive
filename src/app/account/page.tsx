// src/app/account/page.tsx

// Coordinator-only page: wires the loader to sectional UI and owns
// top-level layout decisions. All real UI and state live in sections
// so we can evolve them independently.
import { redirect } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Divider,
} from "@mui/material";

import UserProfileForm from "@/components/UserProfileForm";
import PetList from "@/components/pets/PetList";

import {
  loadAccountPageData,
  type AccountPageData,
} from "./loader";

// Server Component entry point.
// Intentionally boring: fetch data once, handle auth, compose sections.
export default async function AccountPage() {
  const data = await loadAccountPageData();

  // The loader returning null is our signal that the user is not authenticated;
  // we centralize the actual redirect here so routing logic stays obvious.
  if (!data) {
    redirect("/login?callbackUrl=/account");
  }

  const { user, sharedPets } = data;

  return (
    // Using the same Container/Stack pattern as the dashboard and Care Circle
    // so spacing, max-width, and typography all feel like one coherent app.
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 4 } }}>
      <Stack spacing={{ xs: 3, md: 4 }}>
        <AccountHeaderSection user={user} />
        <AccountProfileSection user={user} />
        <AccountSharedPetsSection
          sharedPets={sharedPets}
          currentUserName={user.name}
        />
      </Stack>
    </Container>
  );
}

// SECTION: Top-of-page hero + context
function AccountHeaderSection({
  user,
}: {
  user: AccountPageData["user"];
}) {
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{
          color: "text.secondary",
          letterSpacing: 1.2,
        }}
      >
        ACCOUNT
      </Typography>

      <Typography
        variant="h4"
        component="h1"
        sx={{ mt: 0.5 }}
      >
        My profile
      </Typography>

      {/* This copy keeps the focus on "why" the page exists: you’re here
          to keep contact info accurate so shared-care actually works. */}
      <Typography
        variant="body1"
        sx={{ mt: 1.5, maxWidth: 600 }}
      >
        Review and update your contact details so this account stays
        current and actually usable for the people you share care with.
      </Typography>

      {/* Small hint that we know who you are without over-optimizing
          the layout around it. */}
      <Typography
        variant="body2"
        sx={{ mt: 1, color: "text.secondary" }}
      >
        Signed in as {user.name ?? user.email}
      </Typography>
    </Box>
  );
}

// SECTION: Profile card (name, email, phone, address)
function AccountProfileSection({
  user,
}: {
  user: AccountPageData["user"];
}) {
  return (
    // Paper gives us a standard "card" surface that matches the dashboard
    // shell without reinventing spacing tokens by hand.
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 16,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography
            variant="h6"
            component="h2"
          >
            Contact details
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: "text.secondary" }}
          >
            This is the information we surface in shared-care contexts so
            people know how to reach you if something comes up.
          </Typography>
        </Box>

        <Divider />

        {/* Keep the form as a dedicated client component so all fetch logic,
            optimistic states, and local validation stay encapsulated. */}
        <UserProfileForm
          initialName={user.name ?? ""}
          initialEmail={user.email}
          initialPhone={user.phone ?? ""}
          initialAddress={user.address ?? ""}
          // We are intentionally not threading through any "email verified"
          // state yet because the current Prisma model does not track it.
          // The copy inside the form already explains that gap.
        />
      </Stack>
    </Paper>
  );
}

// SECTION: Shared pets list
function AccountSharedPetsSection({
  sharedPets,
  currentUserName,
}: {
  sharedPets: AccountPageData["sharedPets"];
  currentUserName: string | null;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 16,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography
            variant="h6"
            component="h2"
          >
            Shared pets ({sharedPets.length})
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: "text.secondary" }}
          >
            Pets you have access to because someone shared them with you.
            You can still view details and log care, but ownership lives
            with the person who created the pet.
          </Typography>
        </Box>

        <Divider />

        {/* Reuse the existing PetList so card geometry, quick actions, and
            layout stay aligned with the dashboard. The shared/owned access
            flag is on the data itself, not the list API, so we don&apos;t
            have to fork this component just for the account page. */}
        <Box sx={{ mt: 0.5 }}>
          <PetList
            pets={sharedPets}
            currentUserName={currentUserName}
          />
        </Box>
      </Stack>
    </Paper>
  );
}