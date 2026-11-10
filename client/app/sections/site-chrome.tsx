"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "./footer";
import Header from "./header";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashbordmain");

  if (isDashboard) return children;

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
