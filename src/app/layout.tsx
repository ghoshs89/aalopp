import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({ variable: "--font-baloo", subsets: ["latin"], weight: ["600", "800"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "Puzzle Quest",
  description: "Aishik's puzzle practice",
  appleWebApp: { capable: true, title: "Puzzle Quest", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0e2018",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
