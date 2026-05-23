"use client";

import * as React from "react";

import type { Session } from "next-auth";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

import { Toaster } from "@/components/ui/sonner";

export function AppSessionProvider({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
      <Toaster />
    </NextAuthSessionProvider>
  );
}
