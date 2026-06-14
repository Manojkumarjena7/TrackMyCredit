import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Credit Intelligence",
    template: "%s | Credit Intelligence",
  },
  description:
    "Understand your credit card spending, interest, GST, and hidden charges.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
