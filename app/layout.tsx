import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skribble.io - Multiplayer Drawing & Guessing Game",
  description: "Draw, guess, and win! Skribble.io is a free multiplayer drawing and guessing game. smooth gameplay, no ads, just fun.",
  keywords: ["skribble", "drawing game", "pictionary", "multiplayer", "online game", "guess the word"],
  openGraph: {
    title: "Skribble.io - Draw & Guess",
    description: "Join the fun! Draw clearly, guess quickly, and become the champion.",
    type: "website",
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
