import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Little Shop — Your working space",
  description:
    "A thoughtful local workspace for your toys and stationery shop.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
