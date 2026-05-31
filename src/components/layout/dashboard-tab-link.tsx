import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof Link>;

/** Opens dashboard pages in a new tab so order/outgoing work is not lost. */
export function DashboardTabLink({ className, children, ...props }: Props) {
  return (
    <Link
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex items-center gap-1 underline-offset-4 hover:underline", className)}
    >
      {children}
      <span className="text-[10px] opacity-70" aria-hidden>
        ↗
      </span>
    </Link>
  );
}
