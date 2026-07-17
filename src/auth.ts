import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { demoLoginEvents, users } from "@/db/schema";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        // The seeded demo accounts have a publicly published password, so
        // brute-force lockout doesn't protect anything for them — it would
        // just let a visitor lock a real employer out of trying the demo.
        // They're already write-blocked elsewhere, which is the actual risk.
        if (!user.isDemo) {
          // Same generic failure path whether the account is locked or the
          // password is just wrong, so a caller can't use the difference to
          // enumerate which emails have accounts.
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            console.warn(`[auth] login rejected, account locked: ${user.email}`);
            return null;
          }

          const passwordMatches = await compare(password, user.passwordHash);
          if (!passwordMatches) {
            const attempts = user.failedLoginAttempts + 1;
            const locked = attempts >= MAX_LOGIN_ATTEMPTS;
            await db
              .update(users)
              .set({
                failedLoginAttempts: attempts,
                lockedUntil: locked ? new Date(Date.now() + LOCKOUT_MS) : null,
              })
              .where(eq(users.id, user.id));
            console.warn(
              `[auth] failed login for ${user.email} (attempt ${attempts}${locked ? ", now locked" : ""})`,
            );
            return null;
          }

          if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await db
              .update(users)
              .set({ failedLoginAttempts: 0, lockedUntil: null })
              .where(eq(users.id, user.id));
          }
        } else {
          const passwordMatches = await compare(password, user.passwordHash);
          if (!passwordMatches) return null;

          await db.insert(demoLoginEvents).values({ email: user.email, role: user.role });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          neighborhoodId: user.neighborhoodId,
          isDemo: user.isDemo,
        };
      },
    }),
    Google,
  ],
  callbacks: {
    signIn: async ({ account, profile }) => {
      if (account?.provider === "google") {
        // Only trust the email for account linking/creation if Google
        // has verified it.
        return profile?.email_verified === true;
      }
      return true;
    },
    jwt: async ({ token, user, account, trigger, session }) => {
      if (trigger === "update" && session?.user) {
        const update = session.user as {
          id?: string;
          role?: string;
          neighborhoodId?: string | null;
        };
        if (update.id) token.sub = update.id;
        if (update.role) token.role = update.role;
        if (update.neighborhoodId !== undefined) {
          token.neighborhoodId = update.neighborhoodId;
        }
        return token;
      }

      if (user) {
        const email = user.email?.toLowerCase();
        const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();

        if (email && ownerEmail && email === ownerEmail) {
          // The platform owner's account is auto-provisioned/promoted on
          // sign-in rather than created via the seed script — it isn't
          // tied to any neighborhood.
          let [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!dbUser) {
            [dbUser] = await db
              .insert(users)
              .values({ name: user.name ?? "Owner", email, role: "owner" })
              .returning();
          } else if (dbUser.role !== "owner" || dbUser.neighborhoodId) {
            [dbUser] = await db
              .update(users)
              .set({ role: "owner", neighborhoodId: null })
              .where(eq(users.id, dbUser.id))
              .returning();
          }

          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.neighborhoodId = dbUser.neighborhoodId;
          token.isDemo = dbUser.isDemo;
          return token;
        }

        const [dbUser] = email
          ? await db.select().from(users).where(eq(users.email, email)).limit(1)
          : [];

        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.neighborhoodId = dbUser.neighborhoodId;
          token.isDemo = dbUser.isDemo;
        } else if (account?.provider === "google") {
          // First-time Google sign-in with no matching account yet — send
          // them through onboarding to pick a neighborhood before they get
          // a real users row.
          token.role = "pending";
          token.neighborhoodId = null;
          token.isDemo = false;
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.neighborhoodId = token.neighborhoodId as string | null;
        session.user.isDemo = token.isDemo as boolean;
      }
      return session;
    },
  },
});
