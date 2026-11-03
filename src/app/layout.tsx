import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ModeBadge } from "@/components/ModeBadge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentCheckout — PayPal AI Hackathon",
  description:
    "AI shopping agent that plans carts from natural language and completes PayPal sandbox Orders with risk explanations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-semibold tracking-tight text-white">
                AgentCheckout
              </Link>
              <nav className="flex gap-4 text-sm text-slate-300">
                <Link href="/" className="hover:text-white">
                  Agent
                </Link>
                <Link href="/dashboard" className="hover:text-white">
                  Orders
                </Link>
              </nav>
            </div>
            <ModeBadge />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-slate-500">
          PayPal AI Hackathon entry · Uses PayPal Orders v2 + AI cart planning ·{" "}
          <a
            className="underline hover:text-slate-300"
            href="https://github.com/dl88jing/paypal-agentcheckout"
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>
        </footer>
      </body>
    </html>
  );
}
