"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

/** Enter-only: AnimatePresence mode="wait" + App Router can cause removeChild errors. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[60vh]"
    >
      {children}
    </motion.div>
  );
}
