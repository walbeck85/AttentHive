// src/lib/auth.ts
//
// SECURITY NOTES - READ BEFORE MODIFYING:
//
// 1. USER ENUMERATION PREVENTION:
//    The credentials provider uses the SAME error message "Invalid email or password"
//    for both invalid email AND invalid password. DO NOT change this to provide
//    more "helpful" error messages - it would allow attackers to discover valid emails.
//
// 2. TIMING ATTACK MITIGATION:
//    When a user doesn't exist, we still run bcrypt.compare with a dummy hash.
//    This ensures consistent response times regardless of whether the email exists.
//    Without this, attackers could detect valid emails by measuring response time
//    (bcrypt is slow ~100ms, so skipping it would be noticeable).
//
// 3. PASSWORD HASH STORAGE:
//    OAuth users (Google) have passwordHash="google-oauth" as a placeholder.
//    These accounts cannot be logged into via credentials - the OAuth flow is required.
//
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authLimiter, checkRateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Rate limit by email address: 5 attempts per 15 minutes
        // Using email as identifier to prevent brute force attacks on specific accounts
        const rateLimitResult = await checkRateLimit(
          authLimiter,
          credentials.email.toLowerCase()
        );

        if (!rateLimitResult.success) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // Timing attack mitigation: always run bcrypt.compare even when user
          // doesn't exist. This ensures both code paths take similar time,
          // preventing attackers from detecting valid emails via response timing.
          await bcrypt.compare(
            credentials.password,
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
          );
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as { id: string }).id;
      }
      // When the client calls `update()` from useSession, NextAuth invokes
      // this callback with trigger="update". We merge any new fields (e.g. name)
      // into the token so subsequent session reads reflect the change.
      if (trigger === "update" && session) {
        if (session.name !== undefined) {
          token.name = session.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};