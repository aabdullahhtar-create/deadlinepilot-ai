import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeadlinePilot AI — From brief to shipped",
  description: "Turn complex project instructions into an achievable plan, track progress, audit your submission, and generate a polished README.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
