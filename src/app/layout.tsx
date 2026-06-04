import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const outfit = localFont({
  src: [
    { path: "../../public/fonts/outfit/outfit-300.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/outfit/outfit-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/outfit/outfit-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/outfit/outfit-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/outfit/outfit-700.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/outfit/outfit-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: [
    { path: "../../public/fonts/space-grotesk/space-grotesk-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/space-grotesk/space-grotesk-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/space-grotesk/space-grotesk-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/space-grotesk/space-grotesk-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Call-OS CRM | Premium Leads Command Center",
  description: "High-performance modular outbound sales and lead workflow management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${spaceGrotesk.variable} h-full antialiased light`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-[#0f172a] selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
