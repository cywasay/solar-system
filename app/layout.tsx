import type { Metadata } from "next";
import { Newsreader, Geist, Bebas_Neue } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteNav from "@/components/site/SiteNav";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thessaris — Interactive Solar System",
  description: "A physically accurate 3D planetary observatory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${geistSans.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#020617] text-[#F8FAFC] font-sans selection:bg-[#EA580C] selection:text-white">
        {children}
        {/* Site-wide navigation: fixed [ Menu ] trigger bottom-right on every page. */}
        <SiteNav />
        {/* Vercel Speed Insights — collects Core Web Vitals from real visits. Renders
            nothing and is inert outside Vercel deployments, so local dev is unaffected. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
