import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSharedPetsForUser } from "@/lib/hive";
import AddRecipientForm from "@/components/pets/AddRecipientForm";
import { RecipientList, type RecipientData } from "@/components/recipients";
// MUI layout shell for the dashboard – this keeps spacing, max-width, and card
// geometry aligned with the global theme instead of hand-tuned Tailwind margins.
import { Container, Paper, Stack, Typography } from "@mui/material";

// Force this page to always be dynamically rendered and never cached,
// so pet updates (including characteristics) are immediately visible.
export const dynamic = 'force-dynamic';

// Server-rendered dashboard. This page always runs on the server, so it can
// talk directly to Prisma and NextAuth without shipping any of that to the client.
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // If someone lands here without a valid session, push them through the auth flow.
  if (!session || !session.user || !session.user.id) {
    redirect("/api/auth/signin");
  }

  const sessionUser = session.user;

  // For consistency with the /api/care-recipients route, we resolve a *database* user
  // based on email. This avoids the "session.id !== prisma.id" mismatch that
  // you're currently seeing with recipients being created but not showing up.
  if (!sessionUser.email) {
    // If this ever fires, something is badly wrong with auth config and we
    // want it to crash loudly instead of silently hiding pets.
    throw new Error(
      "Authenticated user is missing an email; cannot resolve DB user."
    );
  }

  const dbUser = await prisma.user.upsert({
    where: { email: sessionUser.email },
    update: {},
    create: {
      email: sessionUser.email,
      name: sessionUser.name ?? "",
      // This placeholder value is never used for login; it just satisfies the
      // non-null constraint on passwordHash for OAuth users.
      passwordHash: "google-oauth",
    },
  });

  // Now we query recipients by the *database* user id, which is the same id that
  // /api/care-recipients uses as ownerId when creating new recipients.
  const ownedRecipients = await prisma.careRecipient.findMany({
    where: {
      ownerId: dbUser.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Fetch recipients shared with this user via Hive
  const sharedMemberships = await getSharedPetsForUser(dbUser.id);

  const ownedRecipientsWithFlag: RecipientData[] = ownedRecipients.map((recipient) => ({
    id: recipient.id,
    name: recipient.name,
    category: recipient.category,
    subtype: recipient.subtype,
    breed: recipient.breed,
    plantSpecies: recipient.plantSpecies,
    relationship: recipient.relationship,
    imageUrl: recipient.imageUrl,
    _accessType: "owner" as const,
  }));

  const sharedRecipientsWithFlag: RecipientData[] = sharedMemberships.map((membership) => ({
    id: membership.recipient.id,
    name: membership.recipient.name,
    category: membership.recipient.category,
    subtype: membership.recipient.subtype,
    breed: membership.recipient.breed,
    plantSpecies: membership.recipient.plantSpecies,
    relationship: membership.recipient.relationship,
    imageUrl: membership.recipient.imageUrl,
    _accessType: "shared" as const,
  }));

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
    >
      <Stack spacing={4}>
        {/* Hero to mirror the Hive treatment */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: "warning.main",
            color: "warning.contrastText",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              display: "block",
              mb: 1,
              fontStyle: "italic",
              opacity: 0.85,
            }}
          >
            Welcome to Your Hive for the Ones You Care For
          </Typography>

          <Typography variant="h4" component="h1" sx={{ mb: 1.5 }}>
            Manage your home
          </Typography>

          <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.9 }}>
            Keep track of pets, plants, family, and housemates you&apos;re caring
            for in one place.
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Welcome, {sessionUser.name ?? sessionUser.email ?? "friend"}
          </Typography>
        </Paper>

        {/* Add recipient card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography
            variant="overline"
            component="h2"
            sx={{
              mb: 1,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Add new recipient
          </Typography>

          <Typography
            variant="body2"
            sx={{ mb: 2, color: "text.secondary" }}
          >
            Create a profile for a pet, plant, or person in your household.
          </Typography>

          {/* AddRecipientForm supports category selection (PET, PLANT, PERSON) */}
          <AddRecipientForm />
        </Paper>

        {/* Owned recipients */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              mb: 0.75,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "baseline",
              gap: 0.75,
            }}
          >
            Your recipients
            <Typography
              component="span"
              variant="caption"
              sx={{
                fontWeight: 500,
                color: "text.secondary",
              }}
            >
              ({ownedRecipientsWithFlag.length})
            </Typography>
          </Typography>

          <Typography
            variant="body2"
            sx={{ mb: 2, color: "text.secondary" }}
          >
            Pets, plants, and people you created and fully manage.
          </Typography>

          <RecipientList recipients={ownedRecipientsWithFlag} groupByCategory />
        </Paper>

        {/* Shared recipients */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              mb: 0.75,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "baseline",
              gap: 0.75,
            }}
          >
            Recipients you care for
            <Typography
              component="span"
              variant="caption"
              sx={{
                fontWeight: 500,
                color: "text.secondary",
              }}
            >
              ({sharedRecipientsWithFlag.length})
            </Typography>
          </Typography>

          <Typography
            variant="body2"
            sx={{ mb: 2, color: "text.secondary" }}
          >
            Pets, plants, and people shared with you as a caregiver.
          </Typography>

          <RecipientList recipients={sharedRecipientsWithFlag} groupByCategory />
        </Paper>
      </Stack>
    </Container>
  );
}
