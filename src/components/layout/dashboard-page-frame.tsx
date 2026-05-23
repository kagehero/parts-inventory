import type { ReactNode } from "react";

import { MotionFade } from "@/components/motion-fade";
import { cn } from "@/lib/utils";

/** Default scroll shell for dashboard list pages (matches min-height used across /dashboard/*). */
export function DashboardPageFrame({
  className,
  children,
  minHeight = "70vh",
}: {
  children: ReactNode;
  className?: string;
  /** Use `screen` for full-page forms (e.g. part edit). */
  minHeight?: "70vh" | "screen";
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        minHeight === "screen" ? "min-h-screen" : "min-h-[70vh]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Standard padded main region using the dashboard motion wrapper. */
export function DashboardContent({
  className,
  children,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <MotionFade className={cn("flex flex-1 flex-col gap-5 px-5 py-8 sm:px-8", className)}>{children}</MotionFade>
  );
}
