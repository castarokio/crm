import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "travelnextlvl.de | Cinematic Travel Booking OS",
  description: "Elite adventure planning, custom itineraries, and remote destination discovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
      style={{ colorScheme: "dark" }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-[#010101] text-[#f1f1f1] selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
