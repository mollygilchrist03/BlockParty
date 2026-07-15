import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    neighborhoodId: string | null;
    isDemo: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      neighborhoodId: string | null;
      isDemo: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    neighborhoodId: string | null;
    isDemo: boolean;
  }
}
