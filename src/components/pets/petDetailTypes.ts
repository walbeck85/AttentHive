// src/components/pets/petDetailTypes.ts

// Shared view-level type for Care Circle membership on the pet detail screen.
// Keeping this in one place helps the server loader and UI stay in sync.
export type CareCircleMember = {
  id: string;
  userName: string | null;
  userEmail: string;
  role: "OWNER" | "CAREGIVER" | "VIEWER";
};