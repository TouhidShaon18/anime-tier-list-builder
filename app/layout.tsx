import type { Metadata } from "next";
import "./globals.css";

const SITE_NAME = "Anime Tier List Builder";
const DESCRIPTION =
  "Drag and drop anime into S, A, B, and C tiers. Build your ranking, download it as an image, and share it with your friends and anime groups.";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
  },
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
