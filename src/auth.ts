import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

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

        const passwordMatches = await compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          neighborhoodId: user.neighborhoodId,
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
        const [dbUser] = email
          ? await db.select().from(users).where(eq(users.email, email)).limit(1)
          : [];

        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
          token.neighborhoodId = dbUser.neighborhoodId;
        } else if (account?.provider === "google") {
          // First-time Google sign-in with no matching account yet — send
          // them through onboarding to pick a neighborhood before they get
          // a real users row.
          token.role = "pending";
          token.neighborhoodId = null;
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.neighborhoodId = token.neighborhoodId as string | null;
      }
      return session;
    },
  },
});
