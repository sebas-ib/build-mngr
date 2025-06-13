import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { twMerge } from "tailwind-merge";

const dmSans = DM_Sans({
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "BuildManager",
  description: "Everything you need to manage projects in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={twMerge(dmSans.className, "antialiased bg-[EAEEFE]")}
      >
        {children}
      </body>
    </html>
  );
}
