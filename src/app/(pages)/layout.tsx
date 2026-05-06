import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../styles/globals.css";
import Link from "next/link";
import { TopNav } from "../components/TopNav";
import { FloatingDecor } from "../components/FloatingDecor";
import { ToastProvider } from "../components/ToastProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quest Scheduler",
  description: "Meeting scheduler for tabletop roleplaying games",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" data-theme="primaryTheme">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <ToastProvider />
       <TopNav />
       <FloatingDecor />
        {children}
        {/* Decorative corner elements */}
      <div className="top-0 left-0 fixed opacity-20 m-4 border-gold border-t-4 border-l-4 rounded-tl-3xl w-32 h-32 pointer-events-none" />
      <div className="top-0 right-0 fixed opacity-20 m-4 border-gold border-t-4 border-r-4 rounded-tr-3xl w-32 h-32 pointer-events-none" />
      <div className="bottom-0 left-0 fixed opacity-20 m-4 border-gold border-b-4 border-l-4 rounded-bl-3xl w-32 h-32 pointer-events-none" />
      <div className="right-0 bottom-0 fixed opacity-20 m-4 border-gold border-r-4 border-b-4 rounded-br-3xl w-32 h-32 pointer-events-none" />

      </body>
    </html>
  );
}
