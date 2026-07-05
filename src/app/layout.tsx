import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeleExpro CRM",
  description: "Outbound Sales CRM for High-Velocity Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
