import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config — imported by `middleware.ts` only.
 * Do not add Credentials / Prisma / bcrypt here (keeps middleware under 1 MB on Vercel).
 * Session is JWT; `authorized` only checks presence of a valid session cookie + JWT.
 */
export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/login")) return true;
      if (pathname.startsWith("/api/auth")) return true;
      return !!auth;
    },
  },
} satisfies NextAuthConfig;
