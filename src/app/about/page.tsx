import { Container, Paper, Stack, Box, Typography, Divider } from "@mui/material";
import { APP_NAME, APP_TAGLINE } from "@/config/appMeta";

export default function AboutPage() {
  return (
    <Container
      maxWidth="lg"
      sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 3, md: 4 } }}
    >
      <Stack spacing={4}>
        {/* Hero Section */}
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
          <Typography variant="overline" sx={{ display: "block", mb: 1 }}>
            ABOUT
          </Typography>
          <Typography variant="h4" component="h1" sx={{ mb: 1.5 }}>
            {APP_NAME}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1.5, fontStyle: "italic" }}>
            {APP_TAGLINE}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Pet care coordination that eliminates the anxious texting. Know your
            pets are cared for with real-time activity tracking and seamless
            caregiver coordination.
          </Typography>
        </Paper>

        {/* What is AttentHive? */}
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
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
            What is {APP_NAME}?
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "warning.main" }}>
                •
              </Typography>
              <Typography variant="body1">
                Share pet access with caregivers — family, friends, dog walkers
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "warning.main" }}>
                •
              </Typography>
              <Typography variant="body1">
                Log activities like walks, feeding, medication, and playtime
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "warning.main" }}>
                •
              </Typography>
              <Typography variant="body1">
                Real-time visibility for peace of mind
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "warning.main" }}>
                •
              </Typography>
              <Typography variant="body1">
                Coordinate care across busy households
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Who It's For */}
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
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
            Who It&apos;s For
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "warning.main" }}>
                •
              </Typography>
              <Typography variant="body1">
                Pet owners who travel or work long hours
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "warning.main" }}>
                •
              </Typography>
              <Typography variant="body1">
                Families sharing pet responsibilities
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "warning.main" }}>
                •
              </Typography>
              <Typography variant="body1">
                Professional pet caregivers and dog walkers
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* The Hive Concept */}
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
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
            The Hive Concept
          </Typography>
          <Stack spacing={2}>
            <Typography variant="body1">
              A &quot;Hive&quot; is a shared care circle around your pet.
              Everyone in the Hive can see activities and coordinate seamlessly.
            </Typography>
            <Divider />
            <Typography
              variant="body1"
              sx={{ fontStyle: "italic", color: "text.secondary" }}
            >
              No more &quot;did you feed the dog?&quot; texts.
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
