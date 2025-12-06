// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  ListSubheader,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { alpha } from "@mui/material/styles";

import { useThemeMode } from "@/components/ThemeModeProvider";
import type { ThemePreference } from "@/theme";

type NavLink = {
  label: string;
  href: string;
};

const NAV_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Care Circle", href: "/care-circle" },
  { label: "My Account", href: "/account" },
];

// Links are always visible; route-level auth still protects pages.
const filteredLinks = NAV_LINKS;

type NavBarProps = {
  mobileOpen: boolean;
  onToggleMobileDrawer: () => void;
  drawerWidth: number;
};

export default function NavBar({
  mobileOpen,
  onToggleMobileDrawer,
  drawerWidth,
}: NavBarProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const { mode, setMode } = useThemeMode();
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isAuthed = !!session;

  const handleAppearanceChange = (
    _: React.MouseEvent<HTMLElement>,
    next: ThemePreference | null
  ) => {
    if (!next) return;
    setMode(next);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          position: "sticky",
          top: 0,
          zIndex: 1,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Mimamori
          </Typography>
          {isAuthed && session.user?.name && (
            <Typography
              variant="body2"
              sx={{ mt: 0.5, color: "text.secondary" }}
            >
              Signed in as {session.user.name}
            </Typography>
          )}
        </Box>
        <IconButton
          aria-label="close navigation"
          onClick={onToggleMobileDrawer}
          edge="end"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <Box sx={{ flexGrow: 1 }}>
        <List component="nav">
          {filteredLinks.map((link) => {
            const selected =
              pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <ListItemButton
                key={link.href}
                component={Link}
                href={link.href}
                selected={selected}
                onClick={onToggleMobileDrawer}
                sx={{
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                  },
                }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            );
          })}

          {/* Mobile-first auth actions live directly in the drawer so they are always reachable on small screens. */}
          {status !== "loading" && (
            <>
              {!isAuthed ? (
                <>
                  <ListItemButton
                    component={Link}
                    href="/login"
                    selected={pathname === "/login"}
                    onClick={onToggleMobileDrawer}
                    sx={{
                      "&.Mui-selected": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                        },
                      },
                    }}
                  >
                    <ListItemText primary="Log in" />
                  </ListItemButton>

                  <ListItemButton
                    component={Link}
                    href="/signup"
                    selected={pathname === "/signup"}
                    onClick={onToggleMobileDrawer}
                    sx={{
                      "&.Mui-selected": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        "&:hover": {
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                        },
                      },
                    }}
                  >
                    <ListItemText primary="Sign up" />
                  </ListItemButton>
                </>
              ) : (
                <ListItemButton
                  onClick={handleLogout}
                  sx={{
                    "&.Mui-selected": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      },
                    },
                  }}
                >
                  <ListItemText primary="Log out" />
                </ListItemButton>
              )}
            </>
          )}
        </List>

        <Box sx={{ mt: 2, px: 2 }}>
          <ListSubheader
            component="div"
            sx={{
              px: 0,
              pb: 1,
              bgcolor: "transparent",
              color: "text.secondary",
            }}
          >
            Appearance
          </ListSubheader>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={handleAppearanceChange}
            fullWidth
          >
            <ToggleButton value="light">Light</ToggleButton>
            <ToggleButton value="dark">Dark</ToggleButton>
            <ToggleButton value="system">System</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Divider />

      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {status !== "loading" && (
          <>
            {isAuthed ? (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleLogout}
                sx={{ textTransform: "none" }}
              >
                Log out
              </Button>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/login"
                  variant="contained"
                  fullWidth
                  sx={{ textTransform: "none" }}
                >
                  Log in
                </Button>
                <Button
                  component={Link}
                  href="/signup"
                  variant="outlined"
                  fullWidth
                  sx={{ textTransform: "none" }}
                >
                  Sign up
                </Button>
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Sticky AppBar that matches new app shell */}
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          backdropFilter: "blur(12px)",
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          color: "text.primary",
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1200,
            mx: "auto",
            width: "100%",
            px: { xs: 2, sm: 3 },
            minHeight: 64,
          }}
        >
          {/* Global hamburger (mobile + desktop) */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open navigation"
            aria-controls="main-navigation-drawer"
            aria-expanded={mobileOpen ? "true" : "false"}
            onClick={onToggleMobileDrawer}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Brand */}
          <Typography
            component={Link}
            href={isAuthed ? "/dashboard" : "/"}
            variant="h6"
            sx={{
              fontWeight: 800,
              textDecoration: "none",
              color: "text.primary",
            }}
          >
            Mimamori
          </Typography>

          {/* Spacer between brand and right side */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop nav links */}
          {isDesktop && (
            <Box
              component="nav"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mr: 3,
              }}
            >
              {filteredLinks.map((link) => {
                const selected =
                  pathname === link.href ||
                  pathname?.startsWith(link.href + "/");
                return (
                  <Button
                    key={link.href}
                    component={Link}
                    href={link.href}
                    color={selected ? "primary" : "inherit"}
                    sx={{
                      fontWeight: selected ? 700 : 500,
                      textTransform: "none",
                    }}
                  >
                    {link.label}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* Auth actions on the right */}
          {status !== "loading" && (
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1, alignItems: "center" }}>
              {isAuthed ? (
                <>
                  <Typography
                    variant="body2"
                    sx={{ display: { xs: "none", sm: "block" } }}
                  >
                    {session.user?.name}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLogout}
                    sx={{ textTransform: "none" }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    component={Link}
                    href="/login"
                    size="small"
                    sx={{ textTransform: "none" }}
                  >
                    Log in
                  </Button>
                  <Button
                    component={Link}
                    href="/signup"
                    size="small"
                    variant="contained"
                    sx={{ textTransform: "none" }}
                  >
                    Sign up
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer – pushes content via RootShell transform */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onToggleMobileDrawer}
        ModalProps={{
          keepMounted: true,
          BackdropProps: { sx: { backgroundColor: "rgba(0,0,0,0.05)" } },
        }}
        PaperProps={{
          id: "main-navigation-drawer",
          sx: {
            width: drawerWidth,
            bgcolor: "background.paper",
            borderRight: 1,
            borderColor: "divider",
            boxShadow: theme.shadows[8],
            transition: theme.transitions.create("box-shadow", {
              duration: theme.transitions.duration.short,
            }),
          },
        }}
        sx={{
          display: "block",
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}