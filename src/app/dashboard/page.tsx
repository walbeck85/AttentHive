import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSharedPetsForUser } from "@/lib/carecircle";
import PetList from "@/components/pets/PetList";
import AddPetForm from "@/components/pets/AddPetForm";
// MUI layout shell for the dashboard – this keeps spacing, max-width, and card
// geometry aligned with the global theme instead of hand-tuned Tailwind margins.
import { Box, Container, Paper, Stack, Typography } from "@mui/material";

// Server-rendered dashboard. This page always runs on the server, so it can
// talk directly to Prisma and NextAuth without shipping any of that to the client.
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // If someone lands here without a valid session, push them through the auth flow.
  if (!session || !session.user || !session.user.id) {
    redirect("/api/auth/signin");
  }

  const sessionUser = session.user;

  // For consistency with the /api/pets route, we resolve a *database* user
  // based on email. This avoids the "session.id !== prisma.id" mismatch that
  // you’re currently seeing with pets being created but not showing up.
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

  // Now we query pets by the *database* user id, which is the same id that
  // /api/pets uses as ownerId when creating new recipients.
  const ownedPets = await prisma.recipient.findMany({
    where: {
      ownerId: dbUser.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Fetch pets shared with this user via CareCircle
  const sharedMemberships = await getSharedPetsForUser(dbUser.id);

  const ownedPetsWithFlag = ownedPets.map((pet) => ({
    ...pet,
    _accessType: "owner" as const,
  }));

  const sharedPetsWithFlag = sharedMemberships.map((membership) => ({
    ...membership.recipient,
    _accessType: "shared" as const,
  }));

  return (
    // Main background still respects the existing mm tokens, but we lean on MUI
    // for min-height and typography color so the dashboard feels native to the theme.
    <Box
      component="main"
      className="bg-mm-bg text-mm-ink"
      sx={{
        bgcolor: "background.default",
        color: "text.primary",
        minHeight: "100vh",
      }}
    >
      {/* Container keeps the dashboard readable on large screens and gives us
          a single place to tweak horizontal padding later instead of hunting
          down individual divs. */}
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 4, md: 6 },
        }}
      >
        {/* Stack handles vertical spacing between sections so we are not
            micro-managing margin utilities on every card. */}
        <Stack spacing={3.5}>
          {/* Overview card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              px: { xs: 2.5, md: 3 },
              py: { xs: 3, md: 3.5 },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                mb: 1,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "text.secondary",
                fontSize: 11,
              }}
            >
              Dashboard
            </Typography>

            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 1.5,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              Manage your home
            </Typography>

            <Typography
              variant="body2"
              sx={{ mb: 1.5 }}
              color="text.secondary"
            >
              Keep track of pets, plants, family, and housemates you&apos;re caring
              for in one place.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {/* Prefer the user&apos;s name, but fall back to email so this never looks broken
                  if their profile is half-filled. */}
              Welcome, {sessionUser.name ?? sessionUser.email ?? "friend"}
            </Typography>
          </Paper>

          {/* Add pet card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              px: { xs: 2.5, md: 3 },
              py: { xs: 3, md: 3.5 },
            }}
          >
            <Typography
              variant="overline"
              component="h2"
              sx={{
                mb: 1,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "text.secondary",
                fontSize: 12,
              }}
            >
              Add new pet
            </Typography>

            <Typography
              variant="body2"
              sx={{ mb: 2 }}
              color="text.secondary"
            >
              Create a profile for another member of your household.
            </Typography>

            {/* Keeping AddPetForm as-is so all existing validation, routing, and
                success handling continues to behave the same; we’re only changing
                the shell it lives inside. */}
            <AddPetForm />
          </Paper>

          {/* Owned pets */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              px: { xs: 2.5, md: 3 },
              py: { xs: 3, md: 3.5 },
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
              Pets you own
              <Typography
                component="span"
                variant="body2"
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "text.secondary",
                }}
              >
                ({ownedPetsWithFlag.length})
              </Typography>
            </Typography>

            <Typography
              variant="body2"
              sx={{ mb: 2 }}
              color="text.secondary"
            >
              Pets you created and fully manage.
            </Typography>

            <PetList pets={ownedPetsWithFlag} />
          </Paper>

          {/* Shared pets */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              px: { xs: 2.5, md: 3 },
              py: { xs: 3, md: 3.5 },
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
              Pets you care for
              <Typography
                component="span"
                variant="body2"
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "text.secondary",
                }}
              >
                ({sharedPetsWithFlag.length})
              </Typography>
            </Typography>

            <Typography
              variant="body2"
              sx={{ mb: 2 }}
              color="text.secondary"
            >
              Pets shared with you as a caregiver.
            </Typography>

            <PetList pets={sharedPetsWithFlag} />
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}