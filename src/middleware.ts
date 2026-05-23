import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

/** Edge-only: no DB / bcrypt — see `auth.config.ts`. */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Run on routes except login, uploads API (handles auth internally), Next internals & static assets.
     */
    "/((?!login|api/uploads|api/order-attachments|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
