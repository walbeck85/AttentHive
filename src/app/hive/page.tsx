// src/app/hive/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Button,
  Divider,
} from "@mui/material";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  loadHivePageData,
  type HivePageData,
  type CaregiverGroup,
  type PetYouCareFor,
  type OwnedPetSummary,
} from "./loader";

// Server action to remove a caregiver's access for a specific pet.
// I am keeping this in the page module so it stays close to the UI
// that calls it, but it is intentionally separate from the loader
// so the data path and mutation path don't get tangled.
export async function removeCaregiverMembership(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);

  // If there is no authenticated user, quietly bail out.
  // The page-level loader already redirects unauthenticated users.
  if (!session || !session.user?.email) {
    return;
  }

  const { email, name } = session.user;

  // Resolve or create the backing DB user, consistent with dashboard/account logic.
  const dbUser = await prisma.user.upsert({
    where: { email: email! },
    update: {},
    create: {
      email: email!,
      name: name ?? "",
      // Satisfies schema; not used for OAuth logins
      passwordHash: "google-oauth",
    },
  });

  const membershipId = formData.get("membershipId");
  const recipientId = formData.get("recipientId");

  if (typeof membershipId !== "string" || membershipId.length === 0) {
    return;
  }

  try {
    const membership = await prisma.hive.findUnique({
      where: { id: membershipId },
      include: {
        recipient: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!membership) {
      return;
    }

    // Only the owner of the recipient can revoke access.
    if (membership.recipient.ownerId !== dbUser.id) {
      return;
    }

    // Extra guardrail: do not allow removing the OWNER record.
    if (membership.role === "OWNER") {
      return;
    }

    await prisma.hive.delete({
      where: { id: membershipId },
    });

    // Refresh this page so the UI reflects the updated membership list.
    revalidatePath("/hive");

    // Also refresh the pet details page if we know which pet this membership belonged to.
    if (typeof recipientId === "string" && recipientId.length > 0) {
      revalidatePath(`/pets/${recipientId}`);
    }
  } catch (error) {
    // For now, fail silently on this path; the primary, more explicit
    // error handling lives in the API route used by the pet details page.
    console.error("Error in removeCaregiverMembership action:", error);
  }
}

// Coordinator: wire up data loader to sectional UI.
// I want this component to stay boring on purpose so future changes
// are clearly about data wiring or layout composition, not business logic.
export default async function HivePage() {
  const data = await loadHivePageData();

  if (!data) {
    redirect("/login?callbackUrl=/hive");
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
    >
      <Stack spacing={4}>
        <HiveHeroSection user={data.user} />
        <HiveCaregiversSection caregivers={data.caregivers} />
        <HivePetsYouCareForSection pets={data.petsYouCareFor} />
        <HiveOwnedPetsSection pets={data.ownedPets} />
      </Stack>
    </Container>
  );
}

// SECTION: Hero / intro copy and user identity
function HiveHeroSection({
  user,
}: {
  user: HivePageData["user"];
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        // Use the warm brand orange token from the theme so this hero stays
        // on-brand in both light and dark mode without needing a runtime
        // theme callback from this server component.
        bgcolor: "warning.main",
        // Rely on the warning.contrastText token for legible copy on top of
        // the orange surface instead of hard-coding white.
        color: "warning.contrastText",
      }}
    >
      <Typography
        variant="overline"
        sx={{
          display: "block",
          mb: 1,
          letterSpacing: "0.2em",
          opacity: 0.9,
        }}
      >
        HIVE
      </Typography>
      <Typography variant="h4" sx={{ mb: 1.5 }}>
        Hive
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.9 }}>
        See the people in your hive and which pets they help with.
        Removing someone from a pet&apos;s Hive immediately revokes
        their access.
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.9 }}>
        Signed in as {user.name ?? user.email}
      </Typography>
    </Paper>
  );
}

// SECTION: People caring for your pets (you are the owner)
function HiveCaregiversSection({
  caregivers,
}: {
  caregivers: CaregiverGroup[];
}) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        People caring for your pets ({caregivers.length})
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        These people can view and log care for pets you own.
      </Typography>

      {caregivers.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          You haven&apos;t shared any pets yet. Open a pet, scroll to &quot;Shared
          with&quot;, and invite a caregiver by email.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {caregivers.map((person) => (
            <HiveCaregiverCard
              key={person.caregiverId}
              caregiver={person}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

// CARD: Single caregiver row with the pets they help with
function HiveCaregiverCard({ caregiver }: { caregiver: CaregiverGroup }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="subtitle1">
            {caregiver.caregiverName || caregiver.caregiverEmail}
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary" }}
          >
            {caregiver.caregiverEmail}
          </Typography>
          <Typography
            variant="caption"
            sx={{ mt: 1, display: "block", color: "text.secondary" }}
          >
            Helps with{" "}
            {caregiver.pets.map((pet, index) => (
              <span key={pet.id}>
                {index > 0 && ", "}
                {pet.name}
              </span>
            ))}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ justifyContent: { xs: "flex-start", sm: "flex-end" } }}
        >
          {caregiver.pets.map((pet) => (
            <Box
              key={pet.membershipId}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {/* I am keeping the nav-pill link styling for now so this CTA
                 continues to match the rest of the app while the shell moves
                 over to MUI. */}
              <Link
                href={`/pets/${pet.id}`}
                className="nav-pill text-xs"
                data-testid={`hive-view-pet-${pet.id}`}
              >
                View {pet.name}
              </Link>
              <form action={removeCaregiverMembership}>
                <input
                  type="hidden"
                  name="membershipId"
                  value={pet.membershipId}
                />
                <input type="hidden" name="recipientId" value={pet.id} />
                <Button
                  type="submit"
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{
                    textTransform: "none",
                    fontSize: "0.7rem",
                    px: 1.5,
                  }}
                >
                  Remove
                </Button>
              </form>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

// SECTION: Pets you care for (someone else is the owner)
export function HivePetsYouCareForSection({
  pets,
}: {
  pets: PetYouCareFor[];
}) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Pets you care for ({pets.length})
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
        Pets shared with you by friends, family, or housemates.
      </Typography>

      {pets.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No one has shared a pet with you yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {pets.map((pet) => (
            <Paper
              key={pet.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="subtitle1">{pet.name}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Owner: {pet.ownerName}
                  </Typography>
                </Box>
                <Link
                  href={`/pets/${pet.id}`}
                  className="nav-pill text-xs"
                  data-testid={`hive-view-pet-${pet.id}`}
                >
                  View pet
                </Link>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}

// SECTION: Lightweight list of pets you own
function HiveOwnedPetsSection({
  pets,
}: {
  pets: OwnedPetSummary[];
}) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        Pets you own ({pets.length})
      </Typography>
      <Typography
        variant="caption"
        sx={{ mb: 2, display: "block", color: "text.secondary" }}
      >
        To change sharing for a specific pet, open its details and use the
        &quot;Shared with&quot; panel.
      </Typography>

      {pets.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          You haven&apos;t added any pets yet. Use the dashboard to create your
          first pet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {pets.map((pet) => (
            <Paper
              key={pet.id}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Typography variant="body2">{pet.name}</Typography>
                <Link href={`/pets/${pet.id}`} className="nav-pill text-xs">
                  Manage sharing
                </Link>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
}
