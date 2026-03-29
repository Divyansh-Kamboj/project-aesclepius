import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const anotherDanger = localFont({
  src: "../../public/fonts/AnotherDanger.ttf",
  variable: "--font-another-danger",
  display: "swap",
});

const specialElite = localFont({
  src: "../../public/fonts/SpecialElite.ttf",
  variable: "--font-special-elite",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project Aesclepius Interface",
  description: "Visualizer game interface scaffold",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anotherDanger.variable} ${specialElite.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
